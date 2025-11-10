<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyCustomerTypesRequest;
use App\Http\Requests\Admin\StoreCustomerTypeRequest;
use App\Http\Requests\Admin\UpdateCustomerTypeRequest;
use App\Models\CustomerType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CustomerTypeController extends Controller
{
    public function index(): Response
    {
        $types = CustomerType::query()
            ->orderBy('position')
            ->orderBy('name')
            ->paginate(20)
            ->through(function (CustomerType $type) {
                return [
                    'id' => $type->id,
                    'name' => $type->name,
                    'slug' => $type->slug,
                    'description' => $type->description,
                    'is_active' => $type->is_active,
                    'position' => $type->position,
                ];
            });

        return Inertia::render('Admin/Customers/Types/Index', [
            'types' => $types,
        ]);
    }

    public function store(StoreCustomerTypeRequest $request): RedirectResponse
    {
        $data = $request->validated();

        CustomerType::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Customer type created successfully.');
    }

    public function update(UpdateCustomerTypeRequest $request, CustomerType $customerType): RedirectResponse
    {
        $data = $request->validated();

        $customerType->update([
            'name' => $data['name'],
            'slug' => $customerType->name === $data['name'] ? $customerType->slug : $this->uniqueSlug($data['name'], $customerType->id),
            'description' => $data['description'] ?? null,
            'is_active' => $request->boolean('is_active', true),
            'position' => $data['position'] ?? 0,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Customer type updated successfully.');
    }

    public function destroy(CustomerType $customerType): RedirectResponse
    {
        $customerType->delete();

        return redirect()
            ->back()
            ->with('success', 'Customer type removed.');
    }

    public function bulkDestroy(BulkDestroyCustomerTypesRequest $request): RedirectResponse
    {
        CustomerType::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected customer types deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            CustomerType::query()
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}

