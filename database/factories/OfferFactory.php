<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Offer>
 */
class OfferFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('OFFER-####')),
            'name' => fake()->catchPhrase(),
            'description' => fake()->sentence(),
            'type' => fake()->randomElement(['percentage', 'fixed', 'making_charge']),
            'value' => fake()->randomFloat(2, 2, 15),
            'constraints' => [
                'min_order_total' => fake()->numberBetween(25000, 150000),
                'customer_types' => fake()->randomElements(['retailer', 'wholesaler'], fake()->numberBetween(1, 2)),
            ],
            'starts_at' => now()->subDays(fake()->numberBetween(1, 15)),
            'ends_at' => now()->addDays(fake()->numberBetween(15, 60)),
            'is_active' => true,
        ];
    }
}
