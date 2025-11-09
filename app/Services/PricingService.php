<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Collection;

class PricingService
{
    /**
     * Calculate the detailed price breakdown for a product configuration.
     *
     * @param  Product  $product
     * @param  User|null  $user
     * @param  array<string, mixed>  $options
     * @return Collection{base: float, metal: float, stones: float, making: float, discount: float, tax: float, total: float}
     */
    public function calculateProductPrice(Product $product, ?User $user, array $options = []): Collection
    {
        $variant = $options['variant'] ?? null;
        $priceAdjustment = $variant['price_adjustment'] ?? 0;

        $base = (float) $product->base_price;
        $making = (float) $product->making_charge;
        $variantCharge = (float) $priceAdjustment;

        $total = $base + $making + $variantCharge;

        return collect([
            'base' => $base,
            'metal' => 0.0,
            'stones' => 0.0,
            'making' => $making,
            'variant_adjustment' => $variantCharge,
            'discount' => 0.0,
            'tax' => 0.0,
            'total' => $total,
        ]);
    }
}

