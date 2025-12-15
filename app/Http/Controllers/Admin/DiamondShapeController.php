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
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'],
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
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond shape updated successfully.');
    }

    public function destroy(DiamondShape $shape): RedirectResponse
    {
        // Check if diamonds exist - if they do, prevent deletion
        if ($shape->diamonds()->exists()) {
            return redirect()
                ->back()
                ->with('error', 'Cannot delete diamond shape because it has associated diamonds. Please remove all diamonds first.');
        }

        // If no diamonds exist, delete the shape
        // Shape sizes will be automatically deleted due to cascadeOnDelete foreign key constraint
        $shape->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond shape and all related shape sizes removed successfully.');
    }

    public function bulkDestroy(BulkDestroyDiamondShapesRequest $request): RedirectResponse
    {
        $ids = $request->validated('ids');
        $deletedCount = 0;
        $skippedCount = 0;

        foreach ($ids as $id) {
            $shape = DiamondShape::find($id);

            if (! $shape) {
                continue;
            }

            // Check if diamonds exist - if they do, skip deletion
            if ($shape->diamonds()->exists()) {
                $skippedCount++;
                continue;
            }

            // If no diamonds exist, delete the shape
            // Shape sizes will be automatically deleted due to cascadeOnDelete
            $shape->delete();

            $deletedCount++;
        }

        $messages = [];

        if ($deletedCount > 0) {
            $messages[] = "{$deletedCount} diamond shape(s) and all related shape sizes deleted successfully.";
        }

        if ($skippedCount > 0) {
            $messages[] = "{$skippedCount} diamond shape(s) could not be deleted because they have associated diamonds.";
        }

        return redirect()
            ->back()
            ->with($deletedCount > 0 ? 'success' : 'error', implode(' ', $messages));
    }
}
