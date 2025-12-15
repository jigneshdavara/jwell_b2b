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
        // Check if size is used in any category
        if ($size->categories()->exists()) {
            return redirect()
                ->back()
                ->with('error', 'Cannot delete size because it is associated with one or more categories. Please remove it from all categories first.');
        }

        $size->delete();

        return redirect()
            ->back()
            ->with('success', 'Size removed.');
    }

    public function bulkDestroy(BulkDestroySizesRequest $request): RedirectResponse
    {
        $ids = $request->validated('ids');
        $deletedCount = 0;
        $skippedCount = 0;
        $skippedSizes = [];

        foreach ($ids as $id) {
            $size = Size::find($id);

            if (! $size) {
                continue;
            }

            // Check if size is used in any category
            if ($size->categories()->exists()) {
                $skippedCount++;
                $skippedSizes[] = $size->name;
                continue;
            }

            $size->delete();
            $deletedCount++;
        }

        $messages = [];

        if ($deletedCount > 0) {
            $plural = $deletedCount === 1 ? '' : 's';
            $messages[] = "{$deletedCount} size{$plural} deleted successfully.";
        }

        if ($skippedCount > 0) {
            $plural = $skippedCount === 1 ? 'is' : 'are';
            $sizeNames = implode(', ', array_slice($skippedSizes, 0, 5));
            if (count($skippedSizes) > 5) {
                $sizeNames .= ' and ' . (count($skippedSizes) - 5) . ' more';
            }
            $messages[] = "Cannot delete {$skippedCount} size{$plural} because {$plural} associated with categories. Please remove {$plural} from categories first: {$sizeNames}.";
        }

        $message = ! empty($messages) ? implode(' ', $messages) : 'No sizes were deleted.';

        return redirect()
            ->back()
            ->with($skippedCount > 0 && $deletedCount === 0 ? 'error' : 'success', $message);
    }
}
