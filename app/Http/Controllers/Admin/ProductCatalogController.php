<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignProductsToCatalogRequest;
use App\Http\Requests\Admin\BulkDestroyProductCatalogsRequest;
use App\Http\Requests\Admin\StoreProductCatalogRequest;
use App\Http\Requests\Admin\UpdateProductCatalogRequest;
use App\Models\Product;
use App\Models\ProductCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductCatalogController extends Controller
{
    public function index(): Response
    {
        $catalogs = ProductCatalog::query()
            ->with(['products:id'])
            ->withCount('products')
            ->orderBy('name')
            ->paginate(20)
            ->through(function (ProductCatalog $catalog) {
                return [
                    'id' => $catalog->id,
                    'name' => $catalog->name,
                    'slug' => $catalog->slug,
                    'description' => $catalog->description,
                    'is_active' => $catalog->is_active,
                    'products_count' => $catalog->products_count,
                    'product_ids' => $catalog->products->pluck('id')->all(),
                ];
            });

        $availableProducts = Product::query()
            ->select(['id', 'name', 'sku', 'brand_id', 'category_id'])
            ->with([
                'brand:id,name',
                'category:id,name',
            ])
            ->orderBy('name')
            ->get()
            ->map(function (Product $product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'brand' => $product->brand?->name,
                    'category' => $product->category?->name,
                ];
            });

        return Inertia::render('Admin/Catalog/ProductCatalogs/Index', [
            'catalogs' => $catalogs,
            'availableProducts' => $availableProducts,
        ]);
    }

    public function store(StoreProductCatalogRequest $request): RedirectResponse
    {
        ProductCatalog::create([
            'name' => $request->input('name'),
            'slug' => $request->input('slug') ?: Str::slug($request->input('name')),
            'description' => $request->input('description'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Product catalog created successfully.');
    }

    public function update(UpdateProductCatalogRequest $request, ProductCatalog $productCatalog): RedirectResponse
    {
        $productCatalog->update([
            'name' => $request->input('name'),
            'slug' => $request->input('slug') ?: Str::slug($request->input('name')),
            'description' => $request->input('description'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Product catalog updated successfully.');
    }

    public function destroy(ProductCatalog $productCatalog): RedirectResponse
    {
        $productCatalog->delete();

        return redirect()
            ->back()
            ->with('success', 'Product catalog removed.');
    }

    public function bulkDestroy(BulkDestroyProductCatalogsRequest $request): RedirectResponse
    {
        ProductCatalog::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected catalogs removed successfully.');
    }

    public function assignProducts(AssignProductsToCatalogRequest $request, ProductCatalog $productCatalog): RedirectResponse
    {
        $productCatalog->products()->sync($request->validated('product_ids'));

        return redirect()
            ->back()
            ->with('success', 'Catalogue products updated.');
    }
}

