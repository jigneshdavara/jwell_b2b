<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\JobworkRequest>
 */
class JobworkRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $mode = fake()->boolean(60) ? 'catalogue' : 'custom';

        return [
            'submission_mode' => $mode,
            'product_id' => null,
            'product_variant_id' => null,
            'type' => fake()->randomElement(['customer_supplied', 'vendor_supplied']),
            'reference_design' => $mode === 'custom' ? fake()->sentence() : null,
            'reference_url' => fake()->boolean(30) ? fake()->url() : null,
            'reference_media' => $mode === 'custom' ? [fake()->imageUrl()] : [],
            'metal' => fake()->randomElement(['Gold', 'Silver', 'Platinum']),
            'purity' => fake()->randomElement(['14K', '18K', '22K']),
            'diamond_quality' => fake()->randomElement(['VVS', 'VS', 'SI']),
            'quantity' => fake()->numberBetween(1, 10),
            'special_instructions' => fake()->paragraph(),
            'delivery_deadline' => now()->addDays(fake()->numberBetween(7, 30)),
            'wastage_percentage' => fake()->randomFloat(2, 0.5, 3.0),
            'manufacturing_charge' => fake()->randomFloat(2, 1000, 10000),
            'status' => fake()->randomElement([
                'submitted',
                'approved',
                'in_progress',
                'completed',
                'cancelled',
            ]),
            'converted_work_order_id' => null,
            'metadata' => [
                'designer_notes' => fake()->sentence(),
            ],
        ];
    }

    public function catalogue(): static
    {
        return $this->state(function () {
            return [
                'submission_mode' => 'catalogue',
                'reference_design' => null,
                'reference_media' => [],
            ];
        });
    }
}
