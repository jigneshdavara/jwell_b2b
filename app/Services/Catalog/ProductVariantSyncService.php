<?php

namespace App\Services\Catalog;

use App\Models\Diamond;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductVariantDiamond;
use App\Models\ProductVariantMetal;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ProductVariantSyncService
{
    public function sync(Product $product, array $variants, ?array $diamondOptions = null): void
    {
        // Ensure variants is always an array
        if (!is_array($variants)) {
            $variants = [];
        }

        // Get diamond options from parameter or product for lookup
        $diamondOptionsData = $diamondOptions ?? $product->diamond_options ?? [];
        $diamondOptionsMap = collect($diamondOptionsData)
            ->keyBy('key')
            ->toArray();

        $variantsCollection = collect($variants)
            ->map(function (array $payload) use ($diamondOptionsMap) {
                $metadata = $payload['metadata'] ?? [];

                // Convert diamond_option_key to diamond entry if needed
                $diamondOptionKey = $metadata['diamond_option_key'] ?? null;
                if ($diamondOptionKey && isset($diamondOptionsMap[$diamondOptionKey])) {
                    $diamondOption = $diamondOptionsMap[$diamondOptionKey];
                    $metadata['diamond'] = [
                        'key' => $diamondOptionKey,
                        'shape_id' => $diamondOption['shape_id'] ?? null,
                        'color_id' => $diamondOption['color_id'] ?? null,
                        'clarity_id' => $diamondOption['clarity_id'] ?? null,
                        'weight' => $diamondOption['weight'] ?? null,
                    ];
                }

                // Ensure label is always present and not empty (required field in database)
                $label = $payload['label'] ?? '';
                if (empty($label) || trim($label) === '') {
                    // Generate a fallback label if missing
                    $label = 'Variant ' . ($payload['sku'] ?? 'Unknown');
                }

                return [
                    'id' => $payload['id'] ?? null,
                    'sku' => $payload['sku'] ?? null,
                    'label' => $label,
                    'metal_id' => $payload['metal_id'] ?? null,
                    'metal_purity_id' => $payload['metal_purity_id'] ?? null,
                    'size' => $payload['size'] ?? null,
                    'inventory_quantity' => isset($payload['inventory_quantity']) && $payload['inventory_quantity'] !== '' && $payload['inventory_quantity'] !== null
                        ? (int) $payload['inventory_quantity']
                        : 0,
                    'is_default' => (bool) ($payload['is_default'] ?? false),
                    'metadata' => $metadata,
                    'metals' => $payload['metals'] ?? [],
                    'diamonds' => $payload['diamonds'] ?? [],
                ];
            });

        if ($variantsCollection->where('is_default', true)->isEmpty() && $variantsCollection->isNotEmpty()) {
            $variantsCollection = $variantsCollection->map(function (array $variant, int $index) {
                $variant['is_default'] = $index === 0;

                return $variant;
            });
        }

        $persistedIds = [];

        $variantsCollection->each(function (array $variant) use ($product, &$persistedIds, $diamondOptionsMap): void {
            // Extract metals and diamonds arrays from payload BEFORE processing
            $metals = Arr::pull($variant, 'metals', []);
            $diamonds = Arr::pull($variant, 'diamonds', []);

            // Normalize metals array: filter out empty entries and ensure proper structure
            $metals = array_filter($metals, function ($metal) {
                return !empty($metal['metal_id']) && $metal['metal_id'] > 0;
            });

            // If metals array is empty but metal_id/metal_purity_id are set on variant, create a metal entry
            // This handles the case where frontend sends metal_id directly on variant (from matrix generation)
            if (empty($metals) && !empty($variant['metal_id']) && $variant['metal_id'] > 0) {
                $metals = [[
                    'metal_id' => (int) $variant['metal_id'],
                    'metal_purity_id' => !empty($variant['metal_purity_id']) && $variant['metal_purity_id'] > 0
                        ? (int) $variant['metal_purity_id']
                        : null,
                    'metal_tone_id' => null,
                    'metal_weight' => null,
                    'metadata' => [],
                ]];
            }

            // Normalize diamonds array: filter out empty entries
            // Only include diamonds with diamond_id (simplified structure)
            $diamonds = array_filter($diamonds, function ($diamond) {
                $diamondId = isset($diamond['diamond_id']) && $diamond['diamond_id'] !== '' && $diamond['diamond_id'] !== null ? (int) $diamond['diamond_id'] : 0;
                return $diamondId > 0;
            });

            // Note: Diamond option key logic removed - we now only use diamond_id directly

            // Remove fields that are not columns on product_variants table
            // metal_id, metal_purity_id are only used to create metals entries if metals array is empty
            // metals and diamonds arrays are used to sync related records
            // diamond_option_key is stored in metadata, not as direct column
            // metal_tone is a legacy field that doesn't exist in the database
            $attributes = Arr::except($variant, [
                'id',
                'metal_id',
                'metal_purity_id',
                'metals',
                'diamonds',
                'diamond_option_key',
                'metal_tone', // Legacy field - not in database
            ]);

            /** @var \App\Models\ProductVariant|null $model */
            $model = null;

            // First, try to find by ID if provided
            if (!empty($variant['id'])) {
                $model = $product->variants()->firstWhere('id', $variant['id']);
            }

            // If not found by ID, try to find by SKU (to handle cases where frontend regenerates variants)
            if (!$model && !empty($variant['sku'])) {
                $model = $product->variants()->firstWhere('sku', $variant['sku']);
            }

            if ($model) {
                // Update existing variant
                $model->update($attributes);
                $this->syncVariantMetals($model, $metals);
                $this->syncVariantDiamonds($model, $diamonds);
                $persistedIds[] = $model->id;

                return;
            }

            // Before creating, check if a variant with this SKU already exists (safety check)
            // First check within the current product
            if (!empty($attributes['sku'])) {
                $existingBySku = $product->variants()->where('sku', $attributes['sku'])->first();
                if ($existingBySku) {
                    // Update the existing variant instead of creating a duplicate
                    $existingBySku->update($attributes);
                    $this->syncVariantMetals($existingBySku, $metals);
                    $this->syncVariantDiamonds($existingBySku, $diamonds);
                    $persistedIds[] = $existingBySku->id;

                    return;
                }

                // Check globally if SKU exists in any product (unique constraint is global)
                $globalExistingBySku = \App\Models\ProductVariant::where('sku', $attributes['sku'])->first();
                if ($globalExistingBySku) {
                    // SKU exists in another product, generate a unique one
                    $attributes['sku'] = $this->generateUniqueSku($attributes['sku']);
                }
            }

            // Ensure label is present before creating (required field)
            if (empty($attributes['label']) || trim($attributes['label']) === '') {
                $attributes['label'] = 'Variant ' . ($attributes['sku'] ?? 'Unknown');
            }

            // Create new variant only if it doesn't exist
            // Use try-catch to handle race conditions where SKU might be created between check and insert
            try {
                $created = $product->variants()->create($attributes);
                $this->syncVariantMetals($created, $metals);
                $this->syncVariantDiamonds($created, $diamonds);
                $persistedIds[] = $created->id;
            } catch (\Illuminate\Database\QueryException $e) {
                // Handle unique constraint violation (race condition)
                if ($e->getCode() === '23505' && str_contains($e->getMessage(), 'product_variants_sku_unique')) {
                    // SKU conflict occurred, generate a new unique SKU and retry
                    if (!empty($attributes['sku'])) {
                        $attributes['sku'] = $this->generateUniqueSku($attributes['sku']);
                        $created = $product->variants()->create($attributes);
                        $this->syncVariantMetals($created, $metals);
                        $this->syncVariantDiamonds($created, $diamonds);
                        $persistedIds[] = $created->id;
                    } else {
                        // If no SKU provided, create without SKU
                        unset($attributes['sku']);
                        $created = $product->variants()->create($attributes);
                        $this->syncVariantMetals($created, $metals);
                        $this->syncVariantDiamonds($created, $diamonds);
                        $persistedIds[] = $created->id;
                    }
                } else {
                    // Log the error for debugging
                    Log::error('Failed to create product variant', [
                        'product_id' => $product->id,
                        'attributes' => $attributes,
                        'error' => $e->getMessage(),
                        'code' => $e->getCode(),
                    ]);
                    // Re-throw if it's a different error
                    throw $e;
                }
            } catch (\Exception $e) {
                // Log any other exceptions
                Log::error('Unexpected error creating product variant', [
                    'product_id' => $product->id,
                    'attributes' => $attributes,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw $e;
            }
        });

        if (! empty($persistedIds)) {
            $product->variants()->whereNotIn('id', $persistedIds)->delete();
        } else {
            $product->variants()->delete();
        }
    }

    protected function syncVariantMetals(ProductVariant $variant, array $metals): void
    {
        // Normalize: ensure metals is an array (not null)
        $metals = $metals ?? [];

        // Filter out any invalid entries
        $metals = array_filter($metals, function ($metal) {
            return !empty($metal['metal_id']) && $metal['metal_id'] > 0;
        });

        $persistedIds = [];

        foreach ($metals as $index => $metal) {
            $metalId = $metal['id'] ?? null;

            // Validate metal_id is present and valid
            if (empty($metal['metal_id']) || $metal['metal_id'] <= 0) {
                continue;
            }

            $attributes = [
                'metal_id' => (int) $metal['metal_id'],
                'metal_purity_id' => isset($metal['metal_purity_id']) && $metal['metal_purity_id'] !== '' && $metal['metal_purity_id'] !== null && $metal['metal_purity_id'] > 0
                    ? (int) $metal['metal_purity_id']
                    : null,
                'metal_tone_id' => isset($metal['metal_tone_id']) && $metal['metal_tone_id'] !== '' && $metal['metal_tone_id'] !== null && $metal['metal_tone_id'] > 0
                    ? (int) $metal['metal_tone_id']
                    : null,
                'metal_weight' => isset($metal['metal_weight']) && $metal['metal_weight'] !== '' && $metal['metal_weight'] !== null
                    ? (float) $metal['metal_weight']
                    : null,
                'metadata' => $metal['metadata'] ?? [],
                'position' => $index,
            ];

            // Update existing metal entry if ID is provided and exists
            if ($metalId && $variant->metals()->where('id', $metalId)->exists()) {
                $variant->metals()->where('id', $metalId)->update($attributes);
                $persistedIds[] = $metalId;
            } else {
                // Create new metal entry
                $created = $variant->metals()->create($attributes);
                $persistedIds[] = $created->id;
            }
        }

        // Delete any metals that are not in the persisted list (removed metals)
        if (! empty($persistedIds)) {
            $variant->metals()->whereNotIn('id', $persistedIds)->delete();
        } else {
            // If no metals provided, delete all existing metals for this variant
            $variant->metals()->delete();
        }
    }

    protected function syncVariantDiamonds(ProductVariant $variant, array $diamonds): void
    {
        // Normalize: ensure diamonds is an array (not null)
        $diamonds = $diamonds ?? [];

        // Filter out empty entries - only include diamonds with diamond_id and count
        $processedDiamonds = [];
        foreach ($diamonds as $diamond) {
            // Handle empty strings properly
            $diamondId = isset($diamond['diamond_id']) && $diamond['diamond_id'] !== '' && $diamond['diamond_id'] !== null ? (int) $diamond['diamond_id'] : 0;
            $diamondsCount = isset($diamond['diamonds_count']) && $diamond['diamonds_count'] !== '' && $diamond['diamonds_count'] !== null ? (int) $diamond['diamonds_count'] : null;

            // Only include if diamond_id is valid
            if ($diamondId > 0) {
                $processedDiamonds[] = [
                    'id' => $diamond['id'] ?? null,
                    'diamond_id' => $diamondId,
                    'diamonds_count' => $diamondsCount,
                    'metadata' => $diamond['metadata'] ?? [],
                ];
            }
        }

        $persistedIds = [];

        foreach ($processedDiamonds as $index => $diamond) {
            $diamondRecordId = $diamond['id'] ?? null;

            $attributes = [
                'diamond_id' => $diamond['diamond_id'],
                'diamonds_count' => $diamond['diamonds_count'],
                'metadata' => $diamond['metadata'],
                'position' => $index,
            ];

            // Update existing diamond entry if ID is provided and exists
            if ($diamondRecordId && $variant->diamonds()->where('id', $diamondRecordId)->exists()) {
                $variant->diamonds()->where('id', $diamondRecordId)->update($attributes);
                $persistedIds[] = $diamondRecordId;
            } else {
                // Create new diamond entry
                $created = $variant->diamonds()->create($attributes);
                $persistedIds[] = $created->id;
            }
        }

        // Delete any diamonds that are not in the persisted list (removed diamonds)
        if (! empty($persistedIds)) {
            $variant->diamonds()->whereNotIn('id', $persistedIds)->delete();
        } else {
            // If no diamonds provided, delete all existing diamonds for this variant
            $variant->diamonds()->delete();
        }
    }


    /**
     * Generate a unique SKU by appending a random suffix if the base SKU already exists.
     */
    protected function generateUniqueSku(?string $baseSku): ?string
    {
        if (!$baseSku) {
            return null;
        }

        // Try to find a unique SKU by appending random characters
        do {
            $candidate = sprintf('%s-%s', $baseSku, Str::upper(Str::random(3)));
        } while (ProductVariant::where('sku', $candidate)->exists());

        return $candidate;
    }
}
