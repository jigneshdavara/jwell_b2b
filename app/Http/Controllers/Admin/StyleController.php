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
        // Check if style is used in any category
        if ($style->categories()->exists()) {
            return redirect()
                ->back()
                ->with('error', 'Cannot delete style because it is associated with one or more categories. Please remove it from all categories first.');
        }

        $style->delete();

        return redirect()
            ->back()
            ->with('success', 'Style removed.');
    }

    public function bulkDestroy(BulkDestroyStylesRequest $request): RedirectResponse
    {
        $ids = $request->validated('ids');
        $deletedCount = 0;
        $skippedCount = 0;
        $skippedStyles = [];

        foreach ($ids as $id) {
            $style = Style::find($id);

            if (! $style) {
                continue;
            }

            // Check if style is used in any category
            if ($style->categories()->exists()) {
                $skippedCount++;
                $skippedStyles[] = $style->name;
                continue;
            }

            $style->delete();
            $deletedCount++;
        }

        $messages = [];

        if ($deletedCount > 0) {
            $plural = $deletedCount === 1 ? '' : 's';
            $messages[] = "{$deletedCount} style{$plural} deleted successfully.";
        }

        if ($skippedCount > 0) {
            $plural = $skippedCount === 1 ? 'is' : 'are';
            $styleNames = implode(', ', array_slice($skippedStyles, 0, 5));
            if (count($skippedStyles) > 5) {
                $styleNames .= ' and ' . (count($skippedStyles) - 5) . ' more';
            }
            $messages[] = "Cannot delete {$skippedCount} style{$plural} because {$plural} associated with categories. Please remove {$plural} from categories first: {$styleNames}.";
        }

        $message = ! empty($messages) ? implode(' ', $messages) : 'No styles were deleted.';

        return redirect()
            ->back()
            ->with($skippedCount > 0 && $deletedCount === 0 ? 'error' : 'success', $message);
    }
}
