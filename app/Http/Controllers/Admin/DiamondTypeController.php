<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondTypesRequest;
use App\Http\Requests\Admin\StoreDiamondTypeRequest;
use App\Http\Requests\Admin\UpdateDiamondTypeRequest;
use App\Models\DiamondType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DiamondTypeController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $types = DiamondType::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (DiamondType $type) {
                return [
                    'id' => $type->id,
                    'code' => $type->code,
                    'name' => $type->name,
                    'description' => $type->description,
                    'is_active' => $type->is_active,
                    'display_order' => $type->display_order,
                ];
            });

        return Inertia::render('Admin/Diamond/Types/Index', [
            'types' => $types,
        ]);
    }

    public function store(StoreDiamondTypeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondType::create([
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond type created successfully.');
    }

    public function update(UpdateDiamondTypeRequest $request, DiamondType $type): RedirectResponse
    {
        $data = $request->validated();

        $type->update([
            'code' => $data['code'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'],
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond type updated successfully.');
    }

    public function destroy(DiamondType $type): RedirectResponse
    {
        $type->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond type removed.');
    }

    public function bulkDestroy(BulkDestroyDiamondTypesRequest $request): RedirectResponse
    {
        DiamondType::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected diamond types deleted successfully.');
    }
}
