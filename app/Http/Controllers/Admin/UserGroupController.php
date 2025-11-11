<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyUserGroupsRequest;
use App\Http\Requests\Admin\StoreUserGroupRequest;
use App\Http\Requests\Admin\UpdateUserGroupRequest;
use App\Models\UserGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class UserGroupController extends Controller
{
    public function index(): Response
    {
        $groups = UserGroup::query()
            ->orderBy('position')
            ->orderBy('name')
            ->paginate(20)
            ->through(function (UserGroup $group) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'slug' => $group->slug,
                    'description' => $group->description,
                    'is_active' => $group->is_active,
                    'position' => $group->position,
                    'features' => $group->features ?? [],
                ];
            });

        return Inertia::render('Admin/Users/Groups/Index', [
            'groups' => $groups,
            'featureOptions' => $this->availableFeatures(),
        ]);
    }

    public function store(StoreUserGroupRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $group = UserGroup::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'features' => $this->sanitizeFeatures($data['features'] ?? []),
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', "User group {$group->name} created successfully.");
    }

    public function update(UpdateUserGroupRequest $request, UserGroup $userGroup): RedirectResponse
    {
        $data = $request->validated();

        $userGroup->update([
            'name' => $data['name'],
            'slug' => $userGroup->name === $data['name'] ? $userGroup->slug : $this->uniqueSlug($data['name'], $userGroup->id),
            'description' => $data['description'] ?? null,
            'features' => $this->sanitizeFeatures($data['features'] ?? []),
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'User group updated successfully.');
    }

    public function destroy(UserGroup $userGroup): RedirectResponse
    {
        $userGroup->delete();

        return redirect()
            ->back()
            ->with('success', 'User group removed.');
    }

    public function bulkDestroy(BulkDestroyUserGroupsRequest $request): RedirectResponse
    {
        UserGroup::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected user groups deleted successfully.');
    }

    protected function availableFeatures(): array
    {
        return [
            ['value' => 'dashboard.view', 'label' => 'Dashboard access'],
            ['value' => 'catalog.manage', 'label' => 'Manage catalog'],
            ['value' => 'orders.manage', 'label' => 'Manage orders'],
            ['value' => 'quotations.manage', 'label' => 'Manage quotations'],
            ['value' => 'jobwork.manage', 'label' => 'Manage jobwork'],
            ['value' => 'offers.manage', 'label' => 'Manage offers & discounts'],
            ['value' => 'customers.manage', 'label' => 'Manage customers'],
            ['value' => 'reports.view', 'label' => 'View reports'],
            ['value' => 'settings.manage', 'label' => 'Configure settings'],
        ];
    }

    protected function sanitizeFeatures(?array $features): ?array
    {
        if (empty($features)) {
            return null;
        }

        $allowed = collect($this->availableFeatures())->pluck('value')->all();

        $cleaned = collect($features)
            ->filter(fn ($feature) => is_string($feature) && in_array($feature, $allowed, true))
            ->unique()
            ->values()
            ->all();

        return empty($cleaned) ? null : $cleaned;
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            UserGroup::query()
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}

