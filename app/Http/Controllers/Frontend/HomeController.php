<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\JobworkRequest;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response|RedirectResponse
    {
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        $stats = [
            'products' => Product::count(),
            'orders' => Order::count(),
            'jobworks' => JobworkRequest::count(),
            'active_offers' => Offer::where('is_active', true)->count(),
        ];

        $spotlight = Product::query()
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'price' => (float) $product->base_price,
                'making_charge_amount' => (float) $product->making_charge_amount,
            ]);

        $features = [
            [
                'title' => 'Live Bullion & Diamond Pricing',
                'description' => 'Lock rates in seconds with automated hedging notifications and daily market snapshots.',
            ],
            [
                'title' => 'Collaborative Jobwork',
                'description' => 'Track incoming material, production stages, QC, and dispatch in one shared workflow.',
            ],
            [
                'title' => 'Personalised Offers',
                'description' => 'Segment retailers vs wholesalers, push promotions, and monitor ROI on every campaign.',
            ],
        ];

        $brands = Brand::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->pluck('name')
            ->toArray();

        return Inertia::render('Frontend/Home/Index', [
            'stats' => $stats,
            'brands' => $brands,
            'spotlight' => $spotlight,
            'features' => $features,
        ]);
    }
}
