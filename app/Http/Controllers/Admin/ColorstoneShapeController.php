<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyColorstoneShapesRequest;
use App\Http\Requests\Admin\StoreColorstoneShapeRequest;
use App\Http\Requests\Admin\UpdateColorstoneShapeRequest;
use App\Models\ColorstoneShape;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ColorstoneShapeController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $shapes = ColorstoneShape::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (ColorstoneShape $shape) {
                return [
                    'id' => $shape->id,
                    'code' => $shape->code,
                    'name' => $shape->name,
                    'description' => $shape->description,
                    'display_order' => $shape->display_order,
                    'is_active' => $shape->is_active,
                ];
            });

        return Inertia::render('Admin/Colorstone/Shapes/Index', [
            'shapes' => $shapes,
        ]);
    }

    public function store(StoreColorstoneShapeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        ColorstoneShape::create([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Colorstone shape created successfully.');
    }

    public function update(UpdateColorstoneShapeRequest $request, ColorstoneShape $shape): RedirectResponse
    {
        $data = $request->validated();

        $shape->update([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Colorstone shape updated successfully.');
    }

    public function destroy(ColorstoneShape $shape): RedirectResponse
    {
        $shape->delete();

        return redirect()
            ->back()
            ->with('success', 'Colorstone shape removed.');
    }

    public function bulkDestroy(BulkDestroyColorstoneShapesRequest $request): RedirectResponse
    {
        ColorstoneShape::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected colorstone shapes deleted successfully.');
    }
}
