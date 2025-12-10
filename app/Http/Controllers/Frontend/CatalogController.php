<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Catalog;
use App\Models\Category;
use App\Models\ColorstoneColor;
use App\Models\ColorstoneQuality;
use App\Models\ColorstoneShape;
use App\Models\DiamondClarity;
use App\Models\DiamondColor;
use App\Models\DiamondShape;
use App\Models\Metal;
use App\Models\MetalPurity;
use App\Models\MetalTone;
use App\Models\PriceRate;
use App\Models\Product;
use App\Services\PricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function __construct(
        protected PricingService $pricingService
    ) {}

    public function index(Request $request): Response
    {
        $mode = $request->string('mode')->lower()->value();
        if (! in_array($mode, ['jobwork', 'purchase'], true)) {
            $mode = 'purchase';
        }

        $filters = $request->only([
            'brand',
            'metal',
            'metal_purity',
            'metal_tone',
            'diamond',
            'colorstone',
            'price_min',
            'price_max',
            'search',
            'category',
            'catalog',
            'sort',
            'jobwork_available',
            'ready_made',
        ]);

        $query = Product::query()
            ->with([
                'category',
                'media' => fn($media) => $media->orderBy('position'),
                'variants' => function ($variants) {
                    $variants->orderByAsc('id')
                        ->with(['metals.metal', 'metals.metalPurity', 'metals.metalTone']);
                },
            ]);

        if ($mode === 'jobwork') {
            $query->where('is_jobwork_allowed', true);
        }

        // Filter by jobwork availability
        if (($filters['jobwork_available'] ?? null) === '1') {
            $query->where('is_jobwork_allowed', true);
        }

        // Filter by ready made (products that are not jobwork-only, meaning they have base_price)
        if (($filters['ready_made'] ?? null) === '1') {
            $query->whereNotNull('base_price')->where('base_price', '>', 0);
        }

        // Filter by brand
        if (! empty($filters['brand'])) {
            $brandNames = array_filter((array) $filters['brand'], fn($value) => filled($value));
            if (! empty($brandNames)) {
                $query->whereHas('brand', function ($brandQuery) use ($brandNames) {
                    $brandQuery->whereIn('name', $brandNames);
                });
            }
        }

        // Filter by metal
        if (! empty($filters['metal'])) {
            $metalIds = array_filter((array) $filters['metal'], fn($value) => $value !== null && $value !== '');
            if (! empty($metalIds)) {
                $query->whereHas('variants.metals', function ($metalQuery) use ($metalIds) {
                    $metalQuery->whereIn('metal_id', array_map('intval', $metalIds));
                });
            }
        }

        // Filter by metal purity
        if (! empty($filters['metal_purity'])) {
            $purityIds = array_filter((array) $filters['metal_purity'], fn($value) => $value !== null && $value !== '');
            if (! empty($purityIds)) {
                $query->whereHas('variants.metals', function ($purityQuery) use ($purityIds) {
                    $purityQuery->whereIn('metal_purity_id', array_map('intval', $purityIds));
                });
            }
        }

        // Filter by metal tone
        if (! empty($filters['metal_tone'])) {
            $toneIds = array_filter((array) $filters['metal_tone'], fn($value) => $value !== null && $value !== '');
            if (! empty($toneIds)) {
                $query->whereHas('variants.metals', function ($toneQuery) use ($toneIds) {
                    $toneQuery->whereIn('metal_tone_id', array_map('intval', $toneIds));
                });
            }
        }

        $diamondFilters = array_filter((array) ($filters['diamond'] ?? []), fn($value) => filled($value));
        if (! empty($diamondFilters)) {
            $query->whereHas('variants.diamonds.diamond', function ($diamondQuery) use ($diamondFilters) {
                $diamondQuery->where(function ($innerQuery) use ($diamondFilters) {
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
                            case 'shape':
                                $innerQuery->orWhere('diamond_shape_id', $id);
                                break;
                            case 'color':
                                $innerQuery->orWhere('diamond_color_id', $id);
                                break;
                            case 'clarity':
                                $innerQuery->orWhere('diamond_clarity_id', $id);
                                break;
                        }
                    }
                });
            });
        }

        $colorstoneFilters = array_filter((array) ($filters['colorstone'] ?? []), fn($value) => filled($value));
        if (! empty($colorstoneFilters)) {
            $query->whereHas('variants.colorstones.colorstone', function ($colorstoneQuery) use ($colorstoneFilters) {
                $colorstoneQuery->where(function ($innerQuery) use ($colorstoneFilters) {
                    foreach ($colorstoneFilters as $filter) {
                        if (! is_string($filter) || strpos($filter, ':') === false) {
                            continue;
                        }

                        [$group, $id] = explode(':', $filter, 2);
                        $id = (int) $id;

                        if ($id <= 0) {
                            continue;
                        }

                        switch ($group) {
                            case 'shape':
                                $innerQuery->orWhere('colorstone_shape_id', $id);
                                break;
                            case 'color':
                                $innerQuery->orWhere('colorstone_color_id', $id);
                                break;
                            case 'quality':
                                $innerQuery->orWhere('colorstone_quality_id', $id);
                                break;
                        }
                    }
                });
            });
        }

        $categoryFilters = array_filter((array) ($filters['category'] ?? []), fn($value) => filled($value));
        if (! empty($categoryFilters)) {
            $query->whereHas('category', function ($categoryQuery) use ($categoryFilters) {
                $categoryQuery->where(function ($innerQuery) use ($categoryFilters) {
                    $ids = array_values(array_filter($categoryFilters, fn($value) => is_numeric($value)));
                    $slugsOrNames = array_values(array_filter($categoryFilters, fn($value) => ! is_numeric($value)));

                    if (! empty($ids)) {
                        $innerQuery->orWhereIn('id', array_map('intval', $ids));
                    }

                    if (! empty($slugsOrNames)) {
                        $innerQuery->orWhereIn('name', $slugsOrNames);
                    }
                });
            });
        }

        $catalogFilters = array_filter((array) ($filters['catalog'] ?? []), fn($value) => filled($value));
        if (! empty($catalogFilters)) {
            $query->whereHas('catalogs', function ($catalogQuery) use ($catalogFilters) {
                $catalogQuery->where(function ($innerQuery) use ($catalogFilters) {
                    $ids = array_values(array_filter($catalogFilters, fn($value) => is_numeric($value)));
                    $slugsOrNames = array_values(array_filter($catalogFilters, fn($value) => ! is_numeric($value)));

                    if (! empty($ids)) {
                        $innerQuery->orWhereIn('catalogs.id', array_map('intval', $ids));
                    }

                    if (! empty($slugsOrNames)) {
                        $innerQuery->orWhereIn('catalogs.name', $slugsOrNames);
                    }
                });
            });
        }
        $sort = $request->string('sort')->value();

        $filters['brand'] = array_values(array_filter((array) ($filters['brand'] ?? []), fn($value) => filled($value)));
        $filters['metal'] = array_values(array_filter((array) ($filters['metal'] ?? []), fn($value) => filled($value)));
        $filters['metal_purity'] = array_values(array_filter((array) ($filters['metal_purity'] ?? []), fn($value) => filled($value)));
        $filters['metal_tone'] = array_values(array_filter((array) ($filters['metal_tone'] ?? []), fn($value) => filled($value)));
        $filters['diamond'] = array_values($diamondFilters);
        $filters['colorstone'] = array_values($colorstoneFilters);
        $filters['category'] = array_values($categoryFilters);
        $filters['catalog'] = array_values($catalogFilters);
        $filters['sort'] = $sort ?: null;
        $filters['jobwork_available'] = ($filters['jobwork_available'] ?? null) === '1' ? '1' : null;
        $filters['ready_made'] = ($filters['ready_made'] ?? null) === '1' ? '1' : null;

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
            ->with([
                'variants.metals.metal',
                'variants.metals.metalPurity',
                'variants.metals.metalTone',
                'variants.diamonds.diamond',
                'variants.colorstones.colorstone',
            ])
            ->when($sort === 'price_asc', fn($builder) => $builder->orderBy('base_price', 'asc'))
            ->when($sort === 'price_desc', fn($builder) => $builder->orderBy('base_price', 'desc'))
            ->when($sort === 'name_asc', fn($builder) => $builder->orderBy('name'))
            ->when(! $sort || $sort === 'newest', fn($builder) => $builder->latest())
            ->paginate(12)
            ->through(function (Product $product) {
                // Calculate priceTotal for the default variant (or first variant if no default)
                // Variants are already ordered by is_default DESC, so first() should get default
                $variant = $product->variants->firstWhere('is_default', true)
                    ?? $product->variants->first();
                $priceTotal = 0;

                if ($variant) {
                    // Calculate metal cost
                    $metalCost = 0;
                    foreach ($variant->metals as $variantMetal) {
                        $metal = $variantMetal->metal;
                        $purity = $variantMetal->metalPurity;
                        $weight = $variantMetal->metal_weight ?? null;

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

                    // Calculate diamond cost from variant diamonds
                    $diamondCost = 0;
                    foreach ($variant->diamonds as $variantDiamond) {
                        $diamond = $variantDiamond->diamond;
                        if ($diamond && $diamond->price) {
                            $diamondCost += (float) $diamond->price;
                        }
                    }
                    $diamondCost = round($diamondCost, 2);

                    // Calculate colorstone cost from variant colorstones
                    $colorstoneCost = 0;
                    foreach ($variant->colorstones as $variantColorstone) {
                        $colorstone = $variantColorstone->colorstone;
                        if ($colorstone && $colorstone->price) {
                            $colorstoneCost += (float) $colorstone->price;
                        }
                    }
                    $colorstoneCost = round($colorstoneCost, 2);

                    // Calculate priceTotal: Metal + Diamond + Colorstone + Making Charge
                    $makingCharge = (float) ($product->making_charge_amount ?? 0);
                    $priceTotal = $metalCost + $diamondCost + $colorstoneCost + $makingCharge;
                } else {
                    // If no variant, fallback to making charge only
                    $priceTotal = (float) ($product->making_charge ?? 0);
                }

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'category' => optional($product->category)?->name,
                    'material' => optional($product->material)?->name,
                    'purity' => $product->metadata['purity'] ?? $product->material?->purity,
                    'gold_weight' => $product->gold_weight !== null ? (float) $product->gold_weight : null,
                    'silver_weight' => $product->silver_weight !== null ? (float) $product->silver_weight : null,
                    'other_material_weight' => $product->other_material_weight !== null ? (float) $product->other_material_weight : null,
                    'total_weight' => $product->total_weight !== null ? (float) $product->total_weight : null,
                    'price_total' => $priceTotal,
                    'making_charge_amount' => (float) $product->making_charge_amount,
                    'is_jobwork_allowed' => (bool) $product->is_jobwork_allowed,
                    'thumbnail' => optional($product->media->sortBy('position')->first())?->url,
                    'media' => $product->media->sortBy('position')->values()->map(fn($media) => [
                        'url' => $media->url,
                        'alt' => $media->metadata['alt'] ?? $product->name,
                    ]),
                    'uses_gold' => (bool) $product->uses_gold,
                    'uses_silver' => (bool) $product->uses_silver,
                    'uses_diamond' => (bool) $product->uses_diamond,
                    'variants' => $product->variants->map(fn($variant) => [
                        'id' => $variant->id,
                        'label' => $variant->label,
                        'price_adjustment' => $variant->price_adjustment,
                        'is_default' => $variant->is_default,
                        'metadata' => $variant->metadata ?? [],
                    ]),
                ];
            });

        $facets = [
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn(Category $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                ]),
            'metals' => Metal::query()
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn(Metal $metal) => [
                    'id' => $metal->id,
                    'name' => $metal->name,
                ]),
            'metalPurities' => MetalPurity::query()
                ->where('is_active', true)
                ->with('metal:id,name')
                ->orderBy('display_order')
                ->orderBy('name')
                ->get()
                ->map(fn(MetalPurity $purity) => [
                    'id' => $purity->id,
                    'name' => $purity->name,
                    'metal_id' => $purity->metal_id,
                    'metal' => $purity->metal ? ['id' => $purity->metal->id, 'name' => $purity->metal->name] : null,
                ]),
            'metalTones' => MetalTone::query()
                ->where('is_active', true)
                ->with('metal:id,name')
                ->orderBy('display_order')
                ->orderBy('name')
                ->get()
                ->map(fn(MetalTone $tone) => [
                    'id' => $tone->id,
                    'name' => $tone->name,
                    'metal_id' => $tone->metal_id,
                    'metal' => $tone->metal ? ['id' => $tone->metal->id, 'name' => $tone->metal->name] : null,
                ]),
            'diamondOptions' => [
                'types' => [], // DiamondType model doesn't exist yet
                'shapes' => DiamondShape::orderBy('name')->get(['id', 'name'])->map(fn(DiamondShape $shape) => [
                    'id' => $shape->id,
                    'name' => $shape->name,
                ]),
                'colors' => DiamondColor::orderBy('name')->get(['id', 'name'])->map(fn(DiamondColor $color) => [
                    'id' => $color->id,
                    'name' => $color->name,
                ]),
                'clarities' => DiamondClarity::orderBy('name')->get(['id', 'name'])->map(fn(DiamondClarity $clarity) => [
                    'id' => $clarity->id,
                    'name' => $clarity->name,
                ]),
                'cuts' => [], // DiamondCut model doesn't exist yet
            ],
            'colorstoneOptions' => [
                'shapes' => ColorstoneShape::query()
                    ->where('is_active', true)
                    ->orderBy('display_order')
                    ->orderBy('name')
                    ->get(['id', 'name'])
                    ->map(fn(ColorstoneShape $shape) => [
                        'id' => $shape->id,
                        'name' => $shape->name,
                    ]),
                'colors' => ColorstoneColor::query()
                    ->where('is_active', true)
                    ->orderBy('display_order')
                    ->orderBy('name')
                    ->get(['id', 'name'])
                    ->map(fn(ColorstoneColor $color) => [
                        'id' => $color->id,
                        'name' => $color->name,
                    ]),
                'qualities' => ColorstoneQuality::query()
                    ->where('is_active', true)
                    ->orderBy('display_order')
                    ->orderBy('name')
                    ->get(['id', 'name'])
                    ->map(fn(ColorstoneQuality $quality) => [
                        'id' => $quality->id,
                        'name' => $quality->name,
                    ]),
            ],
            'brands' => Brand::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->pluck('name')
                ->all(),
            'catalogs' => Catalog::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn(Catalog $catalog) => [
                    'id' => $catalog->id,
                    'name' => $catalog->name,
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
            'category.sizes',
            'media' => fn($media) => $media->orderBy('position'),
            'variants' => function ($variants) {
                $variants->orderByDesc('is_default')
                    ->with([
                        'metals.metal',
                        'metals.metalPurity',
                        'metals.metalTone',
                        'diamonds.diamond.clarity',
                        'diamonds.diamond.color',
                        'diamonds.diamond.shape',
                        'colorstones.colorstone.shape',
                        'colorstones.colorstone.color',
                        'colorstones.colorstone.quality',
                    ]);
            },
        ]);

        // Build configuration options - one option per variant with all metals and diamonds
        $configurationOptions = $this->buildConfigurationOptions($product);

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
                'making_charge_amount' => (float) $product->making_charge_amount,
                'making_charge_percentage' => $product->making_charge_percentage ? (float) $product->making_charge_percentage : null,
                'is_jobwork_allowed' => (bool) $product->is_jobwork_allowed,
                'uses_gold' => (bool) $product->uses_gold,
                'uses_silver' => (bool) $product->uses_silver,
                'uses_diamond' => (bool) $product->uses_diamond,
                'mixed_metal_tones_per_purity' => (bool) ($product->mixed_metal_tones_per_purity ?? false),
                'mixed_metal_purities_per_tone' => (bool) ($product->mixed_metal_purities_per_tone ?? false),
                'metal_mix_mode' => $product->metal_mix_mode ?? [],
                'diamond_mixing_mode' => $product->diamond_mixing_mode ?? 'shared',
                'category_sizes' => $product->category && $product->category->sizes->isNotEmpty()
                    ? $product->category->sizes->where('is_active', true)->map(fn($size) => [
                        'id' => $size->id,
                        'name' => $size->name,
                        'code' => $size->code,
                    ])->values()->all()
                    : [],
                'media' => $product->media->map(fn($media) => [
                    'url' => $media->url,
                    'alt' => $media->metadata['alt'] ?? $product->name,
                ]),
                // Keep legacy variants structure for backward compatibility
                'variants' => $product->variants->map(fn($variant) => [
                    'id' => $variant->id,
                    'label' => $variant->label,
                    'price_adjustment' => $variant->price_adjustment,
                    'is_default' => $variant->is_default,
                    'metadata' => $variant->metadata ?? [],
                    'metals' => $variant->metals->map(fn($metal) => [
                        'id' => $metal->id,
                        'metal_id' => $metal->metal_id,
                        'metal_purity_id' => $metal->metal_purity_id,
                        'metal_tone_id' => $metal->metal_tone_id,
                        'metal_weight' => $metal->metal_weight ?? null,
                        'metal' => $metal->metal ? ['id' => $metal->metal->id, 'name' => $metal->metal->name] : null,
                        'metal_purity' => $metal->metalPurity ? ['id' => $metal->metalPurity->id, 'name' => $metal->metalPurity->name] : null,
                        'metal_tone' => $metal->metalTone ? ['id' => $metal->metalTone->id, 'name' => $metal->metalTone->name] : null,
                    ])->values()->all(),
                    'diamonds' => $variant->diamonds->map(function ($diamond) {
                        $diamondModel = $diamond->diamond;
                        return [
                            'id' => $diamond->id,
                            'diamond_id' => $diamond->diamond_id,
                            'diamonds_count' => $diamond->diamonds_count,
                            'diamond' => $diamondModel ? [
                                'id' => $diamondModel->id,
                                'name' => $diamondModel->name,
                                'diamond_clarity_id' => $diamondModel->diamond_clarity_id,
                                'diamond_color_id' => $diamondModel->diamond_color_id,
                                'diamond_shape_id' => $diamondModel->diamond_shape_id,
                                'diamond_clarity' => $diamondModel->clarity ? ['id' => $diamondModel->clarity->id, 'name' => $diamondModel->clarity->name] : null,
                                'diamond_color' => $diamondModel->color ? ['id' => $diamondModel->color->id, 'name' => $diamondModel->color->name] : null,
                                'diamond_shape' => $diamondModel->shape ? ['id' => $diamondModel->shape->id, 'name' => $diamondModel->shape->name] : null,
                            ] : null,
                        ];
                    })->values()->all(),
                    'colorstones' => $variant->colorstones->map(function ($colorstone) {
                        $colorstoneModel = $colorstone->colorstone;
                        return [
                            'id' => $colorstone->id,
                            'colorstone_id' => $colorstone->colorstone_id,
                            'stones_count' => $colorstone->stones_count,
                            'colorstone' => $colorstoneModel ? [
                                'id' => $colorstoneModel->id,
                                'name' => $colorstoneModel->name,
                                'colorstone_shape_id' => $colorstoneModel->colorstone_shape_id,
                                'colorstone_color_id' => $colorstoneModel->colorstone_color_id,
                                'colorstone_quality_id' => $colorstoneModel->colorstone_quality_id,
                                'colorstone_shape' => $colorstoneModel->shape ? ['id' => $colorstoneModel->shape->id, 'name' => $colorstoneModel->shape->name] : null,
                                'colorstone_color' => $colorstoneModel->color ? ['id' => $colorstoneModel->color->id, 'name' => $colorstoneModel->color->name] : null,
                                'colorstone_quality' => $colorstoneModel->quality ? ['id' => $colorstoneModel->quality->id, 'name' => $colorstoneModel->quality->name] : null,
                            ] : null,
                        ];
                    })->values()->all(),
                ]),
            ],
            // Configuration options - one option per variant
            'configurationOptions' => $configurationOptions,
        ]);
    }

    /**
     * Build configuration options - one option per variant with all metals and diamonds.
     */
    protected function buildConfigurationOptions(Product $product): array
    {
        $configOptions = [];

        // Debug: Check if variants are loaded
        if ($product->variants->isEmpty()) {
            // Product has no variants - return empty array
            return [];
        }

        foreach ($product->variants as $variant) {
            // Reload relationships if they're not loaded (safety check)
            if (!$variant->relationLoaded('metals')) {
                $variant->load(['metals.metal', 'metals.metalPurity', 'metals.metalTone']);
            }
            if (!$variant->relationLoaded('diamonds')) {
                $variant->load(['diamonds.diamond.shape', 'diamonds.diamond.color', 'diamonds.diamond.clarity']);
            }
            if (!$variant->relationLoaded('colorstones')) {
                $variant->load(['colorstones.colorstone.shape', 'colorstones.colorstone.color', 'colorstones.colorstone.quality']);
            }

            // Build metals array for this variant
            $metals = [];
            $metalParts = [];

            foreach ($variant->metals as $variantMetal) {
                // Reload relationships if needed
                if (!$variantMetal->relationLoaded('metal')) {
                    $variantMetal->load('metal');
                }
                if (!$variantMetal->relationLoaded('metalPurity')) {
                    $variantMetal->load('metalPurity');
                }
                if (!$variantMetal->relationLoaded('metalTone')) {
                    $variantMetal->load('metalTone');
                }

                $metal = $variantMetal->metal;
                $purity = $variantMetal->metalPurity;
                $tone = $variantMetal->metalTone;

                if ($metal && $purity && $tone) {
                    $weight = $variantMetal->metal_weight ?? null;

                    // Ensure weight is a float value in grams (no conversion needed)
                    $weightValue = $weight ? (float) $weight : null;
                    $weightStr = $weightValue ? number_format($weightValue, 2) . 'g' : '';

                    // Build label: "18K Yellow Gold 3.50g"
                    $metalLabel = trim(sprintf(
                        '%s %s %s %s',
                        $purity->name,
                        $tone->name,
                        $metal->name,
                        $weightStr
                    ));

                    $metals[] = [
                        'label' => $metalLabel,
                        'metalId' => $metal->id,
                        'metalPurityId' => $purity->id,
                        'metalToneId' => $tone->id,
                        'metalWeight' => $weightValue ? number_format($weightValue, 2, '.', '') : null,
                        // Include purity and tone names for building simplified labels in frontend
                        'purityName' => $purity->name,
                        'toneName' => $tone->name,
                        'metalName' => $metal->name,
                    ];

                    $metalParts[] = $metalLabel;
                }
            }

            // Build diamonds array for this variant
            $diamonds = [];
            $diamondParts = [];

            foreach ($variant->diamonds as $variantDiamond) {
                // Load diamond relationship
                if (!$variantDiamond->relationLoaded('diamond')) {
                    $variantDiamond->load('diamond.shape', 'diamond.color', 'diamond.clarity');
                }

                $diamondModel = $variantDiamond->diamond;
                if (!$diamondModel) {
                    continue;
                }

                $parts = [];

                // Shape
                if ($diamondModel->shape) {
                    $parts[] = $diamondModel->shape->name;
                }

                // Color
                if ($diamondModel->color) {
                    $parts[] = $diamondModel->color->name;
                }

                // Clarity
                if ($diamondModel->clarity) {
                    $parts[] = $diamondModel->clarity->name;
                }

                // Count
                $countStr = '';
                if ($variantDiamond->diamonds_count && $variantDiamond->diamonds_count > 1) {
                    $countStr = '(' . $variantDiamond->diamonds_count . ')';
                }

                // Build label: "Oval F VVS1 (2)" - using diamond name and count
                $diamondLabel = trim(($diamondModel->name ?? implode(' ', $parts)) . ' ' . $countStr);

                $diamonds[] = [
                    'label' => $diamondLabel,
                    'diamondShapeId' => $diamondModel->diamond_shape_id ?? 0,
                    'diamondColorId' => $diamondModel->diamond_color_id ?? 0,
                    'diamondClarityId' => $diamondModel->diamond_clarity_id ?? 0,
                    'stoneCount' => $variantDiamond->diamonds_count ?? 0,
                    'totalCarat' => '0', // No longer stored
                ];

                $diamondParts[] = $diamondLabel;
            }

            // Build colorstones array for this variant
            $colorstones = [];
            $colorstoneParts = [];

            foreach ($variant->colorstones as $variantColorstone) {
                // Load colorstone relationship
                if (!$variantColorstone->relationLoaded('colorstone')) {
                    $variantColorstone->load('colorstone.shape', 'colorstone.color', 'colorstone.quality');
                }

                $colorstoneModel = $variantColorstone->colorstone;
                if (!$colorstoneModel) {
                    continue;
                }

                $parts = [];

                // Shape
                if ($colorstoneModel->shape) {
                    $parts[] = $colorstoneModel->shape->name;
                }

                // Color
                if ($colorstoneModel->color) {
                    $parts[] = $colorstoneModel->color->name;
                }

                // Quality
                if ($colorstoneModel->quality) {
                    $parts[] = $colorstoneModel->quality->name;
                }

                // Count
                $countStr = '';
                if ($variantColorstone->stones_count && $variantColorstone->stones_count > 1) {
                    $countStr = '(' . $variantColorstone->stones_count . ')';
                }

                // Build label: "Ruby Red Oval AAA (2)" - using colorstone name and count
                $colorstoneLabel = trim(($colorstoneModel->name ?? implode(' ', $parts)) . ' ' . $countStr);

                $colorstones[] = [
                    'label' => $colorstoneLabel,
                    'colorstoneShapeId' => $colorstoneModel->colorstone_shape_id ?? 0,
                    'colorstoneColorId' => $colorstoneModel->colorstone_color_id ?? 0,
                    'colorstoneQualityId' => $colorstoneModel->colorstone_quality_id ?? 0,
                    'stoneCount' => $variantColorstone->stones_count ?? 0,
                    'totalCarat' => '0', // No longer stored
                    // Include attribute names for frontend display
                    'shapeName' => $colorstoneModel->shape ? $colorstoneModel->shape->name : null,
                    'colorName' => $colorstoneModel->color ? $colorstoneModel->color->name : null,
                    'qualityName' => $colorstoneModel->quality ? $colorstoneModel->quality->name : null,
                ];

                $colorstoneParts[] = $colorstoneLabel;
            }

            // Build combined labels
            $metalLabel = !empty($metalParts) ? implode(' + ', $metalParts) : '';
            $diamondLabel = !empty($diamondParts) ? implode(' + ', $diamondParts) : '';
            $colorstoneLabel = !empty($colorstoneParts) ? implode(' + ', $colorstoneParts) : '';

            // Full configuration label
            $configLabel = '';
            $labelParts = array_filter([$metalLabel, $diamondLabel, $colorstoneLabel]);
            if (!empty($labelParts)) {
                $configLabel = implode(' | ', $labelParts);
            } else {
                $configLabel = $variant->label ?? 'Configuration ' . $variant->id;
            }

            // Calculate metal cost based on weight × rate
            $metalCost = 0;
            foreach ($variant->metals as $variantMetal) {
                $metal = $variantMetal->metal;
                $purity = $variantMetal->metalPurity;
                $weight = $variantMetal->metal_weight ?? null;

                if ($metal && $purity && $weight) {
                    // Get metal name (gold, silver, platinum) - normalize to lowercase
                    $metalName = strtolower(trim($metal->name ?? ''));

                    // Get purity name (18K, 22K, 925, etc.)
                    $purityName = trim($purity->name ?? '');

                    // Find the price rate for this metal and purity (get most recent effective rate)
                    $priceRate = PriceRate::where('metal', $metalName)
                        ->where('purity', $purityName)
                        ->orderBy('effective_at', 'desc')
                        ->first();

                    if ($priceRate && $priceRate->price_per_gram) {
                        // Calculate: weight (grams) × price_per_gram
                        $metalCost += (float) $weight * (float) $priceRate->price_per_gram;
                    }
                }
            }

            // Round metal cost to 2 decimal places
            $metalCost = round($metalCost, 2);

            // Calculate diamond cost from variant diamonds
            // Price in diamonds table is per stone, so multiply by count
            $diamondCost = 0;
            foreach ($variant->diamonds as $variantDiamond) {
                $diamond = $variantDiamond->diamond;
                $count = (int) ($variantDiamond->diamonds_count ?? 1);

                if ($diamond && $diamond->price) {
                    // Price is per stone, so multiply by count
                    $diamondCost += (float) $diamond->price * $count;
                }
            }
            $diamondCost = round($diamondCost, 2);

            // Calculate colorstone cost from variant colorstones
            // Price in colorstones table is per stone, so multiply by count
            $colorstoneCost = 0;
            foreach ($variant->colorstones as $variantColorstone) {
                $colorstone = $variantColorstone->colorstone;
                $count = (int) ($variantColorstone->stones_count ?? 1);

                if ($colorstone && $colorstone->price) {
                    // Price is per stone, so multiply by count
                    $colorstoneCost += (float) $colorstone->price * $count;
                }
            }
            $colorstoneCost = round($colorstoneCost, 2);

            // Calculate making charge using PricingService
            $priceBreakdown = $this->pricingService->calculateProductPrice(
                $product,
                auth()->user(),
                ['variant' => $variant]
            );
            
            $basePrice = (float) ($product->base_price ?? 0);
            $makingCharge = (float) $priceBreakdown->get('making', 0);
            $priceAdjustment = (float) ($variant->price_adjustment ?? 0);
            // Total price: Metal + Diamond + Colorstone + Making Charge + Adjustment (Base Price is NOT included)
            $priceTotal = $metalCost + $diamondCost + $colorstoneCost + $makingCharge;

            // Always create a configuration option, even if metals/diamonds/colorstones are empty
            // This ensures the frontend always has at least one option to select
            $configOptions[] = [
                'variant_id' => $variant->id,
                'label' => $configLabel ?: ($variant->label ?? 'Configuration ' . $variant->id),
                'metal_label' => $metalLabel,
                'diamond_label' => $diamondLabel,
                'colorstone_label' => $colorstoneLabel,
                'metals' => $metals, // Can be empty array
                'diamonds' => $diamonds, // Can be empty array
                'colorstones' => $colorstones, // Can be empty array
                'price_total' => $priceTotal,
                'price_breakup' => [
                    'base' => $basePrice,
                    'metal' => $metalCost,
                    'diamond' => $diamondCost,
                    'colorstone' => $colorstoneCost,
                    'making' => $makingCharge,
                    'adjustment' => $priceAdjustment,
                ],
                'sku' => $variant->sku ?? $product->sku,
                'inventory_quantity' => $variant->inventory_quantity ?? 0,
            ];
        }

        // If no configuration options were created but variants exist, create at least one
        if (empty($configOptions) && $product->variants->isNotEmpty()) {
            $firstVariant = $product->variants->first();
            $configOptions[] = [
                'variant_id' => $firstVariant->id,
                'label' => $firstVariant->label ?? 'Default Configuration',
                'metal_label' => '',
                'diamond_label' => '',
                'colorstone_label' => '',
                'metals' => [],
                'diamonds' => [],
                'colorstones' => [],
                'price_total' => (float) ($product->making_charge ?? 0),
                'price_breakup' => [
                    'base' => (float) ($product->base_price ?? 0),
                    'metal' => 0,
                    'diamond' => 0,
                    'colorstone' => 0,
                    'making' => (float) ($product->making_charge ?? 0),
                    'adjustment' => 0,
                ],
                'sku' => $firstVariant->sku ?? $product->sku,
                'inventory_quantity' => $firstVariant->inventory_quantity ?? 0,
            ];
        }

        return $configOptions;
    }

    /**
     * Build metal options based on metal_mix_mode.
     * @deprecated This method is no longer used - replaced by buildConfigurationOptions
     */
    protected function buildMetalOptions(Product $product, string $metalMixMode): array
    {
        $allVariantMetals = collect();

        // Collect all variant metals
        foreach ($product->variants as $variant) {
            foreach ($variant->metals as $variantMetal) {
                if (!$variantMetal->metal_id || !$variantMetal->metal_purity_id || !$variantMetal->metal_tone_id) {
                    continue;
                }

                $allVariantMetals->push([
                    'id' => $variantMetal->id,
                    'metal_id' => $variantMetal->metal_id,
                    'metal_purity_id' => $variantMetal->metal_purity_id,
                    'metal_tone_id' => $variantMetal->metal_tone_id,
                    'metal' => $variantMetal->metal,
                    'metalPurity' => $variantMetal->metalPurity,
                    'metalTone' => $variantMetal->metalTone,
                ]);
            }
        }

        if ($allVariantMetals->isEmpty()) {
            return [];
        }

        $optionsMap = [];
        $optionIdCounter = 1;

        if ($metalMixMode === 'separate_variants') {
            // Group by (metal_id, metal_purity_id, metal_tone_id)
            foreach ($allVariantMetals as $variantMetal) {
                $key = sprintf(
                    '%d_%d_%d',
                    $variantMetal['metal_id'],
                    $variantMetal['metal_purity_id'],
                    $variantMetal['metal_tone_id']
                );

                if (!isset($optionsMap[$key])) {
                    $metal = $variantMetal['metal'];
                    $purity = $variantMetal['metalPurity'];
                    $tone = $variantMetal['metalTone'];

                    if ($metal && $purity && $tone) {
                        $label = sprintf('%s %s %s', $purity->name, $tone->name, $metal->name);

                        $optionsMap[$key] = [
                            'id' => $optionIdCounter++,
                            'label' => $label,
                            'metal_ids' => [$variantMetal['metal_id']],
                            'metal_purity_ids' => [$variantMetal['metal_purity_id']],
                            'metal_tone_ids' => [$variantMetal['metal_tone_id']],
                            'metal_variant_ids' => [$variantMetal['id']],
                        ];
                    }
                } else {
                    // Add this variant metal ID to the existing option
                    if (!in_array($variantMetal['id'], $optionsMap[$key]['metal_variant_ids'])) {
                        $optionsMap[$key]['metal_variant_ids'][] = $variantMetal['id'];
                    }
                }
            }
        } elseif ($metalMixMode === 'combine_tones_per_purity') {
            // Group by (metal_id, metal_purity_id), combine tones
            foreach ($allVariantMetals as $variantMetal) {
                $key = sprintf('%d_%d', $variantMetal['metal_id'], $variantMetal['metal_purity_id']);

                if (!isset($optionsMap[$key])) {
                    $metal = $variantMetal['metal'];
                    $purity = $variantMetal['metalPurity'];

                    if ($metal && $purity) {
                        // Collect all tones for this metal+purity combination
                        $toneIds = [];
                        $toneNames = [];

                        foreach ($allVariantMetals as $vm) {
                            if (
                                $vm['metal_id'] === $variantMetal['metal_id'] &&
                                $vm['metal_purity_id'] === $variantMetal['metal_purity_id']
                            ) {
                                if ($vm['metalTone']) {
                                    $toneIds[] = $vm['metal_tone_id'];
                                    $toneNames[] = $vm['metalTone']->name;
                                }
                            }
                        }

                        $toneIds = array_unique($toneIds);
                        $toneNames = array_unique($toneNames);
                        sort($toneNames);

                        $toneLabel = count($toneNames) > 1
                            ? '(' . implode(' / ', $toneNames) . ')'
                            : (count($toneNames) === 1 ? $toneNames[0] : '');

                        $label = sprintf('%s %s %s', $purity->name, $toneLabel, $metal->name);
                        $label = trim(str_replace('  ', ' ', $label));

                        // Collect all metal_variant_ids for this group
                        $metalVariantIds = [];
                        foreach ($allVariantMetals as $vm) {
                            if (
                                $vm['metal_id'] === $variantMetal['metal_id'] &&
                                $vm['metal_purity_id'] === $variantMetal['metal_purity_id']
                            ) {
                                $metalVariantIds[] = $vm['id'];
                            }
                        }

                        $optionsMap[$key] = [
                            'id' => $optionIdCounter++,
                            'label' => $label,
                            'metal_ids' => [$variantMetal['metal_id']],
                            'metal_purity_ids' => [$variantMetal['metal_purity_id']],
                            'metal_tone_ids' => array_values($toneIds),
                            'metal_variant_ids' => array_values(array_unique($metalVariantIds)),
                        ];
                    }
                }
            }
        } elseif ($metalMixMode === 'combine_purities_per_tone') {
            // Group by (metal_id, metal_tone_id), combine purities
            foreach ($allVariantMetals as $variantMetal) {
                $key = sprintf('%d_%d', $variantMetal['metal_id'], $variantMetal['metal_tone_id']);

                if (!isset($optionsMap[$key])) {
                    $metal = $variantMetal['metal'];
                    $tone = $variantMetal['metalTone'];

                    if ($metal && $tone) {
                        // Collect all purities for this metal+tone combination
                        $purityIds = [];
                        $purityNames = [];

                        foreach ($allVariantMetals as $vm) {
                            if (
                                $vm['metal_id'] === $variantMetal['metal_id'] &&
                                $vm['metal_tone_id'] === $variantMetal['metal_tone_id']
                            ) {
                                if ($vm['metalPurity']) {
                                    $purityIds[] = $vm['metal_purity_id'];
                                    $purityNames[] = $vm['metalPurity']->name;
                                }
                            }
                        }

                        $purityIds = array_unique($purityIds);
                        $purityNames = array_unique($purityNames);
                        sort($purityNames);

                        $purityLabel = count($purityNames) > 1
                            ? '(' . implode(' / ', $purityNames) . ')'
                            : (count($purityNames) === 1 ? $purityNames[0] : '');

                        $label = sprintf('%s %s %s', $purityLabel, $tone->name, $metal->name);
                        $label = trim(str_replace('  ', ' ', $label));

                        // Collect all metal_variant_ids for this group
                        $metalVariantIds = [];
                        foreach ($allVariantMetals as $vm) {
                            if (
                                $vm['metal_id'] === $variantMetal['metal_id'] &&
                                $vm['metal_tone_id'] === $variantMetal['metal_tone_id']
                            ) {
                                $metalVariantIds[] = $vm['id'];
                            }
                        }

                        $optionsMap[$key] = [
                            'id' => $optionIdCounter++,
                            'label' => $label,
                            'metal_ids' => [$variantMetal['metal_id']],
                            'metal_purity_ids' => array_values($purityIds),
                            'metal_tone_ids' => [$variantMetal['metal_tone_id']],
                            'metal_variant_ids' => array_values(array_unique($metalVariantIds)),
                        ];
                    }
                }
            }
        }

        return array_values($optionsMap);
    }

    /**
     * Build diamond options based on diamond_mixing_mode.
     */
    protected function buildDiamondOptions(Product $product, string $diamondMixingMode): array
    {
        if (!$product->uses_diamond) {
            return [];
        }

        $allVariantDiamonds = collect();

        // Collect all variant diamonds
        foreach ($product->variants as $variant) {
            foreach ($variant->diamonds as $variantDiamond) {
                $diamondModel = $variantDiamond->diamond;
                if (!$variantDiamond->relationLoaded('diamond')) {
                    $variantDiamond->load('diamond.shape', 'diamond.color', 'diamond.clarity');
                }
                $diamondModel = $variantDiamond->diamond;

                $allVariantDiamonds->push([
                    'id' => $variantDiamond->id,
                    'variant_id' => $variant->id,
                    'diamond_id' => $variantDiamond->diamond_id,
                    'diamond_shape_id' => $diamondModel?->diamond_shape_id,
                    'diamond_clarity_id' => $diamondModel?->diamond_clarity_id,
                    'diamond_color_id' => $diamondModel?->diamond_color_id,
                    'diamonds_count' => $variantDiamond->diamonds_count,
                    'diamondShape' => $diamondModel?->shape,
                    'diamondClarity' => $diamondModel?->clarity,
                    'diamondColor' => $diamondModel?->color,
                ]);
            }
        }

        if ($allVariantDiamonds->isEmpty()) {
            return [];
        }

        $optionsMap = [];
        $optionIdCounter = 1;

        // Group by (diamond_shape_id, diamond_clarity_id, diamond_color_id, total_carat, diamonds_count)
        foreach ($allVariantDiamonds as $variantDiamond) {
            $key = sprintf(
                '%d_%d_%d_%s_%d',
                $variantDiamond['diamond_shape_id'] ?? 0,
                $variantDiamond['diamond_clarity_id'] ?? 0,
                $variantDiamond['diamond_color_id'] ?? 0,
                $variantDiamond['total_carat'] ?? '0',
                $variantDiamond['diamonds_count'] ?? 0
            );

            if (!isset($optionsMap[$key])) {
                $parts = [];

                if ($variantDiamond['diamondShape']) {
                    $parts[] = $variantDiamond['diamondShape']->name;
                }
                if ($variantDiamond['diamondClarity']) {
                    $parts[] = $variantDiamond['diamondClarity']->name;
                }
                if ($variantDiamond['diamondColor']) {
                    $parts[] = $variantDiamond['diamondColor']->name;
                }

                $label = !empty($parts) ? implode(' – ', $parts) : 'Diamond';

                // Add carat info if available
                if ($variantDiamond['total_carat']) {
                    $label .= ' (' . number_format((float) $variantDiamond['total_carat'], 2) . 'ct';
                    if ($variantDiamond['diamonds_count'] && $variantDiamond['diamonds_count'] > 1) {
                        $label .= ' × ' . $variantDiamond['diamonds_count'];
                    }
                    $label .= ')';
                }

                // Collect all diamond_variant_ids for this group
                $diamondVariantIds = [];
                foreach ($allVariantDiamonds as $vd) {
                    if (
                        $vd['diamond_shape_id'] === $variantDiamond['diamond_shape_id'] &&
                        $vd['diamond_clarity_id'] === $variantDiamond['diamond_clarity_id'] &&
                        $vd['diamond_color_id'] === $variantDiamond['diamond_color_id'] &&
                        $vd['total_carat'] == $variantDiamond['total_carat'] &&
                        $vd['diamonds_count'] == $variantDiamond['diamonds_count']
                    ) {
                        $diamondVariantIds[] = $vd['id'];
                    }
                }

                $optionsMap[$key] = [
                    'id' => $optionIdCounter++,
                    'label' => $label,
                    'diamond_shape_ids' => $variantDiamond['diamond_shape_id'] ? [$variantDiamond['diamond_shape_id']] : [],
                    'diamond_clarity_ids' => $variantDiamond['diamond_clarity_id'] ? [$variantDiamond['diamond_clarity_id']] : [],
                    'diamond_color_ids' => $variantDiamond['diamond_color_id'] ? [$variantDiamond['diamond_color_id']] : [],
                    'total_carat' => $variantDiamond['total_carat'] ? (string) number_format((float) $variantDiamond['total_carat'], 2) : null,
                    'stone_count' => $variantDiamond['diamonds_count'],
                    'diamond_variant_ids' => array_values(array_unique($diamondVariantIds)),
                ];
            } else {
                // Add this diamond variant ID to existing option
                if (!in_array($variantDiamond['id'], $optionsMap[$key]['diamond_variant_ids'])) {
                    $optionsMap[$key]['diamond_variant_ids'][] = $variantDiamond['id'];
                }
            }
        }

        return array_values($optionsMap);
    }

    /**
     * Build variant map with pricing information.
     * Each variant can have MULTIPLE metals and MULTIPLE diamonds.
     */
    protected function buildVariantMap(Product $product): array
    {
        $variantMap = [];

        foreach ($product->variants as $variant) {
            // Collect ALL metals for this variant (array of product_variant_metals.id)
            $metalVariantIds = $variant->metals->pluck('id')->all();

            // Collect ALL diamonds for this variant (array of product_variant_diamonds.id)
            $diamondVariantIds = $variant->diamonds->pluck('id')->all();

            // Calculate price breakdown
            $basePrice = (float) ($product->base_price ?? 0);
            $makingCharge = (float) ($product->making_charge ?? 0);
            $priceAdjustment = (float) ($variant->price_adjustment ?? 0);
            $priceTotal = $basePrice + $makingCharge + $priceAdjustment;

            // For now, estimate metal and diamond costs (would be calculated from rates in production)
            $metalCost = 0;
            $diamondCost = 0;

            // Include variant if it has at least metals OR diamonds (or both)
            // Products without metals/diamonds are edge cases
            if (!empty($metalVariantIds) || !empty($diamondVariantIds) || (!$product->uses_gold && !$product->uses_silver && !$product->uses_diamond)) {
                $variantMap[] = [
                    'variant_id' => $variant->id,
                    'metal_variant_ids' => $metalVariantIds,      // Array of ALL metals
                    'diamond_variant_ids' => $diamondVariantIds, // Array of ALL diamonds
                    'price_total' => $priceTotal,
                    'price_breakup' => [
                        'base' => $basePrice,
                        'metal' => $metalCost,
                        'diamond' => $diamondCost,
                        'making' => $makingCharge,
                        'adjustment' => $priceAdjustment,
                    ],
                    'sku' => $variant->sku ?? $product->sku,
                    'label' => $variant->label,
                ];
            }
        }

        return $variantMap;
    }

}
