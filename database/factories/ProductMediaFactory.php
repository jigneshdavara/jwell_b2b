<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductMedia>
 */
class ProductMediaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => fake()->randomElement(['image', 'video', '360']),
            'url' => fake()->imageUrl(800, 800, 'jewellery', true),
            'position' => fake()->numberBetween(0, 5),
            'metadata' => [
                'alt' => fake()->sentence(3),
            ],
        ];
    }
}
