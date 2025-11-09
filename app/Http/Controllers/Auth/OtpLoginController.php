<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserType;
use App\Http\Controllers\Controller;
use App\Mail\LoginOtpMail;
use App\Models\User;
use App\Models\UserLoginOtp;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class OtpLoginController extends Controller
{
    public function send(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:filter', 'exists:users,email'],
        ]);

        $throttleKey = $this->throttleKey($validated['email'], $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            throw ValidationException::withMessages([
                'email' => __('Too many OTP requests. Please try again in :seconds seconds.', ['seconds' => RateLimiter::availableIn($throttleKey)]),
            ])->status(Response::HTTP_TOO_MANY_REQUESTS);
        }

        $user = User::where('email', $validated['email'])->firstOrFail();

        $code = (string) random_int(100000, 999999);

        // Invalidate previous unused codes for this user.
        $user->loginOtps()->whereNull('consumed_at')->delete();

        $user->loginOtps()->create([
            'code' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($user->email)->send(new LoginOtpMail($code, '10 minutes'));

        RateLimiter::hit($throttleKey, 600);

        return back()->with('success', __('A one-time code has been emailed to :email.', ['email' => $user->email]));
    }

    public function verify(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:filter', 'exists:users,email'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = User::where('email', $validated['email'])->firstOrFail();

        $otp = $user->loginOtps()
            ->whereNull('consumed_at')
            ->where('expires_at', '>=', now())
            ->latest()
            ->first();

        if (! $otp || ! Hash::check($validated['code'], $otp->code)) {
            throw ValidationException::withMessages([
                'code' => __('The provided code is invalid or has expired.'),
            ]);
        }

        $otp->forceFill([
            'consumed_at' => now(),
        ])->save();

        $throttleKey = $this->throttleKey($validated['email'], $request->ip());
        RateLimiter::clear($throttleKey);

        Auth::login($user, true);
        event(new Login('web', $user, false));

        $intendedRoute = match ($user->type) {
            UserType::Admin->value, UserType::SuperAdmin->value => route('admin.dashboard', absolute: false),
            UserType::Production->value => route('production.dashboard', absolute: false),
            default => route('dashboard', absolute: false),
        };

        return redirect()->intended($intendedRoute)->with('success', __('Welcome back!'));
    }

    protected function throttleKey(string $email, string $ip): string
    {
        return Str::lower($email).'|'.$ip;
    }
}
