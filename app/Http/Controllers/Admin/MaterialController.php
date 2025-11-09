<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMaterialRequest;
use App\Http\Requests\Admin\UpdateMaterialRequest;
use App\Models\Material;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MaterialController extends Controller
{
    public function index(): Response
    {
        $materials = Material::query()
            ->withCount('products')
            ->latest()
            ->paginate(20)
            ->through(function (Material $material) {
                return [
                    'id' => $material->id,
                    'name' => $material->name,
                    'type' => $material->type,
                    'purity' => $material->purity,
                    'unit' => $material->unit,
                    'is_active' => $material->is_active,
                    'products_count' => $material->products_count,
                ];
            });

        return Inertia::render('Admin/Catalog/Materials/Index', [
            'materials' => $materials,
            'units' => Material::query()->select('unit')->whereNotNull('unit')->distinct()->orderBy('unit')->pluck('unit'),
            'types' => Material::query()->select('type')->whereNotNull('type')->distinct()->orderBy('type')->pluck('type'),
        ]);
    }

    public function store(StoreMaterialRequest $request): RedirectResponse
    {
        Material::create([
            'name' => $request->input('name'),
            'type' => $request->input('type'),
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
        $material->update([
            'name' => $request->input('name'),
            'type' => $request->input('type'),
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
}
