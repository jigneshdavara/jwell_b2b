<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Product;
use Illuminate\Support\Collection;

class PricingService
{
    public function __construct(
        protected MakingChargeDiscountService $discountService
    ) {
    }

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
        $priceAdjustment = is_array($variant) ? ($variant['price_adjustment'] ?? 0) : 0;

        $base = (float) $product->base_price;
        $making = max(0.0, (float) $product->making_charge);
        $variantCharge = (float) $priceAdjustment;

        $unitSubtotal = $base + $making + $variantCharge;
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
            'base' => round($base, 2),
            'metal' => 0.0,
            'stones' => 0.0,
            'making' => round($making, 2),
            'variant_adjustment' => round($variantCharge, 2),
            'subtotal' => round($unitSubtotal, 2),
            'discount' => $unitDiscount,
            'discount_details' => $discount,
            'tax' => 0.0,
            'total' => round($unitTotal, 2),
        ]);
    }
}

