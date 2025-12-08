<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondsRequest;
use App\Http\Requests\Admin\StoreDiamondRequest;
use App\Http\Requests\Admin\UpdateDiamondRequest;
use App\Models\Diamond;
use App\Models\DiamondClarity;
use App\Models\DiamondColor;
use App\Models\DiamondShape;
use App\Models\DiamondShapeSize;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DiamondController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $diamonds = Diamond::query()
            ->with(['clarity', 'color', 'shape', 'shapeSize'])
            ->latest()
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Diamond $diamond) {
                return [
                    'id' => $diamond->id,
                    'name' => $diamond->name,
                    'clarity' => $diamond->clarity ? [
                        'id' => $diamond->clarity->id,
                        'name' => $diamond->clarity->name,
                        'code' => $diamond->clarity->code,
                    ] : null,
                    'color' => $diamond->color ? [
                        'id' => $diamond->color->id,
                        'name' => $diamond->color->name,
                        'code' => $diamond->color->code,
                    ] : null,
                    'shape' => $diamond->shape ? [
                        'id' => $diamond->shape->id,
                        'name' => $diamond->shape->name,
                        'code' => $diamond->shape->code,
                    ] : null,
                    'shape_size' => $diamond->shapeSize ? [
                        'id' => $diamond->shapeSize->id,
                        'size' => $diamond->shapeSize->size,
                        'secondary_size' => $diamond->shapeSize->secondary_size,
                        'ctw' => (float) $diamond->shapeSize->ctw,
                    ] : null,
                    'price' => (float) $diamond->price,
                    'description' => $diamond->description,
                    'is_active' => $diamond->is_active,
                ];
            });

        return Inertia::render('Admin/Diamond/Diamonds/Index', [
            'diamonds' => $diamonds,
            'clarities' => DiamondClarity::where('is_active', true)->orderBy('display_order')->get(['id', 'name', 'code']),
            'colors' => DiamondColor::where('is_active', true)->orderBy('display_order')->get(['id', 'name', 'code']),
            'shapes' => DiamondShape::where('is_active', true)->orderBy('display_order')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(StoreDiamondRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Diamond::create([
            'name' => $data['name'],
            'diamond_clarity_id' => $data['diamond_clarity_id'] ?? null,
            'diamond_color_id' => $data['diamond_color_id'] ?? null,
            'diamond_shape_id' => $data['diamond_shape_id'] ?? null,
            'diamond_shape_size_id' => $data['diamond_shape_size_id'] ?? null,
            'price' => $data['price'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond created successfully.');
    }

    public function update(UpdateDiamondRequest $request, Diamond $diamond): RedirectResponse
    {
        $data = $request->validated();

        $diamond->update([
            'name' => $data['name'],
            'diamond_clarity_id' => $data['diamond_clarity_id'] ?? null,
            'diamond_color_id' => $data['diamond_color_id'] ?? null,
            'diamond_shape_id' => $data['diamond_shape_id'] ?? null,
            'diamond_shape_size_id' => $data['diamond_shape_size_id'] ?? null,
            'price' => $data['price'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond updated successfully.');
    }

    public function destroy(Diamond $diamond): RedirectResponse
    {
        $diamond->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond removed.');
    }

    public function bulkDestroy(BulkDestroyDiamondsRequest $request): RedirectResponse
    {
        Diamond::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected diamonds deleted successfully.');
    }

    public function getShapeSizes(int $shapeId)
    {
        $shapeSizes = DiamondShapeSize::where('diamond_shape_id', $shapeId)
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
