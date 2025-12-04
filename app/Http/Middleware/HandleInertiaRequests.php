<?php

namespace App\Http\Middleware;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
        $wishlistCount = 0;
        $wishlistProductIds = [];
        $navCategories = [];
        $navBrands = [];
        if ($customer instanceof Customer) {
            $customer->loadMissing([
                'carts' => fn ($query) => $query->withCount('items')->where('status', 'active')->latest(),
                'wishlist.items',
            ]);

            $activeCart = $customer->carts
                ->where('status', 'active')
                ->sortByDesc('created_at')
                ->first();

            $cartCount = $activeCart->items_count ?? 0;

            $wishlist = $customer->wishlist;
            if ($wishlist) {
                $wishlistCount = $wishlist->items->count();
                $wishlistProductIds = $wishlist->items->pluck('product_id')->unique()->values()->all();
            }

            $resolveImageUrl = static function (?string $path): ?string {
                if (! $path) {
                    return null;
                }

                if (Str::startsWith($path, ['http://', 'https://'])) {
                    return $path;
                }

                return Storage::disk('public')->url($path);
            };

            $navCategories = Category::query()
                ->select(['id', 'name', 'cover_image'])
                ->where('is_active', true)
                ->orderBy('name')
                ->take(8)
                ->get()
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'cover_image_url' => $resolveImageUrl($category->cover_image),
                ])
                ->toArray();


            $navBrands = Brand::query()
                ->select(['id', 'name', 'slug'])
                ->where('is_active', true)
                ->orderBy('name')
                ->take(8)
                ->get()
                ->map(fn (Brand $brand) => [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'slug' => $brand->slug,
                ])
                ->toArray();
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
            'wishlist' => [
                'count' => $wishlistCount,
                'product_ids' => $wishlistProductIds,
            ],
            'navigation' => [
                'categories' => $navCategories,
                'brands' => $navBrands,
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
