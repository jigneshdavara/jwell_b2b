<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Events\OrderConfirmed;
use App\Exceptions\PaymentGatewayException;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class CheckoutService
{
    public function __construct(
        protected CartService $cartService,
        protected PaymentGatewayManager $gatewayManager
    ) {
    }

    public function initialize(Cart $cart): array
    {
        if ($cart->items->isEmpty()) {
            throw new RuntimeException('Cart is empty.');
        }

        $summary = $this->cartService->summarize($cart);

        return DB::transaction(function () use ($cart, $summary) {
            $order = $this->createOrUpdateOrder($cart, $summary);
            $paymentData = $this->createOrUpdatePayment($order);

            return array_merge($summary, [
                'order' => $order->fresh('items'),
                'payment' => $paymentData,
            ]);
        });
    }

    public function finalize(Payment $payment): Order
    {
        $gateway = $this->gatewayManager->driver($payment->gateway);
        $intent = $gateway->retrieveIntent($payment->provider_reference);

        if (! in_array($intent['status'], ['succeeded', 'requires_capture'], true)) {
            $payment->update(['status' => PaymentStatus::Failed]);
            $payment->order->update(['status' => OrderStatus::PaymentFailed]);

            throw new PaymentGatewayException('Payment has not succeeded.');
        }

        $payment->update([
            'status' => PaymentStatus::Succeeded,
            'meta' => array_merge($payment->meta ?? [], ['intent' => $intent]),
        ]);

        $order = $payment->order;
        $order->update(['status' => OrderStatus::Pending]);

        event(new OrderConfirmed($order->fresh('items'), $payment));

        return $order->fresh('items');
    }

    protected function createOrUpdateOrder(Cart $cart, array $summary): Order
    {
        $metadata = $cart->metadata ?? [];
        $pendingOrderId = $metadata['pending_order_id'] ?? null;

        $order = null;

        if ($pendingOrderId) {
            $order = Order::query()
                ->where('id', $pendingOrderId)
                ->where('user_id', $cart->user_id)
                ->first();
        }

        if (! $order) {
            $order = new Order([
                'user_id' => $cart->user_id,
                'reference' => $this->generateReference(),
                'currency' => $summary['currency'],
            ]);
        }

        $order->status = OrderStatus::PendingPayment;
        $order->subtotal_amount = $summary['subtotal'];
        $order->tax_amount = $summary['tax'];
        $order->discount_amount = $summary['discount'];
        $order->total_amount = $summary['total'];
        $order->price_breakdown = Arr::except($summary, ['items']);
        $order->save();

        $order->items()->delete();

        foreach ($summary['items'] as $itemSummary) {
            $order->items()->create([
                'product_id' => $itemSummary['product_id'],
                'sku' => $itemSummary['sku'],
                'name' => $itemSummary['name'],
                'quantity' => $itemSummary['quantity'],
                'unit_price' => $itemSummary['unit_total'],
                'total_price' => $itemSummary['line_total'],
                'configuration' => [
                    'variant_label' => $itemSummary['variant_label'] ?? null,
                    'variant_id' => $itemSummary['variant_id'] ?? null,
                ],
            ]);
        }

        $cart->update([
            'metadata' => array_merge($metadata, ['pending_order_id' => $order->id]),
        ]);

        return $order;
    }

    protected function createOrUpdatePayment(Order $order): array
    {
        $gatewayModel = $this->gatewayManager->activeGateway();
        $driver = $this->gatewayManager->driver($gatewayModel);

        $payment = $order->payments()
            ->where('payment_gateway_id', $gatewayModel->id)
            ->whereIn('status', [PaymentStatus::Pending, PaymentStatus::RequiresAction])
            ->latest()
            ->first();

        $intent = $driver->ensurePaymentIntent($order, $payment);

        if (! $payment) {
            $payment = $order->payments()->create([
                'payment_gateway_id' => $gatewayModel->id,
                'provider_reference' => $intent['provider_reference'],
                'status' => PaymentStatus::Pending,
                'amount' => $intent['amount'],
                'currency' => $intent['currency'],
                'meta' => ['client_secret' => $intent['client_secret']],
            ]);
        } else {
            $payment->update([
                'provider_reference' => $intent['provider_reference'],
                'amount' => $intent['amount'],
                'currency' => $intent['currency'],
                'meta' => array_merge($payment->meta ?? [], ['client_secret' => $intent['client_secret']]),
            ]);
        }

        return [
            'publishable_key' => $driver->publishableKey(),
            'provider_reference' => $intent['provider_reference'],
            'client_secret' => $intent['client_secret'],
            'payment_id' => $payment->id,
        ];
    }

    protected function generateReference(): string
    {
        return 'ORD-' . Str::upper(Str::random(10));
    }
}
