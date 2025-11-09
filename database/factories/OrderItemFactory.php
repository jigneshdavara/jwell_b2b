<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sku' => strtoupper(fake()->bothify('SKU-####')),
            'name' => fake()->words(3, true),
            'quantity' => $quantity = fake()->numberBetween(1, 5),
            'unit_price' => $unitPrice = fake()->randomFloat(2, 15000, 120000),
            'total_price' => $quantity * $unitPrice,
            'configuration' => [
                'purity' => fake()->randomElement(['9K', '14K', '18K']),
                'size' => fake()->randomElement(['6', '7', '8', '9']),
                'notes' => fake()->sentence(),
            ],
            'metadata' => [
                'engraving' => fake()->boolean(30) ? fake()->word() : null,
            ],
        ];
    }
}
