<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondColorsRequest;
use App\Http\Requests\Admin\StoreDiamondColorRequest;
use App\Http\Requests\Admin\UpdateDiamondColorRequest;
use App\Models\DiamondColor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DiamondColorController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 20);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 20;
        }

        $colors = DiamondColor::query()
            ->orderBy('position')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (DiamondColor $color) {
                return [
                    'id' => $color->id,
                    'name' => $color->name,
                    'slug' => $color->slug,
                    'description' => $color->description,
                    'is_active' => $color->is_active,
                    'position' => $color->position,
                ];
            });

        return Inertia::render('Admin/Diamond/Colors/Index', [
            'colors' => $colors,
        ]);
    }

    public function store(StoreDiamondColorRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondColor::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond color created successfully.');
    }

    public function update(UpdateDiamondColorRequest $request, DiamondColor $color): RedirectResponse
    {
        $data = $request->validated();

        $color->update([
            'name' => $data['name'],
            'slug' => $color->name === $data['name'] ? $color->slug : $this->uniqueSlug($data['name'], $color->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond color updated successfully.');
    }

    public function destroy(DiamondColor $color): RedirectResponse
    {
        $color->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond color removed.');
    }

    public function bulkDestroy(BulkDestroyDiamondColorsRequest $request): RedirectResponse
    {
        DiamondColor::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected diamond colors deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            DiamondColor::query()
            ->when($ignoreId, fn($query) => $query->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}
