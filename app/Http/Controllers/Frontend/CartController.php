<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Frontend\Cart\AddCartItemRequest;
use App\Http\Requests\Frontend\Cart\UpdateCartItemRequest;
use App\Models\CartItem;
use App\Models\Product;
use App\Services\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(protected CartService $cartService) {}

    public function index(): Response
    {
        $user = Auth::user();
        $cart = $this->cartService->getActiveCart($user);
        $summary = $this->cartService->summarize($cart);

        return Inertia::render('Frontend/Cart/Index', [
            'cart' => [
                'items' => $summary['items'],
                'currency' => $summary['currency'],
                'subtotal' => $summary['subtotal'],
                'tax' => $summary['tax'],
                'discount' => $summary['discount'],
                'shipping' => $summary['shipping'],
                'total' => $summary['total'],
            ],
        ]);
    }

    public function store(AddCartItemRequest $request): RedirectResponse
    {
        $user = $request->user();
        $product = Product::findOrFail($request->input('product_id'));
        $variant = null;

        if ($request->filled('product_variant_id')) {
            $variant = $product->variants()->where('id', $request->input('product_variant_id'))->first();

            if (! $variant) {
                return redirect()->back()->with('error', 'Selected variant is no longer available.');
            }
        }

        $quantity = (int) $request->input('quantity', 1);
        $configuration = $request->input('configuration', []);

        $this->cartService->addItem($user, $product, $variant, $quantity, $configuration);

        $variantSuffix = $variant ? ' · ' . $variant->label : '';

        return redirect()
            ->back()
            ->with('success', sprintf('%s%s added to your quotation list.', $product->name, $variantSuffix));
    }

    public function update(UpdateCartItemRequest $request, CartItem $item): RedirectResponse
    {
        $this->authorizeCartItem($request->user()->id, $item);

        $data = $request->validated();

        if (array_key_exists('quantity', $data) && $data['quantity'] !== null) {
            $quantity = (int) $data['quantity'];
            $currentQuantity = $item->quantity;
            $isDecreasing = $quantity < $currentQuantity;

            // Validate inventory quantity if variant exists
            if ($item->product_variant_id) {
                $variant = $item->variant;
                if ($variant) {
                    $inventoryQuantity = $variant->inventory_quantity ?? null;
                    if ($inventoryQuantity !== null) {
                        // If inventory is tracked and is 0, reject the update
                        if ($inventoryQuantity === 0) {
                            return redirect()
                                ->back()
                                ->with('error', 'This product variant is currently out of stock.');
                        }
                        // Only prevent exceeding inventory when increasing (not when decreasing)
                        // Allow decreasing even if new quantity still exceeds inventory (user needs to fix it)
                        if (!$isDecreasing && $quantity > $inventoryQuantity) {
                            return redirect()
                                ->back()
                                ->with('error', "Only {$inventoryQuantity} " . ($inventoryQuantity === 1 ? 'item is' : 'items are') . " available. Maximum {$inventoryQuantity} " . ($inventoryQuantity === 1 ? 'item' : 'items') . " allowed.");
                        }
                    }
                }
            }

            $this->cartService->updateItemQuantity($item, $quantity);
        }

        if (! empty($data['configuration'])) {
            $this->cartService->updateItemConfiguration($item, $data['configuration']);
        }

        return redirect()
            ->back()
            ->with('success', 'Updated quotation entry.');
    }

    public function destroy(Request $request, CartItem $item): RedirectResponse
    {
        $this->authorizeCartItem($request->user()->id, $item);
        $this->cartService->removeItem($item);

        return redirect()
            ->back()
            ->with('success', 'Removed from your purchase list.');
    }

    protected function authorizeCartItem(int $userId, CartItem $item): void
    {
        if ($item->cart->user_id !== $userId) {
            abort(403);
        }
    }
}
