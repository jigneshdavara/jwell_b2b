<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyMetalsRequest;
use App\Http\Requests\Admin\StoreMetalRequest;
use App\Http\Requests\Admin\UpdateMetalRequest;
use App\Models\Metal;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MetalController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $metals = Metal::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Metal $metal) {
                return [
                    'id' => $metal->id,
                    'code' => $metal->code,
                    'name' => $metal->name,
                    'description' => $metal->description,
                    'is_active' => $metal->is_active,
                    'display_order' => $metal->display_order,
                ];
            });

        return Inertia::render('Admin/Metals/Index', [
            'metals' => $metals,
        ]);
    }

    public function store(StoreMetalRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Metal::create([
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'],
        ]);

        return redirect()
            ->back()
            ->with('success', 'Metal created successfully.');
    }

    public function update(UpdateMetalRequest $request, Metal $metal): RedirectResponse
    {
        $data = $request->validated();

        $metal->update([
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'],
        ]);

        return redirect()
            ->back()
            ->with('success', 'Metal updated successfully.');
    }

    public function destroy(Metal $metal): RedirectResponse
    {
        $metal->delete();

        return redirect()
            ->back()
            ->with('success', 'Metal removed.');
    }

    public function bulkDestroy(BulkDestroyMetalsRequest $request): RedirectResponse
    {
        Metal::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected metals deleted successfully.');
    }
}
