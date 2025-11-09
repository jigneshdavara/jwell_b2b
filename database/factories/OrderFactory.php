<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'status' => fake()->randomElement([
                'pending',
                'approved',
                'in_production',
                'quality_check',
                'ready_to_dispatch',
                'dispatched',
                'delivered',
            ]),
            'reference' => strtoupper(fake()->unique()->bothify('ORD-#####')),
            'currency' => 'INR',
            'subtotal_amount' => $subtotal = fake()->randomFloat(2, 25000, 250000),
            'tax_amount' => $tax = round($subtotal * 0.03, 2),
            'discount_amount' => $discount = fake()->randomFloat(2, 0, 5000),
            'total_amount' => $subtotal + $tax - $discount,
            'price_breakdown' => [
                'metal' => fake()->randomFloat(2, 10000, 200000),
                'making' => fake()->randomFloat(2, 2000, 15000),
                'stones' => fake()->randomFloat(2, 5000, 60000),
            ],
            'locked_rates' => [
                'gold' => fake()->randomFloat(2, 2500, 6500),
                'diamond' => fake()->randomFloat(2, 40000, 85000),
            ],
            'status_meta' => [
                'last_updated_by' => fake()->name(),
                'notes' => fake()->sentence(),
            ],
        ];
    }
}
