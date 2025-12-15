<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondColorsRequest;
use App\Http\Requests\Admin\StoreDiamondColorRequest;
use App\Http\Requests\Admin\UpdateDiamondColorRequest;
use App\Models\DiamondColor;
use App\Models\DiamondType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DiamondColorController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $colors = DiamondColor::query()
            ->with('type')
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (DiamondColor $color) {
                return [
                    'id' => $color->id,
                    'diamond_type_id' => $color->diamond_type_id,
                    'type' => $color->type ? [
                        'id' => $color->type->id,
                        'name' => $color->type->name,
                        'code' => $color->type->code,
                    ] : null,
                    'code' => $color->code,
                    'name' => $color->name,
                    'description' => $color->description,
                    'display_order' => $color->display_order,
                    'is_active' => $color->is_active,
                ];
            });

        return Inertia::render('Admin/Diamond/Colors/Index', [
            'colors' => $colors,
            'types' => DiamondType::where('is_active', true)->orderBy('display_order')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(StoreDiamondColorRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondColor::create([
            'diamond_type_id' => $data['diamond_type_id'],
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond color created successfully.');
    }

    public function update(UpdateDiamondColorRequest $request, DiamondColor $color): RedirectResponse
    {
        $data = $request->validated();

        $color->update([
            'diamond_type_id' => $data['diamond_type_id'],
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond color updated successfully.');
    }

    public function destroy(DiamondColor $color): RedirectResponse
    {
        // Check if diamonds exist - if they do, prevent deletion
        if ($color->diamonds()->exists()) {
            return redirect()
                ->back()
                ->with('error', 'Cannot delete diamond color because it has associated diamonds. Please remove all diamonds first.');
        }

        // If no diamonds exist, delete the color
        $color->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond color removed successfully.');
    }

    public function bulkDestroy(BulkDestroyDiamondColorsRequest $request): RedirectResponse
    {
        $ids = $request->validated('ids');
        $deletedCount = 0;
        $skippedCount = 0;

        foreach ($ids as $id) {
            $color = DiamondColor::find($id);

            if (! $color) {
                continue;
            }

            // Check if diamonds exist - if they do, skip deletion
            if ($color->diamonds()->exists()) {
                $skippedCount++;
                continue;
            }

            // If no diamonds exist, delete the color
            $color->delete();

            $deletedCount++;
        }

        $messages = [];

        if ($deletedCount > 0) {
            $plural = $deletedCount === 1 ? '' : 's';
            $messages[] = "{$deletedCount} diamond color{$plural} deleted successfully.";
        }

        if ($skippedCount > 0) {
            $plural = $skippedCount === 1 ? '' : 's';
            $verb = $skippedCount === 1 ? 'it has' : 'they have';
            $messages[] = "{$skippedCount} diamond color{$plural} could not be deleted because {$verb} associated diamonds.";
        }

        return redirect()
            ->back()
            ->with($deletedCount > 0 ? 'success' : 'error', implode(' ', $messages));
    }
}
