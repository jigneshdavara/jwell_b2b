<?php

namespace App\Http\Middleware;

use App\Enums\KycStatus;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureKycApproved
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->kyc_status !== KycStatus::Approved->value) {
            if ($request->expectsJson()) {
                abort(403, 'KYC approval required to access this resource.');
            }

            return redirect()
                ->route('onboarding.kyc.show')
                ->with('status', 'kyc_pending');
        }

        return $next($request);
    }
}
