<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyColorstoneQualitiesRequest;
use App\Http\Requests\Admin\StoreColorstoneQualityRequest;
use App\Http\Requests\Admin\UpdateColorstoneQualityRequest;
use App\Models\ColorstoneQuality;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ColorstoneQualityController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $qualities = ColorstoneQuality::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (ColorstoneQuality $quality) {
                return [
                    'id' => $quality->id,
                    'code' => $quality->code,
                    'name' => $quality->name,
                    'description' => $quality->description,
                    'display_order' => $quality->display_order,
                    'is_active' => $quality->is_active,
                ];
            });

        return Inertia::render('Admin/Colorstone/Qualities/Index', [
            'qualities' => $qualities,
        ]);
    }

    public function store(StoreColorstoneQualityRequest $request): RedirectResponse
    {
        $data = $request->validated();

        ColorstoneQuality::create([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Colorstone quality created successfully.');
    }

    public function update(UpdateColorstoneQualityRequest $request, ColorstoneQuality $quality): RedirectResponse
    {
        $data = $request->validated();

        $quality->update([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Colorstone quality updated successfully.');
    }

    public function destroy(ColorstoneQuality $quality): RedirectResponse
    {
        $quality->delete();

        return redirect()
            ->back()
            ->with('success', 'Colorstone quality removed.');
    }

    public function bulkDestroy(BulkDestroyColorstoneQualitiesRequest $request): RedirectResponse
    {
        ColorstoneQuality::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected colorstone qualities deleted successfully.');
    }
}
