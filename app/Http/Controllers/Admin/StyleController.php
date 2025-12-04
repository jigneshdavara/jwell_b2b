<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyStylesRequest;
use App\Http\Requests\Admin\StoreStyleRequest;
use App\Http\Requests\Admin\UpdateStyleRequest;
use App\Models\Style;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class StyleController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $styles = Style::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Style $style) {
                return [
                    'id' => $style->id,
                    'code' => $style->code,
                    'name' => $style->name,
                    'description' => $style->description,
                    'is_active' => $style->is_active,
                    'display_order' => $style->display_order,
                ];
            });

        return Inertia::render('Admin/Styles/Index', [
            'styles' => $styles,
        ]);
    }

    public function store(StoreStyleRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Style::create([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Style created successfully.');
    }

    public function update(UpdateStyleRequest $request, Style $style): RedirectResponse
    {
        $data = $request->validated();

        $style->update([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Style updated successfully.');
    }

    public function destroy(Style $style): RedirectResponse
    {
        $style->delete();

        return redirect()
            ->back()
            ->with('success', 'Style removed.');
    }

    public function bulkDestroy(BulkDestroyStylesRequest $request): RedirectResponse
    {
        Style::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected styles deleted successfully.');
    }
}
