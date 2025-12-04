<?php

namespace App\Http\Controllers\Frontend;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Offer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductCatalog;
use App\Models\Quotation;
use App\Models\Brand;
use App\Models\PriceRate;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $user = Auth::user();

        $openOrderStatuses = [
            OrderStatus::Pending->value,
            OrderStatus::Approved->value,
            OrderStatus::InProduction->value,
            OrderStatus::QualityCheck->value,
            OrderStatus::ReadyToDispatch->value,
        ];

        $stats = [
            'open_orders' => Order::where('user_id', $user->id)
                ->whereIn('status', $openOrderStatuses)
                ->count(),
            'jobwork_requests' => Quotation::where('user_id', $user->id)
                ->where('mode', 'jobwork')
                ->where('status', 'approved')
                ->count(),
            'active_offers' => Offer::where('is_active', true)->count(),
        ];

        $recentOrders = Order::withCount('items')
            ->where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn(Order $order) => [
                'reference' => $order->reference,
                'status' => $order->status,
                'total' => (float) $order->total_amount,
                'items' => $order->items_count,
                'placed_on' => Carbon::parse($order->created_at)->toDateTimeString(),
            ]);

        $jobworkTimeline = Quotation::where('user_id', $user->id)
            ->where('mode', 'jobwork')
            ->where('status', 'approved')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn(Quotation $quotation) => [
                'id' => $quotation->id,
                'status' => $quotation->jobwork_status,
                'product' => optional($quotation->product)?->name,
                'quantity' => $quotation->quantity,
                'submitted_on' => optional($quotation->created_at)?->toDateTimeString(),
            ]);

        $dueOrders = Order::where('user_id', $user->id)
            ->where('status', OrderStatus::PendingPayment->value)
            ->latest()
            ->take(5)
            ->get()
            ->map(fn(Order $order) => [
                'reference' => $order->reference,
                'total' => (float) $order->total_amount,
                'placed_on' => optional($order->created_at)?->toDateTimeString(),
            ]);

        $coverImageUrl = static function (?string $path): ?string {
            if (! $path) {
                return null;
            }

            if (Str::startsWith($path, ['http://', 'https://'])) {
                return $path;
            }

            return Storage::disk('public')->url($path);
        };

        $recentProducts = Product::query()
            ->with([
                'brand',
                'catalogs',
                'media' => fn($media) => $media->orderBy('position'),
                'variants.metals.metal',
                'variants.metals.metalPurity',
                'variants.metals.metalTone',
            ])
            ->where('is_active', true)
            ->latest()
            ->take(6)
            ->get()
            ->map(function (Product $product) {
                // Calculate priceTotal for the first variant (or default variant if available)
                $variant = $product->variants->sortBy('id')->first();
                $priceTotal = 0;

                if ($variant) {
                    // Calculate metal cost
                    $metalCost = 0;
                    foreach ($variant->metals as $variantMetal) {
                        $metal = $variantMetal->metal;
                        $purity = $variantMetal->metalPurity;
                        $weight = $variantMetal->metal_weight ?? $variantMetal->weight_grams ?? null;

                        if ($metal && $purity && $weight) {
                            $metalName = strtolower(trim($metal->name ?? ''));
                            $purityName = trim($purity->name ?? '');

                            $priceRate = PriceRate::where('metal', $metalName)
                                ->where('purity', $purityName)
                                ->orderBy('effective_at', 'desc')
                                ->first();

                            if ($priceRate && $priceRate->price_per_gram) {
                                $metalCost += (float) $weight * (float) $priceRate->price_per_gram;
                            }
                        }
                    }
                    $metalCost = round($metalCost, 2);

                    // Calculate priceTotal: Metal + Diamond + Making Charge
                    $diamondCost = 0; // Diamond cost calculation can be added later if needed
                    $makingCharge = (float) ($product->making_charge ?? 0);
                    $priceTotal = $metalCost + $diamondCost + $makingCharge;
                } else {
                    // If no variant, fallback to making charge only
                    $priceTotal = (float) ($product->making_charge ?? 0);
                }

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'brand' => optional($product->brand)?->name,
                    'catalog' => optional($product->catalogs->first())?->name,
                    'price_total' => $priceTotal,
                    'thumbnail' => optional($product->media->sortBy('position')->first())?->url,
                ];
            });

        $featuredCatalogs = ProductCatalog::query()
            ->withCount('products')
            ->where('is_active', true)
            ->latest('updated_at')
            ->take(6)
            ->get()
            ->map(fn(ProductCatalog $catalog) => [
                'id' => $catalog->id,
                'name' => $catalog->name,
                'slug' => $catalog->slug,
                'description' => $catalog->description,
                'products_count' => $catalog->products_count,
            ]);

        $featuredCategories = Category::query()
            ->withCount('products')
            ->where('is_active', true)
            ->orderByDesc('products_count')
            ->take(8)
            ->get()
            ->map(fn(Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'products_count' => $category->products_count,
                'cover_image_url' => $coverImageUrl($category->cover_image),
            ]);

        $brandSpotlight = Brand::query()
            ->withCount('products')
            ->where('is_active', true)
            ->orderByDesc('products_count')
            ->take(6)
            ->get()
            ->map(fn(Brand $brand) => [
                'id' => $brand->id,
                'name' => $brand->name,
                'products_count' => $brand->products_count,
                'cover_image_url' => $coverImageUrl($brand->cover_image_path),
            ]);

        return Inertia::render('Frontend/Dashboard/Overview', [
            'stats' => $stats,
            'recentProducts' => $recentProducts,
            'featuredCatalogs' => $featuredCatalogs,
            'featuredCategories' => $featuredCategories,
            'brandSpotlight' => $brandSpotlight,
        ]);
    }
}
