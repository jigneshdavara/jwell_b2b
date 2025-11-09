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
use App\Models\Material;
use App\Models\Product;
use App\Models\ProductMedia;
use App\Models\ProductVariant;
use App\Services\Catalog\ProductVariantSyncService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
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
            'materials' => Material::query()->pluck('name', 'id'),
            'variantLibrary' => $this->variantLibrary(),
        ]);
    }

    public function store(StoreProductRequest $request, ProductVariantSyncService $variantSync): RedirectResponse
    {
        $data = $request->validated();
        $variants = Arr::pull($data, 'variants', []);
        $variantOptions = Arr::pull($data, 'variant_options', []);

        return DB::transaction(function () use ($data, $variants, $variantOptions, $variantSync) {
            $product = Product::create($data);

            $variantSync->sync($product, $variants, $variantOptions);

            return redirect()
                ->route('admin.products.edit', $product)
                ->with('status', 'product_created');
        });
    }

    public function edit(Product $product): Response
    {
        $product->load(['brand', 'category', 'material', 'media', 'variants' => function ($query) {
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
                'material_id' => $product->material_id,
                'gross_weight' => $product->gross_weight,
                'net_weight' => $product->net_weight,
                'base_price' => $product->base_price,
                'making_charge' => $product->making_charge,
                'is_jobwork_allowed' => $product->is_jobwork_allowed,
                'visibility' => $product->visibility,
                'standard_pricing' => $product->standard_pricing,
                'variant_options' => $product->variant_options,
                'variants' => $product->variants->map(fn (ProductVariant $variant) => [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'label' => $variant->label,
                    'metal_tone' => $variant->metal_tone,
                    'stone_quality' => $variant->stone_quality,
                    'size' => $variant->size,
                    'price_adjustment' => $variant->price_adjustment,
                    'is_default' => $variant->is_default,
                ]),
            ],
            'brands' => Brand::query()->pluck('name', 'id'),
            'categories' => Category::query()->pluck('name', 'id'),
            'materials' => Material::query()->pluck('name', 'id'),
            'variantLibrary' => $this->variantLibrary(),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product, ProductVariantSyncService $variantSync): RedirectResponse
    {
        $data = $request->validated();
        $variants = Arr::pull($data, 'variants', []);
        $variantOptions = Arr::pull($data, 'variant_options', []);

        DB::transaction(function () use ($product, $data, $variants, $variantOptions, $variantSync): void {
            $product->update($data);
            $variantSync->sync($product, $variants, $variantOptions);
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
}
