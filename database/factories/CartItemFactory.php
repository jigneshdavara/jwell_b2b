<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\CartItem>
 */
class CartItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'quantity' => fake()->numberBetween(1, 5),
            'configuration' => [
                'purity' => fake()->randomElement(['9K', '14K', '18K']),
                'size' => fake()->randomElement(['6', '7', '8', '9']),
                'diamond_quality' => fake()->randomElement(['VVS', 'VS', 'SI']),
            ],
            'price_breakdown' => [
                'base' => fake()->randomFloat(2, 10000, 80000),
                'making' => fake()->randomFloat(2, 500, 5000),
                'tax' => fake()->randomFloat(2, 500, 7000),
            ],
        ];
    }
}
