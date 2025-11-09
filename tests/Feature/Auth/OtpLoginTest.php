<?php

namespace Tests\Feature\Auth;

use App\Mail\LoginOtpMail;
use App\Models\User;
use App\Models\UserLoginOtp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OtpLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_login_code(): void
    {
        Mail::fake();

        $user = User::factory()->retailer()->create([
            'email' => 'otp-user@example.com',
        ]);

        $response = $this->post('/login/otp/request', [
            'email' => $user->email,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('user_login_otps', [
            'user_id' => $user->id,
            'consumed_at' => null,
        ]);

        Mail::assertSent(LoginOtpMail::class, function (LoginOtpMail $mail) use ($user) {
            return $mail->hasTo($user->email);
        });
    }

    public function test_user_can_login_with_valid_code(): void
    {
        $user = User::factory()->retailer()->create([
            'email' => 'otp-login@example.com',
            'password' => Hash::make('password'),
        ]);

        UserLoginOtp::factory()->create([
            'user_id' => $user->id,
            'code' => Hash::make('123456'),
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->post('/login/otp/verify', [
            'email' => $user->email,
            'code' => '123456',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertAuthenticatedAs($user);

        $this->assertNotNull(
            UserLoginOtp::where('user_id', $user->id)->latest()->first()->consumed_at
        );
    }
}
