<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use App\Models\TaxGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaxGroupController extends Controller
{
    public function index(): Response
    {
        $perPage = request()->integer('per_page', 20);
        $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 20;

        $taxGroups = TaxGroup::query()
            ->withCount('taxes')
            ->latest()
            ->paginate($perPage)
            ->through(function (TaxGroup $group) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'description' => $group->description,
                    'is_active' => $group->is_active,
                    'taxes_count' => $group->taxes_count,
                    'created_at' => optional($group->created_at)?->toDateTimeString(),
                    'updated_at' => optional($group->updated_at)?->toDateTimeString(),
                ];
            });

        return Inertia::render('Admin/Settings/TaxGroups/Index', [
            'taxGroups' => $taxGroups,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        TaxGroup::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Tax group created successfully.');
    }

    public function update(Request $request, TaxGroup $taxGroup): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        $taxGroup->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Tax group updated successfully.');
    }

    public function destroy(TaxGroup $taxGroup): RedirectResponse
    {
        $taxGroup->delete();

        return redirect()
            ->back()
            ->with('success', 'Tax group removed.');
    }
}
