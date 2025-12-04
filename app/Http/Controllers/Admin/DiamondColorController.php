<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondColorsRequest;
use App\Http\Requests\Admin\StoreDiamondColorRequest;
use App\Http\Requests\Admin\UpdateDiamondColorRequest;
use App\Models\DiamondColor;
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
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (DiamondColor $color) {
                return [
                    'id' => $color->id,
                    'code' => $color->code,
                    'name' => $color->name,
                    'ecat_name' => $color->ecat_name,
                    'description' => $color->description,
                    'display_order' => $color->display_order,
                    'is_active' => $color->is_active,
                ];
            });

        return Inertia::render('Admin/Diamond/Colors/Index', [
            'colors' => $colors,
        ]);
    }

    public function store(StoreDiamondColorRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondColor::create([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'ecat_name' => $data['ecat_name'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
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
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'ecat_name' => $data['ecat_name'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond color updated successfully.');
    }

    public function destroy(DiamondColor $color): RedirectResponse
    {
        $color->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond color removed.');
    }

    public function bulkDestroy(BulkDestroyDiamondColorsRequest $request): RedirectResponse
    {
        DiamondColor::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected diamond colors deleted successfully.');
    }
}
