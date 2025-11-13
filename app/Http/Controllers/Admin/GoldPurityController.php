<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyGoldPuritiesRequest;
use App\Http\Requests\Admin\StoreGoldPurityRequest;
use App\Http\Requests\Admin\UpdateGoldPurityRequest;
use App\Models\GoldPurity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class GoldPurityController extends Controller
{
    public function index(): Response
    {
        $perPage = request()->integer('per_page', 20);
        $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 20;

        $purities = GoldPurity::query()
            ->orderBy('position')
            ->orderBy('name')
            ->paginate($perPage)
            ->through(function (GoldPurity $purity) {
                return [
                    'id' => $purity->id,
                    'name' => $purity->name,
                    'slug' => $purity->slug,
                    'description' => $purity->description,
                    'is_active' => $purity->is_active,
                    'position' => $purity->position,
                ];
            });

        return Inertia::render('Admin/Gold/Purities/Index', [
            'purities' => $purities,
        ]);
    }

    public function store(StoreGoldPurityRequest $request): RedirectResponse
    {
        $data = $request->validated();

        GoldPurity::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Gold purity created successfully.');
    }

    public function update(UpdateGoldPurityRequest $request, GoldPurity $goldPurity): RedirectResponse
    {
        $data = $request->validated();

        $goldPurity->update([
            'name' => $data['name'],
            'slug' => $goldPurity->name === $data['name'] ? $goldPurity->slug : $this->uniqueSlug($data['name'], $goldPurity->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Gold purity updated successfully.');
    }

    public function destroy(GoldPurity $goldPurity): RedirectResponse
    {
        $goldPurity->delete();

        return redirect()
            ->back()
            ->with('success', 'Gold purity removed.');
    }

    public function bulkDestroy(BulkDestroyGoldPuritiesRequest $request): RedirectResponse
    {
        GoldPurity::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected gold purities deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            GoldPurity::query()
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}

