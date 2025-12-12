<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondShapeSizesRequest;
use App\Http\Requests\Admin\StoreDiamondShapeSizeRequest;
use App\Http\Requests\Admin\UpdateDiamondShapeSizeRequest;
use App\Models\DiamondShape;
use App\Models\DiamondShapeSize;
use App\Models\DiamondType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DiamondShapeSizeController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $shapeId = request()->integer('shape_id');

        $sizes = DiamondShapeSize::query()
            ->when($shapeId, fn($query) => $query->where('diamond_shape_id', $shapeId))
            ->with(['type', 'shape:id,name,code'])
            ->orderBy('display_order')
            ->orderBy('size')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (DiamondShapeSize $size) {
                return [
                    'id' => $size->id,
                    'diamond_type_id' => $size->diamond_type_id,
                    'type' => $size->type ? [
                        'id' => $size->type->id,
                        'name' => $size->type->name,
                        'code' => $size->type->code,
                    ] : null,
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
            ->orderBy('display_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Diamond/ShapeSizes/Index', [
            'sizes' => $sizes,
            'shapes' => $shapes,
            'types' => DiamondType::where('is_active', true)->orderBy('display_order')->get(['id', 'name', 'code']),
            'selectedShapeId' => $shapeId,
        ]);
    }

    public function store(StoreDiamondShapeSizeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondShapeSize::create([
            'diamond_type_id' => $data['diamond_type_id'],
            'diamond_shape_id' => $data['diamond_shape_id'],
            'size' => $data['size'],
            'secondary_size' => $data['secondary_size'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'],
            'ctw' => $data['ctw'],
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond shape size created successfully.');
    }

    public function update(UpdateDiamondShapeSizeRequest $request, DiamondShapeSize $shapeSize): RedirectResponse
    {
        $data = $request->validated();

        $shapeSize->update([
            'diamond_type_id' => $data['diamond_type_id'],
            'diamond_shape_id' => $data['diamond_shape_id'],
            'size' => $data['size'],
            'secondary_size' => $data['secondary_size'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'],
            'ctw' => $data['ctw'],
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond shape size updated successfully.');
    }

    public function destroy(DiamondShapeSize $shapeSize): RedirectResponse
    {
        // Check if diamonds exist - if they do, prevent deletion
        if ($shapeSize->diamonds()->exists()) {
            return redirect()
                ->back()
                ->with('error', 'Cannot delete diamond shape size because it has associated diamonds. Please remove all diamonds first.');
        }

        // If no diamonds exist, delete the shape size
        $shapeSize->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond shape size removed successfully.');
    }

    public function bulkDestroy(BulkDestroyDiamondShapeSizesRequest $request): RedirectResponse
    {
        $ids = $request->validated('ids');
        $deletedCount = 0;
        $skippedCount = 0;

        foreach ($ids as $id) {
            $shapeSize = DiamondShapeSize::find($id);

            if (! $shapeSize) {
                continue;
            }

            // Check if diamonds exist - if they do, skip deletion
            if ($shapeSize->diamonds()->exists()) {
                $skippedCount++;
                continue;
            }

            // If no diamonds exist, delete the shape size
            $shapeSize->delete();

            $deletedCount++;
        }

        $messages = [];

        if ($deletedCount > 0) {
            $plural = $deletedCount === 1 ? '' : 's';
            $messages[] = "{$deletedCount} diamond shape size{$plural} deleted successfully.";
        }

        if ($skippedCount > 0) {
            $plural = $skippedCount === 1 ? '' : 's';
            $verb = $skippedCount === 1 ? 'it has' : 'they have';
            $messages[] = "{$skippedCount} diamond shape size{$plural} could not be deleted because {$verb} associated diamonds.";
        }

        return redirect()
            ->back()
            ->with($deletedCount > 0 ? 'success' : 'error', implode(' ', $messages));
    }
}
