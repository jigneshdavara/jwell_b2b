<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductVariant;

class CartService
{
    public function __construct(protected PricingService $pricingService)
    {
    }

    public function getActiveCart(Customer $user): Cart
    {
        return Cart::firstOrCreate([
            'user_id' => $user->id,
            'status' => 'active',
        ], [
            'currency' => 'INR',
        ])->loadMissing('items.product.media', 'items.variant');
    }

    public function addItem(Customer $user, Product $product, ?ProductVariant $variant, int $quantity = 1, array $configuration = []): Cart
    {
        $cart = $this->getActiveCart($user);

        $quantity = max(1, $quantity);

        $existingItem = $cart->items
            ->firstWhere(fn (CartItem $item) => $item->product_id === $product->id && $item->product_variant_id === optional($variant)->id && $item->configuration == $configuration);

        $targetQuantity = $existingItem ? $existingItem->quantity + $quantity : $quantity;
        $mode = $configuration['mode'] ?? 'purchase';

        $pricingOptions = [
            'variant' => $variant ? $variant->toArray() : null,
            'quantity' => $targetQuantity,
            'customer_group_id' => $user->customer_group_id ?? null,
            'customer_type' => $user->type ?? null,
            'mode' => $mode,
        ];

        $pricing = $this->pricingService
            ->calculateProductPrice($product, $user, $pricingOptions)
            ->toArray();

        if ($existingItem) {
            $existingItem->update([
                'quantity' => $targetQuantity,
                'price_breakdown' => $pricing,
            ]);
        } else {
            $cart->items()->create([
                'product_id' => $product->id,
                'product_variant_id' => $variant?->id,
                'quantity' => $quantity,
                'configuration' => array_merge(
                    ['mode' => $mode, 'selections' => $configuration['selections'] ?? null],
                    $configuration,
                    ['variant' => $variant?->label]
                ),
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

    public function updateItemConfiguration(CartItem $item, array $configuration): void
    {
        $existing = $item->configuration ?? [];
        $merged = array_merge($existing, $configuration);

        if (! isset($merged['mode'])) {
            $merged['mode'] = $existing['mode'] ?? 'purchase';
        }

        $item->update(['configuration' => $merged]);
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
                [
                    'variant' => $item->variant ? $item->variant->toArray() : null,
                    'quantity' => $item->quantity,
                    'customer_group_id' => $cart->user?->customer_group_id ?? null,
                    'customer_type' => $cart->user?->type ?? null,
                    'mode' => $item->configuration['mode'] ?? null,
                ]
            )->toArray();

            $item->price_breakdown = $pricing;
            $item->save();

            $unitSubtotal = $pricing['subtotal'] ?? (($pricing['metal'] ?? 0) + ($pricing['diamond'] ?? 0) + ($pricing['making'] ?? 0));
            $unitDiscount = $pricing['discount'] ?? 0;
            $unitTotal = $pricing['total'] ?? ($unitSubtotal - $unitDiscount);

            $lineSubtotal = $unitSubtotal * $item->quantity;
            $lineDiscount = $unitDiscount * $item->quantity;
            $lineTotal = $unitTotal * $item->quantity;

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_variant_id' => $item->product_variant_id,
                'variant_id' => $item->variant?->id,
                'sku' => $item->product->sku,
                'name' => $item->product->name,
                'variant_label' => $item->variant?->label,
                'quantity' => $item->quantity,
                'inventory_quantity' => $item->variant?->inventory_quantity ?? null,
                'unit_total' => round($unitTotal, 2),
                'line_total' => round($lineTotal, 2),
                'line_subtotal' => round($lineSubtotal, 2),
                'line_discount' => round($lineDiscount, 2),
                'price_breakdown' => $pricing,
                'thumbnail' => optional($item->product->media->sortBy('position')->first())?->url,
                'configuration' => $item->configuration,
            ];
        });

        $subtotal = $items->sum(fn (array $item) => $item['line_subtotal'] ?? $item['line_total']);
        $tax = 0.0;
        $discount = $items->sum(fn (array $item) => $item['line_discount'] ?? 0.0);
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

    public function clearItems(Cart $cart): void
    {
        $cart->items()->delete();
        $cart->update(['status' => 'active']);
    }
}
