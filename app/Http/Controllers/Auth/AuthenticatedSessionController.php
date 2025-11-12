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
        $request->authenticate();

        $request->session()->regenerate();

        $guard = Auth::guard('admin')->check() ? 'admin' : 'web';
        $request->session()->put('auth_guard', $guard);

        $user = Auth::guard($guard)->user();

        $intendedRoute = match ($user?->type) {
            UserType::Admin->value, UserType::SuperAdmin->value => route('admin.dashboard', absolute: false),
            UserType::Production->value => route('production.dashboard', absolute: false),
            default => route('dashboard', absolute: false),
        };

        return redirect()->intended($intendedRoute);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $guard = $request->session()->pull('auth_guard', 'web');

        Auth::guard($guard)->logout();
        // Ensure any other guard session is cleared as well.
        if ($guard !== 'admin') {
            Auth::guard('admin')->logout();
        }
        if ($guard !== 'web') {
            Auth::guard('web')->logout();
        }

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
