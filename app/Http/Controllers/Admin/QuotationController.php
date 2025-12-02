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
    public function __construct(protected PricingService $pricingService) {}

    public function index(Request $request): Response
    {
        $query = Quotation::query()
            ->with(['user', 'product', 'variant', 'order'])
            ->latest();

        // Filter by order reference
        if ($request->filled('order_reference')) {
            $query->whereHas('order', function ($q) use ($request) {
                $q->where('reference', 'like', '%' . $request->string('order_reference')->value() . '%');
            });
        }

        // Filter by customer name
        if ($request->filled('customer_name')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->string('customer_name')->value() . '%');
            });
        }

        // Filter by customer email
        if ($request->filled('customer_email')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('email', 'like', '%' . $request->string('customer_email')->value() . '%');
            });
        }

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

        // Find all related quotations (same quotation_group_id)
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
                            'media' => $q->product->media->sortBy('position')->values()->map(fn($media) => [
                                'url' => $media->url,
                                'alt' => $media->metadata['alt'] ?? $q->product->name,
                            ]),
                            'variants' => $q->product->variants->map(fn($variant) => [
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
                    'media' => $quotation->product->media->sortBy('position')->values()->map(fn($media) => [
                        'url' => $media->url,
                        'alt' => $media->metadata['alt'] ?? $quotation->product->name,
                    ]),
                    'variants' => $quotation->product->variants->map(fn(ProductVariant $variant) => [
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
                    'status' => $quotation->order->status instanceof OrderStatus ? $quotation->order->status->value : (string) $quotation->order->status,
                    'total_amount' => $quotation->order->total_amount,
                    'history' => $quotation->order->statusHistory->map(fn($history) => [
                        'id' => $history->id,
                        'status' => $history->status,
                        'created_at' => optional($history->created_at)?->toDateTimeString(),
                        'meta' => $history->meta,
                    ]),
                ] : null,
                'messages' => $quotation->messages->map(fn(QuotationMessage $message) => [
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

        // Find all related quotations in the same group
        $relatedQuotations = $this->getRelatedQuotations($quotation)
            ->whereIn('status', ['pending', 'customer_confirmed'])
            ->get();

        if ($relatedQuotations->isEmpty()) {
            return redirect()->back()->with('error', 'No quotations found to approve.');
        }

        $previousStatus = $quotation->status;
        $approvedQuotations = collect();
        $order = null;

        DB::transaction(function () use ($request, $relatedQuotations, &$approvedQuotations, &$order): void {
            $quotation = $relatedQuotations->first();
            $quotation->loadMissing('user');

            // Separate purchase and jobwork quotations
            $purchaseQuotations = $relatedQuotations->filter(fn($q) => $q->mode === 'purchase');
            $jobworkQuotations = $relatedQuotations->filter(fn($q) => $q->mode === 'jobwork');

            // Process all quotations
            foreach ($relatedQuotations as $q) {
                // Check if already approved
                if ($q->status === 'approved') {
                    continue;
                }

                // Update status
                $q->fill([
                    'status' => 'approved',
                    'approved_at' => Carbon::now(),
                    'admin_notes' => $request->validated('admin_notes'),
                ]);

                // Reduce inventory quantity when quotation is approved
                if ($q->product_variant_id) {
                    $variant = ProductVariant::query()->find($q->product_variant_id);
                    if ($variant && $variant->inventory_quantity !== null) {
                        $currentInventory = $variant->inventory_quantity ?? 0;
                        $requestedQuantity = $q->quantity;
                        $newInventory = max(0, $currentInventory - $requestedQuantity); // Prevent negative inventory
                        $variant->update(['inventory_quantity' => $newInventory]);
                    }
                }

                // Handle jobwork status
                if ($q->mode === 'jobwork') {
                    $q->jobwork_status = 'material_sending';
                } else {
                    $q->jobwork_status = null;
                }

                $q->save();
                $approvedQuotations->push($q);
            }

            // Create a single order for all purchase quotations
            if ($purchaseQuotations->isNotEmpty() && !$order) {
                $order = $this->createOrderFromQuotations($purchaseQuotations);

                // Associate order with all purchase quotations
                foreach ($purchaseQuotations as $q) {
                    $q->order()->associate($order);
                    $q->save();
                }
            }
        });

        $quotation->load(['user', 'product', 'order']);

        // Send approval email to customer (only once for the group)
        Mail::to($quotation->user->email)->send(new QuotationApprovedMail($quotation));

        // Send status update email
        Mail::to($quotation->user->email)->send(new QuotationStatusUpdatedMail(
            $quotation,
            $previousStatus,
            $request->validated('admin_notes')
        ));

        $count = $approvedQuotations->count();
        $message = $count > 1
            ? "All {$count} quotations approved successfully."
            : 'Quotation approved successfully.';

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', $message);
    }

    public function reject(ApproveQuotationRequest $request, Quotation $quotation): RedirectResponse
    {
        // Find all related quotations in the same group
        $relatedQuotations = $this->getRelatedQuotations($quotation)
            ->where('status', '!=', 'rejected')
            ->get();

        if ($relatedQuotations->isEmpty()) {
            return redirect()->back()->with('info', 'All quotations in this group are already rejected.');
        }

        $previousStatus = $quotation->status;
        $reason = $request->validated('admin_notes');
        $rejectedCount = 0;

        DB::transaction(function () use ($relatedQuotations, $reason, &$rejectedCount): void {
            foreach ($relatedQuotations as $q) {
                if ($q->status === 'rejected') {
                    continue;
                }

                $q->update([
                    'status' => 'rejected',
                    'admin_notes' => $reason,
                ]);
                $rejectedCount++;
            }
        });

        $quotation->load(['user', 'product']);

        // Send rejection email to customer (only once for the group)
        Mail::to($quotation->user->email)->send(new QuotationRejectedMail($quotation, $reason));

        // Send status update email
        Mail::to($quotation->user->email)->send(new QuotationStatusUpdatedMail(
            $quotation,
            $previousStatus,
            $reason
        ));

        $message = $rejectedCount > 1
            ? "All {$rejectedCount} quotations rejected successfully."
            : 'Quotation rejected.';

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', $message);
    }

    public function updateJobworkStatus(UpdateJobworkStatusRequest $request, Quotation $quotation): RedirectResponse
    {
        // Find all related jobwork quotations in the same group
        $relatedQuotations = $this->getRelatedQuotations($quotation)
            ->where('mode', 'jobwork')
            ->get();

        if ($relatedQuotations->isEmpty()) {
            return redirect()->back()->with('error', 'No jobwork quotations found in this group.');
        }

        $previousStatus = $quotation->jobwork_status;
        $notes = $request->validated('admin_notes');
        $newStatus = $request->validated('jobwork_status');
        $updatedCount = 0;

        DB::transaction(function () use ($relatedQuotations, $newStatus, $notes, &$updatedCount): void {
            foreach ($relatedQuotations as $q) {
                $q->update([
                    'jobwork_status' => $newStatus,
                    'admin_notes' => $notes,
                ]);
                $updatedCount++;

                // Create order when billing is confirmed for all jobwork quotations
                if ($newStatus === 'billing_confirmed' && ! $q->order) {
                    $order = $this->createOrderFromQuotation($q, OrderStatus::PendingPayment);
                    $q->order()->associate($order);
                    $q->save();
                }
            }
        });

        $quotation->load(['user', 'product']);

        // Send status update email to customer (only once for the group)
        Mail::to($quotation->user->email)->send(new QuotationStatusUpdatedMail(
            $quotation,
            $previousStatus ?? 'pending',
            $notes
        ));

        $message = $updatedCount > 1
            ? "Jobwork status updated for all {$updatedCount} quotations."
            : 'Jobwork status updated.';

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', $message);
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
        // Find all related quotations in the same group
        $relatedQuotations = $this->getRelatedQuotations($quotation)
            ->whereIn('status', ['pending', 'approved', 'rejected'])
            ->get();

        if ($relatedQuotations->isEmpty()) {
            return redirect()->back()->with('error', 'No quotations found to request confirmation.');
        }

        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'product_variant_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $previousStatus = $quotation->status;
        $message = $data['notes'] ?? 'Please review updated quotation details.';
        $updatedCount = 0;

        DB::transaction(function () use ($relatedQuotations, $data, $message, $quotation, &$updatedCount): void {
            foreach ($relatedQuotations as $q) {
                // Update variant if provided (only for the main quotation or matching product)
                if (($data['product_variant_id'] ?? null) && $q->product_id === $quotation->product_id) {
                    $variant = $q->product->variants()->find($data['product_variant_id']);
                    if ($variant) {
                        $q->product_variant_id = $variant->id;
                        $q->selections = array_merge($q->selections ?? [], [
                            'auto_label' => $variant->metadata['auto_label'] ?? $variant->label,
                        ]);
                    }
                }

                // Update quantity if it's the main quotation
                if ($q->id === $quotation->id) {
                    $q->quantity = $data['quantity'];
                }

                $q->status = 'pending_customer_confirmation';
                if (! empty($data['notes'])) {
                    $q->admin_notes = $data['notes'];
                }
                $q->save();
                $updatedCount++;

                // Add message to each quotation
                $q->messages()->create([
                    'user_id' => auth('web')->id(),
                    'sender' => 'admin',
                    'message' => $message,
                ]);
            }
        });

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

    public function addItem(Request $request, Quotation $quotation): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'product_variant_id' => ['nullable', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'mode' => ['required', 'in:purchase,jobwork'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $product = Product::query()->findOrFail($data['product_id']);

        if ($data['product_variant_id'] ?? null) {
            $variant = ProductVariant::query()->findOrFail($data['product_variant_id']);
            if ($variant->product_id !== $product->id) {
                return redirect()->back()->withErrors(['product_variant_id' => 'The selected variant does not belong to this product.']);
            }

            // Validate inventory availability
            $inventoryQuantity = $variant->inventory_quantity ?? null;
            if ($inventoryQuantity !== null) {
                if ($inventoryQuantity === 0) {
                    return redirect()->back()->withErrors([
                        'quantity' => 'This product variant is currently out of stock.',
                    ]);
                }
                if ($data['quantity'] > $inventoryQuantity) {
                    return redirect()->back()->withErrors([
                        'quantity' => "The requested quantity ({$data['quantity']}) exceeds the available inventory ({$inventoryQuantity}).",
                    ]);
                }
            }
        }

        if ($data['mode'] === 'jobwork' && ! $product->is_jobwork_allowed) {
            return redirect()->back()->withErrors(['mode' => 'Jobwork quotations are not allowed for this product.']);
        }

        // Create a new quotation with the same quotation_group_id
        $newQuotation = Quotation::create([
            'user_id' => $quotation->user_id,
            'quotation_group_id' => $quotation->quotation_group_id ?? \Illuminate\Support\Str::uuid()->toString(), // Use same group ID or create new one
            'product_id' => $product->id,
            'product_variant_id' => $data['product_variant_id'] ?? null,
            'mode' => $data['mode'],
            'status' => 'pending_customer_confirmation',
            'quantity' => $data['quantity'],
            'selections' => null,
            'notes' => null,
        ]);

        $message = (string) ($data['admin_notes'] ?? "Added new product '{$product->name}' to quotation.");

        $quotation->messages()->create([
            'user_id' => auth('web')->id(),
            'sender' => 'admin',
            'message' => $message,
        ]);

        if (config('mail.from.address') && $quotation->user->email) {
            Mail::to($quotation->user->email)->send(new QuotationStatusUpdatedMail(
                $quotation,
                $quotation->status,
                $message
            ));
        }

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', 'Added new item to quotation and requested customer approval.');
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

        $message = (string) ($data['admin_notes'] ?? "Product changed from '{$previousProduct}' to '{$newProduct}'.");

        $quotation->messages()->create([
            'user_id' => auth('web')->id(),
            'sender' => 'admin',
            'message' => $message,
        ]);

        // Send confirmation request email to customer
        if (config('mail.from.address') && $quotation->user->email) {
            Mail::to($quotation->user->email)->send(new QuotationConfirmationRequestMail($quotation, $message));

            // Send status update email
            Mail::to($quotation->user->email)->send(new QuotationStatusUpdatedMail(
                $quotation,
                (string) $previousStatus,
                $message
            ));
        }

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', 'Product updated and customer notified.');
    }

    public function destroy(Quotation $quotation): RedirectResponse
    {
        // Check if there are related quotations using quotation_group_id
        $relatedQuotations = Quotation::query()
            ->where('id', '!=', $quotation->id)
            ->when($quotation->quotation_group_id, function ($q) use ($quotation) {
                $q->where('quotation_group_id', $quotation->quotation_group_id);
            }, function ($q) use ($quotation) {
                // Fallback for old quotations: use timestamp-based grouping
                $createdAt = $quotation->created_at;
                $timeWindow = $createdAt ? $createdAt->copy()->subMinutes(5) : null;
                $timeWindowEnd = $createdAt ? $createdAt->copy()->addMinutes(5) : null;
                if ($timeWindow && $timeWindowEnd) {
                    $q->where('user_id', $quotation->user_id)
                        ->whereBetween('created_at', [$timeWindow, $timeWindowEnd]);
                }
            })
            ->count();

        $quotation->delete();

        if ($relatedQuotations > 0) {
            // If there are related quotations, redirect to the first one
            $firstRelated = Quotation::query()
                ->when($quotation->quotation_group_id, function ($q) use ($quotation) {
                    $q->where('quotation_group_id', $quotation->quotation_group_id);
                }, function ($q) use ($quotation) {
                    // Fallback for old quotations
                    $createdAt = $quotation->created_at;
                    $timeWindow = $createdAt ? $createdAt->copy()->subMinutes(5) : null;
                    $timeWindowEnd = $createdAt ? $createdAt->copy()->addMinutes(5) : null;
                    if ($timeWindow && $timeWindowEnd) {
                        $q->where('user_id', $quotation->user_id)
                            ->whereBetween('created_at', [$timeWindow, $timeWindowEnd]);
                    }
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

    protected function createOrderFromQuotations($quotations, ?OrderStatus $statusOverride = null): Order
    {
        if ($quotations->isEmpty()) {
            throw new \InvalidArgumentException('Cannot create order from empty quotations collection.');
        }

        $firstQuotation = $quotations->first();
        $firstQuotation->loadMissing('user');

        $totalAmount = 0;
        $totalSubtotal = 0;
        $totalDiscount = 0;
        $orderItems = [];

        // Calculate totals for all quotations
        foreach ($quotations as $quotation) {
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

            $metalCost = (float) ($pricing['metal'] ?? 0);
            $diamondCost = (float) ($pricing['diamond'] ?? 0);
            $making = (float) ($pricing['making'] ?? $product->making_charge);
            $unitSubtotal = (float) ($pricing['subtotal'] ?? ($metalCost + $diamondCost + $making));
            $unitDiscount = (float) ($pricing['discount'] ?? 0);
            $unitTotal = (float) ($pricing['total'] ?? ($unitSubtotal - $unitDiscount));

            $lineSubtotal = $unitSubtotal * $quotation->quantity;
            $lineDiscount = $unitDiscount * $quotation->quantity;
            $lineTotal = $unitTotal * $quotation->quantity;

            $totalAmount += $lineTotal;
            $totalSubtotal += $lineSubtotal;
            $totalDiscount += $lineDiscount;

            $orderItems[] = [
                'product' => $product,
                'variant' => $variant,
                'quotation' => $quotation,
                'unit_total' => $unitTotal,
                'line_total' => $lineTotal,
                'line_subtotal' => $lineSubtotal,
                'line_discount' => $lineDiscount,
                'pricing' => $pricing,
            ];
        }

        $initialStatus = OrderStatus::InProduction;

        $order = Order::create([
            'user_id' => $firstQuotation->user_id,
            'status' => $statusOverride?->value ?? $initialStatus->value,
            'reference' => Str::upper(Str::random(10)),
            'currency' => 'INR',
            'total_amount' => round($totalAmount, 2),
            'subtotal_amount' => round($totalSubtotal, 2),
            'tax_amount' => 0,
            'discount_amount' => round($totalDiscount, 2),
            'price_breakdown' => [
                'items' => collect($orderItems)->map(function ($item) {
                    return [
                        'quotation_id' => $item['quotation']->id,
                        'unit' => $item['pricing'],
                        'quantity' => $item['quotation']->quantity,
                        'line_subtotal' => round($item['line_subtotal'], 2),
                        'line_discount' => round($item['line_discount'], 2),
                    ];
                })->all(),
            ],
            'locked_rates' => null,
        ]);

        // Create order items for each quotation
        foreach ($orderItems as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['product']->id,
                'sku' => $item['product']->sku,
                'name' => $item['product']->name,
                'quantity' => $item['quotation']->quantity,
                'unit_price' => round($item['unit_total'], 2),
                'total_price' => round($item['line_total'], 2),
                'configuration' => $item['quotation']->selections,
                'metadata' => [
                    'mode' => $item['quotation']->mode,
                    'quotation_id' => $item['quotation']->id,
                    'variant' => $item['variant'] ? [
                        'id' => $item['variant']->id,
                        'label' => $item['variant']->label,
                        'metadata' => $item['variant']->metadata,
                    ] : null,
                ],
            ]);
        }

        $order->statusHistory()->create([
            'user_id' => null, // Admin users are not in customers table, so set to null
            'status' => $order->status,
            'meta' => [
                'source' => 'quotation_approval',
                'approved_by' => auth()->id(), // Store admin ID in meta for tracking
                'quotation_ids' => $quotations->pluck('id')->all(),
            ],
        ]);

        return $order;
    }

    /**
     * Get all related quotations in the same group
     */
    protected function getRelatedQuotations(Quotation $quotation)
    {
        return Quotation::query()
            ->when($quotation->quotation_group_id, function ($q) use ($quotation) {
                $q->where('quotation_group_id', $quotation->quotation_group_id);
            }, function ($q) use ($quotation) {
                // Fallback for old quotations: use timestamp-based grouping
                $createdAt = $quotation->created_at;
                $timeWindow = $createdAt ? $createdAt->copy()->subMinutes(5) : null;
                $timeWindowEnd = $createdAt ? $createdAt->copy()->addMinutes(5) : null;
                if ($timeWindow && $timeWindowEnd) {
                    $q->where('user_id', $quotation->user_id)
                        ->whereBetween('created_at', [$timeWindow, $timeWindowEnd]);
                }
            });
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

        $metalCost = (float) ($pricing['metal'] ?? 0);
        $diamondCost = (float) ($pricing['diamond'] ?? 0);
        $making = (float) ($pricing['making'] ?? $product->making_charge);
        $unitSubtotal = (float) ($pricing['subtotal'] ?? ($metalCost + $diamondCost + $making));
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
            'user_id' => null, // Admin users are not in customers table, so set to null
            'status' => $order->status,
            'meta' => [
                'source' => 'quotation_approval',
                'approved_by' => auth()->id(), // Store admin ID in meta for tracking
            ],
        ]);

        return $order;
    }
}
