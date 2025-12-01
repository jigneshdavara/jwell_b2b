<?php

namespace App\Services\Catalog;

use App\Models\Product;
use Illuminate\Support\Collection;

/**
 * Service to compute variant dimensions dynamically from product variants.
 * 
 * This service analyzes all variants for a product and determines which attributes
 * actually vary, then builds a dimension structure for the frontend to render
 * dynamic selectors.
 * 
 * To add a new dimension in the future (e.g., stone_color):
 * 1. Add the attribute extraction logic in extractVariantAttributes()
 * 2. Add the dimension configuration in buildDimensions()
 * 3. Update the TypeScript types in the frontend
 */
class ProductVariantDimensionService
{
    /**
     * Compute variant dimensions and normalized variant data for a product.
     *
     * @return array{variants: array, variant_dimensions: array}
     */
    public function computeDimensions(Product $product): array
    {
        $variants = $product->variants()->with([
            'metals.metal',
            'metals.metalPurity',
            'metals.metalTone',
            'diamonds.diamondType',
            'diamonds.diamondClarity',
            'diamonds.diamondColor',
            'diamonds.diamondShape',
            'diamonds.diamondCut',
        ])->orderByDesc('is_default')->orderBy('label')->get();

        // Extract normalized variant data
        $normalizedVariants = $this->normalizeVariants($variants, $product);

        // Compute dimensions from variants
        $dimensions = $this->buildDimensions($normalizedVariants, $product);

        return [
            'variants' => $normalizedVariants,
            'variant_dimensions' => $dimensions,
        ];
    }

    /**
     * Normalize variants into a consistent structure with codes for matching.
     */
    protected function normalizeVariants(Collection $variants, Product $product): array
    {
        return $variants->map(function ($variant) use ($product) {
            $meta = $variant->metadata ?? [];

            // Extract metal information
            $metalCodes = [];
            $metalLabels = [];
            if ($variant->metals && $variant->metals->isNotEmpty()) {
                foreach ($variant->metals as $variantMetal) {
                    $metal = $variantMetal->metal;
                    $purity = $variantMetal->metalPurity;
                    $tone = $variantMetal->metalTone;

                    if ($metal && $purity && $tone) {
                        $code = $this->buildMetalCode($metal->id, $purity->id, $tone->id);
                        $label = $this->buildMetalLabel($metal->name, $purity->name, $tone->name);
                        $metalCodes[] = $code;
                        $metalLabels[] = $label;
                    }
                }
            }

            // Extract diamond information
            $diamondCode = null;
            $diamondLabel = null;

            if ($product->uses_diamond) {
                $mixingMode = $product->diamond_mixing_mode ?? 'shared';

                if ($mixingMode === 'shared') {
                    // Use diamond_option_key from metadata
                    $diamondOptionKey = $meta['diamond_option_key'] ?? null;
                    if ($diamondOptionKey) {
                        $diamondCode = $diamondOptionKey;
                        // Find the label from product's diamond_options
                        $diamondOptions = $product->diamond_options ?? [];
                        foreach ($diamondOptions as $option) {
                            if (($option['key'] ?? null) === $diamondOptionKey) {
                                $diamondLabel = $option['label'] ?? $diamondOptionKey;
                                break;
                            }
                        }
                    }
                } else {
                    // as_variant mode: build from variant.diamonds
                    if ($variant->diamonds && $variant->diamonds->isNotEmpty()) {
                        $diamondCode = $this->buildDiamondCodeFromVariant($variant->diamonds);
                        $diamondLabel = $this->buildDiamondLabelFromVariant($variant->diamonds);
                    }
                }
            }

            // Extract size
            $size = $meta['size_cm'] ?? null;
            if ($size !== null) {
                $size = (string) $size;
            }

            // Calculate price breakdown
            $basePrice = (float) ($product->base_price ?? 0);
            $makingCharge = (float) ($product->making_charge ?? 0);
            $priceAdjustment = (float) ($variant->price_adjustment ?? 0);

            // For now, we'll estimate metal and diamond costs
            // In a real system, you'd calculate these from rates
            $metalCost = 0; // Would be calculated from metal weight × rate
            $diamondCost = 0; // Would be calculated from diamond carat × rate

            return [
                'id' => $variant->id,
                'sku' => $variant->sku ?? $product->sku,
                'label' => $variant->label,
                'is_default' => $variant->is_default,
                'metal_code' => !empty($metalCodes) ? implode('|', $metalCodes) : null,
                'metal_label' => !empty($metalLabels) ? implode(' / ', $metalLabels) : null,
                'diamond_code' => $diamondCode,
                'diamond_label' => $diamondLabel,
                'size' => $size,
                'price_total' => $basePrice + $makingCharge + $priceAdjustment,
                'price_breakup' => [
                    'base' => $basePrice,
                    'metal' => $metalCost,
                    'diamond' => $diamondCost,
                    'making' => $makingCharge,
                    'adjustment' => $priceAdjustment,
                ],
                // Keep original data for reference
                'original_variant' => [
                    'id' => $variant->id,
                    'metals' => $variant->metals->map(fn($m) => [
                        'metal_id' => $m->metal_id,
                        'metal_purity_id' => $m->metal_purity_id,
                        'metal_tone_id' => $m->metal_tone_id,
                        'metal' => $m->metal ? ['id' => $m->metal->id, 'name' => $m->metal->name] : null,
                        'metal_purity' => $m->metalPurity ? ['id' => $m->metalPurity->id, 'name' => $m->metalPurity->name] : null,
                        'metal_tone' => $m->metalTone ? ['id' => $m->metalTone->id, 'name' => $m->metalTone->name] : null,
                    ])->toArray(),
                    'diamonds' => $variant->diamonds->map(fn($d) => [
                        'diamond_type_id' => $d->diamond_type_id,
                        'diamond_clarity_id' => $d->diamond_clarity_id,
                        'diamond_color_id' => $d->diamond_color_id,
                        'diamond_shape_id' => $d->diamond_shape_id,
                        'diamond_cut_id' => $d->diamond_cut_id,
                        'total_carat' => $d->total_carat,
                        'diamonds_count' => $d->diamonds_count,
                    ])->toArray(),
                ],
            ];
        })->toArray();
    }

    /**
     * Build dimensions array from normalized variants.
     * Only includes dimensions that have more than 1 unique value.
     */
    protected function buildDimensions(array $variants, Product $product): array
    {
        $dimensions = [];

        // Collect unique values for each potential dimension
        $metalCodes = [];
        $diamondCodes = [];
        $sizes = [];

        foreach ($variants as $variant) {
            if ($variant['metal_code']) {
                // Handle pipe-separated metal codes (multi-metal variants)
                $codes = explode('|', $variant['metal_code']);
                foreach ($codes as $code) {
                    if (!in_array($code, $metalCodes)) {
                        $metalCodes[$code] = $variant['metal_label'] ?? $code;
                    }
                }
            }

            if ($variant['diamond_code']) {
                if (!isset($diamondCodes[$variant['diamond_code']])) {
                    $diamondCodes[$variant['diamond_code']] = $variant['diamond_label'] ?? $variant['diamond_code'];
                }
            }

            if ($variant['size']) {
                if (!in_array($variant['size'], $sizes)) {
                    $sizes[] = $variant['size'];
                }
            }
        }

        // Only add dimensions that have more than 1 option
        if (count($metalCodes) > 1) {
            $dimensions[] = [
                'key' => 'metal_code',
                'label' => 'Metal',
                'type' => 'chip',
                'options' => array_map(fn($code, $label) => [
                    'value' => $code,
                    'label' => $label,
                ], array_keys($metalCodes), array_values($metalCodes)),
            ];
        }

        if (count($diamondCodes) > 1) {
            $dimensions[] = [
                'key' => 'diamond_code',
                'label' => 'Diamond',
                'type' => 'chip',
                'options' => array_map(fn($code, $label) => [
                    'value' => $code,
                    'label' => $label,
                ], array_keys($diamondCodes), array_values($diamondCodes)),
            ];
        }

        if (count($sizes) > 1) {
            sort($sizes);
            $dimensions[] = [
                'key' => 'size',
                'label' => 'Size (cm)',
                'type' => 'chip',
                'options' => array_map(fn($size) => [
                    'value' => $size,
                    'label' => $size,
                ], $sizes),
            ];
        }

        return $dimensions;
    }

    /**
     * Build a unique code for a metal combination.
     */
    protected function buildMetalCode(int $metalId, int $purityId, int $toneId): string
    {
        return "metal_{$metalId}_purity_{$purityId}_tone_{$toneId}";
    }

    /**
     * Build a human-readable label for a metal combination.
     */
    protected function buildMetalLabel(string $metalName, string $purityName, string $toneName): string
    {
        return "{$purityName} {$toneName} {$metalName}";
    }

    /**
     * Build a unique code for diamond from variant diamonds.
     */
    protected function buildDiamondCodeFromVariant(Collection $diamonds): string
    {
        // Use the first diamond's attributes to build a code
        $first = $diamonds->first();
        if (!$first) {
            return 'no_diamond';
        }

        $parts = [];
        if ($first->diamond_type_id) $parts[] = "type_{$first->diamond_type_id}";
        if ($first->diamond_shape_id) $parts[] = "shape_{$first->diamond_shape_id}";
        if ($first->diamond_clarity_id) $parts[] = "clarity_{$first->diamond_clarity_id}";
        if ($first->diamond_color_id) $parts[] = "color_{$first->diamond_color_id}";
        if ($first->diamond_cut_id) $parts[] = "cut_{$first->diamond_cut_id}";
        if ($first->total_carat) $parts[] = "carat_{$first->total_carat}";

        return !empty($parts) ? 'diamond_' . implode('_', $parts) : 'diamond_unknown';
    }

    /**
     * Build a human-readable label for diamond from variant diamonds.
     */
    protected function buildDiamondLabelFromVariant(Collection $diamonds): string
    {
        $first = $diamonds->first();
        if (!$first) {
            return 'No Diamond';
        }

        $parts = [];
        if ($first->diamondType) $parts[] = $first->diamondType->name;
        if ($first->diamondShape) $parts[] = $first->diamondShape->name;
        if ($first->diamondClarity) $parts[] = $first->diamondClarity->name;
        if ($first->diamondColor) $parts[] = $first->diamondColor->name;
        if ($first->diamondCut) $parts[] = $first->diamondCut->name;
        if ($first->total_carat) $parts[] = number_format((float) $first->total_carat, 2) . 'ct';

        return !empty($parts) ? implode(' — ', $parts) : 'Diamond';
    }
}

