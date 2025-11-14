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

        $order->load(['items.product.media', 'payments', 'statusHistory', 'quotations.product.media']);
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
                'updated_at' => optional($order->updated_at)?->toDateTimeString(),
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total_price' => $item->total_price,
                    'configuration' => $item->configuration,
                    'metadata' => $item->metadata,
                    'product' => $item->product ? [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'sku' => $item->product->sku,
                        'base_price' => $item->product->base_price,
                        'making_charge' => $item->product->making_charge,
                        'gold_weight' => $item->product->gold_weight,
                        'silver_weight' => $item->product->silver_weight,
                        'other_material_weight' => $item->product->other_material_weight,
                        'total_weight' => $item->product->total_weight,
                        'media' => $item->product->media->sortBy('position')->values()->map(fn ($media) => [
                            'url' => $media->url,
                            'alt' => $media->metadata['alt'] ?? $item->product->name,
                        ]),
                    ] : null,
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
                'quotations' => $order->quotations->map(fn ($quotation) => [
                    'id' => $quotation->id,
                    'mode' => $quotation->mode,
                    'status' => $quotation->status,
                    'quantity' => $quotation->quantity,
                    'product' => $quotation->product ? [
                        'id' => $quotation->product->id,
                        'name' => $quotation->product->name,
                        'sku' => $quotation->product->sku,
                        'media' => $quotation->product->media->sortBy('position')->values()->map(fn ($media) => [
                            'url' => $media->url,
                            'alt' => $media->metadata['alt'] ?? $quotation->product->name,
                        ]),
                    ] : null,
                ]),
            ],
        ]);
    }
}

