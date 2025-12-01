<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyMetalTonesRequest;
use App\Http\Requests\Admin\StoreMetalToneRequest;
use App\Http\Requests\Admin\UpdateMetalToneRequest;
use App\Models\Metal;
use App\Models\MetalTone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MetalToneController extends Controller
{
    public function index(): Response
    {
        $perPage = (int) request('per_page', 20);

        if (! in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 20;
        }

        $tones = MetalTone::query()
            ->with('metal:id,name')
            ->orderBy('position')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(function (MetalTone $tone) {
                return [
                    'id' => $tone->id,
                    'metal_id' => $tone->metal_id,
                    'metal' => $tone->metal ? ['id' => $tone->metal->id, 'name' => $tone->metal->name] : null,
                    'name' => $tone->name,
                    'slug' => $tone->slug,
                    'description' => $tone->description,
                    'is_active' => $tone->is_active,
                    'position' => $tone->position,
                ];
            });

        return Inertia::render('Admin/MetalTones/Index', [
            'tones' => $tones,
            'metals' => Metal::query()
                ->where('is_active', true)
                ->orderBy('position')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn(Metal $metal) => [
                    'id' => $metal->id,
                    'name' => $metal->name,
                ])
                ->all(),
        ]);
    }

    public function store(StoreMetalToneRequest $request): RedirectResponse
    {
        $data = $request->validated();

        MetalTone::create([
            'metal_id' => $data['metal_id'],
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name'], $data['metal_id']),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Metal tone created successfully.');
    }

    public function update(UpdateMetalToneRequest $request, MetalTone $metalTone): RedirectResponse
    {
        $data = $request->validated();

        $metalTone->update([
            'metal_id' => $data['metal_id'],
            'name' => $data['name'],
            'slug' => ($metalTone->name === $data['name'] && $metalTone->metal_id === $data['metal_id'])
                ? $metalTone->slug
                : $this->uniqueSlug($data['name'], $data['metal_id'], $metalTone->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Metal tone updated successfully.');
    }

    public function destroy(MetalTone $metalTone): RedirectResponse
    {
        $metalTone->delete();

        return redirect()
            ->back()
            ->with('success', 'Metal tone removed.');
    }

    public function bulkDestroy(BulkDestroyMetalTonesRequest $request): RedirectResponse
    {
        MetalTone::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected metal tones deleted successfully.');
    }

    protected function uniqueSlug(string $name, int $metalId, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            MetalTone::query()
                ->where('metal_id', $metalId)
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}




