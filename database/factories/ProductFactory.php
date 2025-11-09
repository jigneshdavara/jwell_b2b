<?php

namespace Database\Factories;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Material;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sku' => strtoupper(fake()->unique()->bothify('SKU-####')),
            'name' => fake()->words(3, true),
            'description' => fake()->paragraph(),
            'brand_id' => Brand::factory(),
            'category_id' => Category::factory(),
            'material_id' => Material::factory(),
            'gross_weight' => fake()->randomFloat(3, 2, 50),
            'net_weight' => fake()->randomFloat(3, 1, 45),
            'base_price' => fake()->randomFloat(2, 10000, 250000),
            'making_charge' => fake()->randomFloat(2, 500, 10000),
            'is_jobwork_allowed' => fake()->boolean(60),
            'visibility' => fake()->randomElement(['public', 'restricted', null]),
            'metadata' => [
                'stone_type' => fake()->randomElement(['VVS', 'VS', 'SI', null]),
                'size_options' => fake()->randomElements(['6', '7', '8', '9'], fake()->numberBetween(1, 4)),
            ],
        ];
    }
}
