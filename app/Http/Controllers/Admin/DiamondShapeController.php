<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondShapesRequest;
use App\Http\Requests\Admin\StoreDiamondShapeRequest;
use App\Http\Requests\Admin\UpdateDiamondShapeRequest;
use App\Models\DiamondShape;
use App\Models\DiamondType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DiamondShapeController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $shapes = DiamondShape::query()
            ->with('type')
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (DiamondShape $shape) {
                return [
                    'id' => $shape->id,
                    'diamond_type_id' => $shape->diamond_type_id,
                    'type' => $shape->type ? [
                        'id' => $shape->type->id,
                        'name' => $shape->type->name,
                        'code' => $shape->type->code,
                    ] : null,
                    'code' => $shape->code,
                    'name' => $shape->name,
                    'ecat_name' => $shape->ecat_name,
                    'description' => $shape->description,
                    'is_active' => $shape->is_active,
                    'display_order' => $shape->display_order,
                ];
            });

        return Inertia::render('Admin/Diamond/Shapes/Index', [
            'shapes' => $shapes,
            'types' => DiamondType::where('is_active', true)->orderBy('display_order')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(StoreDiamondShapeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondShape::create([
            'diamond_type_id' => $data['diamond_type_id'],
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'ecat_name' => $data['ecat_name'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond shape created successfully.');
    }

    public function update(UpdateDiamondShapeRequest $request, DiamondShape $shape): RedirectResponse
    {
        $data = $request->validated();

        $shape->update([
            'diamond_type_id' => $data['diamond_type_id'],
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'ecat_name' => $data['ecat_name'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond shape updated successfully.');
    }

    public function destroy(DiamondShape $shape): RedirectResponse
    {
        $shape->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond shape removed.');
    }

    public function bulkDestroy(BulkDestroyDiamondShapesRequest $request): RedirectResponse
    {
        DiamondShape::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected diamond shapes deleted successfully.');
    }
}
