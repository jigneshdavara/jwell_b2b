<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Material>
 */
class MaterialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Gold', 'Silver', 'Diamond', 'Platinum']),
            'type' => fake()->randomElement(['metal', 'stone']),
            'purity' => fake()->randomElement(['9K', '14K', '18K', '22K', '24K']),
            'unit' => 'g',
            'is_active' => true,
        ];
    }
}
