<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyColorstoneColorsRequest;
use App\Http\Requests\Admin\StoreColorstoneColorRequest;
use App\Http\Requests\Admin\UpdateColorstoneColorRequest;
use App\Models\ColorstoneColor;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ColorstoneColorController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $colors = ColorstoneColor::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (ColorstoneColor $color) {
                return [
                    'id' => $color->id,
                    'code' => $color->code,
                    'name' => $color->name,
                    'description' => $color->description,
                    'display_order' => $color->display_order,
                    'is_active' => $color->is_active,
                ];
            });

        return Inertia::render('Admin/Colorstone/Colors/Index', [
            'colors' => $colors,
        ]);
    }

    public function store(StoreColorstoneColorRequest $request): RedirectResponse
    {
        $data = $request->validated();

        ColorstoneColor::create([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Colorstone color created successfully.');
    }

    public function update(UpdateColorstoneColorRequest $request, ColorstoneColor $color): RedirectResponse
    {
        $data = $request->validated();

        $color->update([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Colorstone color updated successfully.');
    }

    public function destroy(ColorstoneColor $color): RedirectResponse
    {
        $color->delete();

        return redirect()
            ->back()
            ->with('success', 'Colorstone color removed.');
    }

    public function bulkDestroy(BulkDestroyColorstoneColorsRequest $request): RedirectResponse
    {
        ColorstoneColor::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected colorstone colors deleted successfully.');
    }
}
