<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyCategoriesRequest;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use App\Models\Style;
use App\Models\Size;
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
            ->with(['parent:id,name', 'styles:id,name', 'sizes:id,name'])
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
                    'styles' => $category->styles->map(fn($style) => ['id' => $style->id, 'name' => $style->name]),
                    'sizes' => $category->sizes->map(fn($size) => ['id' => $size->id, 'name' => $size->name]),
                ];
            });

        // Get all active categories for parent selection in tree structure
        $allCategories = Category::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id']);

        // Build tree structure - first create all nodes, then organize
        $nodes = [];
        foreach ($allCategories as $category) {
            $nodes[$category->id] = [
                'id' => $category->id,
                'name' => $category->name,
                'parent_id' => $category->parent_id,
                'children' => [],
            ];
        }

        // Build tree by linking children to parents
        $tree = [];
        foreach ($nodes as $node) {
            if ($node['parent_id'] === null) {
                $tree[] = &$nodes[$node['id']];
            } else {
                if (isset($nodes[$node['parent_id']])) {
                    $nodes[$node['parent_id']]['children'][] = &$nodes[$node['id']];
                }
            }
        }

        // Flatten tree for select options with indentation
        $parentCategories = $this->flattenCategoryTree($tree);

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'parentCategories' => $parentCategories,
            'categoryTree' => $tree,
            'styles' => Style::query()
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn(Style $style) => [
                    'id' => $style->id,
                    'name' => $style->name,
                ])
                ->all(),
            'sizes' => Size::query()
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn(Size $size) => [
                    'id' => $size->id,
                    'name' => $size->name,
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

        $category = Category::create([
            'parent_id' => $data['parent_id'] ?? null,
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'] ?? 0,
            'cover_image' => $coverImagePath,
        ]);

        // Sync styles and sizes
        if (isset($data['style_ids'])) {
            $category->styles()->sync($data['style_ids']);
        }

        if (isset($data['size_ids'])) {
            $category->sizes()->sync($data['size_ids']);
        }

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

        // Sync styles and sizes
        if (isset($data['style_ids'])) {
            $category->styles()->sync($data['style_ids']);
        }

        if (isset($data['size_ids'])) {
            $category->sizes()->sync($data['size_ids']);
        }

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

    private function flattenCategoryTree(array $tree, int $level = 0): array
    {
        $result = [];
        $prefix = $level > 0 ? str_repeat('  ', $level) . '└─ ' : '';

        foreach ($tree as $node) {
            $result[] = [
                'id' => $node['id'],
                'name' => $prefix . $node['name'],
                'level' => $level,
            ];

            if (!empty($node['children'])) {
                $result = array_merge($result, $this->flattenCategoryTree($node['children'], $level + 1));
            }
        }

        return $result;
    }
}
