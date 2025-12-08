<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyColorstonesRequest;
use App\Http\Requests\Admin\StoreColorstoneRequest;
use App\Http\Requests\Admin\UpdateColorstoneRequest;
use App\Models\Colorstone;
use App\Models\ColorstoneColor;
use App\Models\ColorstoneQuality;
use App\Models\ColorstoneShape;
use App\Models\ColorstoneShapeSize;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ColorstoneController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $colorstones = Colorstone::query()
            ->with(['color', 'quality', 'shape', 'shapeSize'])
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Colorstone $colorstone) {
                return [
                    'id' => $colorstone->id,
                    'name' => $colorstone->name,
                    'color' => $colorstone->color ? [
                        'id' => $colorstone->color->id,
                        'name' => $colorstone->color->name,
                        'code' => $colorstone->color->code,
                    ] : null,
                    'quality' => $colorstone->quality ? [
                        'id' => $colorstone->quality->id,
                        'name' => $colorstone->quality->name,
                        'code' => $colorstone->quality->code,
                    ] : null,
                    'shape' => $colorstone->shape ? [
                        'id' => $colorstone->shape->id,
                        'name' => $colorstone->shape->name,
                        'code' => $colorstone->shape->code,
                    ] : null,
                    'shape_size' => $colorstone->shapeSize ? [
                        'id' => $colorstone->shapeSize->id,
                        'size' => $colorstone->shapeSize->size,
                        'secondary_size' => $colorstone->shapeSize->secondary_size,
                        'ctw' => (float) $colorstone->shapeSize->ctw,
                    ] : null,
                    'price' => (float) $colorstone->price,
                    'description' => $colorstone->description,
                    'is_active' => $colorstone->is_active,
                ];
            });

        return Inertia::render('Admin/Colorstone/Colorstones/Index', [
            'colorstones' => $colorstones,
            'colors' => ColorstoneColor::where('is_active', true)->orderBy('display_order')->get(['id', 'name', 'code']),
            'qualities' => ColorstoneQuality::where('is_active', true)->orderBy('display_order')->get(['id', 'name', 'code']),
            'shapes' => ColorstoneShape::where('is_active', true)->orderBy('display_order')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(StoreColorstoneRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Colorstone::create([
            'name' => $data['name'],
            'colorstone_color_id' => $data['colorstone_color_id'] ?? null,
            'colorstone_quality_id' => $data['colorstone_quality_id'] ?? null,
            'colorstone_shape_id' => $data['colorstone_shape_id'] ?? null,
            'colorstone_shape_size_id' => $data['colorstone_shape_size_id'] ?? null,
            'price' => $data['price'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Colorstone created successfully.');
    }

    public function update(UpdateColorstoneRequest $request, Colorstone $colorstone): RedirectResponse
    {
        $data = $request->validated();

        $colorstone->update([
            'name' => $data['name'],
            'colorstone_color_id' => $data['colorstone_color_id'] ?? null,
            'colorstone_quality_id' => $data['colorstone_quality_id'] ?? null,
            'colorstone_shape_id' => $data['colorstone_shape_id'] ?? null,
            'colorstone_shape_size_id' => $data['colorstone_shape_size_id'] ?? null,
            'price' => $data['price'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Colorstone updated successfully.');
    }

    public function destroy(Colorstone $colorstone): RedirectResponse
    {
        $colorstone->delete();

        return redirect()
            ->back()
            ->with('success', 'Colorstone removed.');
    }

    public function bulkDestroy(BulkDestroyColorstonesRequest $request): RedirectResponse
    {
        Colorstone::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected colorstones deleted successfully.');
    }

    public function getShapeSizes(int $shapeId)
    {
        $shapeSizes = ColorstoneShapeSize::where('colorstone_shape_id', $shapeId)
            ->orderBy('display_order')
            ->get(['id', 'size', 'secondary_size', 'ctw']);

        return response()->json($shapeSizes->map(function ($size) {
            return [
                'id' => $size->id,
                'size' => $size->size,
                'secondary_size' => $size->secondary_size,
                'ctw' => (float) $size->ctw,
                'label' => trim(($size->size ?? '') . ' ' . ($size->secondary_size ?? '')) . ' (CTW: ' . number_format((float) $size->ctw, 3) . ')',
            ];
        }));
    }
}
