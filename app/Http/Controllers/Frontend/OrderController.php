<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $orders = Order::query()
            ->with('items')
            ->where('user_id', Auth::id())
            ->latest()
            ->paginate(15)
            ->through(function (Order $order) {
                $statusValue = $order->status instanceof \UnitEnum ? $order->status->value : (string) $order->status;

                return [
                    'id' => $order->id,
                    'reference' => $order->reference,
                    'status' => $statusValue,
                    'status_label' => Str::headline($statusValue),
                    'total_amount' => (float) $order->total_amount,
                    'created_at' => optional($order->created_at)?->toDateTimeString(),
                    'items' => $order->items->map(fn ($item) => [
                        'id' => $item->id,
                        'name' => $item->name,
                        'quantity' => $item->quantity,
                    ]),
                ];
            });

        return Inertia::render('Frontend/Orders/Index', [
            'orders' => $orders,
        ]);
    }

    public function show(Order $order): Response
    {
        abort_unless($order->user_id === Auth::id(), 403);

        $order->load(['items', 'payments', 'statusHistory']);
        $statusValue = $order->status instanceof \UnitEnum ? $order->status->value : (string) $order->status;

        return Inertia::render('Frontend/Orders/Show', [
            'order' => [
                'id' => $order->id,
                'reference' => $order->reference,
                'status' => $statusValue,
                'status_label' => Str::headline($statusValue),
                'total_amount' => (float) $order->total_amount,
                'subtotal_amount' => (float) $order->subtotal_amount,
                'tax_amount' => (float) $order->tax_amount,
                'discount_amount' => (float) $order->discount_amount,
                'created_at' => optional($order->created_at)?->toDateTimeString(),
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'quantity' => $item->quantity,
                    'total_price' => $item->total_price,
                ]),
                'payments' => $order->payments->map(fn ($payment) => [
                    'id' => $payment->id,
                    'status' => $payment->status,
                    'amount' => (float) $payment->amount,
                    'created_at' => optional($payment->created_at)?->toDateTimeString(),
                ]),
                'status_history' => $order->statusHistory->map(fn ($history) => [
                    'id' => $history->id,
                    'status' => $history->status,
                    'created_at' => optional($history->created_at)?->toDateTimeString(),
                    'meta' => $history->meta,
                ]),
            ],
        ]);
    }
}

