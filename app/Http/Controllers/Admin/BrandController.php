<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyBrandsRequest;
use App\Http\Requests\Admin\StoreBrandRequest;
use App\Http\Requests\Admin\UpdateBrandRequest;
use App\Models\Brand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 20);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 20;
        }

        $brands = Brand::query()
            ->withCount('products')
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Brand $brand) {
                return [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'slug' => $brand->slug,
                    'description' => $brand->description,
                    'cover_image_url' => $brand->cover_image_path ? Storage::url($brand->cover_image_path) : null,
                    'is_active' => $brand->is_active,
                    'products_count' => $brand->products_count,
                ];
            });

        return Inertia::render('Admin/Catalog/Brands/Index', [
            'brands' => $brands,
        ]);
    }

    public function store(StoreBrandRequest $request): RedirectResponse
    {
        $coverImagePath = $request->file('cover_image')
            ? $request->file('cover_image')->store('brand-covers', 'public')
            : null;

        Brand::create([
            'name' => $request->input('name'),
            'slug' => $request->input('slug') ?: Str::slug($request->input('name')),
            'description' => $request->input('description'),
            'cover_image_path' => $coverImagePath,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Brand created successfully.');
    }

    public function update(UpdateBrandRequest $request, Brand $brand): RedirectResponse
    {
        $payload = [
            'name' => $request->input('name'),
            'slug' => $request->input('slug') ?: Str::slug($request->input('name')),
            'description' => $request->input('description'),
            'is_active' => $request->boolean('is_active', true),
        ];

        if ($request->boolean('remove_cover_image')) {
            if ($brand->cover_image_path) {
                Storage::disk('public')->delete($brand->cover_image_path);
            }

            $payload['cover_image_path'] = null;
        }

        if ($request->hasFile('cover_image')) {
            if ($brand->cover_image_path) {
                Storage::disk('public')->delete($brand->cover_image_path);
            }

            $payload['cover_image_path'] = $request->file('cover_image')->store('brand-covers', 'public');
        }

        $brand->update($payload);

        return redirect()
            ->back()
            ->with('success', 'Brand updated successfully.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        $brand->delete();

        return redirect()
            ->back()
            ->with('success', 'Brand removed.');
    }

    public function bulkDestroy(BulkDestroyBrandsRequest $request): RedirectResponse
    {
        Brand::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected brands deleted successfully.');
    }
}
