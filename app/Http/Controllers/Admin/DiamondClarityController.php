<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondClaritiesRequest;
use App\Http\Requests\Admin\StoreDiamondClarityRequest;
use App\Http\Requests\Admin\UpdateDiamondClarityRequest;
use App\Models\DiamondClarity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DiamondClarityController extends Controller
{
    public function index(): Response
    {
        $perPage = request()->integer('per_page', 20);
        $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 20;

        $clarities = DiamondClarity::query()
            ->orderBy('position')
            ->orderBy('name')
            ->paginate($perPage)
            ->through(function (DiamondClarity $clarity) {
                return [
                    'id' => $clarity->id,
                    'name' => $clarity->name,
                    'slug' => $clarity->slug,
                    'description' => $clarity->description,
                    'is_active' => $clarity->is_active,
                    'position' => $clarity->position,
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
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond clarity grade created successfully.');
    }

    public function update(UpdateDiamondClarityRequest $request, DiamondClarity $clarity): RedirectResponse
    {
        $data = $request->validated();

        $clarity->update([
            'name' => $data['name'],
            'slug' => $clarity->name === $data['name'] ? $clarity->slug : $this->uniqueSlug($data['name'], $clarity->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond clarity grade updated successfully.');
    }

    public function destroy(DiamondClarity $clarity): RedirectResponse
    {
        $clarity->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond clarity grade removed.');
    }

    public function bulkDestroy(BulkDestroyDiamondClaritiesRequest $request): RedirectResponse
    {
        DiamondClarity::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected diamond clarity grades deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            DiamondClarity::query()
            ->when($ignoreId, fn($query) => $query->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}
