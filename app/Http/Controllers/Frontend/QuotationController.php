<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuotationMessageRequest;
use App\Mail\QuotationSubmittedAdminMail;
use App\Mail\QuotationSubmittedCustomerMail;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Quotation;
use App\Models\QuotationMessage;
use App\Services\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    public function __construct(protected CartService $cartService)
    {
    }

    public function index(): Response
    {
        $quotations = Quotation::query()
            ->with(['product.media', 'variant', 'order.statusHistory', 'messages.user'])
            ->where('user_id', Auth::id())
            ->latest()
            ->get()
            ->map(fn (Quotation $quotation) => [
                'id' => $quotation->id,
                'mode' => $quotation->mode,
                'status' => $quotation->status,
                'jobwork_status' => $quotation->jobwork_status,
                'approved_at' => optional($quotation->approved_at)?->toDateTimeString(),
                'admin_notes' => $quotation->admin_notes,
                'quantity' => $quotation->quantity,
                'notes' => $quotation->notes,
                'selections' => $quotation->selections,
                'product' => [
                    'id' => $quotation->product->id,
                    'name' => $quotation->product->name,
                    'sku' => $quotation->product->sku,
                    'thumbnail' => optional($quotation->product->media->sortBy('position')->first())->url,
                ],
                'variant' => $quotation->variant ? [
                    'id' => $quotation->variant->id,
                    'label' => $quotation->variant->label,
                    'metadata' => $quotation->variant->metadata ?? [],
                ] : null,
                'order' => $quotation->order ? [
                    'id' => $quotation->order->id,
                    'reference' => $quotation->order->reference,
                    'status' => $quotation->order->status?->value ?? null,
                    'history' => $quotation->order->statusHistory->map(fn ($history) => [
                        'id' => $history->id,
                        'status' => $history->status,
                        'created_at' => optional($history->created_at)?->toDateTimeString(),
                        'meta' => $history->meta,
                    ]),
                ] : null,
                'messages' => $quotation->messages->map(fn (QuotationMessage $message) => [
                    'id' => $message->id,
                    'sender' => $message->sender,
                    'message' => $message->message,
                    'created_at' => optional($message->created_at)?->toDateTimeString(),
                ]),
                'created_at' => $quotation->created_at?->toDateTimeString(),
                'updated_at' => $quotation->updated_at?->toDateTimeString(),
            ]);

        return Inertia::render('Frontend/Quotations/Index', [
            'quotations' => $quotations,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'product_variant_id' => ['nullable', 'exists:product_variants,id'],
            'mode' => ['required', Rule::in(['purchase', 'jobwork'])],
            'quantity' => ['required', 'integer', 'min:1'],
            'selections' => ['nullable', 'array'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        /** @var Product $product */
        $product = Product::query()->findOrFail($data['product_id']);

        $variantId = $data['product_variant_id'] ?? null;
        if ($variantId) {
            /** @var ProductVariant $variant */
            $variant = ProductVariant::query()->findOrFail($variantId);
            if ($variant->product_id !== $product->id) {
                return back()->withErrors(['product_variant_id' => 'The selected variant does not belong to this product.']);
            }
        }

        if ($data['mode'] === 'jobwork' && ! $product->is_jobwork_allowed) {
            return back()->withErrors(['mode' => 'Jobwork quotations are not allowed for this product.']);
        }

        $quotation = Quotation::create([
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
            'product_variant_id' => $variantId,
            'mode' => $data['mode'],
            'status' => 'pending',
            'quantity' => $data['quantity'],
            'selections' => $data['selections'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        $quotation->load(['user', 'product']);

        // Send email to customer
        Mail::to($quotation->user->email)->send(new QuotationSubmittedCustomerMail($quotation));

        // Send email to admin
        $adminEmail = config('mail.from.address');
        if ($adminEmail) {
            Mail::to($adminEmail)->send(new QuotationSubmittedAdminMail($quotation));
        }

        return redirect()
            ->route('frontend.quotations.index')
            ->with('success', 'Quotation submitted successfully. Our team will get back to you shortly.');
    }

    public function destroy(Quotation $quotation): RedirectResponse
    {
        abort_unless($quotation->user_id === Auth::id(), 403);

        if ($quotation->status !== 'pending') {
            return redirect()
                ->route('frontend.quotations.index')
                ->with('error', 'Only pending quotations can be cancelled.');
        }

        $quotation->delete();

        return redirect()
            ->route('frontend.quotations.index')
            ->with('success', 'Quotation cancelled successfully.');
    }

    public function message(Quotation $quotation, StoreQuotationMessageRequest $request): RedirectResponse
    {
        abort_unless($quotation->user_id === Auth::id(), 403);

        $quotation->messages()->create([
            'user_id' => $request->user()->id,
            'sender' => 'customer',
            'message' => $request->validated('message'),
        ]);

        return redirect()
            ->route('frontend.quotations.index')
            ->with('success', 'Message sent.');
    }

    public function storeFromCart(Request $request): RedirectResponse
    {
        $user = $request->user();
        $cart = $this->cartService->getActiveCart($user);
        $cart->loadMissing('items.product', 'items.variant');

        if ($cart->items->isEmpty()) {
            return redirect()->route('frontend.cart.index')->with('error', 'Your quotation list is empty.');
        }

        $quotations = [];
        DB::transaction(function () use ($cart, $user, &$quotations): void {
            foreach ($cart->items as $item) {
                $product = $item->product;
                if (! $product) {
                    continue;
                }

                $configuration = $item->configuration ?? [];
                $mode = in_array($configuration['mode'] ?? null, ['purchase', 'jobwork'], true)
                    ? $configuration['mode']
                    : 'purchase';

                if ($mode === 'jobwork' && ! $product->is_jobwork_allowed) {
                    $mode = 'purchase';
                }

                $selections = $configuration['selections'] ?? null;
                if ($selections !== null && ! is_array($selections)) {
                    $selections = null;
                }

                $quotation = Quotation::create([
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                    'product_variant_id' => $item->product_variant_id,
                    'mode' => $mode,
                    'status' => 'pending',
                    'quantity' => $item->quantity,
                    'selections' => $selections,
                    'notes' => $configuration['notes'] ?? null,
                ]);

                if (! empty($configuration['notes'])) {
                    $quotation->messages()->create([
                        'user_id' => $user->id,
                        'sender' => 'customer',
                        'message' => (string) $configuration['notes'],
                    ]);
                }

                $quotations[] = $quotation;
            }

            $this->cartService->clearItems($cart);
        });

        // Send emails for all quotations
        $adminEmail = config('mail.from.address');
        foreach ($quotations as $quotation) {
            $quotation->load(['user', 'product']);
            Mail::to($quotation->user->email)->send(new QuotationSubmittedCustomerMail($quotation));
            
            if ($adminEmail) {
                Mail::to($adminEmail)->send(new QuotationSubmittedAdminMail($quotation));
            }
        }

        return redirect()
            ->route('frontend.quotations.index')
            ->with('success', 'Quotation requests submitted successfully.');
    }

    public function confirm(Quotation $quotation): RedirectResponse
    {
        abort_unless($quotation->user_id === Auth::id(), 403);

        if ($quotation->status !== 'pending_customer_confirmation') {
            return redirect()->route('frontend.quotations.index')->with('error', 'No confirmation required for this quotation.');
        }

        $quotation->update(['status' => 'customer_confirmed']);

        $quotation->messages()->create([
            'user_id' => Auth::id(),
            'sender' => 'customer',
            'message' => 'Customer approved the updated quotation.',
        ]);

        return redirect()->route('frontend.quotations.index')->with('success', 'Quotation approved. Awaiting admin confirmation.');
    }

    public function decline(Quotation $quotation): RedirectResponse
    {
        abort_unless($quotation->user_id === Auth::id(), 403);

        if ($quotation->status !== 'pending_customer_confirmation') {
            return redirect()->route('frontend.quotations.index')->with('error', 'No confirmation required for this quotation.');
        }

        $quotation->update(['status' => 'customer_declined']);

        $quotation->messages()->create([
            'user_id' => Auth::id(),
            'sender' => 'customer',
            'message' => 'Customer declined the updated quotation.',
        ]);

        return redirect()->route('frontend.quotations.index')->with('success', 'Quotation declined.');
    }
}

