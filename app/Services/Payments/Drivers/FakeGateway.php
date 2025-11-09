<?php

namespace App\Services\Payments\Drivers;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentGateway;
use App\Services\Payments\Contracts\PaymentGatewayDriver;

class FakeGateway implements PaymentGatewayDriver
{
    public function __construct(protected PaymentGateway $gateway)
    {
    }

    public function gateway(): PaymentGateway
    {
        return $this->gateway;
    }

    public function ensurePaymentIntent(Order $order, ?Payment $payment = null): array
    {
        $reference = $payment?->provider_reference ?? ('pi_fake_' . $order->id);

        return [
            'provider_reference' => $reference,
            'client_secret' => 'cs_fake_' . $order->id,
            'amount' => $order->total_amount,
            'currency' => $order->currency,
        ];
    }

    public function retrieveIntent(string $providerReference): array
    {
        return [
            'status' => 'succeeded',
            'amount' => 0,
            'currency' => 'INR',
        ];
    }

    public function publishableKey(): string
    {
        return $this->gateway->config['publishable_key'] ?? 'pk_test_fake';
    }
}
