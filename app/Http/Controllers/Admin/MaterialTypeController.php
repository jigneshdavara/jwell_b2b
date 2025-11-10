<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyMaterialTypesRequest;
use App\Http\Requests\Admin\StoreMaterialTypeRequest;
use App\Http\Requests\Admin\UpdateMaterialTypeRequest;
use App\Models\MaterialType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MaterialTypeController extends Controller
{
    public function index(): Response
    {
        $materialTypes = MaterialType::query()
            ->withCount('materials')
            ->orderBy('name')
            ->paginate(20)
            ->through(function (MaterialType $materialType) {
                return [
                    'id' => $materialType->id,
                    'name' => $materialType->name,
                    'slug' => $materialType->slug,
                    'description' => $materialType->description,
                    'is_active' => $materialType->is_active,
                    'materials_count' => $materialType->materials_count,
                ];
            });

        return Inertia::render('Admin/Catalog/MaterialTypes/Index', [
            'materialTypes' => $materialTypes,
        ]);
    }

    public function store(StoreMaterialTypeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        MaterialType::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Material type created successfully.');
    }

    public function update(UpdateMaterialTypeRequest $request, MaterialType $materialType): RedirectResponse
    {
        $data = $request->validated();

        $materialType->update([
            'name' => $data['name'],
            'slug' => $materialType->name === $data['name'] ? $materialType->slug : $this->uniqueSlug($data['name'], $materialType->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Material type updated successfully.');
    }

    public function destroy(MaterialType $materialType): RedirectResponse
    {
        $materialType->delete();

        return redirect()
            ->back()
            ->with('success', 'Material type removed.');
    }

    public function bulkDestroy(BulkDestroyMaterialTypesRequest $request): RedirectResponse
    {
        MaterialType::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected material types deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            MaterialType::query()
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}

