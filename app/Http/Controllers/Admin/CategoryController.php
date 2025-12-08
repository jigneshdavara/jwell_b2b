<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyCategoriesRequest;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $categories = Category::query()
            ->with('parent:id,name')
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Category $category) {
                return [
                    'id' => $category->id,
                    'parent_id' => $category->parent_id,
                    'parent' => $category->parent ? ['id' => $category->parent->id, 'name' => $category->parent->name] : null,
                    'code' => $category->code,
                    'name' => $category->name,
                    'description' => $category->description,
                    'is_active' => $category->is_active,
                    'display_order' => $category->display_order,
                    'cover_image' => $category->cover_image,
                    'cover_image_url' => $category->cover_image ? Storage::url($category->cover_image) : null,
                ];
            });

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'parentCategories' => Category::query()
                ->whereNull('parent_id')
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn(Category $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                ])
                ->all(),
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $coverImagePath = null;

        if ($request->hasFile('cover_image')) {
            try {
                $file = $request->file('cover_image');
                $coverImagePath = $file->store('categories', 'public');

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

        Category::create([
            'parent_id' => $data['parent_id'] ?? null,
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'] ?? 0,
            'cover_image' => $coverImagePath,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Category created successfully.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $data = $request->validated();

        $updateData = [
            'parent_id' => $data['parent_id'] ?? null,
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'] ?? 0,
        ];

        // Handle file upload
        if ($request->hasFile('cover_image')) {
            try {
                $file = $request->file('cover_image');

                // Delete old image if exists
                if ($category->cover_image && Storage::disk('public')->exists($category->cover_image)) {
                    Storage::disk('public')->delete($category->cover_image);
                }

                $coverImagePath = $file->store('categories', 'public');

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
            if ($category->cover_image && Storage::disk('public')->exists($category->cover_image)) {
                Storage::disk('public')->delete($category->cover_image);
            }
            $updateData['cover_image'] = null;
        }
        // If no new image is uploaded and remove flag is not set, cover_image is not included in updateData
        // This means the existing image path will be preserved

        $category->update($updateData);

        return redirect()
            ->back()
            ->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        // Delete associated image if exists
        if ($category->cover_image) {
            Storage::disk('public')->delete($category->cover_image);
        }

        $category->delete();

        return redirect()
            ->back()
            ->with('success', 'Category removed.');
    }

    public function bulkDestroy(BulkDestroyCategoriesRequest $request): RedirectResponse
    {
        Category::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected categories deleted successfully.');
    }
}
