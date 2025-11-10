<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyMaterialsRequest;
use App\Http\Requests\Admin\StoreMaterialRequest;
use App\Http\Requests\Admin\UpdateMaterialRequest;
use App\Models\Material;
use App\Models\MaterialType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MaterialController extends Controller
{
    public function index(): Response
    {
        $materials = Material::query()
            ->with(['materialType'])
            ->withCount('products')
            ->latest()
            ->paginate(20)
            ->through(function (Material $material) {
                return [
                    'id' => $material->id,
                    'name' => $material->name,
                    'material_type_id' => $material->material_type_id,
                    'material_type_name' => $material->materialType?->name ?? $material->type,
                    'purity' => $material->purity,
                    'unit' => $material->unit,
                    'is_active' => $material->is_active,
                    'products_count' => $material->products_count,
                ];
            });

        return Inertia::render('Admin/Catalog/Materials/Index', [
            'materials' => $materials,
            'units' => Material::query()->select('unit')->whereNotNull('unit')->distinct()->orderBy('unit')->pluck('unit'),
            'materialTypes' => MaterialType::query()
                ->orderBy('name')
                ->get()
                ->map(fn (MaterialType $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'is_active' => $type->is_active,
                ])
                ->values(),
        ]);
    }

    public function store(StoreMaterialRequest $request): RedirectResponse
    {
        $materialType = $this->resolveMaterialType($request->input('material_type_id'));

        Material::create([
            'name' => $request->input('name'),
            'material_type_id' => $materialType?->id,
            'type' => $materialType?->name,
            'purity' => $request->input('purity'),
            'unit' => $request->input('unit'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Material created successfully.');
    }

    public function update(UpdateMaterialRequest $request, Material $material): RedirectResponse
    {
        $materialType = $this->resolveMaterialType($request->input('material_type_id'));

        $material->update([
            'name' => $request->input('name'),
            'material_type_id' => $materialType?->id,
            'type' => $materialType?->name,
            'purity' => $request->input('purity'),
            'unit' => $request->input('unit'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Material updated successfully.');
    }

    public function destroy(Material $material): RedirectResponse
    {
        $material->delete();

        return redirect()
            ->back()
            ->with('success', 'Material removed.');
    }

    public function bulkDestroy(BulkDestroyMaterialsRequest $request): RedirectResponse
    {
        Material::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected materials deleted successfully.');
    }

    protected function resolveMaterialType(null|int|string $materialTypeId): ?MaterialType
    {
        if (! $materialTypeId) {
            return null;
        }

        return MaterialType::query()->find((int) $materialTypeId);
    }
}
