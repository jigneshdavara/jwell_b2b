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
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Brand $brand) {
                return [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'slug' => $brand->slug,
                    'description' => $brand->description,
                    'cover_image_path' => $brand->cover_image_path,
                    'cover_image_url' => $brand->cover_image_path ? Storage::url($brand->cover_image_path) : null,
                    'is_active' => $brand->is_active,
                ];
            });

        return Inertia::render('Admin/Brands/Index', [
            'brands' => $brands,
        ]);
    }

    public function store(StoreBrandRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $coverImagePath = null;

        if ($request->hasFile('cover_image')) {
            try {
                $file = $request->file('cover_image');
                $coverImagePath = $file->store('brands', 'public');

                // Verify the file was actually stored
                if (!Storage::disk('public')->exists($coverImagePath)) {
                    throw new \Exception('File was not stored successfully');
                }
            } catch (\Exception $e) {
                return redirect()
                    ->back()
                    ->withErrors(['cover_image' => 'Failed to upload image: ' . $e->getMessage()])
                    ->withInput();
            }
        }

        Brand::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'cover_image_path' => $coverImagePath,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Brand created successfully.');
    }

    public function update(UpdateBrandRequest $request, Brand $brand): RedirectResponse
    {
        $data = $request->validated();

        $updateData = [
            'name' => $data['name'],
            'slug' => $brand->name === $data['name'] ? $brand->slug : $this->uniqueSlug($data['name'], $brand->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ];

        // Only update image if a new file is uploaded
        if ($request->hasFile('cover_image')) {
            try {
                $file = $request->file('cover_image');

                // Delete old image if exists
                if ($brand->cover_image_path && Storage::disk('public')->exists($brand->cover_image_path)) {
                    Storage::disk('public')->delete($brand->cover_image_path);
                }

                $coverImagePath = $file->store('brands', 'public');

                // Verify the file was actually stored
                if (!Storage::disk('public')->exists($coverImagePath)) {
                    throw new \Exception('File was not stored successfully');
                }

                $updateData['cover_image_path'] = $coverImagePath;
            } catch (\Exception $e) {
                return redirect()
                    ->back()
                    ->withErrors(['cover_image' => 'Failed to upload image: ' . $e->getMessage()])
                    ->withInput();
            }
        }
        // If no new image is uploaded, cover_image_path is not included in updateData
        // This means the existing image path will be preserved

        $brand->update($updateData);

        return redirect()
            ->back()
            ->with('success', 'Brand updated successfully.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        // Delete associated image if exists
        if ($brand->cover_image_path) {
            Storage::disk('public')->delete($brand->cover_image_path);
        }

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

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            Brand::query()
            ->when($ignoreId, fn($query) => $query->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}
