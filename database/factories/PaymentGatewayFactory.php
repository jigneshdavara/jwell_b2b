<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PaymentGateway>
 */
class PaymentGatewayFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slug = $this->faker->unique()->slug(2);

        return [
            'name' => ucfirst($slug) . ' Gateway',
            'slug' => $slug,
            'driver' => 'fake',
            'is_active' => true,
            'is_default' => false,
            'config' => [
                'publishable_key' => 'pk_test_' . $this->faker->lexify('????????????????????'),
                'secret_key' => 'sk_test_' . $this->faker->lexify('????????????????????'),
            ],
        ];
    }
}
