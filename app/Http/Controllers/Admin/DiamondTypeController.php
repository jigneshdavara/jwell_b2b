<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondTypesRequest;
use App\Http\Requests\Admin\StoreDiamondTypeRequest;
use App\Http\Requests\Admin\UpdateDiamondTypeRequest;
use App\Models\DiamondType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DiamondTypeController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $types = DiamondType::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (DiamondType $type) {
                return [
                    'id' => $type->id,
                    'code' => $type->code,
                    'name' => $type->name,
                    'description' => $type->description,
                    'is_active' => $type->is_active,
                    'display_order' => $type->display_order,
                ];
            });

        return Inertia::render('Admin/Diamond/Types/Index', [
            'types' => $types,
        ]);
    }

    public function store(StoreDiamondTypeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondType::create([
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond type created successfully.');
    }

    public function update(UpdateDiamondTypeRequest $request, DiamondType $type): RedirectResponse
    {
        $data = $request->validated();

        $type->update([
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond type updated successfully.');
    }

    public function destroy(DiamondType $type): RedirectResponse
    {
        // Check if diamonds exist - if they do, prevent deletion
        if ($type->diamonds()->exists()) {
            return redirect()
                ->back()
                ->with('error', 'Cannot delete diamond type because it has associated diamonds. Please remove all diamonds first.');
        }

        // If no diamonds exist, cascade delete all related data
        // Delete in order to respect foreign key constraints
        $type->shapeSizes()->delete(); // Delete shape sizes first (they may reference shapes)
        $type->shapes()->delete();     // Delete shapes
        $type->clarities()->delete();  // Delete clarities
        $type->colors()->delete();     // Delete colors
        $type->delete();               // Finally delete the type

        return redirect()
            ->back()
            ->with('success', 'Diamond type and all related data (clarities, colors, shapes, shape sizes) removed successfully.');
    }

    public function bulkDestroy(BulkDestroyDiamondTypesRequest $request): RedirectResponse
    {
        $ids = $request->validated('ids');
        $deletedCount = 0;
        $skippedCount = 0;

        foreach ($ids as $id) {
            $type = DiamondType::find($id);

            if (! $type) {
                continue;
            }

            // Check if diamonds exist - if they do, skip deletion
            if ($type->diamonds()->exists()) {
                $skippedCount++;
                continue;
            }

            // If no diamonds exist, cascade delete all related data
            $type->shapeSizes()->delete();
            $type->shapes()->delete();
            $type->clarities()->delete();
            $type->colors()->delete();
            $type->delete();

            $deletedCount++;
        }

        $messages = [];

        if ($deletedCount > 0) {
            $messages[] = "{$deletedCount} diamond type(s) and all related data deleted successfully.";
        }

        if ($skippedCount > 0) {
            $messages[] = "{$skippedCount} diamond type(s) could not be deleted because they have associated diamonds.";
        }

        return redirect()
            ->back()
            ->with($deletedCount > 0 ? 'success' : 'error', implode(' ', $messages));
    }
}
