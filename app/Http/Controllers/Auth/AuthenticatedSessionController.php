<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $guard = $request->authenticate();

        $request->session()->regenerate();

        $request->session()->put('auth_guard', $guard);

        $user = Auth::guard($guard)->user();

        $intendedUrl = match ($user?->type) {
            UserType::Admin->value,
            UserType::SuperAdmin->value => route('admin.dashboard'),
            UserType::Production->value => route('production.dashboard'),
            default => route('dashboard'),
        };

        $storedIntended = $request->session()->get('url.intended');
        $storedPath = $storedIntended ? parse_url($storedIntended, PHP_URL_PATH) : null;

        if ($guard === 'admin') {
            $expectedPrefix = match ($user?->type) {
                UserType::Production->value => '/production',
                default => '/admin',
            };

            if (! $storedPath || ! str_starts_with($storedPath, $expectedPrefix)) {
                $request->session()->put('url.intended', $intendedUrl);
            }

            return redirect()->intended($intendedUrl);
        }

        if ($storedPath && (str_starts_with($storedPath, '/admin') || str_starts_with($storedPath, '/production'))) {
            $request->session()->forget('url.intended');
        }

        return redirect($intendedUrl);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->session()->forget('auth_guard');
        $request->session()->forget('url.intended');

        foreach (['admin', 'web'] as $guard) {
            Auth::guard($guard)->logout();
        }

        Auth::shouldUse(config('auth.defaults.guard', 'web'));

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
