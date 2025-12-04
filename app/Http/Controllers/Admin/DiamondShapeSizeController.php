<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondShapeSizesRequest;
use App\Http\Requests\Admin\StoreDiamondShapeSizeRequest;
use App\Http\Requests\Admin\UpdateDiamondShapeSizeRequest;
use App\Models\DiamondShape;
use App\Models\DiamondShapeSize;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DiamondShapeSizeController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 20);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 20;
        }

        $shapeId = request()->integer('shape_id');

        $sizes = DiamondShapeSize::query()
            ->when($shapeId, fn($query) => $query->where('diamond_shape_id', $shapeId))
            ->with('shape:id,name,code')
            ->orderBy('display_order')
            ->orderBy('size')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (DiamondShapeSize $size) {
                return [
                    'id' => $size->id,
                    'diamond_shape_id' => $size->diamond_shape_id,
                    'shape' => $size->shape ? [
                        'id' => $size->shape->id,
                        'name' => $size->shape->name,
                        'code' => $size->shape->code,
                    ] : null,
                    'size' => $size->size,
                    'secondary_size' => $size->secondary_size,
                    'description' => $size->description,
                    'display_order' => $size->display_order,
                    'ctw' => (float) $size->ctw,
                ];
            });

        $shapes = DiamondShape::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Diamond/ShapeSizes/Index', [
            'sizes' => $sizes,
            'shapes' => $shapes,
            'selectedShapeId' => $shapeId,
        ]);
    }

    public function store(StoreDiamondShapeSizeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondShapeSize::create([
            'diamond_shape_id' => $data['diamond_shape_id'],
            'size' => $data['size'] ?? null,
            'secondary_size' => $data['secondary_size'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'ctw' => $data['ctw'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond shape size created successfully.');
    }

    public function update(UpdateDiamondShapeSizeRequest $request, DiamondShapeSize $shapeSize): RedirectResponse
    {
        $data = $request->validated();

        $shapeSize->update([
            'diamond_shape_id' => $data['diamond_shape_id'],
            'size' => $data['size'] ?? null,
            'secondary_size' => $data['secondary_size'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'ctw' => $data['ctw'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond shape size updated successfully.');
    }

    public function destroy(DiamondShapeSize $shapeSize): RedirectResponse
    {
        $shapeSize->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond shape size removed.');
    }

    public function bulkDestroy(BulkDestroyDiamondShapeSizesRequest $request): RedirectResponse
    {
        DiamondShapeSize::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected diamond shape sizes deleted successfully.');
    }
}
