<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Material;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'brand',
            'material',
            'purity',
            'search',
        ]);

        $query = Product::query()->with(['brand', 'category', 'material', 'media' => fn ($media) => $media->orderBy('position'), 'variants' => fn ($variants) => $variants->orderByDesc('is_default')]);

        if ($filters['brand'] ?? null) {
            $query->whereHas('brand', fn ($q) => $q->where('name', $filters['brand']));
        }

        if ($filters['material'] ?? null) {
            $query->whereHas('material', fn ($q) => $q->where('name', $filters['material']));
        }

        if ($filters['purity'] ?? null) {
            $query->where('purity', $filters['purity']);
        }

        if ($filters['search'] ?? null) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('sku', 'like', '%' . $filters['search'] . '%');
            });
        }

        $products = $query
            ->latest()
            ->paginate(12)
            ->through(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'brand' => optional($product->brand)?->name,
                'category' => optional($product->category)?->name,
                'material' => optional($product->material)?->name,
                'purity' => $product->metadata['purity'] ?? $product->material?->purity,
                'gross_weight' => (float) $product->gross_weight,
                'net_weight' => (float) $product->net_weight,
                'base_price' => (float) $product->base_price,
                'making_charge' => (float) $product->making_charge,
                'is_jobwork_allowed' => (bool) $product->is_jobwork_allowed,
                'thumbnail' => optional($product->media->sortBy('position')->first())?->url,
                'media' => $product->media->sortBy('position')->values()->map(fn ($media) => [
                    'url' => $media->url,
                    'alt' => $media->metadata['alt'] ?? $product->name,
                ]),
                'variants' => $product->variants->map(fn ($variant) => [
                    'id' => $variant->id,
                    'label' => $variant->label,
                    'metal_tone' => $variant->metal_tone,
                    'stone_quality' => $variant->stone_quality,
                    'size' => $variant->size,
                    'price_adjustment' => $variant->price_adjustment,
                    'is_default' => $variant->is_default,
                ]),
            ]);

        $facets = [
            'brands' => Brand::orderBy('name')->pluck('name'),
            'materials' => Material::orderBy('name')->pluck('name'),
            'purities' => Material::select('purity')
                ->distinct()
                ->pluck('purity')
                ->filter()
                ->values(),
            'categories' => Category::orderBy('name')->pluck('name'),
        ];

        return Inertia::render('Frontend/Catalog/Index', [
            'filters' => $filters,
            'products' => $products,
            'facets' => $facets,
        ]);
    }

    public function show(Product $product): Response
    {
        $product->load(['brand', 'material', 'media' => fn ($media) => $media->orderBy('position'), 'variants' => fn ($variants) => $variants->orderByDesc('is_default')]);

        return Inertia::render('Frontend/Catalog/Show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'description' => $product->description,
                'brand' => optional($product->brand)?->name,
                'material' => optional($product->material)?->name,
                'purity' => $product->metadata['purity'] ?? $product->material?->purity,
                'net_weight' => (float) $product->net_weight,
                'gross_weight' => (float) $product->gross_weight,
                'base_price' => (float) $product->base_price,
                'making_charge' => (float) $product->making_charge,
                'is_jobwork_allowed' => (bool) $product->is_jobwork_allowed,
                'media' => $product->media->map(fn ($media) => [
                    'url' => $media->url,
                    'alt' => $media->metadata['alt'] ?? $product->name,
                ]),
                'variants' => $product->variants->map(fn ($variant) => [
                    'id' => $variant->id,
                    'label' => $variant->label,
                    'metal_tone' => $variant->metal_tone,
                    'stone_quality' => $variant->stone_quality,
                    'size' => $variant->size,
                    'price_adjustment' => $variant->price_adjustment,
                    'is_default' => $variant->is_default,
                ]),
            ],
        ]);
    }
}
