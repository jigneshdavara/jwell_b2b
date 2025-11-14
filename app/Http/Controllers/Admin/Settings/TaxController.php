<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use App\Models\Tax;
use App\Models\TaxGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaxController extends Controller
{
    public function index(): Response
    {
        $perPage = request()->integer('per_page', 20);
        $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 20;

        $taxes = Tax::query()
            ->with('taxGroup')
            ->latest()
            ->paginate($perPage)
            ->through(function (Tax $tax) {
                return [
                    'id' => $tax->id,
                    'name' => $tax->name,
                    'code' => $tax->code,
                    'rate' => $tax->rate,
                    'description' => $tax->description,
                    'is_active' => $tax->is_active,
                    'tax_group' => $tax->taxGroup ? [
                        'id' => $tax->taxGroup->id,
                        'name' => $tax->taxGroup->name,
                    ] : null,
                    'created_at' => optional($tax->created_at)?->toDateTimeString(),
                    'updated_at' => optional($tax->updated_at)?->toDateTimeString(),
                ];
            });

        $taxGroups = TaxGroup::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn (TaxGroup $group) => [
                'id' => $group->id,
                'name' => $group->name,
            ]);

        return Inertia::render('Admin/Settings/Taxes/Index', [
            'taxes' => $taxes,
            'taxGroups' => $taxGroups,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'tax_group_id' => ['required', 'exists:tax_groups,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:taxes,code'],
            'rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        Tax::create([
            'tax_group_id' => $data['tax_group_id'],
            'name' => $data['name'],
            'code' => $data['code'],
            'rate' => $data['rate'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Tax created successfully.');
    }

    public function update(Request $request, Tax $tax): RedirectResponse
    {
        $data = $request->validate([
            'tax_group_id' => ['required', 'exists:tax_groups,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:taxes,code,' . $tax->id],
            'rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        $tax->update([
            'tax_group_id' => $data['tax_group_id'],
            'name' => $data['name'],
            'code' => $data['code'],
            'rate' => $data['rate'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()
            ->back()
            ->with('success', 'Tax updated successfully.');
    }

    public function destroy(Tax $tax): RedirectResponse
    {
        $tax->delete();

        return redirect()
            ->back()
            ->with('success', 'Tax removed.');
    }
}
