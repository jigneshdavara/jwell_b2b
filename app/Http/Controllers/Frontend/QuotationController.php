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
use App\Services\TaxService;
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
        protected PricingService $pricingService,
        protected TaxService $taxService
    ) {}

    public function index(): Response
    {
        $query = Quotation::query()
            ->with(['product.media', 'variant', 'order.statusHistory', 'messages.user'])
            ->where('user_id', Auth::id())
            ->latest();

        // Group quotations by quotation_group_id (or fallback to timestamp-based grouping for old data)
        $quotations = $query
            ->get()
            ->groupBy(function ($quotation) {
                // Use quotation_group_id if available
                if ($quotation->quotation_group_id) {
                    return $quotation->quotation_group_id;
                }
                // Fallback for old quotations: group by user and date+hour+minute (rounded to 5 minutes)
                $createdAt = optional($quotation->created_at);
                if ($createdAt) {
                    $minute = floor($createdAt->format('i') / 5) * 5;
                    return $quotation->user_id . '_' . $createdAt->format('Y-m-d H:') . sprintf('%02d', $minute);
                }
                return $quotation->user_id . '_' . time();
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
                        'thumbnail' => optional($first->product->media->sortBy('display_order')->first())->url,
                    ],
                    'products' => $group->map(function ($q) {
                        return [
                            'id' => $q->product->id,
                            'name' => $q->product->name,
                            'sku' => $q->product->sku,
                            'thumbnail' => optional($q->product->media->sortBy('display_order')->first())->url,
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

        // Find all related quotations using quotation_group_id
        $relatedQuotations = Quotation::query()
            ->where('id', '!=', $quotation->id) // Exclude the main quotation
            ->when($quotation->quotation_group_id, function ($q) use ($quotation) {
                $q->where('quotation_group_id', $quotation->quotation_group_id);
            }, function ($q) use ($quotation) {
                // Fallback for old quotations without group_id: use timestamp-based grouping
                $createdAt = $quotation->created_at;
                $timeWindow = $createdAt ? $createdAt->copy()->subMinutes(5) : null;
                $timeWindowEnd = $createdAt ? $createdAt->copy()->addMinutes(5) : null;
                if ($timeWindow && $timeWindowEnd) {
                    $q->where('user_id', $quotation->user_id)
                        ->whereBetween('created_at', [$timeWindow, $timeWindowEnd]);
                }
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
                            'making_charge_amount' => $q->product->making_charge_amount,
                            'media' => $q->product->media->sortBy('display_order')->values()->map(fn($media) => [
                                'url' => $media->url,
                                'alt' => $media->metadata['alt'] ?? $q->product->name,
                            ]),
                            'variants' => $q->product->variants->map(fn($variant) => [
                                'id' => $variant->id,
                                'label' => $variant->label,
                                'metadata' => $variant->metadata ?? [],
                            ]),
                        ],
                        'variant' => $q->variant ? [
                            'id' => $q->variant->id,
                            'label' => $q->variant->label,
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
                    'media' => $quotation->product->media->sortBy('display_order')->values()->map(fn($media) => [
                        'url' => $media->url,
                        'alt' => $media->metadata['alt'] ?? $quotation->product->name,
                    ]),
                    'variants' => $quotation->product->variants->map(fn($variant) => [
                        'id' => $variant->id,
                        'label' => $variant->label,
                        'metadata' => $variant->metadata ?? [],
                    ]),
                ],
                'variant' => $quotation->variant ? [
                    'id' => $quotation->variant->id,
                    'label' => $quotation->variant->label,
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
                    'history' => $quotation->order->statusHistory->map(fn($history) => [
                        'id' => $history->id,
                        'status' => $history->status,
                        'created_at' => optional($history->created_at)?->toDateTimeString(),
                        'meta' => $history->meta,
                    ]),
                ] : null,
                'tax_rate' => $this->taxService->getDefaultTaxRate(),
                'tax_summary' => $this->calculateQuotationTaxSummary($quotation, $relatedQuotations),
                'messages' => $quotation->messages->map(fn(QuotationMessage $message) => [
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
        $variant = null;
        if ($variantId) {
            /** @var ProductVariant $variant */
            $variant = ProductVariant::query()->findOrFail($variantId);
            if ($variant->product_id !== $product->id) {
                return back()->withErrors(['product_variant_id' => 'The selected variant does not belong to this product.']);
            }

            // Validate inventory availability
            $inventoryQuantity = $variant->inventory_quantity ?? null;
            if ($inventoryQuantity !== null) {
                // If inventory is tracked and is 0, reject the request
                if ($inventoryQuantity === 0) {
                    return back()->withErrors([
                        'quantity' => 'This product variant is currently out of stock. Quotation requests are not available.',
                    ]);
                }
                // If inventory is tracked and quantity exceeds available, reject
                if ($data['quantity'] > $inventoryQuantity) {
                    return back()->withErrors([
                        'quantity' => "The requested quantity ({$data['quantity']}) exceeds the available inventory ({$inventoryQuantity}).",
                    ]);
                }
            }
        }


        // Generate a unique group ID for this quotation request
        $quotationGroupId = \Illuminate\Support\Str::uuid()->toString();

        $quotation = Quotation::create([
            'user_id' => $request->user()->id,
            'quotation_group_id' => $quotationGroupId,
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
        $errors = [];

        try {
            DB::transaction(function () use ($cart, $user, &$quotations, &$errors): void {
                // Group items by product_variant_id to check total quantity per variant
                $variantQuantities = [];
                foreach ($cart->items as $item) {
                    if ($item->product_variant_id) {
                        $variantId = $item->product_variant_id;
                        if (!isset($variantQuantities[$variantId])) {
                            $variantQuantities[$variantId] = [
                                'variant' => $item->variant,
                                'product' => $item->product,
                                'total_quantity' => 0,
                                'items' => [],
                            ];
                        }
                        $variantQuantities[$variantId]['total_quantity'] += $item->quantity;
                        $variantQuantities[$variantId]['items'][] = $item;
                    }
                }

                // Validate total quantity per variant
                foreach ($variantQuantities as $variantId => $data) {
                    $variant = $data['variant'];
                    $product = $data['product'];
                    $totalQuantity = $data['total_quantity'];

                    if ($variant) {
                        $inventoryQuantity = $variant->inventory_quantity ?? null;
                        if ($inventoryQuantity !== null) {
                            // If inventory is tracked and is 0, reject the request
                            if ($inventoryQuantity === 0) {
                                $errors[] = "{$product->name} ({$variant->label}) is currently out of stock. Quotation requests are not available.";
                                continue;
                            }
                            // If total quantity for this variant exceeds available inventory, reject
                            if ($totalQuantity > $inventoryQuantity) {
                                $errors[] = "Total quantity requested for {$product->name} ({$variant->label}) is {$totalQuantity}, but only {$inventoryQuantity} " . ($inventoryQuantity === 1 ? 'item is' : 'items are') . " available.";
                                continue;
                            }
                        }
                    }
                }

                // If there are errors, don't proceed with creating quotations
                if (!empty($errors)) {
                    throw new \Exception(implode(' ', $errors));
                }

                // Generate a unique group ID for all quotations in this submission
                $quotationGroupId = \Illuminate\Support\Str::uuid()->toString();

                foreach ($cart->items as $item) {
                    $product = $item->product;
                    if (! $product) {
                        continue;
                    }

                    $configuration = $item->configuration ?? [];
                    $mode = in_array($configuration['mode'] ?? null, ['purchase', 'jobwork'], true)
                        ? $configuration['mode']
                        : 'purchase';


                    $selections = $configuration['selections'] ?? null;
                    if ($selections !== null && ! is_array($selections)) {
                        $selections = null;
                    }

                    $quotation = Quotation::create([
                        'user_id' => $user->id,
                        'quotation_group_id' => $quotationGroupId, // Same group ID for all items
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

                if (! empty($errors)) {
                    throw new \Exception(implode(' ', $errors));
                }

                $this->cartService->clearItems($cart);
            });
        } catch (\Exception $e) {
            return redirect()
                ->route('frontend.cart.index')
                ->withErrors(['quantity' => $e->getMessage()]);
        }

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

    protected function calculateQuotationTaxSummary(Quotation $quotation, $relatedQuotations): array
    {
        $allQuotations = collect([$quotation])->merge($relatedQuotations);

        $totalSubtotal = 0;

        foreach ($allQuotations as $q) {
            $pricing = $this->pricingService->calculateProductPrice(
                $q->product,
                $q->user,
                [
                    'variant' => $q->variant ? $q->variant->toArray() : null,
                    'quantity' => $q->quantity,
                    'customer_group_id' => $q->user?->customer_group_id ?? null,
                    'customer_type' => $q->user?->type ?? null,
                    'mode' => $q->mode,
                ]
            )->toArray();

            $unitSubtotal = $pricing['subtotal'] ?? (($pricing['metal'] ?? 0) + ($pricing['diamond'] ?? 0) + ($pricing['making'] ?? 0));
            $unitDiscount = $pricing['discount'] ?? 0;
            $lineSubtotal = ($unitSubtotal - $unitDiscount) * $q->quantity;

            $totalSubtotal += $lineSubtotal;
        }

        $taxAmount = $this->taxService->calculateTax($totalSubtotal);
        $grandTotal = $totalSubtotal + $taxAmount;

        return [
            'subtotal' => round($totalSubtotal, 2),
            'tax' => round($taxAmount, 2),
            'total' => round($grandTotal, 2),
        ];
    }
}
