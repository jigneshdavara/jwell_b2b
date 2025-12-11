<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkProductsRequest;
use App\Http\Requests\Admin\BulkUpdateProductStatusRequest;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Brand;
use App\Models\Catalog;
use App\Models\Category;
use App\Models\CustomerGroup;
use App\Models\Diamond;
use App\Models\Metal;
use App\Models\MetalPurity;
use App\Models\MetalTone;
use App\Models\Product;
use App\Models\ProductMedia;
use App\Models\ProductVariant;
use App\Models\Size;
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
        $perPage = $this->validatePerPage(request('per_page', 10));

        $products = Product::query()
            ->with(['brand:id,name', 'category:id,name'])
            ->withCount('variants')
            ->when(
                $filters['search'] ?? null,
                fn($query, $search) =>
                $query->where(function ($q) use ($search) {
                    $q->where('sku', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                })
            )
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
            ->through(fn(Product $product) => $this->formatProductForList($product));

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
            ...$this->getFormOptions(),
        ]);
    }

    public function store(StoreProductRequest $request, ProductVariantSyncService $variantSync): RedirectResponse
    {
        $validated = $request->validated();

        return DB::transaction(function () use ($validated, $variantSync) {
            $product = $this->createProduct($validated, $variantSync);

            return redirect()
                ->route('admin.products.edit', $product)
                ->with('status', 'product_created');
        });
    }

    public function edit(Product $product): Response
    {
        $product->load([
            'brand',
            'category.sizes' => fn($query) => $query->where('is_active', true)->orderBy('name'),
            'catalogs',
            'media' => fn($query) => $query->orderBy('display_order'),
            'variants' => function ($query) {
                $query->orderByDesc('is_default')
                    ->orderBy('label')
                    ->with([
                        'metals.metal',
                        'metals.metalPurity',
                        'metals.metalTone',
                        'diamonds.diamond.shape',
                        'diamonds.diamond.color',
                        'diamonds.diamond.clarity',
                        'size',
                    ]);
            },
        ]);

        return Inertia::render('Admin/Products/Edit', [
            'product' => $this->formatProductForEdit($product),
            ...$this->getFormOptions(),
        ]);
    }

    public function update(
        UpdateProductRequest $request,
        Product $product,
        ProductVariantSyncService $variantSync
    ): RedirectResponse {
        $validated = $request->validated();

        DB::transaction(function () use ($product, $validated, $variantSync): void {
            $this->updateProduct($product, $validated, $variantSync);
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
        $isActive = $request->validated('action') === 'activate';

        Product::whereIn('id', $request->validated('ids'))->update([
            'is_active' => $isActive,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Product visibility updated.');
    }

    public function copy(Product $product): RedirectResponse
    {
        $product->load(['variants', 'media']);

        $newProduct = DB::transaction(function () use ($product) {
            return $this->duplicateProduct($product);
        });

        return redirect()
            ->route('admin.products.edit', $newProduct)
            ->with('status', 'product_copied');
    }

    protected function createProduct(array $data, ProductVariantSyncService $variantSync): Product
    {
        $variants = Arr::pull($data, 'variants', []);
        $mediaUploads = Arr::pull($data, 'media_uploads', []);
        $removedMediaIds = Arr::pull($data, 'removed_media_ids', []);
        $catalogIds = Arr::pull($data, 'catalog_ids', []);
        $categoryIds = Arr::pull($data, 'category_ids', []);

        $data['subcategory_ids'] = !empty($categoryIds) ? $categoryIds : null;
        $data = $this->prepareProductPayload($data);

        $product = Product::create($data);

        $variantSync->sync($product, $variants, null);
        $this->syncMedia($product, $mediaUploads, $removedMediaIds);

        if (!empty($catalogIds)) {
            $product->catalogs()->sync($catalogIds);
        }

        return $product;
    }

    protected function updateProduct(
        Product $product,
        array $data,
        ProductVariantSyncService $variantSync
    ): void {
        $variants = Arr::pull($data, 'variants', []);
        $mediaUploads = Arr::pull($data, 'media_uploads', []);
        $removedMediaIds = Arr::pull($data, 'removed_media_ids', []);
        $catalogIds = Arr::pull($data, 'catalog_ids', []);
        $categoryIds = Arr::pull($data, 'category_ids', []);

        $data['subcategory_ids'] = !empty($categoryIds) ? $categoryIds : null;
        $data = $this->prepareProductPayload($data);

        $product->update($data);
        $variantSync->sync($product, $variants, null);
        $this->syncMedia($product, $mediaUploads, $removedMediaIds);
        $product->catalogs()->sync($catalogIds ?? []);
    }

    protected function prepareProductPayload(array $data): array
    {
        // Handle making charge percentage
        if (
            isset($data['making_charge_percentage'])
            && $data['making_charge_percentage'] !== null
            && $data['making_charge_percentage'] !== ''
        ) {
            $data['making_charge_percentage'] = (float) $data['making_charge_percentage'];
        } else {
            $data['making_charge_percentage'] = null;
        }

        // Handle making charge types - store in metadata
        $makingChargeTypes = $data['making_charge_types'] ?? [];
        if (!empty($makingChargeTypes) && is_array($makingChargeTypes)) {
            // Store in metadata for easy access
            $metadata = is_array($data['metadata'] ?? null) ? $data['metadata'] : [];
            $metadata['making_charge_types'] = array_values(array_filter($makingChargeTypes, fn($type) => in_array($type, ['fixed', 'percentage'], true)));
            $data['metadata'] = !empty($metadata) ? $metadata : null;
        }

        // Handle other metadata fields
        if (array_key_exists('metadata', $data) && is_array($data['metadata'])) {
            $metadata = $data['metadata'];
            $sizeDimension = $this->sanitizeSizeDimension($metadata['size_dimension'] ?? null);

            if ($sizeDimension) {
                $metadata['size_dimension'] = $sizeDimension;
            }

            $data['metadata'] = !empty($metadata) ? $metadata : null;
        }

        return $data;
    }

    protected function sanitizeSizeDimension($sizeDimension): ?array
    {
        if (!is_array($sizeDimension)) {
            return null;
        }

        $unit = $sizeDimension['unit'] ?? null;
        if (!in_array($unit, ['mm', 'cm'], true)) {
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

    protected function formatProductForList(Product $product): array
    {
        return [
            'id' => $product->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'is_active' => $product->is_active,
            'brand' => $product->brand ? ['name' => $product->brand->name] : null,
            'category' => $product->category ? ['name' => $product->category->name] : null,
            'variants_count' => $product->variants_count,
        ];
    }

    protected function formatProductForEdit(Product $product): array
    {
        return [
            'id' => $product->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'titleline' => $product->titleline ?? '',
            'description' => $product->description,
            'brand_id' => $product->brand_id,
            'category_id' => $product->category_id,
            'category_ids' => $product->subcategory_ids ?? [],
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'sizes' => $product->category->sizes->map(fn($size) => [
                    'id' => $size->id,
                    'name' => $size->name,
                    'value' => $size->value ?? $size->name,
                ])->all(),
            ] : null,
            'collection' => $product->collection ?? '',
            'producttype' => $product->producttype ?? '',
            'gender' => $product->gender ?? '',
            'making_charge_amount' => $product->making_charge_amount,
            'making_charge_percentage' => $product->making_charge_percentage,
            'making_charge_types' => $product->getMakingChargeTypes(),
            'is_active' => $product->is_active ?? true,
            'catalog_ids' => $product->catalogs->pluck('id')->toArray(),
            'metadata' => $product->metadata,
            'variants' => $product->variants->map(
                fn(ProductVariant $variant) =>
                $this->formatVariantForEdit($variant)
            ),
            'media' => $product->media->map(fn(ProductMedia $media) => [
                'id' => $media->id,
                'type' => $media->type,
                'url' => $media->url,
                'display_order' => $media->display_order,
                'metadata' => $media->metadata,
            ]),
        ];
    }

    protected function formatVariantForEdit(ProductVariant $variant): array
    {
        return [
            'id' => $variant->id,
            'sku' => $variant->sku,
            'label' => $variant->label,
            'inventory_quantity' => $variant->inventory_quantity ?? 0,
            'size_id' => $variant->size_id,
            'size' => $variant->size ? [
                'id' => $variant->size->id,
                'name' => $variant->size->name,
                'value' => $variant->size->value,
            ] : null,
            'is_default' => $variant->is_default,
            'metadata' => $variant->metadata,
            'metals' => $variant->metals->map(fn($metal) => [
                'id' => $metal->id,
                'metal_id' => $metal->metal_id,
                'metal_purity_id' => $metal->metal_purity_id,
                'metal_tone_id' => $metal->metal_tone_id,
                'metal_weight' => $metal->metal_weight,
                'metadata' => $metal->metadata,
                'metal' => $metal->metal ? [
                    'id' => $metal->metal->id,
                    'name' => $metal->metal->name,
                ] : null,
                'metal_purity' => $metal->metalPurity ? [
                    'id' => $metal->metalPurity->id,
                    'name' => $metal->metalPurity->name,
                ] : null,
                'metal_tone' => $metal->metalTone ? [
                    'id' => $metal->metalTone->id,
                    'name' => $metal->metalTone->name,
                ] : null,
            ])->values()->all(),
            'diamonds' => $variant->diamonds->map(fn($diamond) => [
                'id' => $diamond->id,
                'diamond_id' => $diamond->diamond_id,
                'diamonds_count' => $diamond->diamonds_count,
                'metadata' => $diamond->metadata,
            ])->values()->all(),
        ];
    }

    protected function syncMedia(Product $product, array $uploads = [], array $removedIds = []): void
    {
        // Remove deleted media
        if (!empty($removedIds)) {
            $product->media()
                ->whereIn('id', $removedIds)
                ->get()
                ->each(function (ProductMedia $media) {
                    $this->deleteMediaFile($media);
                    $media->delete();
                });
        }

        // Upload new media
        if (empty($uploads)) {
            return;
        }

        $nextDisplayOrder = ((int) ($product->media()->max('display_order') ?? -1)) + 1;

        foreach ($uploads as $upload) {
            if (!$upload instanceof UploadedFile) {
                continue;
            }

            $this->createMediaFromUpload($product, $upload, $nextDisplayOrder++);
        }
    }

    protected function createMediaFromUpload(Product $product, UploadedFile $upload, int $displayOrder): void
    {
        $path = $upload->store('products', 'public');
        $mimeType = $upload->getMimeType() ?? '';
        $type = str_starts_with($mimeType, 'video/') ? 'video' : 'image';

        $url = '/storage/' . $path;
        $url = preg_replace('#(?<!:)/{2,}#', '/', $url);

        $product->media()->create([
            'type' => $type,
            'url' => $url,
            'display_order' => $displayOrder,
            'metadata' => [
                'original_name' => $upload->getClientOriginalName(),
                'size' => $upload->getSize(),
                'mime_type' => $mimeType,
                'storage_path' => $path,
            ],
        ]);
    }

    protected function deleteMediaFile(ProductMedia $media): void
    {
        $storagePath = $media->metadata['storage_path'] ?? null;
        if ($storagePath) {
            Storage::disk('public')->delete($storagePath);
            return;
        }

        $url = $media->url;
        if (!$url) {
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

    protected function duplicateProduct(Product $product): Product
    {
        $replica = $product->replicate();
        $replica->sku = $this->generateProductSku($product->sku);
        $replica->name = $product->name . ' (Copy)';
        $replica->is_active = false;
        $replica->push();

        // Duplicate variants
        foreach ($product->variants as $variant) {
            $newVariant = $variant->replicate();
            $newVariant->product_id = $replica->id;
            $newVariant->sku = $this->generateVariantSku($variant->sku);
            $newVariant->save();
        }

        // Duplicate media
        foreach ($product->media as $media) {
            $newMedia = $media->replicate();
            $newMedia->product_id = $replica->id;
            $newMedia->save();
        }

        return $replica;
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
        if (!$baseSku) {
            return null;
        }

        do {
            $candidate = sprintf('%s-%s', $baseSku, Str::upper(Str::random(3)));
        } while (ProductVariant::where('sku', $candidate)->exists());

        return $candidate;
    }

    protected function getFormOptions(): array
    {
        return [
            'customerGroups' => $this->customerGroupOptions(),
            'brands' => $this->brandList(),
            'categories' => $this->categoryList(),
            'parentCategories' => $this->parentCategoryList(),
            'subcategories' => $this->subcategoryList(),
            'catalogs' => $this->catalogList(),
            'diamonds' => $this->diamondOptions(),
            'metals' => $this->metalOptions(),
            'metalPurities' => $this->metalPurityOptions(),
            'metalTones' => $this->metalToneOptions(),
            'sizes' => $this->sizeOptions(),
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
            ->get(['id', 'name', 'parent_id'])
            ->map(fn(Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'parent_id' => $category->parent_id,
            ])
            ->all();
    }

    protected function parentCategoryList(): array
    {
        return Category::query()
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with(['sizes' => fn($query) => $query->where('is_active', true)->orderBy('name')])
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn(Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'sizes' => $category->sizes->map(fn($size) => [
                    'id' => $size->id,
                    'name' => $size->name,
                ])->all(),
            ])
            ->all();
    }

    protected function subcategoryList(): array
    {
        return Category::query()
            ->where('is_active', true)
            ->whereNotNull('parent_id')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id'])
            ->map(fn(Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'parent_id' => $category->parent_id,
            ])
            ->all();
    }

    protected function catalogList(): array
    {
        return Catalog::query()
            ->where('is_active', true)
            ->withCount('products')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'display_order', 'is_active'])
            ->map(fn(Catalog $catalog) => [
                'id' => $catalog->id,
                'code' => $catalog->code,
                'name' => $catalog->name,
                'products_count' => $catalog->products_count,
                'display_order' => $catalog->display_order,
                'is_active' => $catalog->is_active,
            ])
            ->all();
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
                'metal' => $purity->metal ? [
                    'id' => $purity->metal->id,
                    'name' => $purity->metal->name,
                ] : null,
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
                'metal' => $tone->metal ? [
                    'id' => $tone->metal->id,
                    'name' => $tone->metal->name,
                ] : null,
            ])
            ->all();
    }

    protected function sizeOptions(): array
    {
        return Size::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn(Size $size) => [
                'id' => $size->id,
                'name' => $size->name,
            ])
            ->all();
    }

    protected function validatePerPage(int $perPage): int
    {
        $allowed = [10, 25, 50, 100];
        return in_array($perPage, $allowed, true) ? $perPage : 10;
    }
}
