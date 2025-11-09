<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PriceRate>
 */
class PriceRateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'metal' => fake()->randomElement(['gold', 'silver', 'platinum', 'diamond']),
            'purity' => fake()->randomElement(['9K', '14K', '18K', '22K', '24K', null]),
            'price_per_gram' => fake()->randomFloat(2, 2500, 7000),
            'currency' => 'INR',
            'source' => fake()->randomElement(['api', 'manual']),
            'effective_at' => now()->subHours(fake()->numberBetween(1, 72)),
            'metadata' => [
                'market' => fake()->randomElement(['MCX', 'LBMA', 'Domestic']),
            ],
        ];
    }
}
