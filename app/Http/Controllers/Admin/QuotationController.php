<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApproveQuotationRequest;
use App\Http\Requests\Admin\UpdateJobworkStatusRequest;
use App\Http\Requests\StoreQuotationMessageRequest;
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
        $mode = $request->string('mode')->lower()->value();

        $query = Quotation::query()
            ->with(['user', 'product', 'variant', 'order'])
            ->latest();

        if ($mode === 'jobwork') {
            $query->where('mode', 'jobwork');
        } elseif ($mode === 'purchase' || $mode === 'jewellery') {
            $query->where('mode', 'purchase');
            $mode = 'purchase';
        } else {
            $mode = 'all';
        }

        $quotations = $query
            ->paginate(20)
            ->withQueryString()
            ->through(function (Quotation $quotation) {
                return [
                    'id' => $quotation->id,
                    'mode' => $quotation->mode,
                    'status' => $quotation->status,
                    'jobwork_status' => $quotation->jobwork_status,
                    'quantity' => $quotation->quantity,
                    'approved_at' => optional($quotation->approved_at)?->toDateTimeString(),
                    'product' => [
                        'id' => $quotation->product->id,
                        'name' => $quotation->product->name,
                        'sku' => $quotation->product->sku,
                    ],
                    'user' => [
                        'name' => optional($quotation->user)->name,
                        'email' => optional($quotation->user)->email,
                    ],
                    'order_reference' => $quotation->order?->reference,
                ];
            });

        return Inertia::render('Admin/Quotations/Index', [
            'quotations' => $quotations,
            'mode' => $mode,
        ]);
    }

    public function show(Quotation $quotation): Response
    {
        $quotation->load(['user', 'product.media', 'variant', 'product.variants', 'order.statusHistory', 'messages.user']);

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

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', 'Quotation approved successfully.');
    }

    public function reject(ApproveQuotationRequest $request, Quotation $quotation): RedirectResponse
    {
        $quotation->update([
            'status' => 'rejected',
            'admin_notes' => $request->validated('admin_notes'),
        ]);

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', 'Quotation rejected.');
    }

    public function updateJobworkStatus(UpdateJobworkStatusRequest $request, Quotation $quotation): RedirectResponse
    {
        if ($quotation->mode !== 'jobwork') {
            return redirect()->back()->with('error', 'Jobwork status is only applicable to jobwork quotations.');
        }

        $quotation->update([
            'jobwork_status' => $request->validated('jobwork_status'),
            'admin_notes' => $request->validated('admin_notes'),
        ]);

        if ($request->validated('jobwork_status') === 'billing_confirmed' && ! $quotation->order) {
            $order = $this->createOrderFromQuotation($quotation, OrderStatus::PendingPayment);
            $quotation->order()->associate($order);
            $quotation->save();
        }

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

        $quotation->quantity = $data['quantity'];
        $quotation->status = 'pending_customer_confirmation';
        if (! empty($data['notes'])) {
            $quotation->admin_notes = $data['notes'];
        }
        $quotation->save();

        $customerId = auth('web')->id();

        $quotation->messages()->create([
            'user_id' => $customerId,
            'sender' => 'admin',
            'message' => $data['notes'] ?? 'Please review updated quotation details.',
        ]);

        return redirect()
            ->route('admin.quotations.show', $quotation->id)
            ->with('success', 'Updated quotation and requested customer approval.');
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

