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
use App\Services\PricingService;
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
    public function __construct(
        protected CartService $cartService,
        protected PricingService $pricingService
    ) {
    }

    public function index(): Response
    {
        $query = Quotation::query()
            ->with(['product.media', 'variant', 'order.statusHistory', 'messages.user'])
            ->where('user_id', Auth::id())
            ->latest();

        // Group quotations by user_id and created_at (within same 5 minutes) to show combined modes
        $quotations = $query
            ->get()
            ->groupBy(function ($quotation) {
                $createdAt = optional($quotation->created_at);
                // Group by user and date+hour+minute (rounded to 5 minutes)
                if ($createdAt) {
                    $minute = floor($createdAt->format('i') / 5) * 5;
                    return $quotation->user_id.'_'.$createdAt->format('Y-m-d H:').sprintf('%02d', $minute);
                }
                return $quotation->user_id.'_'.time();
            })
            ->map(function ($group) {
                $first = $group->first();
                $modes = $group->pluck('mode')->unique()->values();
                $totalQuantity = $group->sum('quantity');
                
                return [
                    'id' => $first->id,
                    'ids' => $group->pluck('id')->values()->all(),
                    'mode' => $modes->count() > 1 ? 'both' : $modes->first(),
                    'modes' => $modes->all(),
                    'status' => $first->status,
                    'jobwork_status' => $first->jobwork_status,
                    'quantity' => $totalQuantity,
                    'approved_at' => optional($first->approved_at)?->toDateTimeString(),
                    'created_at' => optional($first->created_at)?->toDateTimeString(),
                    'updated_at' => optional($first->updated_at)?->toDateTimeString(),
                    'product' => [
                        'id' => $first->product->id,
                        'name' => $first->product->name,
                        'sku' => $first->product->sku,
                        'thumbnail' => optional($first->product->media->sortBy('position')->first())->url,
                    ],
                    'products' => $group->map(function ($q) {
                        return [
                            'id' => $q->product->id,
                            'name' => $q->product->name,
                            'sku' => $q->product->sku,
                            'thumbnail' => optional($q->product->media->sortBy('position')->first())->url,
                        ];
                    })->values()->all(),
                    'order_reference' => $first->order?->reference,
                ];
            })
            ->values()
            ->sortByDesc(function ($item) {
                return $item['created_at'] ?? '';
            })
            ->values();

        return Inertia::render('Frontend/Quotations/Index', [
            'quotations' => $quotations,
        ]);
    }

    public function show(Quotation $quotation): Response
    {
        abort_unless($quotation->user_id === Auth::id(), 403);

        $quotation->load(['user', 'product.media', 'variant', 'product.variants', 'order.statusHistory', 'messages.user']);

        // Find all related quotations (same user, within 5 minutes)
        $createdAt = $quotation->created_at;
        $timeWindow = $createdAt ? $createdAt->copy()->subMinutes(5) : null;
        $timeWindowEnd = $createdAt ? $createdAt->copy()->addMinutes(5) : null;

        $relatedQuotations = Quotation::query()
            ->where('user_id', $quotation->user_id)
            ->where('id', '!=', $quotation->id) // Exclude the main quotation
            ->when($timeWindow && $timeWindowEnd, function ($q) use ($timeWindow, $timeWindowEnd) {
                $q->whereBetween('created_at', [$timeWindow, $timeWindowEnd]);
            })
            ->with(['product.media', 'variant', 'product.variants'])
            ->orderBy('created_at')
            ->get();

        return Inertia::render('Frontend/Quotations/Show', [
            'quotation' => [
                'id' => $quotation->id,
                'mode' => $quotation->mode,
                'status' => $quotation->status,
                'jobwork_status' => $quotation->jobwork_status,
                'quantity' => $quotation->quantity,
                'notes' => $quotation->notes,
                'admin_notes' => $quotation->admin_notes,
                'approved_at' => optional($quotation->approved_at)?->toDateTimeString(),
                'selections' => $quotation->selections,
                'created_at' => optional($quotation->created_at)?->toDateTimeString(),
                'updated_at' => optional($quotation->updated_at)?->toDateTimeString(),
                'related_quotations' => $relatedQuotations->map(function ($q) use ($quotation) {
                    $pricing = $this->pricingService->calculateProductPrice(
                        $q->product,
                        $quotation->user,
                        [
                            'variant' => $q->variant ? $q->variant->toArray() : null,
                            'quantity' => $q->quantity,
                            'customer_group_id' => $quotation->user?->customer_group_id ?? null,
                            'customer_type' => $quotation->user?->type ?? null,
                            'mode' => $q->mode,
                        ]
                    )->toArray();

                    return [
                        'id' => $q->id,
                        'mode' => $q->mode,
                        'status' => $q->status,
                        'quantity' => $q->quantity,
                        'notes' => $q->notes,
                        'selections' => $q->selections,
                        'product' => [
                            'id' => $q->product->id,
                            'name' => $q->product->name,
                            'sku' => $q->product->sku,
                            'base_price' => $q->product->base_price,
                            'making_charge' => $q->product->making_charge,
                            'gold_weight' => $q->product->gold_weight,
                            'silver_weight' => $q->product->silver_weight,
                            'other_material_weight' => $q->product->other_material_weight,
                            'total_weight' => $q->product->total_weight,
                            'media' => $q->product->media->sortBy('position')->values()->map(fn ($media) => [
                                'url' => $media->url,
                                'alt' => $media->metadata['alt'] ?? $q->product->name,
                            ]),
                            'variants' => $q->product->variants->map(fn ($variant) => [
                                'id' => $variant->id,
                                'label' => $variant->label,
                                'metadata' => $variant->metadata ?? [],
                                'price_adjustment' => $variant->price_adjustment,
                            ]),
                        ],
                        'variant' => $q->variant ? [
                            'id' => $q->variant->id,
                            'label' => $q->variant->label,
                            'price_adjustment' => $q->variant->price_adjustment,
                            'metadata' => $q->variant->metadata ?? [],
                        ] : null,
                        'price_breakdown' => $pricing,
                    ];
                }),
                'product' => [
                    'id' => $quotation->product->id,
                    'name' => $quotation->product->name,
                    'sku' => $quotation->product->sku,
                    'base_price' => $quotation->product->base_price,
                    'making_charge' => $quotation->product->making_charge,
                    'gold_weight' => $quotation->product->gold_weight,
                    'silver_weight' => $quotation->product->silver_weight,
                    'other_material_weight' => $quotation->product->other_material_weight,
                    'total_weight' => $quotation->product->total_weight,
                    'media' => $quotation->product->media->sortBy('position')->values()->map(fn ($media) => [
                        'url' => $media->url,
                        'alt' => $media->metadata['alt'] ?? $quotation->product->name,
                    ]),
                    'variants' => $quotation->product->variants->map(fn ($variant) => [
                        'id' => $variant->id,
                        'label' => $variant->label,
                        'metadata' => $variant->metadata ?? [],
                        'price_adjustment' => $variant->price_adjustment,
                    ]),
                ],
                'variant' => $quotation->variant ? [
                    'id' => $quotation->variant->id,
                    'label' => $quotation->variant->label,
                    'price_adjustment' => $quotation->variant->price_adjustment,
                    'metadata' => $quotation->variant->metadata ?? [],
                ] : null,
                'price_breakdown' => $this->pricingService->calculateProductPrice(
                    $quotation->product,
                    $quotation->user,
                    [
                        'variant' => $quotation->variant ? $quotation->variant->toArray() : null,
                        'quantity' => $quotation->quantity,
                        'customer_group_id' => $quotation->user?->customer_group_id ?? null,
                        'customer_type' => $quotation->user?->type ?? null,
                        'mode' => $quotation->mode,
                    ]
                )->toArray(),
                'user' => [
                    'name' => optional($quotation->user)->name,
                    'email' => optional($quotation->user)->email,
                ],
                'order' => $quotation->order ? [
                    'id' => $quotation->order->id,
                    'reference' => $quotation->order->reference,
                    'status' => $quotation->order->status?->value ?? null,
                    'total_amount' => $quotation->order->total_amount,
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
                    'author' => optional($message->user)->name,
                ]),
            ],
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

