<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondCutsRequest;
use App\Http\Requests\Admin\StoreDiamondCutRequest;
use App\Http\Requests\Admin\UpdateDiamondCutRequest;
use App\Models\DiamondCut;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DiamondCutController extends Controller
{
    public function index(): Response
    {
        $perPage = request()->integer('per_page', 20);
        $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 20;

        $cuts = DiamondCut::query()
            ->orderBy('position')
            ->orderBy('name')
            ->paginate($perPage)
            ->through(function (DiamondCut $cut) {
                return [
                    'id' => $cut->id,
                    'name' => $cut->name,
                    'slug' => $cut->slug,
                    'description' => $cut->description,
                    'is_active' => $cut->is_active,
                    'position' => $cut->position,
                ];
            });

        return Inertia::render('Admin/Diamond/Cuts/Index', [
            'cuts' => $cuts,
        ]);
    }

    public function store(StoreDiamondCutRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondCut::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond cut grade created successfully.');
    }

    public function update(UpdateDiamondCutRequest $request, DiamondCut $diamondCut): RedirectResponse
    {
        $data = $request->validated();

        $diamondCut->update([
            'name' => $data['name'],
            'slug' => $diamondCut->name === $data['name'] ? $diamondCut->slug : $this->uniqueSlug($data['name'], $diamondCut->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond cut grade updated successfully.');
    }

    public function destroy(DiamondCut $diamondCut): RedirectResponse
    {
        $diamondCut->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond cut grade removed.');
    }

    public function bulkDestroy(BulkDestroyDiamondCutsRequest $request): RedirectResponse
    {
        DiamondCut::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected diamond cut grades deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            DiamondCut::query()
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}

