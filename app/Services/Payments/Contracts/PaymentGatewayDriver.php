<?php

namespace App\Services\Payments\Contracts;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentGateway;

interface PaymentGatewayDriver
{
    public function gateway(): PaymentGateway;

    /**
     * Create or update a payment intent for the given order.
     *
     * @return array{provider_reference: string, client_secret: string, amount: float, currency: string}
     */
    public function ensurePaymentIntent(Order $order, ?Payment $payment = null): array;

    /**
     * Retrieve the latest status information for a payment intent.
     *
     * @return array{status: string, amount: float, currency: string}
     */
    public function retrieveIntent(string $providerReference): array;

    public function publishableKey(): string;
}
