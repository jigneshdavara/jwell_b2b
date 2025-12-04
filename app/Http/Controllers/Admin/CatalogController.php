<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssignProductsToCatalogRequest;
use App\Http\Requests\Admin\BulkDestroyCatalogsRequest;
use App\Http\Requests\Admin\StoreCatalogRequest;
use App\Http\Requests\Admin\UpdateCatalogRequest;
use App\Models\Catalog;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $catalogs = Catalog::query()
            ->withCount('products')
            ->with('products:id')
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Catalog $catalog) {
                return [
                    'id' => $catalog->id,
                    'code' => $catalog->code,
                    'name' => $catalog->name,
                    'description' => $catalog->description,
                    'is_active' => $catalog->is_active,
                    'display_order' => $catalog->display_order,
                    'products_count' => $catalog->products_count,
                    'product_ids' => $catalog->products->pluck('id')->toArray(),
                ];
            });

        return Inertia::render('Admin/Catalogs/Index', [
            'catalogs' => $catalogs,
        ]);
    }

    public function store(StoreCatalogRequest $request): RedirectResponse
    {
        Catalog::create([
            'code' => $request->input('code'),
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $request->input('display_order', 0),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Catalog created successfully.');
    }

    public function update(UpdateCatalogRequest $request, Catalog $catalog): RedirectResponse
    {
        $catalog->update([
            'code' => $request->input('code'),
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $request->input('display_order', 0),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Catalog updated successfully.');
    }

    public function destroy(Catalog $catalog): RedirectResponse
    {
        $catalog->delete();

        return redirect()
            ->back()
            ->with('success', 'Catalog removed.');
    }

    public function bulkDestroy(BulkDestroyCatalogsRequest $request): RedirectResponse
    {
        Catalog::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected catalogs deleted successfully.');
    }

    public function showAssignProducts(Catalog $catalog): Response
    {
        $catalog->load('products:id');
        $selectedProductIds = $catalog->products->pluck('id')->toArray();

        $query = Product::query()
            ->select(['id', 'name', 'sku'])
            ->orderBy('name');

        if (request()->filled('search')) {
            $search = request('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $products = $query->get()
            ->map(function (Product $product) use ($selectedProductIds) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'selected' => in_array($product->id, $selectedProductIds),
                ];
            });

        return Inertia::render('Admin/Catalogs/AssignProducts', [
            'catalog' => [
                'id' => $catalog->id,
                'name' => $catalog->name,
            ],
            'products' => $products,
            'selectedProductIds' => $selectedProductIds,
            'filters' => [
                'search' => request('search', ''),
            ],
        ]);
    }

    public function assignProducts(AssignProductsToCatalogRequest $request, Catalog $catalog): RedirectResponse
    {
        $validated = $request->validated();
        $productIds = $this->sanitizeIds($validated['product_ids'] ?? []);

        $catalog->products()->sync($productIds);

        return redirect()
            ->route('admin.catalogs.index')
            ->with('success', 'Catalog products updated successfully.');
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
}
