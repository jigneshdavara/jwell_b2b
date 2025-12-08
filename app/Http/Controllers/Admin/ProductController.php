<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkProductsRequest;
use App\Http\Requests\Admin\BulkUpdateProductStatusRequest;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\CustomerGroup;
use App\Models\Colorstone;
use App\Models\ColorstoneColor;
use App\Models\ColorstoneQuality;
use App\Models\ColorstoneShape;
use App\Models\Diamond;
use App\Models\DiamondClarity;
use App\Models\DiamondColor;
use App\Models\DiamondShape;
use App\Models\Metal;
use App\Models\MetalPurity;
use App\Models\MetalTone;
use App\Models\Product;
use App\Models\ProductMedia;
use App\Models\ProductVariant;
use App\Services\Catalog\ProductVariantSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        $filters = request()->only(['search', 'status']);
        $perPage = (int) request('per_page', 20);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 20;
        }

        $products = Product::query()
            ->with(['brand:id,name', 'category:id,name'])
            ->withCount('variants')
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('sku', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, function ($query, $status) {
                if ($status === 'active') {
                    $query->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->latest('updated_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Product $product) {
                return [
                    'id' => $product->id,
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'is_active' => $product->is_active,
                    'brand' => $product->brand ? ['name' => $product->brand->name] : null,
                    'category' => $product->category ? ['name' => $product->category->name] : null,
                    'variants_count' => $product->variants_count,
                ];
            });

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'brands' => $this->brandList(),
            'categories' => $this->categoryList(),
            'filters' => $filters,
            'perPageOptions' => [10, 25, 50, 100],
            'perPage' => $perPage,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Products/Edit', [
            'product' => null,
            'customerGroups' => $this->customerGroupOptions(),
            'brands' => $this->brandList(),
            'categories' => $this->categoryList(),
            'diamondCatalog' => $this->diamondCatalogOptions(),
            'colorstoneCatalog' => $this->colorstoneCatalogOptions(),
            'diamonds' => $this->diamondOptions(),
            'colorstones' => $this->colorstoneOptions(),
            'metals' => $this->metalOptions(),
            'metalPurities' => $this->metalPurityOptions(),
            'metalTones' => $this->metalToneOptions(),
        ]);
    }

    public function store(StoreProductRequest $request, ProductVariantSyncService $variantSync): RedirectResponse
    {
        $data = $request->validated();
        $variants = Arr::pull($data, 'variants', []);
        $variantOptions = Arr::pull($data, 'variant_options', []);
        $mediaUploads = Arr::pull($data, 'media_uploads', []);
        $removedMediaIds = Arr::pull($data, 'removed_media_ids', []);

        $data = $this->prepareProductPayload($data);

        return DB::transaction(function () use ($data, $variants, $variantOptions, $variantSync, $mediaUploads, $removedMediaIds) {
            $product = Product::create($data);

            $variantSync->sync($product, $variants, $variantOptions, null);
            $this->syncMedia($product, $mediaUploads, $removedMediaIds);

            return redirect()
                ->route('admin.products.edit', $product)
                ->with('status', 'product_created');
        });
    }

    public function edit(Product $product): Response
    {
        $product->load([
            'brand',
            'category',
            'media' => fn($query) => $query->orderBy('position'),
            'variants' => function ($query) {
                $query->orderByDesc('is_default')->orderBy('label')
                    ->with([
                        'metals.metal',
                        'metals.metalPurity',
                        'metals.metalTone',
                        'diamonds.diamond.shape',
                        'diamonds.diamond.color',
                        'diamonds.diamond.clarity',
                        'colorstones.colorstone.shape',
                        'colorstones.colorstone.color',
                        'colorstones.colorstone.quality',
                    ]);
            },
        ]);

        return Inertia::render('Admin/Products/Edit', [
            'product' => [
                'id' => $product->id,
                'sku' => $product->sku,
                'name' => $product->name,
                'titleline' => $product->titleline ?? '',
                'description' => $product->description,
                'brand_id' => $product->brand_id,
                'category_id' => $product->category_id,
                'collection' => $product->collection ?? '',
                'producttype' => $product->producttype ?? '',
                'gender' => $product->gender ?? '',
                'gross_weight' => $product->gross_weight,
                'net_weight' => $product->net_weight,
                'gold_weight' => $product->gold_weight,
                'silver_weight' => $product->silver_weight,
                'other_material_weight' => $product->other_material_weight,
                'total_weight' => $product->total_weight,
                'making_charge' => $product->making_charge,
                'making_charge_discount_type' => $product->making_charge_discount_type,
                'making_charge_discount_value' => $product->making_charge_discount_value !== null ? (string) $product->making_charge_discount_value : '',
                'making_charge_discount_overrides' => collect($product->making_charge_discount_overrides ?? [])
                    ->map(function (array $override) {
                        return [
                            'customer_group_id' => $override['customer_group_id'] ?? null,
                            'type' => $override['type'] ?? 'percentage',
                            'value' => isset($override['value']) ? (string) $override['value'] : '',
                        ];
                    })
                    ->values()
                    ->all(),
                'is_active' => $product->is_active ?? true,
                'is_jobwork_allowed' => $product->is_jobwork_allowed ?? false,
                'visibility' => $product->visibility ?? 'public',
                'standard_pricing' => $product->standard_pricing ?? false,
                'variant_options' => $product->variant_options,
                'is_variant_product' => $product->is_variant_product ?? false,
                'mixed_metal_tones_per_purity' => $product->mixed_metal_tones_per_purity ?? false,
                'mixed_metal_purities_per_tone' => $product->mixed_metal_purities_per_tone ?? false,
                'metal_mix_mode' => is_array($product->metal_mix_mode) && count($product->metal_mix_mode) > 0
                    ? $product->metal_mix_mode
                    : (object)[],
                'metal_ids' => $product->metal_ids ?? [],
                'metal_purity_ids' => $product->metal_purity_ids ?? [],
                'metal_tone_ids' => $product->metal_tone_ids ?? [],
                'metadata' => $product->metadata,
                'variants' => $product->variants->map(fn(ProductVariant $variant) => [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'label' => $variant->label,
                    'inventory_quantity' => $variant->inventory_quantity ?? 0,
                    'total_weight' => $variant->total_weight ?? null,
                    // Legacy fields - kept for backwards compatibility
                    'metal_tone' => $variant->metal_tone,
                    'stone_quality' => $variant->stone_quality,
                    'size' => $variant->size,
                    'price_adjustment' => $variant->price_adjustment,
                    'is_default' => $variant->is_default,
                    'metadata' => $variant->metadata,
                    'size_cm' => $variant->metadata['size_cm'] ?? null,
                    // Optional: for multiple metals per variant
                    'metals' => $variant->metals->map(fn($metal) => [
                        'id' => $metal->id,
                        'metal_id' => $metal->metal_id,
                        'metal_purity_id' => $metal->metal_purity_id,
                        'metal_tone_id' => $metal->metal_tone_id,
                        'metal_weight' => $metal->metal_weight,
                        'metadata' => $metal->metadata,
                        'metal' => $metal->metal ? ['id' => $metal->metal->id, 'name' => $metal->metal->name] : null,
                        'metal_purity' => $metal->metalPurity ? ['id' => $metal->metalPurity->id, 'name' => $metal->metalPurity->name] : null,
                        'metal_tone' => $metal->metalTone ? ['id' => $metal->metalTone->id, 'name' => $metal->metalTone->name] : null,
                    ])->values()->all(),
                    // Diamonds for this variant - simplified structure with only diamond_id and count
                    'diamonds' => $variant->diamonds->map(fn($diamond) => [
                        'id' => $diamond->id,
                        'diamond_id' => $diamond->diamond_id,
                        'diamonds_count' => $diamond->diamonds_count,
                        'metadata' => $diamond->metadata,
                    ])->values()->all(),
                    // Colorstones for this variant - simplified structure with only colorstone_id and count
                    'colorstones' => $variant->colorstones->map(fn($colorstone) => [
                        'id' => $colorstone->id,
                        'colorstone_id' => $colorstone->colorstone_id,
                        'stones_count' => $colorstone->stones_count,
                        'metadata' => $colorstone->metadata,
                    ])->values()->all(),
                ]),
                'media' => $product->media->map(fn(ProductMedia $media) => [
                    'id' => $media->id,
                    'type' => $media->type,
                    'url' => $media->url,
                    'position' => $media->position,
                    'metadata' => $media->metadata,
                ]),
            ],
            'customerGroups' => $this->customerGroupOptions(),
            'brands' => $this->brandList(),
            'categories' => $this->categoryList(),
            'diamondCatalog' => $this->diamondCatalogOptions(),
            'colorstoneCatalog' => $this->colorstoneCatalogOptions(),
            'diamonds' => $this->diamondOptions(),
            'colorstones' => $this->colorstoneOptions(),
            'metals' => $this->metalOptions(),
            'metalPurities' => $this->metalPurityOptions(),
            'metalTones' => $this->metalToneOptions(),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product, ProductVariantSyncService $variantSync): RedirectResponse
    {
        $data = $request->validated();
        $variants = Arr::pull($data, 'variants', []);
        $variantOptions = Arr::pull($data, 'variant_options', []);
        $mediaUploads = Arr::pull($data, 'media_uploads', []);
        $removedMediaIds = Arr::pull($data, 'removed_media_ids', []);

        $data = $this->prepareProductPayload($data);

        DB::transaction(function () use ($product, $data, $variants, $variantOptions, $variantSync, $mediaUploads, $removedMediaIds): void {
            $product->update($data);
            $variantSync->sync($product, $variants, $variantOptions, null);
            $this->syncMedia($product, $mediaUploads, $removedMediaIds);
        });

        return redirect()
            ->route('admin.products.edit', $product)
            ->with('status', 'product_updated');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()
            ->route('admin.products.index')
            ->with('status', 'product_deleted');
    }

    public function bulkDestroy(BulkProductsRequest $request): RedirectResponse
    {
        Product::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected products deleted successfully.');
    }

    public function bulkStatus(BulkUpdateProductStatusRequest $request): RedirectResponse
    {
        $activate = $request->validated('action') === 'activate';

        Product::whereIn('id', $request->validated('ids'))->update([
            'is_active' => $activate,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Product visibility updated.');
    }



    public function copy(Product $product): RedirectResponse
    {
        $product->load(['variants', 'media']);

        $newProduct = DB::transaction(function () use ($product) {
            $replica = $product->replicate();
            $replica->sku = $this->generateProductSku($product->sku);
            $replica->name = $product->name . ' (Copy)';
            $replica->is_active = false;
            $replica->push();

            foreach ($product->variants as $variant) {
                $newVariant = $variant->replicate();
                $newVariant->product_id = $replica->id;
                $newVariant->sku = $this->generateVariantSku($variant->sku);
                $newVariant->save();
            }

            foreach ($product->media as $media) {
                $newMedia = $media->replicate();
                $newMedia->product_id = $replica->id;
                $newMedia->save();
            }

            return $replica;
        });

        return redirect()
            ->route('admin.products.edit', $newProduct)
            ->with('status', 'product_copied');
    }

    protected function variantLibrary(): array
    {
        return [
            'metal_tone' => ProductVariant::query()->whereNotNull('metal_tone')->distinct()->orderBy('metal_tone')->pluck('metal_tone')->values()->all(),
            'stone_quality' => ProductVariant::query()->whereNotNull('stone_quality')->distinct()->orderBy('stone_quality')->pluck('stone_quality')->values()->all(),
            'size' => ProductVariant::query()->whereNotNull('size')->distinct()->orderBy('size')->pluck('size')->values()->all(),
        ];
    }


    protected function customerGroupOptions(): array
    {
        return CustomerGroup::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn(CustomerGroup $group) => [
                'id' => $group->id,
                'name' => $group->name,
            ])
            ->all();
    }


    protected function metalOptions(): array
    {
        return Metal::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(fn(Metal $metal) => [
                'id' => $metal->id,
                'name' => $metal->name,
                'slug' => $metal->slug ?? null,
            ])
            ->all();
    }

    protected function metalPurityOptions(): array
    {
        return MetalPurity::query()
            ->where('is_active', true)
            ->with('metal:id,name')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(fn(MetalPurity $purity) => [
                'id' => $purity->id,
                'metal_id' => $purity->metal_id,
                'name' => $purity->name,
                'metal' => $purity->metal ? ['id' => $purity->metal->id, 'name' => $purity->metal->name] : null,
            ])
            ->all();
    }

    protected function metalToneOptions(): array
    {
        return MetalTone::query()
            ->where('is_active', true)
            ->with('metal:id,name')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(fn(MetalTone $tone) => [
                'id' => $tone->id,
                'metal_id' => $tone->metal_id,
                'name' => $tone->name,
                'metal' => $tone->metal ? ['id' => $tone->metal->id, 'name' => $tone->metal->name] : null,
            ])
            ->all();
    }

    protected function brandOptions(): array
    {
        return Brand::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn(Brand $brand) => [
                'id' => $brand->id,
                'name' => $brand->name,
            ])
            ->all();
    }

    protected function categoryOptions(): array
    {
        return Category::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn(Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
            ])
            ->all();
    }

    protected function brandList(): array
    {
        return Brand::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->pluck('name', 'id')
            ->all();
    }

    protected function categoryList(): array
    {
        return Category::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->pluck('name', 'id')
            ->all();
    }

    protected function diamondCatalogOptions(): array
    {
        return [
            'types' => [], // DiamondType model doesn't exist yet
            'shapes' => DiamondShape::query()
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn($item) => ['id' => $item->id, 'name' => $item->name])
                ->all(),
            'colors' => DiamondColor::query()
                ->where('is_active', true)
                ->orderBy('display_order') // diamond_colors uses 'display_order'
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn($item) => ['id' => $item->id, 'name' => $item->name])
                ->all(),
            'clarities' => DiamondClarity::query()
                ->where('is_active', true)
                ->orderBy('display_order') // diamond_clarities uses 'display_order'
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn($item) => ['id' => $item->id, 'name' => $item->name])
                ->all(),
            'cuts' => [], // DiamondCut model doesn't exist yet
        ];
    }

    protected function colorstoneCatalogOptions(): array
    {
        return [
            'shapes' => ColorstoneShape::query()
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn($item) => ['id' => $item->id, 'name' => $item->name])
                ->all(),
            'colors' => ColorstoneColor::query()
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn($item) => ['id' => $item->id, 'name' => $item->name])
                ->all(),
            'qualities' => ColorstoneQuality::query()
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn($item) => ['id' => $item->id, 'name' => $item->name])
                ->all(),
        ];
    }

    protected function diamondOptions(): array
    {
        return Diamond::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn($item) => ['id' => $item->id, 'name' => $item->name])
            ->all();
    }

    protected function colorstoneOptions(): array
    {
        return Colorstone::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn($item) => ['id' => $item->id, 'name' => $item->name])
            ->all();
    }

    protected function prepareProductPayload(array $data): array
    {
        $data['is_variant_product'] = (bool) ($data['is_variant_product'] ?? true);
        $data['mixed_metal_tones_per_purity'] = (bool) ($data['mixed_metal_tones_per_purity'] ?? false);
        $data['mixed_metal_purities_per_tone'] = (bool) ($data['mixed_metal_purities_per_tone'] ?? false);

        // Ensure mutual exclusion: if both are true, prefer mixed_metal_tones_per_purity
        if ($data['mixed_metal_tones_per_purity'] && $data['mixed_metal_purities_per_tone']) {
            $data['mixed_metal_purities_per_tone'] = false;
        }

        // Sanitize metal_mix_mode: ensure it's an array with valid values
        $metalMixMode = $data['metal_mix_mode'] ?? [];
        if (! is_array($metalMixMode)) {
            $metalMixMode = [];
        }

        // Validate and sanitize each metal's mode
        $sanitizedMetalMixMode = [];
        foreach ($metalMixMode as $metalId => $mode) {
            $metalIdInt = is_numeric($metalId) ? (int) $metalId : null;
            if ($metalIdInt && in_array($mode, ['normal', 'mix_tones', 'mix_purities'], true)) {
                $sanitizedMetalMixMode[$metalIdInt] = $mode;
            }
        }
        // Always set to array (empty array if no modes), never null (column has NOT NULL constraint)
        $data['metal_mix_mode'] = $sanitizedMetalMixMode;

        $metalIds = $this->sanitizeIds($data['metal_ids'] ?? []);
        $metalPurityIds = $this->sanitizeIds($data['metal_purity_ids'] ?? []);
        $metalToneIds = $this->sanitizeIds($data['metal_tone_ids'] ?? []);

        $data['metal_ids'] = ! empty($metalIds) ? $metalIds : null;
        $data['metal_purity_ids'] = ! empty($metalPurityIds) ? $metalPurityIds : null;
        $data['metal_tone_ids'] = ! empty($metalToneIds) ? $metalToneIds : null;

        if (! $data['is_variant_product']) {
            $data['metal_ids'] = null;
            $data['metal_purity_ids'] = null;
            $data['metal_tone_ids'] = null;
            $data['metal_mix_mode'] = []; // Reset to empty array when variant product is disabled
        }

        $data['making_charge_discount_type'] = $data['making_charge_discount_type'] ?? null;
        if (! $data['making_charge_discount_type']) {
            $data['making_charge_discount_type'] = null;
            $data['making_charge_discount_value'] = null;
        } else {
            $data['making_charge_discount_value'] = isset($data['making_charge_discount_value'])
                ? (float) $data['making_charge_discount_value']
                : null;
        }

        $discountOverrides = $this->sanitizeDiscountOverrides($data['making_charge_discount_overrides'] ?? []);
        $data['making_charge_discount_overrides'] = ! empty($discountOverrides) ? $discountOverrides : null;

        foreach (['gold_weight', 'silver_weight', 'other_material_weight', 'total_weight'] as $weightField) {
            if (! array_key_exists($weightField, $data)) {
                continue;
            }

            $value = $data[$weightField];
            $data[$weightField] = ($value === null || $value === '' || ! is_numeric($value))
                ? null
                : (float) $value;
        }

        if (array_key_exists('metadata', $data)) {
            $metadata = is_array($data['metadata']) ? $data['metadata'] : [];

            $sizeDimension = $this->sanitizeSizeDimension($metadata['size_dimension'] ?? null);

            $metadata = array_filter([
                'size_dimension' => $sizeDimension,
            ]);

            $data['metadata'] = ! empty($metadata) ? $metadata : null;
        }

        return $data;
    }

    protected function sanitizeIds(array $ids): array
    {
        return collect($ids)
            ->filter(fn($value) => is_numeric($value))
            ->map(fn($value) => (int) $value)
            ->unique()
            ->values()
            ->all();
    }


    protected function sanitizeDiscountOverrides(array $overrides): array
    {
        return collect($overrides)
            ->filter(function ($override) {
                return is_array($override)
                    && isset($override['customer_group_id'], $override['type'], $override['value'])
                    && $override['customer_group_id'] !== null;
            })
            ->map(function (array $override) {
                return [
                    'customer_group_id' => (int) $override['customer_group_id'],
                    'type' => $override['type'] === 'fixed' ? 'fixed' : 'percentage',
                    'value' => (float) $override['value'],
                ];
            })
            ->unique('customer_group_id')
            ->values()
            ->all();
    }

    protected function sanitizeSizeDimension($sizeDimension): ?array
    {
        if (! is_array($sizeDimension)) {
            return null;
        }

        $unit = $sizeDimension['unit'] ?? null;

        if (! in_array($unit, ['mm', 'cm'], true)) {
            return null;
        }

        $values = collect($sizeDimension['values'] ?? [])
            ->filter(fn($value) => is_numeric($value))
            ->map(fn($value) => round((float) $value, 3))
            ->filter(fn($value) => $value > 0)
            ->values()
            ->all();

        return [
            'unit' => $unit,
            'values' => $values,
        ];
    }


    protected function generateProductSku(string $baseSku): string
    {
        do {
            $candidate = sprintf('%s-%s', $baseSku, Str::upper(Str::random(4)));
        } while (Product::where('sku', $candidate)->exists());

        return $candidate;
    }

    protected function generateVariantSku(?string $baseSku): ?string
    {
        if (! $baseSku) {
            return null;
        }

        do {
            $candidate = sprintf('%s-%s', $baseSku, Str::upper(Str::random(3)));
        } while (ProductVariant::where('sku', $candidate)->exists());

        return $candidate;
    }

    protected function syncMedia(Product $product, array $uploads = [], array $removedIds = []): void
    {
        if (! empty($removedIds)) {
            $mediaToRemove = $product->media()->whereIn('id', $removedIds)->get();
            foreach ($mediaToRemove as $media) {
                $this->deleteMediaFile($media);
                $media->delete();
            }
        }

        if (empty($uploads)) {
            return;
        }

        $nextPosition = (int) (($product->media()->max('position')) ?? -1) + 1;

        /** @var \Illuminate\Filesystem\FilesystemAdapter $publicDisk */
        $publicDisk = Storage::disk('public');

        foreach ($uploads as $upload) {
            if (! $upload instanceof UploadedFile) {
                continue;
            }

            $path = $upload->store('products', 'public');
            $mimeType = $upload->getMimeType() ?? '';
            $type = str_starts_with($mimeType, 'video/') ? 'video' : 'image';

            // Generate relative URL for better portability
            // Use relative path starting with /storage/ instead of full URL
            $url = '/storage/' . $path;
            // Normalize double slashes
            $url = preg_replace('#(?<!:)/{2,}#', '/', $url);

            $product->media()->create([
                'type' => $type,
                'url' => $url,
                'position' => $nextPosition++,
                'metadata' => [
                    'original_name' => $upload->getClientOriginalName(),
                    'size' => $upload->getSize(),
                    'mime_type' => $mimeType,
                    'storage_path' => $path,
                ],
            ]);
        }
    }

    protected function deleteMediaFile(ProductMedia $media): void
    {
        $storagePath = $media->metadata['storage_path'] ?? null;
        if ($storagePath) {
            Storage::disk('public')->delete($storagePath);

            return;
        }

        $url = $media->url;
        if (! $url) {
            return;
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $publicDisk */
        $publicDisk = Storage::disk('public');
        $publicBase = rtrim($publicDisk->url(''), '/');

        if ($publicBase && str_starts_with($url, $publicBase)) {
            $relative = ltrim(Str::after($url, $publicBase), '/');
            if ($relative !== '') {
                $publicDisk->delete($relative);
            }

            return;
        }

        if (str_starts_with($url, '/storage/')) {
            $publicDisk->delete(ltrim(Str::after($url, '/storage/'), '/'));
        }
    }
}
