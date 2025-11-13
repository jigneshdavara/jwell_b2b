<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApproveQuotationRequest;
use App\Http\Requests\Admin\UpdateJobworkStatusRequest;
use App\Http\Requests\StoreQuotationMessageRequest;
use App\Mail\QuotationApprovedMail;
use App\Mail\QuotationConfirmationRequestMail;
use App\Mail\QuotationRejectedMail;
use App\Mail\QuotationStatusUpdatedMail;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Quotation;
use App\Models\QuotationMessage;
use App\Services\PricingService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    public function __construct(protected PricingService $pricingService)
    {
    }

    public function index(Request $request): Response
    {
        $query = Quotation::query()
            ->with(['user', 'product', 'variant', 'order'])
            ->latest();

        // Filter by order reference
        if ($request->filled('order_reference')) {
            $query->whereHas('order', function ($q) use ($request) {
                $q->where('reference', 'like', '%'.$request->string('order_reference')->value().'%');
            });
        }

        // Filter by customer name
        if ($request->filled('customer_name')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->string('customer_name')->value().'%');
            });
        }

        // Filter by customer email
        if ($request->filled('customer_email')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('email', 'like', '%'.$request->string('customer_email')->value().'%');
            });
        }

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
                    ],
                    'products' => $group->map(function ($q) {
                        return [
                            'id' => $q->product->id,
                            'name' => $q->product->name,
                        ];
                    })->values()->all(),
                    'user' => [
                        'name' => optional($first->user)->name,
                        'email' => optional($first->user)->email,
                    ],
                    'order_reference' => $first->order?->reference,
                ];
            })
            ->values()
            ->sortByDesc(function ($item) {
                return $item['created_at'] ?? '';
            })
            ->values();

        // Paginate manually
        $perPage = 20;
        $currentPage = $request->integer('page', 1);
        $total = $quotations->count();
        $items = $quotations->slice(($currentPage - 1) * $perPage, $perPage)->values();

        $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Admin/Quotations/Index', [
            'quotations' => $paginated,
            'filters' => [
                'order_reference' => $request->string('order_reference')->value(),
                'customer_name' => $request->string('customer_name')->value(),
                'customer_email' => $request->string('customer_email')->value(),
            ],
        ]);
    }

    public function show(Quotation $quotation): Response
    {
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

        return Inertia::render('Admin/Quotations/Show', [
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
                'related_quotations' => $relatedQuotations->map(function ($q) {
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
                    ];
                }),
                'product' => [
                    'id' => $quotation->product->id,
                    'name' => $quotation->product->name,
                    'sku' => $quotation->product->sku,
                    'base_price' => $quotation->product->base_price,
                    'making_charge' => $quotation->product->making_charge,
                    'media' => $quotation->product->media->sortBy('position')->values()->map(fn ($media) => [
                        'url' => $media->url,
                        'alt' => $media->metadata['alt'] ?? $quotation->product->name,
                    ]),
                    'variants' => $quotation->product->variants->map(fn (ProductVariant $variant) => [
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
                'user' => [
                    'name' => optional($quotation->user)->name,
                    'email' => optional($quotation->user)->email,
                ],
                'order' => $quotation->order ? [
                    'id' => $quotation->order->id,
                    'reference' => $quotation->order->reference,
                    'status' => $quotation->order->status instanceof OrderStatus ? $quotation->order->status->value : (string) $quotation->order->status,
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
                    'author' => $message->sender === 'admin' ? optional($message->user)->name : optional($message->user)->name,
                ]),
            ],
            'jobworkStages' => [
                'material_sending' => 'Material sending',
                'material_received' => 'Material received',
                'under_preparation' => 'Under preparation',
                'completed' => 'Completed',
                'awaiting_billing' => 'Awaiting billing',
                'billing_confirmed' => 'Billing confirmed',
                'ready_to_ship' => 'Ready to ship',
            ],
        ]);
    }

    public function approve(ApproveQuotationRequest $request, Quotation $quotation): RedirectResponse
    {
        if ($quotation->status === 'approved') {
            return redirect()->back()->with('info', 'Quotation already approved.');
        }

        if (! in_array($quotation->status, ['pending', 'customer_confirmed'], true)) {
            return redirect()->back()->with('error', 'Quotation must be confirmed by customer before approval.');
        }

        $previousStatus = $quotation->status;
        DB::transaction(function () use ($request, $quotation): void {
            $quotation->fill([
                'status' => 'approved',
                'approved_at' => Carbon::now(),
                'admin_notes' => $request->validated('admin_notes'),
            ]);

            if ($quotation->mode === 'jobwork') {
                $quotation->jobwork_status = 'material_sending';
                $quotation->save();

                return;
            }

            $order = $this->createOrderFromQuotation($quotation);

            $quotation->order()->associate($order);
            $quotation->jobwork_status = null;
            $quotation->save();
        });

        $quotation->load(['user', 'product', 'order']);
        
        // Send approval email to customer
        Mail::to($quotation->user->email)->send(new QuotationApprovedMail($quotation));
        
        // Send status update email
        Mail::to($quotation->user->email)->send(new QuotationStatusUpdatedMail(
            $quotation,
            $previousStatus,
            $request->validated('admin_notes')
        ));

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', 'Quotation approved successfully.');
    }

    public function reject(ApproveQuotationRequest $request, Quotation $quotation): RedirectResponse
    {
        $previousStatus = $quotation->status;
        $reason = $request->validated('admin_notes');
        
        $quotation->update([
            'status' => 'rejected',
            'admin_notes' => $reason,
        ]);

        $quotation->load(['user', 'product']);
        
        // Send rejection email to customer
        Mail::to($quotation->user->email)->send(new QuotationRejectedMail($quotation, $reason));
        
        // Send status update email
        Mail::to($quotation->user->email)->send(new QuotationStatusUpdatedMail(
            $quotation,
            $previousStatus,
            $reason
        ));

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', 'Quotation rejected.');
    }

    public function updateJobworkStatus(UpdateJobworkStatusRequest $request, Quotation $quotation): RedirectResponse
    {
        if ($quotation->mode !== 'jobwork') {
            return redirect()->back()->with('error', 'Jobwork status is only applicable to jobwork quotations.');
        }

        $previousStatus = $quotation->jobwork_status;
        $notes = $request->validated('admin_notes');
        
        $quotation->update([
            'jobwork_status' => $request->validated('jobwork_status'),
            'admin_notes' => $notes,
        ]);

        if ($request->validated('jobwork_status') === 'billing_confirmed' && ! $quotation->order) {
            $order = $this->createOrderFromQuotation($quotation, OrderStatus::PendingPayment);
            $quotation->order()->associate($order);
            $quotation->save();
        }

        $quotation->load(['user', 'product']);
        
        // Send status update email to customer
        Mail::to($quotation->user->email)->send(new QuotationStatusUpdatedMail(
            $quotation,
            $previousStatus ?? 'pending',
            $notes
        ));

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', 'Jobwork status updated.');
    }

    public function message(Quotation $quotation, StoreQuotationMessageRequest $request): RedirectResponse
    {
        $customerId = auth('web')->id();

        $quotation->messages()->create([
            'user_id' => $customerId,
            'sender' => 'admin',
            'message' => $request->validated('message'),
        ]);

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', 'Message sent to client.');
    }

    public function requestCustomerConfirmation(Request $request, Quotation $quotation): RedirectResponse
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'product_variant_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($data['product_variant_id'] ?? null) {
            $variant = $quotation->product->variants()->findOrFail($data['product_variant_id']);
            $quotation->product_variant_id = $variant->id;
            $quotation->selections = array_merge($quotation->selections ?? [], [
                'auto_label' => $variant->metadata['auto_label'] ?? $variant->label,
            ]);
        }

        $previousStatus = $quotation->status;
        $quotation->quantity = $data['quantity'];
        $quotation->status = 'pending_customer_confirmation';
        if (! empty($data['notes'])) {
            $quotation->admin_notes = $data['notes'];
        }
        $quotation->save();

        $customerId = auth('web')->id();
        $message = $data['notes'] ?? 'Please review updated quotation details.';

        $quotation->messages()->create([
            'user_id' => $customerId,
            'sender' => 'admin',
            'message' => $message,
        ]);

        $quotation->load(['user', 'product']);
        
        // Send confirmation request email to customer
        Mail::to($quotation->user->email)->send(new QuotationConfirmationRequestMail($quotation, $message));
        
        // Send status update email
        Mail::to($quotation->user->email)->send(new QuotationStatusUpdatedMail(
            $quotation,
            $previousStatus,
            $message
        ));

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', 'Updated quotation and requested customer approval.');
    }

    public function updateProduct(Request $request, Quotation $quotation): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'product_variant_id' => ['nullable', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $product = Product::query()->findOrFail($data['product_id']);
        
        if ($data['product_variant_id'] ?? null) {
            $variant = ProductVariant::query()->findOrFail($data['product_variant_id']);
            if ($variant->product_id !== $product->id) {
                return redirect()->back()->withErrors(['product_variant_id' => 'The selected variant does not belong to this product.']);
            }
        }

        $previousStatus = $quotation->status;
        $previousProduct = $quotation->product->name;
        $newProduct = $product->name;

        $quotation->update([
            'product_id' => $product->id,
            'product_variant_id' => $data['product_variant_id'] ?? null,
            'quantity' => $data['quantity'],
            'status' => 'pending_customer_confirmation',
            'admin_notes' => $data['admin_notes'] ?? null,
        ]);

        $quotation->load(['user', 'product']);
        
        $message = $data['admin_notes'] ?? "Product changed from '{$previousProduct}' to '{$newProduct}'.";
        
        $quotation->messages()->create([
            'user_id' => auth('web')->id(),
            'sender' => 'admin',
            'message' => $message,
        ]);

        // Send confirmation request email to customer
        Mail::to($quotation->user->email)->send(new QuotationConfirmationRequestMail($quotation, $message));
        
        // Send status update email
        Mail::to($quotation->user->email)->send(new QuotationStatusUpdatedMail(
            $quotation,
            $previousStatus,
            $message
        ));

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', 'Product updated and customer notified.');
    }

    public function destroy(Quotation $quotation): RedirectResponse
    {
        // Check if there are related quotations - if this is the main one, redirect to list
        $createdAt = $quotation->created_at;
        $timeWindow = $createdAt ? $createdAt->copy()->subMinutes(5) : null;
        $timeWindowEnd = $createdAt ? $createdAt->copy()->addMinutes(5) : null;

        $relatedQuotations = Quotation::query()
            ->where('user_id', $quotation->user_id)
            ->when($timeWindow && $timeWindowEnd, function ($q) use ($timeWindow, $timeWindowEnd) {
                $q->whereBetween('created_at', [$timeWindow, $timeWindowEnd]);
            })
            ->where('id', '!=', $quotation->id)
            ->count();

        $quotation->delete();

        if ($relatedQuotations > 0) {
            // If there are related quotations, redirect to the first one
            $firstRelated = Quotation::query()
                ->where('user_id', $quotation->user_id)
                ->when($timeWindow && $timeWindowEnd, function ($q) use ($timeWindow, $timeWindowEnd) {
                    $q->whereBetween('created_at', [$timeWindow, $timeWindowEnd]);
                })
                ->orderBy('created_at')
                ->first();

            if ($firstRelated) {
                return redirect()
                    ->route('admin.quotations.show', $firstRelated->id)
                    ->with('success', 'Quotation item removed.');
            }
        }

        return redirect()
            ->route('admin.quotations.index')
            ->with('success', 'Quotation removed.');
    }

    protected function createOrderFromQuotation(Quotation $quotation, ?OrderStatus $statusOverride = null): Order
    {
        $quotation->loadMissing('user');

        /** @var Product $product */
        $product = Product::query()->findOrFail($quotation->product_id);
        $variant = $quotation->product_variant_id
            ? ProductVariant::query()->findOrFail($quotation->product_variant_id)
            : null;

        $pricing = $this->pricingService->calculateProductPrice(
            $product,
            $quotation->user,
            [
                'variant' => $variant ? $variant->toArray() : null,
                'quantity' => $quotation->quantity,
                'customer_group_id' => $quotation->user?->customer_group_id ?? null,
                'customer_type' => $quotation->user?->type ?? null,
                'mode' => $quotation->mode,
            ]
        )->toArray();

        $base = (float) ($pricing['base'] ?? $product->base_price);
        $making = (float) ($pricing['making'] ?? $product->making_charge);
        $variantAdjustment = (float) ($pricing['variant_adjustment'] ?? ($variant?->price_adjustment ?? 0));
        $unitSubtotal = (float) ($pricing['subtotal'] ?? ($base + $making + $variantAdjustment));
        $unitDiscount = (float) ($pricing['discount'] ?? 0);
        $unitTotal = (float) ($pricing['total'] ?? ($unitSubtotal - $unitDiscount));

        $lineSubtotal = $unitSubtotal * $quotation->quantity;
        $lineDiscount = $unitDiscount * $quotation->quantity;
        $lineTotal = $unitTotal * $quotation->quantity;

        $initialStatus = $quotation->mode === 'jobwork'
            ? OrderStatus::AwaitingMaterials
            : OrderStatus::InProduction;

        $order = Order::create([
            'user_id' => $quotation->user_id,
            'status' => $statusOverride?->value ?? $initialStatus->value,
            'reference' => Str::upper(Str::random(10)),
            'currency' => 'INR',
            'total_amount' => round($lineTotal, 2),
            'subtotal_amount' => round($lineSubtotal, 2),
            'tax_amount' => 0,
            'discount_amount' => round($lineDiscount, 2),
            'price_breakdown' => [
                'unit' => $pricing,
                'quantity' => $quotation->quantity,
                'line_subtotal' => round($lineSubtotal, 2),
                'line_discount' => round($lineDiscount, 2),
            ],
            'locked_rates' => null,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'quantity' => $quotation->quantity,
            'unit_price' => round($unitTotal, 2),
            'total_price' => round($lineTotal, 2),
            'configuration' => $quotation->selections,
            'metadata' => [
                'mode' => $quotation->mode,
                'quotation_id' => $quotation->id,
                'variant' => $variant ? [
                    'id' => $variant->id,
                    'label' => $variant->label,
                    'metadata' => $variant->metadata,
                ] : null,
            ],
        ]);

        $order->statusHistory()->create([
            'user_id' => auth()->id(),
            'status' => $order->status,
            'meta' => [
                'source' => 'quotation_approval',
            ],
        ]);

        return $order;
    }
}

