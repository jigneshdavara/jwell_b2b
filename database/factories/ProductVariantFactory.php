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
        $stone = $this->faker->randomElement(['VVS', 'VS', 'SI']);
        $size = $this->faker->randomElement(['6', '7', '8', '9', 'Free']);

        return [
            'label' => $metal.' / '.$stone.' / Size '.$size,
            'metal_tone' => $metal,
            'stone_quality' => $stone,
            'size' => $size,
            'price_adjustment' => $this->faker->numberBetween(-5000, 15000),
            'is_default' => false,
            'metadata' => [
                'lead_time_days' => $this->faker->numberBetween(7, 21),
            ],
        ];
    }
}
