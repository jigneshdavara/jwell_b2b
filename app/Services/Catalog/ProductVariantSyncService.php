<?php

namespace App\Services\Catalog;

use App\Models\Colorstone;
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
    public function sync(Product $product, array $variants, ?array $variantOptions = null, ?array $diamondOptions = null): void
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

                // Ensure size_cm is included in metadata if provided
                if (isset($payload['size_cm']) && $payload['size_cm'] !== '' && $payload['size_cm'] !== null) {
                    $metadata['size_cm'] = $payload['size_cm'];
                }

                // Convert diamond_option_key to diamond entry if needed
                $diamondOptionKey = $metadata['diamond_option_key'] ?? null;
                if ($diamondOptionKey && isset($diamondOptionsMap[$diamondOptionKey])) {
                    $diamondOption = $diamondOptionsMap[$diamondOptionKey];
                    $metadata['diamond'] = [
                        'key' => $diamondOptionKey,
                        'type_id' => $diamondOption['type_id'] ?? null,
                        'shape_id' => $diamondOption['shape_id'] ?? null,
                        'color_id' => $diamondOption['color_id'] ?? null,
                        'clarity_id' => $diamondOption['clarity_id'] ?? null,
                        'cut_id' => $diamondOption['cut_id'] ?? null,
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
                    'price_adjustment' => (float) ($payload['price_adjustment'] ?? 0),
                    'inventory_quantity' => isset($payload['inventory_quantity']) && $payload['inventory_quantity'] !== '' && $payload['inventory_quantity'] !== null
                        ? (int) $payload['inventory_quantity']
                        : 0,
                    'is_default' => (bool) ($payload['is_default'] ?? false),
                    'metadata' => $metadata,
                    'size_cm' => $payload['size_cm'] ?? null, // Keep for extraction before saving
                    'metals' => $payload['metals'] ?? [],
                    'diamonds' => $payload['diamonds'] ?? [],
                    'colorstones' => $payload['colorstones'] ?? [],
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
            // Extract metals, diamonds, and colorstones arrays from payload BEFORE processing
            $metals = Arr::pull($variant, 'metals', []);
            $diamonds = Arr::pull($variant, 'diamonds', []);
            $colorstones = Arr::pull($variant, 'colorstones', []);

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
            $diamonds = array_filter($diamonds, function ($diamond) {
                // A diamond entry is valid if it has at least one diamond attribute
                return !empty($diamond['diamond_type_id'])
                    || !empty($diamond['diamond_shape_id'])
                    || !empty($diamond['diamond_color_id'])
                    || !empty($diamond['diamond_clarity_id'])
                    || !empty($diamond['diamond_cut_id'])
                    || !empty($diamond['diamond_id']); // Also check for diamond_id
            });

            // If diamonds array is empty but diamond_option_key is in metadata, create a diamond entry
            // This handles the case where frontend sends diamond_option_key in metadata (from matrix generation)
            if (empty($diamonds) && !empty($variant['metadata']['diamond_option_key'])) {
                $diamondOptionKey = $variant['metadata']['diamond_option_key'];
                $diamondOption = $variant['metadata']['diamond'] ?? null;

                // If diamond option data is not in metadata, try to get it from diamondOptionsMap
                if (!$diamondOption && isset($diamondOptionsMap[$diamondOptionKey])) {
                    $diamondOption = $diamondOptionsMap[$diamondOptionKey];
                }

                if ($diamondOption) {
                    $diamonds = [[
                        'diamond_type_id' => !empty($diamondOption['type_id']) ? (int) $diamondOption['type_id'] : null,
                        'diamond_shape_id' => !empty($diamondOption['shape_id']) ? (int) $diamondOption['shape_id'] : null,
                        'diamond_color_id' => !empty($diamondOption['color_id']) ? (int) $diamondOption['color_id'] : null,
                        'diamond_clarity_id' => !empty($diamondOption['clarity_id']) ? (int) $diamondOption['clarity_id'] : null,
                        'diamond_cut_id' => !empty($diamondOption['cut_id']) ? (int) $diamondOption['cut_id'] : null,
                        'total_carat' => !empty($diamondOption['weight']) ? (float) $diamondOption['weight'] : null,
                        'diamonds_count' => !empty($diamondOption['diamonds_count']) ? (int) $diamondOption['diamonds_count'] : null,
                        'metadata' => [],
                    ]];
                }
            }

            // Remove fields that are not columns on product_variants table
            // metal_id, metal_purity_id are only used to create metals entries if metals array is empty
            // metals, diamonds, and colorstones arrays are used to sync related records
            // diamond_option_key and size_cm are stored in metadata, not as direct columns
            // total_weight is on products table, not product_variants
            // metal_tone and stone_quality are legacy fields that don't exist in the database
            $attributes = Arr::except($variant, [
                'id',
                'metal_id',
                'metal_purity_id',
                'metals',
                'diamonds',
                'colorstones',
                'diamond_option_key',
                'size_cm',
                'total_weight',
                'metal_tone', // Legacy field - not in database
                'stone_quality', // Legacy field - not in database
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
                $this->syncVariantColorstones($model, $colorstones);
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
                    $this->syncVariantColorstones($existingBySku, $colorstones);
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
                $this->syncVariantColorstones($created, $colorstones);
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
                        $this->syncVariantColorstones($created, $colorstones);
                        $persistedIds[] = $created->id;
                    } else {
                        // If no SKU provided, create without SKU
                        unset($attributes['sku']);
                        $created = $product->variants()->create($attributes);
                        $this->syncVariantMetals($created, $metals);
                        $this->syncVariantDiamonds($created, $diamonds);
                        $this->syncVariantColorstones($created, $colorstones);
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

        $options = $this->prepareVariantOptions($variantsCollection, $variantOptions ?? []);

        if (Schema::hasColumn('products', 'variant_options')) {
            $product->update([
                'variant_options' => $options,
            ]);
        }
    }

    protected function prepareVariantOptions(Collection $variants, array $provided): array
    {
        $keys = ['size'];

        $baseline = collect($keys)->mapWithKeys(function ($key) use ($variants, $provided) {
            $submitted = $variants->pluck($key)->filter()->unique()->values()->all();
            $library = collect(Arr::get($provided, $key, []))->filter()->unique()->values()->all();

            return [$key => array_values(array_unique(array_merge($library, $submitted)))];
        })->toArray();

        return $baseline;
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
                    : (isset($metal['weight_grams']) && $metal['weight_grams'] !== '' && $metal['weight_grams'] !== null
                        ? (float) $metal['weight_grams']
                        : null),
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

        // Handle both formats: diamond_id (from diamond_selections) or direct shape/color/clarity IDs
        $processedDiamonds = [];
        foreach ($diamonds as $diamond) {
            // If diamond_id is provided, look up the diamond and extract its attributes
            if (!empty($diamond['diamond_id']) && $diamond['diamond_id'] > 0) {
                $diamondModel = Diamond::find($diamond['diamond_id']);
                if ($diamondModel) {
                    $processedDiamonds[] = [
                        'id' => $diamond['id'] ?? null,
                        'diamond_shape_id' => $diamondModel->diamond_shape_id,
                        'diamond_color_id' => $diamondModel->diamond_color_id,
                        'diamond_clarity_id' => $diamondModel->diamond_clarity_id,
                        'diamonds_count' => $diamond['diamonds_count'] ?? null,
                        'total_carat' => $diamond['total_carat'] ?? null,
                        'metadata' => $diamond['metadata'] ?? [],
                    ];
                }
            } else {
                // Direct shape/color/clarity IDs provided
                // Only include if at least one attribute is present
                if (
                    !empty($diamond['diamond_shape_id'])
                    || !empty($diamond['diamond_color_id'])
                    || !empty($diamond['diamond_clarity_id'])
                ) {
                    $processedDiamonds[] = $diamond;
                }
            }
        }

        $persistedIds = [];

        foreach ($processedDiamonds as $index => $diamond) {
            $diamondId = $diamond['id'] ?? null;

            $attributes = [
                'diamond_shape_id' => isset($diamond['diamond_shape_id']) && $diamond['diamond_shape_id'] !== '' && $diamond['diamond_shape_id'] !== null && $diamond['diamond_shape_id'] > 0
                    ? (int) $diamond['diamond_shape_id']
                    : null,
                'diamond_color_id' => isset($diamond['diamond_color_id']) && $diamond['diamond_color_id'] !== '' && $diamond['diamond_color_id'] !== null && $diamond['diamond_color_id'] > 0
                    ? (int) $diamond['diamond_color_id']
                    : null,
                'diamond_clarity_id' => isset($diamond['diamond_clarity_id']) && $diamond['diamond_clarity_id'] !== '' && $diamond['diamond_clarity_id'] !== null && $diamond['diamond_clarity_id'] > 0
                    ? (int) $diamond['diamond_clarity_id']
                    : null,
                'diamonds_count' => isset($diamond['diamonds_count']) && $diamond['diamonds_count'] !== '' && $diamond['diamonds_count'] !== null && $diamond['diamonds_count'] >= 0
                    ? (int) $diamond['diamonds_count']
                    : null,
                'total_carat' => isset($diamond['total_carat']) && $diamond['total_carat'] !== '' && $diamond['total_carat'] !== null && $diamond['total_carat'] > 0
                    ? (float) $diamond['total_carat']
                    : null,
                'metadata' => $diamond['metadata'] ?? [],
                'position' => $index,
            ];

            // Update existing diamond entry if ID is provided and exists
            if ($diamondId && $variant->diamonds()->where('id', $diamondId)->exists()) {
                $variant->diamonds()->where('id', $diamondId)->update($attributes);
                $persistedIds[] = $diamondId;
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

    protected function syncVariantColorstones(ProductVariant $variant, array $colorstones): void
    {
        // Normalize: ensure colorstones is an array (not null)
        $colorstones = $colorstones ?? [];

        // Handle both formats: colorstone_id (from colorstone_selections) or direct shape/color/quality IDs
        $processedColorstones = [];
        foreach ($colorstones as $colorstone) {
            // If colorstone_id is provided, look up the colorstone and extract its attributes
            if (!empty($colorstone['colorstone_id']) && $colorstone['colorstone_id'] > 0) {
                $colorstoneModel = Colorstone::find($colorstone['colorstone_id']);
                if ($colorstoneModel) {
                    $processedColorstones[] = [
                        'id' => $colorstone['id'] ?? null,
                        'colorstone_shape_id' => $colorstoneModel->colorstone_shape_id,
                        'colorstone_color_id' => $colorstoneModel->colorstone_color_id,
                        'colorstone_quality_id' => $colorstoneModel->colorstone_quality_id,
                        'stones_count' => $colorstone['stones_count'] ?? null,
                        'total_carat' => $colorstone['total_carat'] ?? null,
                        'metadata' => $colorstone['metadata'] ?? [],
                    ];
                }
            } else {
                // Direct shape/color/quality IDs provided
                // Only include if at least one attribute is present
                if (
                    !empty($colorstone['colorstone_shape_id'])
                    || !empty($colorstone['colorstone_color_id'])
                    || !empty($colorstone['colorstone_quality_id'])
                ) {
                    $processedColorstones[] = $colorstone;
                }
            }
        }

        $persistedIds = [];

        foreach ($processedColorstones as $index => $colorstone) {
            $colorstoneId = $colorstone['id'] ?? null;

            $attributes = [
                'colorstone_shape_id' => isset($colorstone['colorstone_shape_id']) && $colorstone['colorstone_shape_id'] !== '' && $colorstone['colorstone_shape_id'] !== null && $colorstone['colorstone_shape_id'] > 0
                    ? (int) $colorstone['colorstone_shape_id']
                    : null,
                'colorstone_color_id' => isset($colorstone['colorstone_color_id']) && $colorstone['colorstone_color_id'] !== '' && $colorstone['colorstone_color_id'] !== null && $colorstone['colorstone_color_id'] > 0
                    ? (int) $colorstone['colorstone_color_id']
                    : null,
                'colorstone_quality_id' => isset($colorstone['colorstone_quality_id']) && $colorstone['colorstone_quality_id'] !== '' && $colorstone['colorstone_quality_id'] !== null && $colorstone['colorstone_quality_id'] > 0
                    ? (int) $colorstone['colorstone_quality_id']
                    : null,
                'stones_count' => isset($colorstone['stones_count']) && $colorstone['stones_count'] !== '' && $colorstone['stones_count'] !== null && $colorstone['stones_count'] >= 0
                    ? (int) $colorstone['stones_count']
                    : null,
                'total_carat' => isset($colorstone['total_carat']) && $colorstone['total_carat'] !== '' && $colorstone['total_carat'] !== null && $colorstone['total_carat'] > 0
                    ? (float) $colorstone['total_carat']
                    : null,
                'metadata' => $colorstone['metadata'] ?? [],
                'position' => $index,
            ];

            // Update existing colorstone entry if ID is provided and exists
            if ($colorstoneId && $variant->colorstones()->where('id', $colorstoneId)->exists()) {
                $variant->colorstones()->where('id', $colorstoneId)->update($attributes);
                $persistedIds[] = $colorstoneId;
            } else {
                // Create new colorstone entry
                $created = $variant->colorstones()->create($attributes);
                $persistedIds[] = $created->id;
            }
        }

        // Delete any colorstones that are not in the persisted list (removed colorstones)
        if (! empty($persistedIds)) {
            $variant->colorstones()->whereNotIn('id', $persistedIds)->delete();
        } else {
            // If no colorstones provided, delete all existing colorstones for this variant
            $variant->colorstones()->delete();
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
