<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyMetalPuritiesRequest;
use App\Http\Requests\Admin\StoreMetalPurityRequest;
use App\Http\Requests\Admin\UpdateMetalPurityRequest;
use App\Models\Metal;
use App\Models\MetalPurity;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MetalPurityController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $purities = MetalPurity::query()
            ->with('metal:id,name')
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (MetalPurity $purity) {
                return [
                    'id' => $purity->id,
                    'metal_id' => $purity->metal_id,
                    'metal' => $purity->metal ? ['id' => $purity->metal->id, 'name' => $purity->metal->name] : null,
                    'code' => $purity->code,
                    'name' => $purity->name,
                    'description' => $purity->description,
                    'is_active' => $purity->is_active,
                    'display_order' => $purity->display_order,
                ];
            });

        return Inertia::render('Admin/MetalPurities/Index', [
            'purities' => $purities,
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

    public function store(StoreMetalPurityRequest $request): RedirectResponse
    {
        $data = $request->validated();

        MetalPurity::create([
            'metal_id' => $data['metal_id'],
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Metal purity created successfully.');
    }

    public function update(UpdateMetalPurityRequest $request, MetalPurity $metalPurity): RedirectResponse
    {
        $data = $request->validated();

        $metalPurity->update([
            'metal_id' => $data['metal_id'],
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Metal purity updated successfully.');
    }

    public function destroy(MetalPurity $metalPurity): RedirectResponse
    {
        $metalPurity->delete();

        return redirect()
            ->back()
            ->with('success', 'Metal purity removed.');
    }

    public function bulkDestroy(BulkDestroyMetalPuritiesRequest $request): RedirectResponse
    {
        MetalPurity::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected metal purities deleted successfully.');
    }
}
