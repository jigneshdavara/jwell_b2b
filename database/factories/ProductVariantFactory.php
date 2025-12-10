<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $metal = $this->faker->randomElement(['22K Yellow', '18K Rose', '18K White']);
        $size = $this->faker->randomElement(['6', '7', '8', '9', 'Free']);

        return [
            'label' => $metal . ' / Size ' . $size,
            'size' => $size,
            'is_default' => false,
            'metadata' => [
                'lead_time_days' => $this->faker->numberBetween(7, 21),
            ],
        ];
    }
}
