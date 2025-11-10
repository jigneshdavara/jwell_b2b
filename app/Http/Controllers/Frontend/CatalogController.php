<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\DiamondClarity;
use App\Models\DiamondColor;
use App\Models\DiamondCut;
use App\Models\DiamondShape;
use App\Models\DiamondType;
use App\Models\GoldPurity;
use App\Models\Product;
use App\Models\SilverPurity;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $mode = $request->string('mode')->lower()->value();
        if (! in_array($mode, ['jobwork', 'purchase'], true)) {
            $mode = 'purchase';
        }

        $filters = $request->only([
            'brand',
            'gold_purity',
            'silver_purity',
            'search',
        ]);

        $query = Product::query()
            ->with([
                'brand',
                'category',
                'material',
                'media' => fn ($media) => $media->orderBy('position'),
                'variants' => fn ($variants) => $variants->orderByDesc('is_default'),
            ]);

        if ($mode === 'jobwork') {
            $query->where('is_jobwork_allowed', true);
        }

        if ($filters['brand'] ?? null) {
            $query->whereHas('brand', fn ($q) => $q->where('name', $filters['brand']));
        }

        if ($filters['gold_purity'] ?? null) {
            $query->whereJsonContains('gold_purity_ids', (int) $filters['gold_purity']);
        }

        if ($filters['silver_purity'] ?? null) {
            $query->whereJsonContains('silver_purity_ids', (int) $filters['silver_purity']);
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
                'uses_gold' => (bool) $product->uses_gold,
                'uses_silver' => (bool) $product->uses_silver,
                'uses_diamond' => (bool) $product->uses_diamond,
                'variants' => $product->variants->map(fn ($variant) => [
                    'id' => $variant->id,
                    'label' => $variant->label,
                    'price_adjustment' => $variant->price_adjustment,
                    'is_default' => $variant->is_default,
                    'metadata' => $variant->metadata ?? [],
                ]),
            ]);

        $facets = [
            'brands' => Brand::orderBy('name')->pluck('name'),
            'categories' => Category::orderBy('name')->pluck('name'),
            'goldPurities' => GoldPurity::orderBy('position')->orderBy('name')->get(['id', 'name'])->map(fn (GoldPurity $purity) => [
                'id' => $purity->id,
                'name' => $purity->name,
            ]),
            'silverPurities' => SilverPurity::orderBy('position')->orderBy('name')->get(['id', 'name'])->map(fn (SilverPurity $purity) => [
                'id' => $purity->id,
                'name' => $purity->name,
            ]),
        ];

        return Inertia::render('Frontend/Catalog/Index', [
            'mode' => $mode,
            'filters' => $filters,
            'products' => $products,
            'facets' => $facets,
        ]);
    }

    public function show(Product $product): Response
    {
        $mode = request()->string('mode')->lower()->value();
        if (! in_array($mode, ['jobwork', 'purchase'], true)) {
            $mode = 'purchase';
        }

        $product->load([
            'brand',
            'material',
            'media' => fn ($media) => $media->orderBy('position'),
            'variants' => fn ($variants) => $variants->orderByDesc('is_default'),
        ]);

        $goldPurityIds = collect($product->gold_purity_ids ?? [])->filter()->values();
        $goldPurities = $goldPurityIds->isEmpty()
            ? []
            : GoldPurity::query()
                ->whereIn('id', $goldPurityIds)
                ->orderBy('position')
                ->orderBy('name')
                ->get()
                ->map(fn (GoldPurity $purity) => [
                    'id' => $purity->id,
                    'name' => $purity->name,
                ])
                ->values()
                ->all();

        $silverPurityIds = collect($product->silver_purity_ids ?? [])->filter()->values();
        $silverPurities = $silverPurityIds->isEmpty()
            ? []
            : SilverPurity::query()
                ->whereIn('id', $silverPurityIds)
                ->orderBy('position')
                ->orderBy('name')
                ->get()
                ->map(fn (SilverPurity $purity) => [
                    'id' => $purity->id,
                    'name' => $purity->name,
                ])
                ->values()
                ->all();

        $diamondOptions = collect($product->diamond_options ?? [])
            ->map(function (array $option) {
                return [
                    'key' => $option['key'] ?? (string) Str::uuid(),
                    'type_id' => $option['type_id'] ?? null,
                    'shape_id' => $option['shape_id'] ?? null,
                    'color_id' => $option['color_id'] ?? null,
                    'clarity_id' => $option['clarity_id'] ?? null,
                    'cut_id' => $option['cut_id'] ?? null,
                    'weight' => $option['weight'] ?? null,
                ];
            });

        $typeMap = DiamondType::query()->whereIn('id', $diamondOptions->pluck('type_id')->filter())->pluck('name', 'id');
        $shapeMap = DiamondShape::query()->whereIn('id', $diamondOptions->pluck('shape_id')->filter())->pluck('name', 'id');
        $colorMap = DiamondColor::query()->whereIn('id', $diamondOptions->pluck('color_id')->filter())->pluck('name', 'id');
        $clarityMap = DiamondClarity::query()->whereIn('id', $diamondOptions->pluck('clarity_id')->filter())->pluck('name', 'id');
        $cutMap = DiamondCut::query()->whereIn('id', $diamondOptions->pluck('cut_id')->filter())->pluck('name', 'id');

        $diamondOptions = $diamondOptions
            ->map(function (array $option) use ($typeMap, $shapeMap, $colorMap, $clarityMap, $cutMap) {
                $parts = collect([
                    $option['weight'] ? number_format((float) $option['weight'], 2) . ' Ct' : null,
                    $option['shape_id'] ? $shapeMap[$option['shape_id']] ?? null : null,
                    $option['clarity_id'] ? $clarityMap[$option['clarity_id']] ?? null : null,
                    $option['color_id'] ? $colorMap[$option['color_id']] ?? null : null,
                    $option['type_id'] ? $typeMap[$option['type_id']] ?? null : null,
                    $option['cut_id'] ? $cutMap[$option['cut_id']] ?? null : null,
                ])->filter()->values()->all();

                return [
                    'key' => $option['key'],
                    'type_id' => $option['type_id'],
                    'shape_id' => $option['shape_id'],
                    'color_id' => $option['color_id'],
                    'clarity_id' => $option['clarity_id'],
                    'cut_id' => $option['cut_id'],
                    'weight' => $option['weight'],
                    'label' => ! empty($parts) ? implode(' · ', $parts) : 'Custom mix',
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Frontend/Catalog/Show', [
            'mode' => $mode,
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
                'uses_gold' => (bool) $product->uses_gold,
                'uses_silver' => (bool) $product->uses_silver,
                'uses_diamond' => (bool) $product->uses_diamond,
                'media' => $product->media->map(fn ($media) => [
                    'url' => $media->url,
                    'alt' => $media->metadata['alt'] ?? $product->name,
                ]),
                'variants' => $product->variants->map(fn ($variant) => [
                    'id' => $variant->id,
                    'label' => $variant->label,
                    'price_adjustment' => $variant->price_adjustment,
                    'is_default' => $variant->is_default,
                    'metadata' => $variant->metadata ?? [],
                ]),
            ],
            'goldPurities' => $goldPurities,
            'silverPurities' => $silverPurities,
            'diamondOptions' => $diamondOptions,
        ]);
    }
}
