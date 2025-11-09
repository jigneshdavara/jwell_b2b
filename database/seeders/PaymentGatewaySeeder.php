<?php

namespace Database\Seeders;

use App\Models\PaymentGateway;
use Illuminate\Database\Seeder;

class PaymentGatewaySeeder extends Seeder
{
    public function run(): void
    {
        PaymentGateway::updateOrCreate(
            ['slug' => 'stripe'],
            [
                'name' => 'Stripe',
                'driver' => \App\Services\Payments\Drivers\StripeGateway::class,
                'is_active' => true,
                'is_default' => true,
                'config' => [
                    'publishable_key' => env('STRIPE_PUBLISHABLE_KEY', 'pk_test_51HCgk3Cbz7lg5RoIM70TsNosf3Xasq4BTY5F7KB1KpKtpnes9N81HNRi7S0r15ztICGBIjp2KTP4ndjVaXsjR3oa003Tm2AIax'),
                    'secret_key' => env('STRIPE_SECRET_KEY', 'sk_test_51HCgk3Cbz7lg5RoIOoHSPYWtrm12YE3etwgtUamIbG7NITNW3JHvpasnqIDLo6Tm6MA5TLgSQRrWaQRVLFJM71yT00iq1dxXSV'),
                    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET', 'whsec_demo_placeholder'),
                ],
            ]
        );
    }
}
