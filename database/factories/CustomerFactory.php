<?php

namespace Database\Factories;

use App\Enums\KycStatus;
use App\Enums\UserType;
use App\Models\Customer;
use App\Models\UserKycProfile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories.Factory<\App\Models\Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'phone' => fake()->unique()->numerify('98########'),
            'type' => fake()->randomElement([
                UserType::Retailer->value,
                UserType::Wholesaler->value,
            ]),
            'kyc_status' => fake()->randomElement([
                KycStatus::Pending->value,
                KycStatus::Approved->value,
                KycStatus::Rejected->value,
                KycStatus::Review->value,
            ]),
            'preferred_language' => fake()->randomElement(['en', 'hi', 'gu']),
            'credit_limit' => fake()->randomFloat(2, 50000, 500000),
            'kyc_notes' => fake()->boolean(30) ? fake()->sentence() : null,
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'kyc_status' => KycStatus::Approved->value,
        ]);
    }

    public function retailer(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => UserType::Retailer->value,
        ]);
    }

    public function wholesaler(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => UserType::Wholesaler->value,
        ]);
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Customer $customer): void {
            $customer->kycProfile()->create(
                UserKycProfile::factory()->make()->toArray()
            );
        });
    }
}

