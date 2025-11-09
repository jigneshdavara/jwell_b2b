<?php

namespace App\Services\Payments;

use App\Models\PaymentGateway;
use App\Services\Payments\Contracts\PaymentGatewayDriver;
use Illuminate\Contracts\Container\Container;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use RuntimeException;

class PaymentGatewayManager
{
    public function __construct(
        protected Container $app
    ) {
    }

    public function activeGateway(): PaymentGateway
    {
        $gateway = PaymentGateway::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->first();

        if (! $gateway) {
            $fallbackSlug = config('payments.default');

            $gateway = PaymentGateway::query()->where('slug', $fallbackSlug)->first();
        }

        if (! $gateway) {
            throw new RuntimeException('No active payment gateway configured.');
        }

        return $gateway;
    }

    public function driver(?PaymentGateway $gateway = null): PaymentGatewayDriver
    {
        $gateway ??= $this->activeGateway();

        $driverClass = $gateway->driver ?: Arr::get(config('payments.gateways'), $gateway->slug.'.driver');

        if (! $driverClass) {
            throw new RuntimeException(sprintf('No driver registered for payment gateway [%s].', $gateway->slug));
        }

        return $this->app->make($driverClass, compact('gateway'));
    }

    public function drivers(): Collection
    {
        return PaymentGateway::query()->get();
    }
}
