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
use App\Models\ProductCatalog;
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
            'diamond',
            'price_min',
            'price_max',
            'search',
            'category',
            'catalog',
            'sort',
        ]);

        $query = Product::query()
            ->with([
                'brand',
                'category',
                'material',
                'catalogs:id,name,slug',
                'media' => fn ($media) => $media->orderBy('position'),
                'variants' => fn ($variants) => $variants->orderByDesc('is_default'),
            ]);

        if ($mode === 'jobwork') {
            $query->where('is_jobwork_allowed', true);
        }

        $brandFilters = array_filter((array) ($filters['brand'] ?? []), fn ($value) => filled($value));
        if (! empty($brandFilters)) {
            $query->whereHas('brand', fn ($q) => $q->whereIn('name', $brandFilters));
        }

        if (! empty($filters['gold_purity'])) {
            $goldIds = array_filter((array) $filters['gold_purity'], fn ($value) => $value !== null && $value !== '');
            if (! empty($goldIds)) {
                $query->where(function ($goldQuery) use ($goldIds) {
                    foreach ($goldIds as $id) {
                        $goldQuery->orWhereJsonContains('gold_purity_ids', (int) $id);
                    }
                });
            }
        }

        if (! empty($filters['silver_purity'])) {
            $silverIds = array_filter((array) $filters['silver_purity'], fn ($value) => $value !== null && $value !== '');
            if (! empty($silverIds)) {
                $query->where(function ($silverQuery) use ($silverIds) {
                    foreach ($silverIds as $id) {
                        $silverQuery->orWhereJsonContains('silver_purity_ids', (int) $id);
                    }
                });
            }
        }

        $diamondFilters = array_filter((array) ($filters['diamond'] ?? []), fn ($value) => filled($value));
        if (! empty($diamondFilters)) {
            $query->where(function ($diamondQuery) use ($diamondFilters) {
                foreach ($diamondFilters as $filter) {
                    if (! is_string($filter) || strpos($filter, ':') === false) {
                        continue;
                    }

                    [$group, $id] = explode(':', $filter, 2);
                    $id = (int) $id;

                    if ($id <= 0) {
                        continue;
                    }

                    switch ($group) {
                        case 'type':
                            $diamondQuery->orWhereJsonContains('diamond_options', ['type_id' => $id]);
                            break;
                        case 'shape':
                            $diamondQuery->orWhereJsonContains('diamond_options', ['shape_id' => $id]);
                            break;
                        case 'color':
                            $diamondQuery->orWhereJsonContains('diamond_options', ['color_id' => $id]);
                            break;
                        case 'clarity':
                            $diamondQuery->orWhereJsonContains('diamond_options', ['clarity_id' => $id]);
                            break;
                        case 'cut':
                            $diamondQuery->orWhereJsonContains('diamond_options', ['cut_id' => $id]);
                            break;
                    }
                }
            });
        }

        $categoryFilters = array_filter((array) ($filters['category'] ?? []), fn ($value) => filled($value));
        if (! empty($categoryFilters)) {
            $query->whereHas('category', function ($categoryQuery) use ($categoryFilters) {
                $categoryQuery->where(function ($innerQuery) use ($categoryFilters) {
                    $ids = array_values(array_filter($categoryFilters, fn ($value) => is_numeric($value)));
                    $slugsOrNames = array_values(array_filter($categoryFilters, fn ($value) => ! is_numeric($value)));

                    if (! empty($ids)) {
                        $innerQuery->orWhereIn('id', array_map('intval', $ids));
                    }

                    if (! empty($slugsOrNames)) {
                        $innerQuery->orWhereIn('slug', $slugsOrNames)
                            ->orWhereIn('name', $slugsOrNames);
                    }
                });
            });
        }
        $sort = $request->string('sort')->value();

        $filters['brand'] = array_values($brandFilters);
        $filters['gold_purity'] = array_values(array_filter((array) ($filters['gold_purity'] ?? []), fn ($value) => filled($value)));
        $filters['silver_purity'] = array_values(array_filter((array) ($filters['silver_purity'] ?? []), fn ($value) => filled($value)));
        $filters['diamond'] = array_values($diamondFilters);
        $filters['category'] = array_values($categoryFilters);
        $filters['sort'] = $sort ?: null;

        if ($filters['catalog'] ?? null) {
            $catalogFilter = $filters['catalog'];
            $catalog = ProductCatalog::query()
                ->where('slug', $catalogFilter)
                ->orWhere('id', $catalogFilter)
                ->first();

            if ($catalog) {
                $query->whereHas('catalogs', fn ($catalogQuery) => $catalogQuery->where('product_catalogs.id', $catalog->id));
            }
        }

        if ($filters['search'] ?? null) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('sku', 'like', '%' . $filters['search'] . '%');
            });
        }

        $priceMin = $filters['price_min'] ?? null;
        $priceMax = $filters['price_max'] ?? null;
        if ($priceMin !== null || $priceMax !== null) {
            $query->where(function ($priceQuery) use ($priceMin, $priceMax) {
                if ($priceMin !== null) {
                    $priceQuery->where('base_price', '>=', (float) $priceMin);
                }

                if ($priceMax !== null) {
                    $priceQuery->where('base_price', '<=', (float) $priceMax);
                }
            });
        }

        $sort = in_array($sort, ['newest', 'price_asc', 'price_desc', 'name_asc'], true) ? $sort : null;

        $products = $query
            ->when($sort === 'price_asc', fn ($builder) => $builder->orderBy('base_price', 'asc'))
            ->when($sort === 'price_desc', fn ($builder) => $builder->orderBy('base_price', 'desc'))
            ->when($sort === 'name_asc', fn ($builder) => $builder->orderBy('name'))
            ->when(! $sort || $sort === 'newest', fn ($builder) => $builder->latest())
            ->paginate(12)
            ->through(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'brand' => optional($product->brand)?->name,
                'category' => optional($product->category)?->name,
                'material' => optional($product->material)?->name,
                'purity' => $product->metadata['purity'] ?? $product->material?->purity,
                'gold_weight' => $product->gold_weight !== null ? (float) $product->gold_weight : null,
                'silver_weight' => $product->silver_weight !== null ? (float) $product->silver_weight : null,
                'other_material_weight' => $product->other_material_weight !== null ? (float) $product->other_material_weight : null,
                'total_weight' => $product->total_weight !== null ? (float) $product->total_weight : null,
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
                'catalogs' => $product->catalogs->map(fn (ProductCatalog $catalog) => [
                    'id' => $catalog->id,
                    'name' => $catalog->name,
                    'slug' => $catalog->slug,
                ]),
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
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                ]),
            'catalogs' => ProductCatalog::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn (ProductCatalog $catalog) => [
                    'id' => $catalog->id,
                    'name' => $catalog->name,
                    'slug' => $catalog->slug,
                ]),
            'goldPurities' => GoldPurity::orderBy('position')->orderBy('name')->get(['id', 'name'])->map(fn (GoldPurity $purity) => [
                'id' => $purity->id,
                'name' => $purity->name,
            ]),
            'silverPurities' => SilverPurity::orderBy('position')->orderBy('name')->get(['id', 'name'])->map(fn (SilverPurity $purity) => [
                'id' => $purity->id,
                'name' => $purity->name,
            ]),
            'diamondOptions' => [
                'types' => DiamondType::orderBy('name')->get(['id', 'name'])->map(fn (DiamondType $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                ]),
                'shapes' => DiamondShape::orderBy('name')->get(['id', 'name'])->map(fn (DiamondShape $shape) => [
                    'id' => $shape->id,
                    'name' => $shape->name,
                ]),
                'colors' => DiamondColor::orderBy('name')->get(['id', 'name'])->map(fn (DiamondColor $color) => [
                    'id' => $color->id,
                    'name' => $color->name,
                ]),
                'clarities' => DiamondClarity::orderBy('name')->get(['id', 'name'])->map(fn (DiamondClarity $clarity) => [
                    'id' => $clarity->id,
                    'name' => $clarity->name,
                ]),
                'cuts' => DiamondCut::orderBy('name')->get(['id', 'name'])->map(fn (DiamondCut $cut) => [
                    'id' => $cut->id,
                    'name' => $cut->name,
                ]),
            ],
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
                'gold_weight' => $product->gold_weight !== null ? (float) $product->gold_weight : null,
                'silver_weight' => $product->silver_weight !== null ? (float) $product->silver_weight : null,
                'other_material_weight' => $product->other_material_weight !== null ? (float) $product->other_material_weight : null,
                'total_weight' => $product->total_weight !== null ? (float) $product->total_weight : null,
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
