<?php

return [
    'default' => env('PAYMENT_GATEWAY', 'stripe'),

    'gateways' => [
        'stripe' => [
            'driver' => \App\Services\Payments\Drivers\StripeGateway::class,
        ],
        'fake' => [
            'driver' => \App\Services\Payments\Drivers\FakeGateway::class,
        ],
    ],
];
