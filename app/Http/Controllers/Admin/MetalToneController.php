<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyMetalTonesRequest;
use App\Http\Requests\Admin\StoreMetalToneRequest;
use App\Http\Requests\Admin\UpdateMetalToneRequest;
use App\Models\Metal;
use App\Models\MetalTone;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MetalToneController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $tones = MetalTone::query()
            ->with('metal:id,name')
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (MetalTone $tone) {
                return [
                    'id' => $tone->id,
                    'metal_id' => $tone->metal_id,
                    'metal' => $tone->metal ? ['id' => $tone->metal->id, 'name' => $tone->metal->name] : null,
                    'code' => $tone->code,
                    'name' => $tone->name,
                    'description' => $tone->description,
                    'is_active' => $tone->is_active,
                    'display_order' => $tone->display_order,
                ];
            });

        return Inertia::render('Admin/MetalTones/Index', [
            'tones' => $tones,
            'metals' => Metal::query()
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn(Metal $metal) => [
                    'id' => $metal->id,
                    'name' => $metal->name,
                ])
                ->all(),
        ]);
    }

    public function store(StoreMetalToneRequest $request): RedirectResponse
    {
        $data = $request->validated();

        MetalTone::create([
            'metal_id' => $data['metal_id'],
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'],
        ]);

        return redirect()
            ->back()
            ->with('success', 'Metal tone created successfully.');
    }

    public function update(UpdateMetalToneRequest $request, MetalTone $metalTone): RedirectResponse
    {
        $data = $request->validated();

        $metalTone->update([
            'metal_id' => $data['metal_id'],
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'],
        ]);

        return redirect()
            ->back()
            ->with('success', 'Metal tone updated successfully.');
    }

    public function destroy(MetalTone $metalTone): RedirectResponse
    {
        $metalTone->delete();

        return redirect()
            ->back()
            ->with('success', 'Metal tone removed.');
    }

    public function bulkDestroy(BulkDestroyMetalTonesRequest $request): RedirectResponse
    {
        MetalTone::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected metal tones deleted successfully.');
    }
}
