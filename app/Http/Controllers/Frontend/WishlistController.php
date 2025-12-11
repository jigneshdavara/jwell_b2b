<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Frontend\Wishlist\AddWishlistItemRequest;
use App\Models\Product;
use App\Models\WishlistItem;
use App\Services\CartService;
use App\Services\WishlistService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    public function __construct(
        protected WishlistService $wishlistService,
        protected CartService $cartService
    ) {
    }

    public function index(Request $request): Response
    {
        $wishlist = $this->wishlistService->getWishlist($request->user());

        $items = $wishlist->items->map(function (WishlistItem $item) {
            $product = $item->product;

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'variant_id' => $item->product_variant_id,
                'sku' => $product?->sku,
                'name' => $product?->name,
                'thumbnail' => optional($product?->media->sortBy('display_order')->first())?->url,
                'variant_label' => $item->variant?->label,
                'configuration' => $item->configuration,
            ];
        })->filter(fn (array $item) => $item['name'] !== null);

        return Inertia::render('Frontend/Wishlist/Index', [
            'items' => $items->values()->all(),
        ]);
    }

    public function store(AddWishlistItemRequest $request): RedirectResponse
    {
        $user = $request->user();
        $product = Product::findOrFail($request->validated('product_id'));
        $variantId = $request->validated('product_variant_id');
        $variant = null;

        if ($variantId) {
            $variant = $product->variants()->find($variantId);
        }

        $this->wishlistService->addItem($user, $product, $variant);

        return back()->with('success', 'Saved to your wishlist.');
    }

    public function destroy(Request $request, WishlistItem $item): RedirectResponse
    {
        abort_unless($item->wishlist->customer_id === $request->user()->id, 403);

        $this->wishlistService->removeItem($item);

        return back()->with('success', 'Removed from wishlist.');
    }

    public function addToCart(Request $request, WishlistItem $item): RedirectResponse
    {
        $customer = $request->user();
        abort_unless($item->wishlist->customer_id === $customer->id, 403);

        $product = $item->product;
        if (! $product) {
            $this->wishlistService->removeItem($item);

            return back()->with('error', 'Product is no longer available.');
        }

        $this->cartService->addItem(
            $customer,
            $product,
            $item->variant,
            1,
            $item->configuration ?? []
        );

        $this->wishlistService->removeItem($item);

        return back()->with('success', 'Moved to your quotation list.');
    }

    public function destroyByProduct(Request $request, Product $product): RedirectResponse
    {
        $customer = $request->user();
        $variantId = $request->input('product_variant_id');
        $variant = null;

        if ($variantId) {
            $variant = $product->variants()->find($variantId);
        }

        $this->wishlistService->removeByProduct($customer, $product, $variant);

        return back()->with('success', 'Removed from wishlist.');
    }
}

