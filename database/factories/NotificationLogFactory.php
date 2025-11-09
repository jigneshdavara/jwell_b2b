<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\NotificationLog>
 */
class NotificationLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'channel' => fake()->randomElement(['mail', 'sms', 'whatsapp']),
            'template' => fake()->randomElement(['order_update', 'offer_alert', 'kyc_status']),
            'payload' => [
                'subject' => fake()->sentence(),
                'message' => fake()->paragraph(),
            ],
            'sent_at' => now()->subMinutes(fake()->numberBetween(1, 720)),
            'status' => fake()->randomElement(['queued', 'sent', 'failed']),
            'response' => [
                'provider_id' => fake()->uuid(),
            ],
        ];
    }
}
