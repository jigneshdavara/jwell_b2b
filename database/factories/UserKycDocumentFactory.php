<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserKycDocument>
 */
class UserKycDocumentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => fake()->randomElement(['pan_card', 'aadhaar', 'gst_certificate', 'trade_license']),
            'file_path' => 'kyc/'.fake()->uuid().'.pdf',
            'status' => fake()->randomElement(['pending', 'approved', 'rejected']),
            'remarks' => fake()->boolean(25) ? fake()->sentence() : null,
            'metadata' => [
                'uploaded_at' => now()->subDays(fake()->numberBetween(1, 10))->toDateTimeString(),
            ],
        ];
    }
}
