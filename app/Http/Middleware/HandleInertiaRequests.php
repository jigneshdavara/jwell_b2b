<?php

namespace App\Http\Middleware;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $customer = $request->user();
        $admin = $request->user('admin');
        $authUser = $customer ?? $admin;

        $cartCount = 0;
        if ($customer instanceof Customer) {
            $activeCart = $customer->carts()
                ->where('status', 'active')
                ->withCount('items')
                ->latest()
                ->first();

            $cartCount = $activeCart->items_count ?? 0;
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $authUser,
            ],
            'brand' => [
                'name' => config('demo.brand_name'),
            ],
            'cart' => [
                'count' => $cartCount,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'info' => $request->session()->get('info'),
                'status' => $request->session()->get('status'),
            ],
        ];
    }
}
