<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Wishlist;
use App\Models\WishlistItem;

class WishlistService
{
    public function getWishlist(Customer $customer): Wishlist
    {
        return Wishlist::firstOrCreate(
            ['customer_id' => $customer->id],
            ['name' => 'Primary']
        )->loadMissing('items.product.media', 'items.variant');
    }

    public function addItem(Customer $customer, Product $product, ?ProductVariant $variant = null, array $configuration = []): Wishlist
    {
        $wishlist = $this->getWishlist($customer);

        $existing = $wishlist->items()
            ->where('product_id', $product->id)
            ->where('product_variant_id', $variant?->id)
            ->first();

        if (! $existing) {
            $wishlist->items()->create([
                'product_id' => $product->id,
                'product_variant_id' => $variant?->id,
                'configuration' => $configuration,
            ]);
        }

        return $wishlist->refresh()->load('items.product.media', 'items.variant');
    }

    public function removeItem(WishlistItem $item): void
    {
        $item->delete();
    }

    public function removeByProduct(Customer $customer, Product $product, ?ProductVariant $variant = null): void
    {
        $wishlist = $this->getWishlist($customer);

        $wishlist->items()
            ->where('product_id', $product->id)
            ->when($variant, fn ($query) => $query->where('product_variant_id', $variant->id))
            ->delete();
    }

    public function isWishlisted(Customer $customer, int $productId): bool
    {
        return $this->getWishlist($customer)
            ->items
            ->contains(fn (WishlistItem $item) => $item->product_id === $productId);
    }

    public function productIds(Customer $customer): array
    {
        return $this->getWishlist($customer)
            ->items
            ->pluck('product_id')
            ->unique()
            ->values()
            ->all();
    }
}

