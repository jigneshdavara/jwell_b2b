<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyCategoriesRequest;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        $filters = request()->only(['search', 'status', 'parent_id']);
        $perPage = (int) request('per_page', 20);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 20;
        }

        $allCategories = Category::select('id', 'name', 'parent_id')->get()->keyBy('id');

        $depthCache = [];

        $categories = Category::query()
            ->with(['parent'])
            ->withCount(['products', 'children'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null, function ($query, $status) {
                if ($status === 'active') {
                    $query->where('is_active', true);
                }

                if ($status === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->when($filters['parent_id'] ?? null, function ($query, $parentId) {
                $query->where('parent_id', $parentId === 'root' ? null : $parentId);
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Category $category) use ($allCategories, &$depthCache) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'cover_image_url' => $category->cover_image_path ? Storage::url($category->cover_image_path) : null,
                    'is_active' => $category->is_active,
                    'products_count' => $category->products_count,
                    'parent_id' => $category->parent_id,
                    'parent_name' => optional($category->parent)->name,
                    'depth' => $this->depthFor($allCategories, $category, $depthCache),
                    'children_count' => $category->children_count,
                ];
            });

        return Inertia::render('Admin/Catalog/Categories/Index', [
            'categories' => $categories,
            'filters' => $filters,
            'parents' => $this->parentOptions($allCategories),
        ]);
    }

    protected function parentOptions(Collection $categories): Collection
    {
        $depthCache = [];

        return $categories
            ->sortBy('name')
            ->map(function (Category $category) use ($categories, &$depthCache) {
                $depth = $this->depthFor($categories, $category, $depthCache);
                return [
                    'id' => $category->id,
                    'name' => str_repeat('— ', $depth).$category->name,
                ];
            })
            ->values();
    }

    protected function depthFor(Collection $categories, Category $category, array &$cache): int
    {
        if (isset($cache[$category->id])) {
            return $cache[$category->id];
        }

        $depth = 0;
        $currentParentId = $category->parent_id;

        while ($currentParentId && $categories->has($currentParentId)) {
            if (isset($cache[$currentParentId])) {
                $depth += $cache[$currentParentId] + 1;
                $currentParentId = null;
                break;
            }

            $depth++;
            $currentParent = $categories->get($currentParentId);
            $currentParentId = $currentParent?->parent_id;
        }

        return $cache[$category->id] = $depth;
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $coverImagePath = $request->file('cover_image')
            ? $request->file('cover_image')->store('category-covers', 'public')
            : null;

        Category::create([
            'name' => $request->input('name'),
            'slug' => $request->input('slug') ?: Str::slug($request->input('name')),
            'description' => $request->input('description'),
            'parent_id' => $request->input('parent_id') ?: null,
            'cover_image_path' => $coverImagePath,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Category created successfully.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $payload = [
            'name' => $request->input('name'),
            'slug' => $request->input('slug') ?: Str::slug($request->input('name')),
            'description' => $request->input('description'),
            'parent_id' => $request->input('parent_id') ?: null,
            'is_active' => $request->boolean('is_active', true),
        ];

        if ($request->boolean('remove_cover_image')) {
            if ($category->cover_image_path) {
                Storage::disk('public')->delete($category->cover_image_path);
            }

            $payload['cover_image_path'] = null;
        }

        if ($request->hasFile('cover_image')) {
            if ($category->cover_image_path) {
                Storage::disk('public')->delete($category->cover_image_path);
            }

            $payload['cover_image_path'] = $request->file('cover_image')->store('category-covers', 'public');
        }

        $category->update($payload);

        return redirect()
            ->back()
            ->with('success', 'Category updated successfully.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->children()->exists()) {
            return redirect()
                ->back()
                ->with('error', 'This category has subcategories. Reassign or delete them first.');
        }

        $category->delete();

        return redirect()
            ->back()
            ->with('success', 'Category removed.');
    }

    public function bulkDestroy(BulkDestroyCategoriesRequest $request): RedirectResponse
    {
        $ids = collect($request->validated('ids'));

        $blocked = Category::whereIn('parent_id', $ids)->exists();

        if ($blocked) {
            return redirect()
                ->back()
                ->with('error', 'One or more selected categories have subcategories. Clear them first.');
        }

        Category::whereIn('id', $ids)->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected categories deleted successfully.');
    }
}
