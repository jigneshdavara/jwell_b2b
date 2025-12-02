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
use App\Models\Metal;
use App\Models\MetalPurity;
use App\Models\MetalTone;
use App\Models\PriceRate;
use App\Models\Product;
use App\Models\ProductCatalog;
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
            'jobwork_available',
            'ready_made',
        ]);

        $query = Product::query()
            ->with([
                'brand',
                'category',
                'material',
                'catalogs:id,name,slug',
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

        $brandFilters = array_filter((array) ($filters['brand'] ?? []), fn($value) => filled($value));
        if (! empty($brandFilters)) {
            $query->whereHas('brand', fn($q) => $q->whereIn('name', $brandFilters));
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
                        $innerQuery->orWhereIn('slug', $slugsOrNames)
                            ->orWhereIn('name', $slugsOrNames);
                    }
                });
            });
        }
        $sort = $request->string('sort')->value();

        $filters['brand'] = array_values($brandFilters);
        $filters['metal'] = array_values(array_filter((array) ($filters['metal'] ?? []), fn($value) => filled($value)));
        $filters['metal_purity'] = array_values(array_filter((array) ($filters['metal_purity'] ?? []), fn($value) => filled($value)));
        $filters['metal_tone'] = array_values(array_filter((array) ($filters['metal_tone'] ?? []), fn($value) => filled($value)));
        $filters['diamond'] = array_values($diamondFilters);
        $filters['category'] = array_values($categoryFilters);
        $filters['sort'] = $sort ?: null;
        $filters['jobwork_available'] = ($filters['jobwork_available'] ?? null) === '1' ? '1' : null;
        $filters['ready_made'] = ($filters['ready_made'] ?? null) === '1' ? '1' : null;

        if ($filters['catalog'] ?? null) {
            $catalogFilter = $filters['catalog'];
            $catalogQuery = ProductCatalog::query()->where('slug', $catalogFilter);

            // Only add id comparison if the filter value is numeric
            if (is_numeric($catalogFilter)) {
                $catalogQuery->orWhere('id', (int) $catalogFilter);
            }

            $catalog = $catalogQuery->first();

            if ($catalog) {
                $query->whereHas('catalogs', fn($catalogQuery) => $catalogQuery->where('product_catalogs.id', $catalog->id));
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
            ->with([
                'variants.metals.metal',
                'variants.metals.metalPurity',
                'variants.metals.metalTone',
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
                    'category' => optional($product->category)?->name,
                    'material' => optional($product->material)?->name,
                    'purity' => $product->metadata['purity'] ?? $product->material?->purity,
                    'gold_weight' => $product->gold_weight !== null ? (float) $product->gold_weight : null,
                    'silver_weight' => $product->silver_weight !== null ? (float) $product->silver_weight : null,
                    'other_material_weight' => $product->other_material_weight !== null ? (float) $product->other_material_weight : null,
                    'total_weight' => $product->total_weight !== null ? (float) $product->total_weight : null,
                    'price_total' => $priceTotal,
                    'making_charge' => (float) $product->making_charge,
                    'is_jobwork_allowed' => (bool) $product->is_jobwork_allowed,
                    'thumbnail' => optional($product->media->sortBy('position')->first())?->url,
                    'media' => $product->media->sortBy('position')->values()->map(fn($media) => [
                        'url' => $media->url,
                        'alt' => $media->metadata['alt'] ?? $product->name,
                    ]),
                    'uses_gold' => (bool) $product->uses_gold,
                    'uses_silver' => (bool) $product->uses_silver,
                    'uses_diamond' => (bool) $product->uses_diamond,
                    'catalogs' => $product->catalogs->map(fn(ProductCatalog $catalog) => [
                        'id' => $catalog->id,
                        'name' => $catalog->name,
                        'slug' => $catalog->slug,
                    ]),
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
            'brands' => Brand::orderBy('name')->pluck('name'),
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn(Category $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                ]),
            'catalogs' => ProductCatalog::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'slug'])
                ->map(fn(ProductCatalog $catalog) => [
                    'id' => $catalog->id,
                    'name' => $catalog->name,
                    'slug' => $catalog->slug,
                ]),
            'metals' => Metal::query()
                ->where('is_active', true)
                ->orderBy('position')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn(Metal $metal) => [
                    'id' => $metal->id,
                    'name' => $metal->name,
                ]),
            'metalPurities' => MetalPurity::query()
                ->where('is_active', true)
                ->with('metal:id,name')
                ->orderBy('position')
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
                ->orderBy('position')
                ->orderBy('name')
                ->get()
                ->map(fn(MetalTone $tone) => [
                    'id' => $tone->id,
                    'name' => $tone->name,
                    'metal_id' => $tone->metal_id,
                    'metal' => $tone->metal ? ['id' => $tone->metal->id, 'name' => $tone->metal->name] : null,
                ]),
            'diamondOptions' => [
                'types' => DiamondType::orderBy('name')->get(['id', 'name'])->map(fn(DiamondType $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                ]),
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
                'cuts' => DiamondCut::orderBy('name')->get(['id', 'name'])->map(fn(DiamondCut $cut) => [
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
            'media' => fn($media) => $media->orderBy('position'),
            'variants' => function ($variants) {
                $variants->orderByDesc('is_default')
                    ->with([
                        'metals.metal',
                        'metals.metalPurity',
                        'metals.metalTone',
                        'diamonds.diamondType',
                        'diamonds.diamondClarity',
                        'diamonds.diamondColor',
                        'diamonds.diamondShape',
                        'diamonds.diamondCut',
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
                'making_charge' => (float) $product->making_charge,
                'is_jobwork_allowed' => (bool) $product->is_jobwork_allowed,
                'uses_gold' => (bool) $product->uses_gold,
                'uses_silver' => (bool) $product->uses_silver,
                'uses_diamond' => (bool) $product->uses_diamond,
                'mixed_metal_tones_per_purity' => (bool) ($product->mixed_metal_tones_per_purity ?? false),
                'mixed_metal_purities_per_tone' => (bool) ($product->mixed_metal_purities_per_tone ?? false),
                'metal_mix_mode' => $product->metal_mix_mode ?? [],
                'diamond_mixing_mode' => $product->diamond_mixing_mode ?? 'shared',
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
                        'weight_grams' => $metal->weight_grams,
                        'metal' => $metal->metal ? ['id' => $metal->metal->id, 'name' => $metal->metal->name] : null,
                        'metal_purity' => $metal->metalPurity ? ['id' => $metal->metalPurity->id, 'name' => $metal->metalPurity->name] : null,
                        'metal_tone' => $metal->metalTone ? ['id' => $metal->metalTone->id, 'name' => $metal->metalTone->name] : null,
                    ])->values()->all(),
                    'diamonds' => $variant->diamonds->map(fn($diamond) => [
                        'id' => $diamond->id,
                        'diamond_type_id' => $diamond->diamond_type_id,
                        'diamond_clarity_id' => $diamond->diamond_clarity_id,
                        'diamond_color_id' => $diamond->diamond_color_id,
                        'diamond_shape_id' => $diamond->diamond_shape_id,
                        'diamond_cut_id' => $diamond->diamond_cut_id,
                        'diamonds_count' => $diamond->diamonds_count,
                        'total_carat' => $diamond->total_carat,
                        'diamond_type' => $diamond->diamondType ? ['id' => $diamond->diamondType->id, 'name' => $diamond->diamondType->name] : null,
                        'diamond_clarity' => $diamond->diamondClarity ? ['id' => $diamond->diamondClarity->id, 'name' => $diamond->diamondClarity->name] : null,
                        'diamond_color' => $diamond->diamondColor ? ['id' => $diamond->diamondColor->id, 'name' => $diamond->diamondColor->name] : null,
                        'diamond_shape' => $diamond->diamondShape ? ['id' => $diamond->diamondShape->id, 'name' => $diamond->diamondShape->name] : null,
                        'diamond_cut' => $diamond->diamondCut ? ['id' => $diamond->diamondCut->id, 'name' => $diamond->diamondCut->name] : null,
                    ])->values()->all(),
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

        foreach ($product->variants as $variant) {
            // Build metals array for this variant
            $metals = [];
            $metalParts = [];

            foreach ($variant->metals as $variantMetal) {
                $metal = $variantMetal->metal;
                $purity = $variantMetal->metalPurity;
                $tone = $variantMetal->metalTone;

                if ($metal && $purity && $tone) {
                    $weight = $variantMetal->metal_weight ?? $variantMetal->weight_grams ?? null;

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
                        'weightGrams' => $weightValue ? number_format($weightValue, 2, '.', '') : null,
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
                $parts = [];

                // Type abbreviation
                if ($variantDiamond->diamondType) {
                    $typeName = $variantDiamond->diamondType->name;
                    $parts[] = strtoupper(substr($typeName, 0, 3)) === 'LAB' ? 'LG' : 'NAT';
                }

                // Shape
                if ($variantDiamond->diamondShape) {
                    $parts[] = $variantDiamond->diamondShape->name;
                }

                // Color
                if ($variantDiamond->diamondColor) {
                    $parts[] = $variantDiamond->diamondColor->name;
                }

                // Clarity
                if ($variantDiamond->diamondClarity) {
                    $parts[] = $variantDiamond->diamondClarity->name;
                }

                // Cut
                if ($variantDiamond->diamondCut) {
                    $cutName = $variantDiamond->diamondCut->name;
                    // Abbreviate cut grades
                    $cutAbbr = match (strtoupper($cutName)) {
                        'EXCELLENT' => 'EX',
                        'VERY GOOD' => 'VG',
                        'GOOD' => 'G',
                        'FAIR' => 'F',
                        'POOR' => 'P',
                        default => $cutName,
                    };
                    $parts[] = $cutAbbr;
                }

                // Carat and count
                $caratStr = '';
                if ($variantDiamond->total_carat) {
                    $caratStr = number_format((float) $variantDiamond->total_carat, 2) . 'ct';
                }

                $countStr = '';
                if ($variantDiamond->diamonds_count && $variantDiamond->diamonds_count > 1) {
                    $countStr = '(' . $variantDiamond->diamonds_count . ')';
                }

                // Build label: "LG Oval F VVS1 EX 1.00ct (2)"
                $diamondLabel = trim(implode(' ', $parts) . ' ' . $caratStr . ' ' . $countStr);

                $diamonds[] = [
                    'label' => $diamondLabel,
                    'diamondTypeId' => $variantDiamond->diamond_type_id ?? 0,
                    'diamondShapeId' => $variantDiamond->diamond_shape_id ?? 0,
                    'diamondColorId' => $variantDiamond->diamond_color_id ?? 0,
                    'diamondClarityId' => $variantDiamond->diamond_clarity_id ?? 0,
                    'diamondCutId' => $variantDiamond->diamond_cut_id ?? 0,
                    'stoneCount' => $variantDiamond->diamonds_count ?? 0,
                    'totalCarat' => $variantDiamond->total_carat ? (string) number_format((float) $variantDiamond->total_carat, 2) : '0',
                ];

                $diamondParts[] = $diamondLabel;
            }

            // Build combined labels
            $metalLabel = !empty($metalParts) ? implode(' + ', $metalParts) : '';
            $diamondLabel = !empty($diamondParts) ? implode(' + ', $diamondParts) : '';

            // Full configuration label
            $configLabel = '';
            if (!empty($metalLabel) && !empty($diamondLabel)) {
                $configLabel = $metalLabel . ' | ' . $diamondLabel;
            } elseif (!empty($metalLabel)) {
                $configLabel = $metalLabel;
            } elseif (!empty($diamondLabel)) {
                $configLabel = $diamondLabel;
            } else {
                $configLabel = $variant->label ?? 'Configuration ' . $variant->id;
            }

            // Calculate metal cost based on weight × rate
            $metalCost = 0;
            foreach ($variant->metals as $variantMetal) {
                $metal = $variantMetal->metal;
                $purity = $variantMetal->metalPurity;
                $weight = $variantMetal->metal_weight ?? $variantMetal->weight_grams ?? null;

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

            // Calculate pricing
            $basePrice = (float) ($product->base_price ?? 0);
            $makingCharge = (float) ($product->making_charge ?? 0);
            $priceAdjustment = 0; //(float) ($variant->price_adjustment ?? 0);
            $diamondCost = 0; // Diamond cost calculation can be added later if needed
            // Total price: Metal + Diamond + Making Charge + Adjustment (Base Price is NOT included)
            $priceTotal = $metalCost + $diamondCost + $makingCharge;

            $configOptions[] = [
                'variant_id' => $variant->id,
                'label' => $configLabel,
                'metal_label' => $metalLabel,
                'diamond_label' => $diamondLabel,
                'metals' => $metals,
                'diamonds' => $diamonds,
                'price_total' => $priceTotal,
                'price_breakup' => [
                    'base' => $basePrice,
                    'metal' => $metalCost,
                    'diamond' => $diamondCost,
                    'making' => $makingCharge,
                    'adjustment' => $priceAdjustment,
                ],
                'sku' => $variant->sku ?? $product->sku,
                'inventory_quantity' => $variant->inventory_quantity ?? 0,
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
                $allVariantDiamonds->push([
                    'id' => $variantDiamond->id,
                    'variant_id' => $variant->id,
                    'diamond_type_id' => $variantDiamond->diamond_type_id,
                    'diamond_shape_id' => $variantDiamond->diamond_shape_id,
                    'diamond_clarity_id' => $variantDiamond->diamond_clarity_id,
                    'diamond_color_id' => $variantDiamond->diamond_color_id,
                    'diamond_cut_id' => $variantDiamond->diamond_cut_id,
                    'total_carat' => $variantDiamond->total_carat,
                    'diamonds_count' => $variantDiamond->diamonds_count,
                    'diamondType' => $variantDiamond->diamondType,
                    'diamondShape' => $variantDiamond->diamondShape,
                    'diamondClarity' => $variantDiamond->diamondClarity,
                    'diamondColor' => $variantDiamond->diamondColor,
                    'diamondCut' => $variantDiamond->diamondCut,
                ]);
            }
        }

        if ($allVariantDiamonds->isEmpty()) {
            return [];
        }

        $optionsMap = [];
        $optionIdCounter = 1;

        // Group by (diamond_type_id, diamond_shape_id, diamond_clarity_id, diamond_color_id, diamond_cut_id, total_carat, diamonds_count)
        foreach ($allVariantDiamonds as $variantDiamond) {
            $key = sprintf(
                '%d_%d_%d_%d_%d_%s_%d',
                $variantDiamond['diamond_type_id'] ?? 0,
                $variantDiamond['diamond_shape_id'] ?? 0,
                $variantDiamond['diamond_clarity_id'] ?? 0,
                $variantDiamond['diamond_color_id'] ?? 0,
                $variantDiamond['diamond_cut_id'] ?? 0,
                $variantDiamond['total_carat'] ?? '0',
                $variantDiamond['diamonds_count'] ?? 0
            );

            if (!isset($optionsMap[$key])) {
                $parts = [];

                if ($variantDiamond['diamondType']) {
                    $parts[] = $variantDiamond['diamondType']->name;
                }
                if ($variantDiamond['diamondShape']) {
                    $parts[] = $variantDiamond['diamondShape']->name;
                }
                if ($variantDiamond['diamondClarity']) {
                    $parts[] = $variantDiamond['diamondClarity']->name;
                }
                if ($variantDiamond['diamondColor']) {
                    $parts[] = $variantDiamond['diamondColor']->name;
                }
                if ($variantDiamond['diamondCut']) {
                    $parts[] = $variantDiamond['diamondCut']->name;
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
                        $vd['diamond_type_id'] === $variantDiamond['diamond_type_id'] &&
                        $vd['diamond_shape_id'] === $variantDiamond['diamond_shape_id'] &&
                        $vd['diamond_clarity_id'] === $variantDiamond['diamond_clarity_id'] &&
                        $vd['diamond_color_id'] === $variantDiamond['diamond_color_id'] &&
                        $vd['diamond_cut_id'] === $variantDiamond['diamond_cut_id'] &&
                        $vd['total_carat'] == $variantDiamond['total_carat'] &&
                        $vd['diamonds_count'] == $variantDiamond['diamonds_count']
                    ) {
                        $diamondVariantIds[] = $vd['id'];
                    }
                }

                $optionsMap[$key] = [
                    'id' => $optionIdCounter++,
                    'label' => $label,
                    'diamond_type_ids' => $variantDiamond['diamond_type_id'] ? [$variantDiamond['diamond_type_id']] : [],
                    'diamond_shape_ids' => $variantDiamond['diamond_shape_id'] ? [$variantDiamond['diamond_shape_id']] : [],
                    'diamond_clarity_ids' => $variantDiamond['diamond_clarity_id'] ? [$variantDiamond['diamond_clarity_id']] : [],
                    'diamond_color_ids' => $variantDiamond['diamond_color_id'] ? [$variantDiamond['diamond_color_id']] : [],
                    'diamond_cut_ids' => $variantDiamond['diamond_cut_id'] ? [$variantDiamond['diamond_cut_id']] : [],
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
