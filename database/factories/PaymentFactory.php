<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => \App\Models\Order::factory(),
            'payment_gateway_id' => \App\Models\PaymentGateway::factory(),
            'provider_reference' => 'pi_' . $this->faker->lexify(str_repeat('?', 24)),
            'status' => 'pending',
            'amount' => $this->faker->numberBetween(50000, 250000) / 100,
            'currency' => 'INR',
            'meta' => [
                'client_secret' => 'cs_test_' . $this->faker->lexify(str_repeat('?', 24)),
            ],
        ];
    }
}
