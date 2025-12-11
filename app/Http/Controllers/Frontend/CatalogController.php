<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Catalog;
use App\Models\Category;
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
        $filters = $request->only([
            'brand',
            'metal',
            'metal_purity',
            'metal_tone',
            'diamond',
            'price_min',
            'price_max',
            'search',
            'category',
            'catalog',
            'sort',
            'ready_made',
        ]);

        $query = Product::query()
            ->with([
                'category',
                'media' => fn($media) => $media->orderBy('display_order'),
                'variants' => function ($variants) {
                    $variants->orderByAsc('id')
                        ->with(['metals.metal', 'metals.metalPurity', 'metals.metalTone']);
                },
            ]);


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
        $filters['category'] = array_values($categoryFilters);
        $filters['catalog'] = array_values($catalogFilters);
        $filters['sort'] = $sort ?: null;
        $filters['ready_made'] = ($filters['ready_made'] ?? null) === '1' ? '1' : null;

        if ($filters['search'] ?? null) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('sku', 'like', '%' . $filters['search'] . '%');
            });
        }

        $priceMin = $filters['price_min'] ?? null;
        $priceMax = $filters['price_max'] ?? null;

        $sort = in_array($sort, ['newest', 'price_asc', 'price_desc', 'name_asc'], true) ? $sort : null;

        // Calculate price_total for filtering - we need to do this after fetching products
        // because price_total depends on variant metals/diamonds and current rates
        $products = $query
            ->with([
                'variants.metals.metal',
                'variants.metals.metalPurity',
                'variants.metals.metalTone',
                'variants.diamonds.diamond',
            ])
            ->when($sort === 'name_asc', fn($builder) => $builder->orderBy('name'))
            ->when(! $sort || $sort === 'newest', fn($builder) => $builder->latest())
            ->get()
            ->map(function (Product $product) {
                // Calculate priceTotal for the default variant (or first variant if no default)
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

                    // Calculate making charge based on configured types (fixed, percentage, or both)
                    $makingCharge = $product->calculateMakingCharge($metalCost);

                    // Calculate priceTotal: Metal + Diamond + Making Charge
                    $priceTotal = $metalCost + $diamondCost + $makingCharge;
                } else {
                    // If no variant, fallback to making charge only (with no metal cost)
                    // Note: For percentage-only making charge, this will be 0 if no metal cost
                    $priceTotal = $product->calculateMakingCharge(0);
                }

                // Ensure price_total is always a valid number
                $priceTotal = max(0, (float) $priceTotal);

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'category' => optional($product->category)?->name,
                    'material' => optional($product->material)?->name,
                    'purity' => $product->metadata['purity'] ?? $product->material?->purity,
                    'price_total' => $priceTotal,
                    'making_charge_amount' => (float) $product->making_charge_amount,
                    'thumbnail' => optional($product->media->sortBy('display_order')->first())?->url,
                    'media' => $product->media->sortBy('display_order')->values()->map(fn($media) => [
                        'url' => $media->url,
                        'alt' => $media->metadata['alt'] ?? $product->name,
                    ]),
                    'uses_gold' => (bool) $product->uses_gold,
                    'uses_silver' => (bool) $product->uses_silver,
                    'uses_diamond' => (bool) $product->uses_diamond,
                    'variants' => $product->variants->map(fn($variant) => [
                        'id' => $variant->id,
                        'label' => $variant->label,
                        'is_default' => $variant->is_default,
                        'metadata' => $variant->metadata ?? [],
                    ]),
                ];
            });

        // Apply price filter after calculating price_total
        if ($priceMin !== null || $priceMax !== null) {
            $products = $products->filter(function ($product) use ($priceMin, $priceMax) {
                $priceTotal = $product['price_total'] ?? 0;

                if ($priceMin !== null && $priceTotal < (float) $priceMin) {
                    return false;
                }

                if ($priceMax !== null && $priceTotal > (float) $priceMax) {
                    return false;
                }

                return true;
            });
        }

        // Apply sorting by price if needed
        if ($sort === 'price_asc') {
            $products = $products->sortBy('price_total');
        } elseif ($sort === 'price_desc') {
            $products = $products->sortByDesc('price_total');
        }

        // Reset collection keys for proper pagination
        $products = $products->values();

        // Manual pagination
        $page = (int) $request->input('page', 1);
        $perPage = 12;
        $total = $products->count();
        $items = $products->forPage($page, $perPage)->values()->all();
        $products = new \Illuminate\Pagination\LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

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
            'filters' => $filters,
            'products' => $products,
            'facets' => $facets,
        ]);
    }

    public function show(Product $product): Response
    {
        $product->load([
            'brand',
            'category.sizes',
            'media' => fn($media) => $media->orderBy('display_order'),
            'variants' => function ($variants) {
                $variants->orderByDesc('is_default')
                    ->with([
                        'metals.metal',
                        'metals.metalPurity',
                        'metals.metalTone',
                        'diamonds.diamond.clarity',
                        'diamonds.diamond.color',
                        'diamonds.diamond.shape',
                        'size',
                    ]);
            },
        ]);

        // Build configuration options - one option per variant with all metals and diamonds
        $configurationOptions = $this->buildConfigurationOptions($product);

        return Inertia::render('Frontend/Catalog/Show', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'description' => $product->description,
                'brand' => optional($product->brand)?->name,
                'material' => optional($product->material)?->name,
                'purity' => $product->metadata['purity'] ?? $product->material?->purity,
                'base_price' => (float) $product->base_price,
                'making_charge_amount' => (float) $product->making_charge_amount,
                'making_charge_percentage' => $product->making_charge_percentage ? (float) $product->making_charge_percentage : null,
                'uses_gold' => (bool) $product->uses_gold,
                'uses_silver' => (bool) $product->uses_silver,
                'uses_diamond' => (bool) $product->uses_diamond,
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
            if (!$variant->relationLoaded('size')) {
                $variant->load('size');
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

            // Build combined labels
            $metalLabel = !empty($metalParts) ? implode(' + ', $metalParts) : '';
            $diamondLabel = !empty($diamondParts) ? implode(' + ', $diamondParts) : '';

            // Full configuration label
            $configLabel = '';
            $labelParts = array_filter([$metalLabel, $diamondLabel]);
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

            // Calculate pricing
            $basePrice = (float) ($product->base_price ?? 0);
            // Calculate making charge based on configured types (fixed, percentage, or both)
            $makingCharge = $product->calculateMakingCharge($metalCost);
            // Total price: Metal + Diamond + Making Charge (Base Price is NOT included)
            $priceTotal = $metalCost + $diamondCost + $makingCharge;
            // Always create a configuration option, even if metals/diamonds are empty
            // This ensures the frontend always has at least one option to select
            $configOptions[] = [
                'variant_id' => $variant->id,
                'label' => $configLabel ?: ($variant->label ?? 'Configuration ' . $variant->id),
                'metal_label' => $metalLabel,
                'diamond_label' => $diamondLabel,
                'metals' => $metals, // Can be empty array
                'diamonds' => $diamonds, // Can be empty array
                'size_id' => $variant->size_id,
                'size' => $variant->size ? [
                    'id' => $variant->size->id,
                    'name' => $variant->size->name,
                    'value' => $variant->size->value ?? $variant->size->name,
                ] : null,
                'price_total' => $priceTotal,
                'price_breakup' => [
                    'base' => $basePrice,
                    'metal' => $metalCost,
                    'diamond' => $diamondCost,
                    'making' => $makingCharge,
                ],
                'sku' => $variant->sku ?? $product->sku,
                'inventory_quantity' => $variant->inventory_quantity ?? 0,
            ];
        }

        // If no configuration options were created but variants exist, create at least one
        if (empty($configOptions) && $product->variants->isNotEmpty()) {
            $firstVariant = $product->variants->first();
            // Ensure size relationship is loaded
            if (!$firstVariant->relationLoaded('size')) {
                $firstVariant->load('size');
            }
            $configOptions[] = [
                'variant_id' => $firstVariant->id,
                'label' => $firstVariant->label ?? 'Default Configuration',
                'metal_label' => '',
                'diamond_label' => '',
                'metals' => [],
                'diamonds' => [],
                'size_id' => $firstVariant->size_id,
                'size' => $firstVariant->size ? [
                    'id' => $firstVariant->size->id,
                    'name' => $firstVariant->size->name,
                    'value' => $firstVariant->size->value ?? $firstVariant->size->name,
                ] : null,
                'price_total' => $product->calculateMakingCharge(0),
                'price_breakup' => [
                    'base' => (float) ($product->base_price ?? 0),
                    'metal' => 0,
                    'diamond' => 0,
                    'making' => $product->calculateMakingCharge(0),
                ],
                'sku' => $firstVariant->sku ?? $product->sku,
                'inventory_quantity' => $firstVariant->inventory_quantity ?? 0,
            ];
        }

        return $configOptions;
    }


    /**
     * Build diamond options from variant diamonds.
     */
    protected function buildDiamondOptions(Product $product): array
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
            $priceTotal = $basePrice + $makingCharge;

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
                    ],
                    'sku' => $variant->sku ?? $product->sku,
                    'label' => $variant->label,
                ];
            }
        }

        return $variantMap;
    }
}
