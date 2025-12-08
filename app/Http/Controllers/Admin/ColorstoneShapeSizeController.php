<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyColorstoneShapeSizesRequest;
use App\Http\Requests\Admin\StoreColorstoneShapeSizeRequest;
use App\Http\Requests\Admin\UpdateColorstoneShapeSizeRequest;
use App\Models\ColorstoneShape;
use App\Models\ColorstoneShapeSize;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ColorstoneShapeSizeController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $shapeId = request()->integer('shape_id');

        $sizes = ColorstoneShapeSize::query()
            ->when($shapeId, fn($query) => $query->where('colorstone_shape_id', $shapeId))
            ->with('shape:id,name,code')
            ->orderBy('display_order')
            ->orderBy('size')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (ColorstoneShapeSize $size) {
                return [
                    'id' => $size->id,
                    'colorstone_shape_id' => $size->colorstone_shape_id,
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

        $shapes = ColorstoneShape::query()
            ->where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Colorstone/ShapeSizes/Index', [
            'sizes' => $sizes,
            'shapes' => $shapes,
            'selectedShapeId' => $shapeId,
        ]);
    }

    public function store(StoreColorstoneShapeSizeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        ColorstoneShapeSize::create([
            'colorstone_shape_id' => $data['colorstone_shape_id'],
            'size' => $data['size'] ?? null,
            'secondary_size' => $data['secondary_size'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'ctw' => $data['ctw'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Colorstone shape size created successfully.');
    }

    public function update(UpdateColorstoneShapeSizeRequest $request, ColorstoneShapeSize $shapeSize): RedirectResponse
    {
        $data = $request->validated();

        $shapeSize->update([
            'colorstone_shape_id' => $data['colorstone_shape_id'],
            'size' => $data['size'] ?? null,
            'secondary_size' => $data['secondary_size'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'ctw' => $data['ctw'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Colorstone shape size updated successfully.');
    }

    public function destroy(ColorstoneShapeSize $shapeSize): RedirectResponse
    {
        $shapeSize->delete();

        return redirect()
            ->back()
            ->with('success', 'Colorstone shape size removed.');
    }

    public function bulkDestroy(BulkDestroyColorstoneShapeSizesRequest $request): RedirectResponse
    {
        ColorstoneShapeSize::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected colorstone shape sizes deleted successfully.');
    }
}
