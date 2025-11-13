<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyDiamondTypesRequest;
use App\Http\Requests\Admin\StoreDiamondTypeRequest;
use App\Http\Requests\Admin\UpdateDiamondTypeRequest;
use App\Models\DiamondType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DiamondTypeController extends Controller
{
    public function index(): Response
    {
        $perPage = request()->integer('per_page', 20);
        $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 20;

        $types = DiamondType::query()
            ->orderBy('position')
            ->orderBy('name')
            ->paginate($perPage)
            ->through(function (DiamondType $type) {
                return [
                    'id' => $type->id,
                    'name' => $type->name,
                    'slug' => $type->slug,
                    'description' => $type->description,
                    'is_active' => $type->is_active,
                    'position' => $type->position,
                ];
            });

        return Inertia::render('Admin/Diamond/Types/Index', [
            'types' => $types,
        ]);
    }

    public function store(StoreDiamondTypeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DiamondType::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond type created successfully.');
    }

    public function update(UpdateDiamondTypeRequest $request, DiamondType $diamondType): RedirectResponse
    {
        $data = $request->validated();

        $diamondType->update([
            'name' => $data['name'],
            'slug' => $diamondType->name === $data['name'] ? $diamondType->slug : $this->uniqueSlug($data['name'], $diamondType->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Diamond type updated successfully.');
    }

    public function destroy(DiamondType $diamondType): RedirectResponse
    {
        $diamondType->delete();

        return redirect()
            ->back()
            ->with('success', 'Diamond type removed.');
    }

    public function bulkDestroy(BulkDestroyDiamondTypesRequest $request): RedirectResponse
    {
        DiamondType::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected diamond types deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            DiamondType::query()
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}

