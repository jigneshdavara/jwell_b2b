<?php

namespace Database\Factories;

use App\Models\UserLoginOtp;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<UserLoginOtp>
 */
class UserLoginOtpFactory extends Factory
{
    protected $model = UserLoginOtp::class;

    public function definition(): array
    {
        return [
            'code' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(10),
            'consumed_at' => null,
        ];
    }
}
