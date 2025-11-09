<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\JobworkRequest;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'products' => Product::count(),
            'orders' => Order::count(),
            'jobworks' => JobworkRequest::count(),
            'active_offers' => Offer::where('is_active', true)->count(),
        ];

        $brands = Brand::query()
            ->inRandomOrder()
            ->limit(6)
            ->pluck('name')
            ->toArray();

        $spotlight = Product::with('brand')
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'brand' => optional($product->brand)->name,
                'price' => (float) $product->base_price,
                'making_charge' => (float) $product->making_charge,
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

        return Inertia::render('Frontend/Home/Index', [
            'stats' => $stats,
            'brands' => $brands,
            'spotlight' => $spotlight,
            'features' => $features,
        ]);
    }
}
