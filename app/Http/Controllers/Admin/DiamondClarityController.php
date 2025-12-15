<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondClaritiesRequest;
use App\Http\Requests\Admin\StoreDiamondClarityRequest;
use App\Http\Requests\Admin\UpdateDiamondClarityRequest;
use App\Models\DiamondClarity;
use App\Models\DiamondType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DiamondClarityController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $clarities = DiamondClarity::query()
            ->with('type')
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (DiamondClarity $clarity) {
                return [
                    'id' => $clarity->id,
                    'diamond_type_id' => $clarity->diamond_type_id,
                    'type' => $clarity->type ? [
                        'id' => $clarity->type->id,
                        'name' => $clarity->type->name,
                        'code' => $clarity->type->code,
                    ] : null,
                    'code' => $clarity->code,
                    'name' => $clarity->name,
                    'description' => $clarity->description,
                    'display_order' => $clarity->display_order,
                    'is_active' => $clarity->is_active,
                ];
            });

        return Inertia::render('Admin/Diamond/Clarities/Index', [
            'clarities' => $clarities,
            'types' => DiamondType::where('is_active', true)->orderBy('display_order')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(StoreDiamondClarityRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondClarity::create([
            'diamond_type_id' => $data['diamond_type_id'],
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond clarity created successfully.');
    }

    public function update(UpdateDiamondClarityRequest $request, DiamondClarity $clarity): RedirectResponse
    {
        $data = $request->validated();

        $clarity->update([
            'diamond_type_id' => $data['diamond_type_id'],
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond clarity updated successfully.');
    }

    public function destroy(DiamondClarity $clarity): RedirectResponse
    {
        // Check if diamonds exist - if they do, prevent deletion
        if ($clarity->diamonds()->exists()) {
            return redirect()
                ->back()
                ->with('error', 'Cannot delete diamond clarity because it has associated diamonds. Please remove all diamonds first.');
        }

        // If no diamonds exist, delete the clarity
        $clarity->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond clarity removed successfully.');
    }

    public function bulkDestroy(BulkDestroyDiamondClaritiesRequest $request): RedirectResponse
    {
        $ids = $request->validated('ids');
        $deletedCount = 0;
        $skippedCount = 0;

        foreach ($ids as $id) {
            $clarity = DiamondClarity::find($id);

            if (! $clarity) {
                continue;
            }

            // Check if diamonds exist - if they do, skip deletion
            if ($clarity->diamonds()->exists()) {
                $skippedCount++;
                continue;
            }

            // If no diamonds exist, delete the clarity
            $clarity->delete();

            $deletedCount++;
        }

        $messages = [];

        if ($deletedCount > 0) {
            $plural = $deletedCount === 1 ? 'y' : 'ies';
            $messages[] = "{$deletedCount} diamond clarit{$plural} deleted successfully.";
        }

        if ($skippedCount > 0) {
            $plural = $skippedCount === 1 ? 'y' : 'ies';
            $verb = $skippedCount === 1 ? 'it has' : 'they have';
            $messages[] = "{$skippedCount} diamond clarit{$plural} could not be deleted because {$verb} associated diamonds.";
        }

        return redirect()
            ->back()
            ->with($deletedCount > 0 ? 'success' : 'error', implode(' ', $messages));
    }
}
