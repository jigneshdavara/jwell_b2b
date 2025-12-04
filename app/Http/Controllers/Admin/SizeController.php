<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroySizesRequest;
use App\Http\Requests\Admin\StoreSizeRequest;
use App\Http\Requests\Admin\UpdateSizeRequest;
use App\Models\Size;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SizeController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 10);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 10;
        }

        $sizes = Size::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Size $size) {
                return [
                    'id' => $size->id,
                    'code' => $size->code,
                    'name' => $size->name,
                    'description' => $size->description,
                    'is_active' => $size->is_active,
                    'display_order' => $size->display_order,
                ];
            });

        return Inertia::render('Admin/Sizes/Index', [
            'sizes' => $sizes,
        ]);
    }

    public function store(StoreSizeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Size::create([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Size created successfully.');
    }

    public function update(UpdateSizeRequest $request, Size $size): RedirectResponse
    {
        $data = $request->validated();

        $size->update([
            'code' => $data['code'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'display_order' => $data['display_order'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Size updated successfully.');
    }

    public function destroy(Size $size): RedirectResponse
    {
        $size->delete();

        return redirect()
            ->back()
            ->with('success', 'Size removed.');
    }

    public function bulkDestroy(BulkDestroySizesRequest $request): RedirectResponse
    {
        Size::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected sizes deleted successfully.');
    }
}
