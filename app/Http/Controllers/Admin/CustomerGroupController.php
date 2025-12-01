<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyCustomerGroupsRequest;
use App\Http\Requests\Admin\StoreCustomerGroupRequest;
use App\Http\Requests\Admin\UpdateCustomerGroupRequest;
use App\Models\CustomerGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CustomerGroupController extends Controller
{
    public function index(): Response
    {
        $perPage = request()->integer('per_page', 20);
        $perPage = in_array($perPage, [10, 25, 50, 100]) ? $perPage : 20;

        $groups = CustomerGroup::query()
            ->orderBy('position')
            ->orderBy('name')
            ->paginate($perPage)
            ->through(function (CustomerGroup $group) {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'slug' => $group->slug,
                    'description' => $group->description,
                    'is_active' => $group->is_active,
                    'position' => $group->position,
                ];
            });

        return Inertia::render('Admin/Customers/Groups/Index', [
            'groups' => $groups,
        ]);
    }

    public function store(StoreCustomerGroupRequest $request): RedirectResponse
    {
        $data = $request->validated();

        CustomerGroup::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Customer group created successfully.');
    }

    public function update(UpdateCustomerGroupRequest $request, CustomerGroup $group): RedirectResponse
    {
        $data = $request->validated();

        $group->update([
            'name' => $data['name'],
            'slug' => $group->name === $data['name'] ? $group->slug : $this->uniqueSlug($data['name'], $group->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Customer group updated successfully.');
    }

    public function destroy(CustomerGroup $group): RedirectResponse
    {
        $group->delete();

        return redirect()
            ->back()
            ->with('success', 'Customer group removed.');
    }

    public function bulkDestroy(BulkDestroyCustomerGroupsRequest $request): RedirectResponse
    {
        CustomerGroup::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected customer groups deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            CustomerGroup::query()
            ->when($ignoreId, fn($query) => $query->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}
