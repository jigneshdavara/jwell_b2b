<?php

namespace App\Http\Middleware;

use App\Enums\UserType;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomerPortalAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ?string ...$roles): Response
    {
        $user = $request->user();

        $allowedRoles = collect($roles)
            ->filter()
            ->map(fn (string $role) => strtolower($role))
            ->all();

        if (empty($allowedRoles)) {
            $allowedRoles = [
                UserType::Retailer->value,
                UserType::Wholesaler->value,
                UserType::Sales->value,
            ];
        }

        if ($user && in_array($user->type, $allowedRoles, true)) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            abort(403, 'This area is reserved for customer partners.');
        }

        $redirectRoute = match ($user?->type) {
            UserType::Admin->value, UserType::SuperAdmin->value => 'admin.dashboard',
            UserType::Production->value => 'production.dashboard',
            default => 'home',
        };

        return redirect()
            ->route($redirectRoute)
            ->with('error', 'Access limited to approved retail partners.');
    }
}
