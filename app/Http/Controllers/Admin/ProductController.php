<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkAssignProductBrandRequest;
use App\Http\Requests\Admin\BulkAssignProductCategoryRequest;
use App\Http\Requests\Admin\BulkProductsRequest;
use App\Http\Requests\Admin\BulkUpdateProductStatusRequest;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\CustomerGroup;
use App\Models\DiamondClarity;
use App\Models\DiamondColor;
use App\Models\DiamondCut;
use App\Models\DiamondShape;
use App\Models\DiamondType;
use App\Models\GoldPurity;
use App\Models\Product;
use App\Models\ProductCatalog;
use App\Models\ProductMedia;
use App\Models\ProductVariant;
use App\Models\SilverPurity;
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
        $filters = request()->only(['search', 'brand', 'category', 'status']);

        $products = Product::query()
            ->with(['brand', 'category'])
            ->withCount('variants')
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('sku', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->when($filters['brand'] ?? null, function ($query, $brand) {
                $query->where('brand_id', $brand);
            })
            ->when($filters['category'] ?? null, function ($query, $category) {
                $query->where('category_id', $category);
            })
            ->when($filters['status'] ?? null, function ($query, $status) {
                if ($status === 'active') {
                    $query->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->latest('updated_at')
            ->paginate(20)
            ->withQueryString()
            ->through(function (Product $product) {
                return [
                    'id' => $product->id,
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'is_active' => $product->is_active,
                    'brand' => $product->brand?->only(['id', 'name']),
                    'category' => $product->category?->only(['id', 'name']),
                    'variants_count' => $product->variants_count,
                ];
            });

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'brands' => Brand::query()->orderBy('name')->pluck('name', 'id'),
            'categories' => Category::query()->orderBy('name')->pluck('name', 'id'),
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Products/Edit', [
            'product' => null,
            'brands' => Brand::query()->pluck('name', 'id'),
            'categories' => Category::query()->pluck('name', 'id'),
            'productCatalogs' => ProductCatalog::query()->pluck('name', 'id'),
            'goldPurities' => $this->goldPurityOptions(),
            'silverPurities' => $this->silverPurityOptions(),
            'diamondCatalog' => $this->diamondCatalog(),
            'customerGroups' => $this->customerGroupOptions(),
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
        $catalogIds = $this->sanitizeIds($data['product_catalog_ids'] ?? []);
        unset($data['product_catalog_ids']);

        return DB::transaction(function () use ($data, $variants, $variantOptions, $variantSync, $mediaUploads, $removedMediaIds, $catalogIds) {
            $product = Product::create($data);

            $variantSync->sync($product, $variants, $variantOptions);
            $this->syncMedia($product, $mediaUploads, $removedMediaIds);
            $product->catalogs()->sync($catalogIds);

            return redirect()
                ->route('admin.products.edit', $product)
                ->with('status', 'product_created');
        });
    }

    public function edit(Product $product): Response
    {
        $product->load(['brand', 'category', 'material', 'catalogs', 'media' => fn ($query) => $query->orderBy('position'), 'variants' => function ($query) {
            $query->orderByDesc('is_default')->orderBy('label');
        }]);

        return Inertia::render('Admin/Products/Edit', [
            'product' => [
                'id' => $product->id,
                'sku' => $product->sku,
                'name' => $product->name,
                'description' => $product->description,
                'brand_id' => $product->brand_id,
                'category_id' => $product->category_id,
                'gross_weight' => $product->gross_weight,
                'net_weight' => $product->net_weight,
                'gold_weight' => $product->gold_weight,
                'silver_weight' => $product->silver_weight,
                'other_material_weight' => $product->other_material_weight,
                'total_weight' => $product->total_weight,
                'base_price' => $product->base_price,
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
                'is_jobwork_allowed' => $product->is_jobwork_allowed,
                'visibility' => $product->visibility,
                'standard_pricing' => $product->standard_pricing,
                'variant_options' => $product->variant_options,
                'is_variant_product' => $product->is_variant_product,
                'uses_gold' => $product->uses_gold,
                'uses_silver' => $product->uses_silver,
                'uses_diamond' => $product->uses_diamond,
                'gold_purity_ids' => $product->gold_purity_ids ?? [],
                'silver_purity_ids' => $product->silver_purity_ids ?? [],
                'diamond_options' => collect($product->diamond_options ?? [])
                    ->map(function (array $option) {
                        return [
                            'key' => $option['key'] ?? (string) Str::uuid(),
                            'type_id' => $option['type_id'] ?? null,
                            'shape_id' => $option['shape_id'] ?? null,
                            'color_id' => $option['color_id'] ?? null,
                            'clarity_id' => $option['clarity_id'] ?? null,
                            'cut_id' => $option['cut_id'] ?? null,
                            'weight' => isset($option['weight']) ? (string) $option['weight'] : '',
                        ];
                    })
                    ->all(),
                'metadata' => $product->metadata,
                'product_catalog_ids' => $product->catalogs->pluck('id')->all(),
                'variants' => $product->variants->map(fn (ProductVariant $variant) => [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'label' => $variant->label,
                    'metal_tone' => $variant->metal_tone,
                    'stone_quality' => $variant->stone_quality,
                    'size' => $variant->size,
                    'price_adjustment' => $variant->price_adjustment,
                    'is_default' => $variant->is_default,
                    'metadata' => $variant->metadata,
                    'gold_purity_id' => $variant->metadata['gold_purity_id'] ?? null,
                    'silver_purity_id' => $variant->metadata['silver_purity_id'] ?? null,
                    'diamond_option_key' => $variant->metadata['diamond_option_key'] ?? null,
                    'size_cm' => $variant->metadata['size_cm'] ?? null,
                ]),
                'media' => $product->media->map(fn (ProductMedia $media) => [
                    'id' => $media->id,
                    'type' => $media->type,
                    'url' => $media->url,
                    'position' => $media->position,
                    'metadata' => $media->metadata,
                ]),
            ],
            'brands' => Brand::query()->pluck('name', 'id'),
            'categories' => Category::query()->pluck('name', 'id'),
            'productCatalogs' => ProductCatalog::query()->pluck('name', 'id'),
            'goldPurities' => $this->goldPurityOptions(),
            'silverPurities' => $this->silverPurityOptions(),
            'diamondCatalog' => $this->diamondCatalog(),
            'customerGroups' => $this->customerGroupOptions(),
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
        $catalogIds = $this->sanitizeIds($data['product_catalog_ids'] ?? []);
        unset($data['product_catalog_ids']);

        DB::transaction(function () use ($product, $data, $variants, $variantOptions, $variantSync, $mediaUploads, $removedMediaIds, $catalogIds): void {
            $product->update($data);
            $variantSync->sync($product, $variants, $variantOptions);
            $this->syncMedia($product, $mediaUploads, $removedMediaIds);
            $product->catalogs()->sync($catalogIds);
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

    public function bulkAssignBrand(BulkAssignProductBrandRequest $request): RedirectResponse
    {
        Product::whereIn('id', $request->validated('ids'))->update([
            'brand_id' => $request->validated('brand_id'),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Brand assigned to selected products.');
    }

    public function bulkAssignCategory(BulkAssignProductCategoryRequest $request): RedirectResponse
    {
        Product::whereIn('id', $request->validated('ids'))->update([
            'category_id' => $request->validated('category_id'),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Category assigned to selected products.');
    }

    public function copy(Product $product): RedirectResponse
    {
        $product->load(['variants', 'media']);

        $newProduct = DB::transaction(function () use ($product) {
            $replica = $product->replicate();
            $replica->sku = $this->generateProductSku($product->sku);
            $replica->name = $product->name.' (Copy)';
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

    protected function goldPurityOptions(): array
    {
        return GoldPurity::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('name')
            ->get()
            ->map(fn (GoldPurity $purity) => [
                'id' => $purity->id,
                'name' => $purity->name,
            ])
            ->all();
    }

    protected function silverPurityOptions(): array
    {
        return SilverPurity::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('name')
            ->get()
            ->map(fn (SilverPurity $purity) => [
                'id' => $purity->id,
                'name' => $purity->name,
            ])
            ->all();
    }

    protected function customerGroupOptions(): array
    {
        return CustomerGroup::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (CustomerGroup $group) => [
                'id' => $group->id,
                'name' => $group->name,
            ])
            ->all();
    }

    protected function diamondCatalog(): array
    {
        return [
            'types' => DiamondType::query()->where('is_active', true)->orderBy('position')->orderBy('name')->get()->map(fn (DiamondType $type) => [
                'id' => $type->id,
                'name' => $type->name,
            ])->all(),
            'shapes' => DiamondShape::query()->where('is_active', true)->orderBy('position')->orderBy('name')->get()->map(fn (DiamondShape $shape) => [
                'id' => $shape->id,
                'name' => $shape->name,
            ])->all(),
            'colors' => DiamondColor::query()->where('is_active', true)->orderBy('position')->orderBy('name')->get()->map(fn (DiamondColor $color) => [
                'id' => $color->id,
                'name' => $color->name,
            ])->all(),
            'clarities' => DiamondClarity::query()->where('is_active', true)->orderBy('position')->orderBy('name')->get()->map(fn (DiamondClarity $clarity) => [
                'id' => $clarity->id,
                'name' => $clarity->name,
            ])->all(),
            'cuts' => DiamondCut::query()->where('is_active', true)->orderBy('position')->orderBy('name')->get()->map(fn (DiamondCut $cut) => [
                'id' => $cut->id,
                'name' => $cut->name,
            ])->all(),
        ];
    }

    protected function prepareProductPayload(array $data): array
    {
        $data['is_variant_product'] = (bool) ($data['is_variant_product'] ?? true);
        $data['uses_gold'] = (bool) ($data['uses_gold'] ?? false);
        $data['uses_silver'] = (bool) ($data['uses_silver'] ?? false);
        $data['uses_diamond'] = (bool) ($data['uses_diamond'] ?? false);

        $goldPurityIds = $this->sanitizeIds($data['gold_purity_ids'] ?? []);
        $silverPurityIds = $this->sanitizeIds($data['silver_purity_ids'] ?? []);
        $diamondOptions = $this->sanitizeDiamondOptions($data['diamond_options'] ?? []);

        $data['gold_purity_ids'] = $data['uses_gold'] && ! empty($goldPurityIds) ? $goldPurityIds : null;
        $data['silver_purity_ids'] = $data['uses_silver'] && ! empty($silverPurityIds) ? $silverPurityIds : null;
        $data['diamond_options'] = $data['uses_diamond'] && ! empty($diamondOptions) ? $diamondOptions : null;

        if (! $data['is_variant_product']) {
            $data['uses_gold'] = false;
            $data['uses_silver'] = false;
            $data['uses_diamond'] = false;
            $data['gold_purity_ids'] = null;
            $data['silver_purity_ids'] = null;
            $data['diamond_options'] = null;
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
            ->filter(fn ($value) => is_numeric($value))
            ->map(fn ($value) => (int) $value)
            ->unique()
            ->values()
            ->all();
    }

    protected function sanitizeDiamondOptions(array $options): array
    {
        return collect($options)
            ->map(function (array $option) {
                $key = $option['key'] ?? (string) Str::uuid();

                return [
                    'key' => $key,
                    'type_id' => isset($option['type_id']) ? (int) $option['type_id'] : null,
                    'shape_id' => isset($option['shape_id']) ? (int) $option['shape_id'] : null,
                    'color_id' => isset($option['color_id']) ? (int) $option['color_id'] : null,
                    'clarity_id' => isset($option['clarity_id']) ? (int) $option['clarity_id'] : null,
                    'cut_id' => isset($option['cut_id']) ? (int) $option['cut_id'] : null,
                    'weight' => isset($option['weight']) ? (float) $option['weight'] : null,
                ];
            })
            ->filter(function (array $option) {
                return $option['type_id'] || $option['shape_id'] || $option['color_id'] || $option['clarity_id'] || $option['cut_id'] || $option['weight'];
            })
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
            ->filter(fn ($value) => is_numeric($value))
            ->map(fn ($value) => round((float) $value, 3))
            ->filter(fn ($value) => $value > 0)
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

        foreach ($uploads as $upload) {
            if (! $upload instanceof UploadedFile) {
                continue;
            }

            $path = $upload->store('products', 'public');
            $mimeType = $upload->getMimeType() ?? '';
            $type = str_starts_with($mimeType, 'video/') ? 'video' : 'image';

            $product->media()->create([
                'type' => $type,
                'url' => Storage::disk('public')->url($path),
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
