<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;

class CartService
{
    public function __construct(protected PricingService $pricingService)
    {
    }

    public function getActiveCart(User $user): Cart
    {
        return Cart::firstOrCreate([
            'user_id' => $user->id,
            'status' => 'active',
        ], [
            'currency' => 'INR',
        ])->loadMissing('items.product.media', 'items.variant');
    }

    public function addItem(User $user, Product $product, ?ProductVariant $variant, int $quantity = 1, array $configuration = []): Cart
    {
        $cart = $this->getActiveCart($user);

        $quantity = max(1, $quantity);

        $existingItem = $cart->items
            ->firstWhere(fn (CartItem $item) => $item->product_id === $product->id && $item->product_variant_id === optional($variant)->id && $item->configuration == $configuration);

        $pricingOptions = ['variant' => $variant ? $variant->toArray() : null];
        $pricing = $this->pricingService
            ->calculateProductPrice($product, $user, $pricingOptions)
            ->toArray();

        if ($existingItem) {
            $existingItem->update([
                'quantity' => $existingItem->quantity + $quantity,
                'price_breakdown' => $pricing,
            ]);
        } else {
            $cart->items()->create([
                'product_id' => $product->id,
                'product_variant_id' => $variant?->id,
                'quantity' => $quantity,
                'configuration' => array_merge($configuration, ['variant' => $variant?->label]),
                'price_breakdown' => $pricing,
            ]);
        }

        return $cart->refresh()->load('items.product.media', 'items.variant');
    }

    public function updateItemQuantity(CartItem $item, int $quantity): void
    {
        $quantity = max(1, $quantity);
        $item->update(['quantity' => $quantity]);
    }

    public function removeItem(CartItem $item): void
    {
        $item->delete();
    }

    public function summarize(Cart $cart): array
    {
        $cart->loadMissing('items.product.media', 'items.variant');

        $items = $cart->items->map(function (CartItem $item) use ($cart) {
            $pricing = $this->pricingService->calculateProductPrice(
                $item->product,
                $cart->user,
                ['variant' => $item->variant ? $item->variant->toArray() : null]
            )->toArray();

            $item->price_breakdown = $pricing;
            $item->save();

            $total = ($pricing['total'] ?? 0) * $item->quantity;

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'variant_id' => $item->variant?->id,
                'sku' => $item->product->sku,
                'name' => $item->product->name,
                'variant_label' => $item->variant?->label,
                'quantity' => $item->quantity,
                'unit_total' => $pricing['total'] ?? 0,
                'line_total' => $total,
                'price_breakdown' => $pricing,
                'thumbnail' => optional($item->product->media->sortBy('position')->first())?->url,
            ];
        });

        $subtotal = $items->sum('line_total');
        $tax = 0.0;
        $discount = 0.0;
        $shipping = 0.0;
        $total = $subtotal + $tax - $discount + $shipping;

        return [
            'items' => $items->toArray(),
            'currency' => $cart->currency ?? 'INR',
            'subtotal' => round($subtotal, 2),
            'tax' => round($tax, 2),
            'discount' => round($discount, 2),
            'shipping' => round($shipping, 2),
            'total' => round($total, 2),
        ];
    }

    public function clear(Cart $cart): void
    {
        $metadata = $cart->metadata ?? [];
        unset($metadata['pending_order_id']);

        $cart->items()->delete();
        $cart->update([
            'status' => 'converted',
            'metadata' => array_merge($metadata, ['converted_at' => now()->toIso8601String()]),
        ]);
    }
}
