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
    ) {
    }

    public function index(): Response
    {
        $orders = Order::query()
            ->with('user')
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
                    'user' => $order->user ? [
                        'name' => $order->user->name,
                    ] : null,
                ];
            });

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'statuses' => collect(OrderStatus::cases())->pluck('value'),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load(['items.product', 'user', 'payments', 'statusHistory']);

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
                'user' => $order->user ? [
                    'name' => $order->user->name,
                    'email' => $order->user->email,
                ] : null,
                'items' => $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'sku' => $item->sku,
                        'name' => $item->name,
                        'quantity' => $item->quantity,
                        'total_price' => $item->total_price,
                    ];
                }),
                'status_history' => $order->statusHistory->map(fn ($entry) => [
                    'id' => $entry->id,
                    'status' => $entry->status,
                    'created_at' => optional($entry->created_at)?->toDateTimeString(),
                    'meta' => $entry->meta,
                ]),
                'payments' => $order->payments->map(fn ($payment) => [
                    'id' => $payment->id,
                    'status' => $payment->status,
                    'amount' => $payment->amount,
                    'created_at' => optional($payment->created_at)?->toDateTimeString(),
                ]),
            ],
            'statusOptions' => collect(OrderStatus::cases())->map(fn (OrderStatus $status) => [
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
