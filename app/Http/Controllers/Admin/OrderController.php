<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Models\Order;
use App\Services\OrderWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(
        protected OrderWorkflowService $orderWorkflowService
    ) {}

    public function index(): Response
    {
        $orders = Order::query()
            ->with(['user', 'items'])
            ->latest()
            ->paginate(20)
            ->through(function (Order $order) {
                $statusValue = $order->status instanceof OrderStatus ? $order->status->value : (string) $order->status;

                return [
                    'id' => $order->id,
                    'reference' => $order->reference,
                    'status' => $statusValue,
                    'status_label' => Str::headline($statusValue),
                    'total_amount' => $order->total_amount,
                    'created_at' => optional($order->created_at)?->toDateTimeString(),
                    'user' => $order->user ? [
                        'name' => $order->user->name,
                        'email' => $order->user->email,
                    ] : null,
                    'items_count' => $order->items->count(),
                ];
            });

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'statuses' => collect(OrderStatus::cases())->pluck('value'),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load(['items.product.media', 'user', 'payments', 'statusHistory', 'quotations.product.media']);

        return Inertia::render('Admin/Orders/Show', [
            'order' => [
                'id' => $order->id,
                'reference' => $order->reference,
                'status' => $order->status instanceof OrderStatus ? $order->status->value : (string) $order->status,
                'status_label' => Str::headline($order->status instanceof OrderStatus ? $order->status->value : (string) $order->status),
                'subtotal_amount' => $order->subtotal_amount,
                'tax_amount' => $order->tax_amount,
                'discount_amount' => $order->discount_amount,
                'total_amount' => $order->total_amount,
                'price_breakdown' => $order->price_breakdown,
                'created_at' => optional($order->created_at)?->toDateTimeString(),
                'updated_at' => optional($order->updated_at)?->toDateTimeString(),
                'user' => $order->user ? [
                    'name' => $order->user->name,
                    'email' => $order->user->email,
                ] : null,
                'items' => $order->items->map(function ($item) use ($order) {
                    // Try to get price breakdown from item metadata (stored at order time)
                    $priceBreakdown = $item->metadata['price_breakdown'] ?? null;
                    
                    // If not in item metadata, try to get from order-level price_breakdown
                    if (!$priceBreakdown && $order->price_breakdown) {
                        $orderBreakdown = is_array($order->price_breakdown) ? $order->price_breakdown : [];
                        // Check if order breakdown has items array
                        if (isset($orderBreakdown['items']) && is_array($orderBreakdown['items'])) {
                            // Try to find matching item by checking first item or quotation_id
                            foreach ($orderBreakdown['items'] as $breakdownItem) {
                                if (isset($breakdownItem['unit']) && is_array($breakdownItem['unit'])) {
                                    $priceBreakdown = $breakdownItem['unit'];
                                    break;
                                }
                            }
                        } elseif (isset($orderBreakdown['unit']) && is_array($orderBreakdown['unit'])) {
                            // Single item order
                            $priceBreakdown = $orderBreakdown['unit'];
                        }
                    }
                    
                    // Ensure price_breakdown has all required fields with defaults
                    if ($priceBreakdown && is_array($priceBreakdown)) {
                        $priceBreakdown = [
                            'metal' => (float) ($priceBreakdown['metal'] ?? 0),
                            'diamond' => (float) ($priceBreakdown['diamond'] ?? 0),
                            'making' => (float) ($priceBreakdown['making'] ?? 0),
                            'subtotal' => (float) ($priceBreakdown['subtotal'] ?? ($priceBreakdown['metal'] + $priceBreakdown['diamond'] + $priceBreakdown['making'] ?? 0)),
                            'discount' => (float) ($priceBreakdown['discount'] ?? 0),
                            'total' => (float) ($priceBreakdown['total'] ?? $item->unit_price),
                        ];
                    } else {
                        // If no breakdown available, create minimal structure from unit_price
                        // Note: This won't match exact order-time breakdown, but provides display structure
                        $priceBreakdown = null;
                    }

                    return [
                        'id' => $item->id,
                        'sku' => $item->sku,
                        'name' => $item->name,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'total_price' => $item->total_price,
                        'configuration' => $item->configuration,
                        'metadata' => $item->metadata,
                        'price_breakdown' => $priceBreakdown,
                        'calculated_making_charge' => $priceBreakdown ? (float) $priceBreakdown['making'] : null,
                        'product' => $item->product ? [
                            'id' => $item->product->id,
                            'name' => $item->product->name,
                            'sku' => $item->product->sku,
                            'base_price' => $item->product->base_price,
                            'making_charge_amount' => $item->product->making_charge_amount,
                            'making_charge_percentage' => $item->product->making_charge_percentage,
                            'making_charge_types' => $item->product->getMakingChargeTypes(),
                            'media' => $item->product->media->sortBy('display_order')->values()->map(fn($media) => [
                                'url' => $media->url,
                                'alt' => $media->metadata['alt'] ?? $item->product->name,
                            ]),
                        ] : null,
                    ];
                }),
                'status_history' => $order->statusHistory->map(fn($entry) => [
                    'id' => $entry->id,
                    'status' => $entry->status,
                    'created_at' => optional($entry->created_at)?->toDateTimeString(),
                    'meta' => $entry->meta,
                ]),
                'payments' => $order->payments->map(fn($payment) => [
                    'id' => $payment->id,
                    'status' => $payment->status,
                    'amount' => $payment->amount,
                    'created_at' => optional($payment->created_at)?->toDateTimeString(),
                ]),
                'quotations' => $order->quotations->map(fn($quotation) => [
                    'id' => $quotation->id,
                    'status' => $quotation->status,
                    'quantity' => $quotation->quantity,
                    'product' => $quotation->product ? [
                        'id' => $quotation->product->id,
                        'name' => $quotation->product->name,
                        'sku' => $quotation->product->sku,
                        'media' => $quotation->product->media->sortBy('display_order')->values()->map(fn($media) => [
                            'url' => $media->url,
                            'alt' => $media->metadata['alt'] ?? $quotation->product->name,
                        ]),
                    ] : null,
                ]),
            ],
            'statusOptions' => collect(OrderStatus::cases())->map(fn(OrderStatus $status) => [
                'value' => $status->value,
                'label' => Str::headline($status->value),
            ]),
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): RedirectResponse
    {
        $this->orderWorkflowService->transitionOrder(
            $order,
            OrderStatus::from($request->get('status')),
            $request->validated('meta') ?? []
        );

        $statusLabel = Str::headline($request->get('status'));

        return redirect()
            ->back()
            ->with('success', "Order status updated to {$statusLabel}.");
    }
}
