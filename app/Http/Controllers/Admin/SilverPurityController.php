<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroySilverPuritiesRequest;
use App\Http\Requests\Admin\StoreSilverPurityRequest;
use App\Http\Requests\Admin\UpdateSilverPurityRequest;
use App\Models\SilverPurity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SilverPurityController extends Controller
{
    public function index(): Response
    {
        $purities = SilverPurity::query()
            ->orderBy('position')
            ->orderBy('name')
            ->paginate(20)
            ->through(function (SilverPurity $purity) {
                return [
                    'id' => $purity->id,
                    'name' => $purity->name,
                    'slug' => $purity->slug,
                    'description' => $purity->description,
                    'is_active' => $purity->is_active,
                    'position' => $purity->position,
                ];
            });

        return Inertia::render('Admin/Silver/Purities/Index', [
            'purities' => $purities,
        ]);
    }

    public function store(StoreSilverPurityRequest $request): RedirectResponse
    {
        $data = $request->validated();

        SilverPurity::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Silver purity created successfully.');
    }

    public function update(UpdateSilverPurityRequest $request, SilverPurity $silverPurity): RedirectResponse
    {
        $data = $request->validated();

        $silverPurity->update([
            'name' => $data['name'],
            'slug' => $silverPurity->name === $data['name'] ? $silverPurity->slug : $this->uniqueSlug($data['name'], $silverPurity->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Silver purity updated successfully.');
    }

    public function destroy(SilverPurity $silverPurity): RedirectResponse
    {
        $silverPurity->delete();

        return redirect()
            ->back()
            ->with('success', 'Silver purity removed.');
    }

    public function bulkDestroy(BulkDestroySilverPuritiesRequest $request): RedirectResponse
    {
        SilverPurity::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected silver purities deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            SilverPurity::query()
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}

