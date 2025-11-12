<?php

namespace Database\Factories;

use App\Enums\UserType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password = null;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'type' => UserType::Admin->value,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => [
            'type' => UserType::Admin->value,
        ]);
    }

    public function superAdmin(): static
    {
        return $this->state(fn () => [
            'type' => UserType::SuperAdmin->value,
        ]);
    }

    public function production(): static
    {
        return $this->state(fn () => [
            'type' => UserType::Production->value,
        ]);
    }

    public function sales(): static
    {
        return $this->state(fn () => [
            'type' => UserType::Sales->value,
        ]);
    }
}

