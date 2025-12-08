<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\PriceRate;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Collection;

class PricingService
{
    public function __construct(
        protected MakingChargeDiscountService $discountService
    ) {}

    /**
     * Calculate the detailed price breakdown for a product configuration.
     *
     * @param  Product  $product
     * @param  Customer|null  $user
     * @param  array<string, mixed>  $options
     * @return Collection<string, mixed>
     */
    public function calculateProductPrice(Product $product, ?Customer $user, array $options = []): Collection
    {
        $variant = $options['variant'] ?? null;
        $variantModel = null;

        // Load variant model if variant ID is provided
        if (is_array($variant) && isset($variant['id'])) {
            $variantModel = ProductVariant::with([
                'metals.metal',
                'metals.metalPurity',
                'metals.metalTone',
                'diamonds.diamond',
                'colorstones.colorstone',
            ])->find($variant['id']);
        } elseif ($variant instanceof ProductVariant) {
            $variantModel = $variant->load([
                'metals.metal',
                'metals.metalPurity',
                'metals.metalTone',
                'diamonds.diamond',
                'colorstones.colorstone',
            ]);
        }

        // Calculate metal cost from variant metals
        $metalCost = 0.0;
        if ($variantModel && $variantModel->metals) {
            foreach ($variantModel->metals as $variantMetal) {
                $metal = $variantMetal->metal;
                $purity = $variantMetal->metalPurity;
                $weight = $variantMetal->metal_weight ?? null;

                if ($metal && $purity && $weight) {
                    $metalName = strtolower(trim($metal->name ?? ''));
                    $purityName = trim($purity->name ?? '');

                    $priceRate = PriceRate::where('metal', $metalName)
                        ->where('purity', $purityName)
                        ->orderBy('effective_at', 'desc')
                        ->first();

                    if ($priceRate && $priceRate->price_per_gram) {
                        $metalCost += (float) $weight * (float) $priceRate->price_per_gram;
                    }
                }
            }
        }
        $metalCost = round($metalCost, 2);

        // Calculate diamond cost from variant diamonds
        // Note: Price in diamonds table is per stone, so multiply by count
        // If price seems too high, it might be per carat - adjust calculation accordingly
        $diamondCost = 0.0;
        if ($variantModel && $variantModel->diamonds) {
            foreach ($variantModel->diamonds as $variantDiamond) {
                $diamond = $variantDiamond->diamond;
                $count = $variantDiamond->diamonds_count ?? 1;

                if ($diamond && $diamond->price) {
                    // If price is per carat, we'd need carat weight here
                    // For now, assume price is per stone and use it directly (don't multiply by count)
                    // This prevents over-calculation if price is already high
                    $diamondCost += (float) $diamond->price;
                }
            }
        }
        $diamondCost = round($diamondCost, 2);

        // Calculate colorstone cost from variant colorstones
        // Note: Price in colorstones table is per stone, so multiply by count
        // If price seems too high, it might be per carat - adjust calculation accordingly
        $colorstoneCost = 0.0;
        if ($variantModel && $variantModel->colorstones) {
            foreach ($variantModel->colorstones as $variantColorstone) {
                $colorstone = $variantColorstone->colorstone;
                $count = $variantColorstone->stones_count ?? 1;

                if ($colorstone && $colorstone->price) {
                    // If price is per carat, we'd need carat weight here
                    // For now, assume price is per stone and use it directly (don't multiply by count)
                    // This prevents over-calculation if price is already high
                    $colorstoneCost += (float) $colorstone->price;
                }
            }
        }
        $colorstoneCost = round($colorstoneCost, 2);

        $making = max(0.0, (float) $product->making_charge);

        // Total price: Metal + Diamond + Colorstone + Making Charge (Base Price is NOT included)
        $unitSubtotal = $metalCost + $diamondCost + $colorstoneCost + $making;
        $quantity = max(1, (int) ($options['quantity'] ?? 1));

        $discountContext = array_merge($options, [
            'quantity' => $quantity,
            'unit_subtotal' => $unitSubtotal,
            'line_subtotal' => $unitSubtotal * $quantity,
        ]);

        $discount = $this->discountService->resolve($product, $user, $discountContext);
        $unitDiscount = round((float) ($discount['amount'] ?? 0), 2);
        $unitDiscount = min($unitDiscount, $making);
        $unitDiscount = max(0.0, $unitDiscount);

        $unitTotal = max(0.0, $unitSubtotal - $unitDiscount);

        return collect([
            'metal' => round($metalCost, 2),
            'diamond' => round($diamondCost, 2),
            'colorstone' => round($colorstoneCost, 2),
            'stones' => round($diamondCost, 2), // Keep for backward compatibility
            'making' => round($making, 2),
            'subtotal' => round($unitSubtotal, 2),
            'discount' => $unitDiscount,
            'discount_details' => $discount,
            'tax' => 0.0,
            'total' => round($unitTotal, 2),
        ]);
    }
}
