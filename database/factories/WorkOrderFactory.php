<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WorkOrder>
 */
class WorkOrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'status' => fake()->randomElement([
                'draft',
                'in_production',
                'quality_check',
                'ready_to_dispatch',
                'dispatched',
                'closed',
            ]),
            'assigned_to' => null,
            'due_date' => now()->addDays(fake()->numberBetween(3, 21)),
            'notes' => fake()->sentence(),
            'metadata' => [
                'batch' => fake()->bothify('BATCH-###'),
            ],
        ];
    }
}
