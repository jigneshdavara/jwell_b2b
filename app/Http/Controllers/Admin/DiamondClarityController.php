<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondClaritiesRequest;
use App\Http\Requests\Admin\StoreDiamondClarityRequest;
use App\Http\Requests\Admin\UpdateDiamondClarityRequest;
use App\Models\DiamondClarity;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DiamondClarityController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $clarities = DiamondClarity::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (DiamondClarity $clarity) {
                return [
                    'id' => $clarity->id,
                    'code' => $clarity->code,
                    'name' => $clarity->name,
                    'ecat_name' => $clarity->ecat_name,
                    'description' => $clarity->description,
                    'display_order' => $clarity->display_order,
                    'is_active' => $clarity->is_active,
                ];
            });

        return Inertia::render('Admin/Diamond/Clarities/Index', [
            'clarities' => $clarities,
        ]);
    }

    public function store(StoreDiamondClarityRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondClarity::create([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'ecat_name' => $data['ecat_name'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond clarity created successfully.');
    }

    public function update(UpdateDiamondClarityRequest $request, DiamondClarity $clarity): RedirectResponse
    {
        $data = $request->validated();

        $clarity->update([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'ecat_name' => $data['ecat_name'] ?? null,
            'description' => $data['description'] ?? null,
            'display_order' => $data['display_order'] ?? 0,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond clarity updated successfully.');
    }

    public function destroy(DiamondClarity $clarity): RedirectResponse
    {
        $clarity->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond clarity removed.');
    }

    public function bulkDestroy(BulkDestroyDiamondClaritiesRequest $request): RedirectResponse
    {
        DiamondClarity::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected diamond clarities deleted successfully.');
    }
}
