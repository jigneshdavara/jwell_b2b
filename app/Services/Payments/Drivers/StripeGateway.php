<?php

namespace App\Services\Payments\Drivers;

use App\Exceptions\PaymentGatewayException;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentGateway;
use App\Services\Payments\Contracts\PaymentGatewayDriver;
use Stripe\StripeClient;
use Throwable;

class StripeGateway implements PaymentGatewayDriver
{
    protected StripeClient $client;

    public function __construct(protected PaymentGateway $gateway)
    {
        $secretKey = $gateway->config['secret_key'] ?? null;

        if (! $secretKey) {
            throw new PaymentGatewayException('Stripe secret key is not configured.');
        }

        $this->client = new StripeClient($secretKey);
    }

    public function gateway(): PaymentGateway
    {
        return $this->gateway;
    }

    public function ensurePaymentIntent(Order $order, ?Payment $payment = null): array
    {
        $amount = (int) round($order->total_amount * 100);
        $currency = strtolower($order->currency ?? 'inr');
        $description = 'Order '.$order->reference.' – Jewellery export transaction';
        $statementDescriptor = 'AURUMCRAFT';

        try {
            if ($payment && $payment->provider_reference) {
                $intent = $this->client->paymentIntents->update($payment->provider_reference, [
                    'amount' => $amount,
                    'currency' => $currency,
                    'description' => $description,
                    'statement_descriptor' => $statementDescriptor,
                ]);
            } else {
                $intent = $this->client->paymentIntents->create([
                    'amount' => $amount,
                    'currency' => $currency,
                    'payment_method_types' => ['card'],
                    'description' => $description,
                    'statement_descriptor' => $statementDescriptor,
                    'metadata' => [
                        'order_id' => $order->id,
                        'order_reference' => $order->reference,
                    ],
                ]);
            }
        } catch (Throwable $exception) {
            throw new PaymentGatewayException($exception->getMessage(), previous: $exception);
        }

        return [
            'provider_reference' => $intent->id,
            'client_secret' => $intent->client_secret,
            'amount' => $intent->amount / 100,
            'currency' => strtoupper($intent->currency),
        ];
    }

    public function retrieveIntent(string $providerReference): array
    {
        try {
            $intent = $this->client->paymentIntents->retrieve($providerReference);
        } catch (Throwable $exception) {
            throw new PaymentGatewayException($exception->getMessage(), previous: $exception);
        }

        return [
            'status' => $intent->status,
            'amount' => $intent->amount / 100,
            'currency' => strtoupper($intent->currency),
        ];
    }

    public function publishableKey(): string
    {
        $publishableKey = $this->gateway->config['publishable_key'] ?? null;

        if (! $publishableKey) {
            throw new PaymentGatewayException('Stripe publishable key is not configured.');
        }

        return $publishableKey;
    }
}
