<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyBrandsRequest;
use App\Http\Requests\Admin\StoreBrandRequest;
use App\Http\Requests\Admin\UpdateBrandRequest;
use App\Models\Brand;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $brands = Brand::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Brand $brand) {
                return [
                    'id' => $brand->id,
                    'code' => $brand->code,
                    'name' => $brand->name,
                    'description' => $brand->description,
                    'is_active' => $brand->is_active,
                    'display_order' => $brand->display_order,
                    'cover_image' => $brand->cover_image ? Storage::url($brand->cover_image) : null,
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
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'],
            'cover_image' => $coverImagePath,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Brand created successfully.');
    }

    public function update(UpdateBrandRequest $request, Brand $brand): RedirectResponse
    {
        $data = $request->validated();

        $updateData = [
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'],
        ];

        // Handle file upload
        if ($request->hasFile('cover_image')) {
            try {
                $file = $request->file('cover_image');

                // Delete old image if exists
                if ($brand->cover_image && Storage::disk('public')->exists($brand->cover_image)) {
                    Storage::disk('public')->delete($brand->cover_image);
                }

                $coverImagePath = $file->store('brands', 'public');

                // Verify the file was actually stored
                if (!Storage::disk('public')->exists($coverImagePath)) {
                    throw new \Exception('File was not stored successfully');
                }

                $updateData['cover_image'] = $coverImagePath;
            } catch (\Exception $e) {
                return redirect()
                    ->back()
                    ->withErrors(['cover_image' => 'Failed to upload image: ' . $e->getMessage()])
                    ->withInput();
            }
        } elseif ($request->boolean('remove_cover_image', false)) {
            // Delete image if remove flag is set
            if ($brand->cover_image && Storage::disk('public')->exists($brand->cover_image)) {
                Storage::disk('public')->delete($brand->cover_image);
            }
            $updateData['cover_image'] = null;
        }
        // If no new image is uploaded and remove flag is not set, cover_image is not included in updateData
        // This means the existing image path will be preserved

        $brand->update($updateData);

        return redirect()
            ->back()
            ->with('success', 'Brand updated successfully.');
    }

    public function destroy(Brand $brand): RedirectResponse
    {
        // Delete associated image if exists
        if ($brand->cover_image) {
            Storage::disk('public')->delete($brand->cover_image);
        }

        $brand->delete();

        return redirect()
            ->back()
            ->with('success', 'Brand removed.');
    }

    public function bulkDestroy(BulkDestroyBrandsRequest $request): RedirectResponse
    {
        $brands = Brand::whereIn('id', $request->validated('ids'))->get();

        foreach ($brands as $brand) {
            if ($brand->cover_image) {
                Storage::disk('public')->delete($brand->cover_image);
            }
        }

        Brand::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected brands deleted successfully.');
    }
}
