<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondShapesRequest;
use App\Http\Requests\Admin\StoreDiamondShapeRequest;
use App\Http\Requests\Admin\UpdateDiamondShapeRequest;
use App\Models\DiamondShape;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DiamondShapeController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 20);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 20;
        }

        $shapes = DiamondShape::query()
            ->orderBy('position')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (DiamondShape $shape) {
                return [
                    'id' => $shape->id,
                    'name' => $shape->name,
                    'slug' => $shape->slug,
                    'description' => $shape->description,
                    'is_active' => $shape->is_active,
                    'position' => $shape->position,
                ];
            });

        return Inertia::render('Admin/Diamond/Shapes/Index', [
            'shapes' => $shapes,
        ]);
    }

    public function store(StoreDiamondShapeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondShape::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond shape created successfully.');
    }

    public function update(UpdateDiamondShapeRequest $request, DiamondShape $diamondShape): RedirectResponse
    {
        $data = $request->validated();

        $diamondShape->update([
            'name' => $data['name'],
            'slug' => $diamondShape->name === $data['name'] ? $diamondShape->slug : $this->uniqueSlug($data['name'], $diamondShape->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond shape updated successfully.');
    }

    public function destroy(DiamondShape $diamondShape): RedirectResponse
    {
        $diamondShape->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond shape removed.');
    }

    public function bulkDestroy(BulkDestroyDiamondShapesRequest $request): RedirectResponse
    {
        DiamondShape::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected diamond shapes deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            DiamondShape::query()
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}

