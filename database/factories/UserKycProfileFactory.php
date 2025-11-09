<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserKycProfile>
 */
class UserKycProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'business_name' => fake()->company().' Jewels',
            'business_website' => fake()->boolean(60) ? 'https://'.fake()->domainName() : null,
            'gst_number' => '27'.strtoupper(fake()->bothify('?????')).fake()->numerify('#######'),
            'pan_number' => strtoupper(fake()->bothify('?????####?')),
            'registration_number' => fake()->numerify('REG#######'),
            'address_line1' => fake()->streetAddress(),
            'address_line2' => fake()->boolean(40) ? fake()->secondaryAddress() : null,
            'city' => fake()->city(),
            'state' => fake()->state(),
            'postal_code' => fake()->postcode(),
            'country' => 'India',
            'contact_name' => fake()->name(),
            'contact_phone' => fake()->numerify('98########'),
            'metadata' => null,
        ];
    }
}
