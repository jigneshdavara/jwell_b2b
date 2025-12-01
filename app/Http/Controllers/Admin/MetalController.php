<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyMetalsRequest;
use App\Http\Requests\Admin\StoreMetalRequest;
use App\Http\Requests\Admin\UpdateMetalRequest;
use App\Models\Metal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MetalController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 20);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 20;
        }

        $metals = Metal::query()
            ->orderBy('position')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (Metal $metal) {
                return [
                    'id' => $metal->id,
                    'name' => $metal->name,
                    'slug' => $metal->slug,
                    'description' => $metal->description,
                    'is_active' => $metal->is_active,
                    'position' => $metal->position,
                ];
            });

        return Inertia::render('Admin/Metals/Index', [
            'metals' => $metals,
        ]);
    }

    public function store(StoreMetalRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Metal::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Metal created successfully.');
    }

    public function update(UpdateMetalRequest $request, Metal $metal): RedirectResponse
    {
        $data = $request->validated();

        $metal->update([
            'name' => $data['name'],
            'slug' => $metal->name === $data['name'] ? $metal->slug : $this->uniqueSlug($data['name'], $metal->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Metal updated successfully.');
    }

    public function destroy(Metal $metal): RedirectResponse
    {
        $metal->delete();

        return redirect()
            ->back()
            ->with('success', 'Metal removed.');
    }

    public function bulkDestroy(BulkDestroyMetalsRequest $request): RedirectResponse
    {
        Metal::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected metals deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            Metal::query()
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}




