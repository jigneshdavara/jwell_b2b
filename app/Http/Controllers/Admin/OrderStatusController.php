<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyOrderStatusesRequest;
use App\Http\Requests\Admin\StoreOrderStatusRequest;
use App\Http\Requests\Admin\UpdateOrderStatusTypeRequest;
use App\Models\OrderStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OrderStatusController extends Controller
{
    public function index(): Response
    {
        $statuses = OrderStatus::query()
            ->orderBy('position')
            ->orderBy('name')
            ->paginate(20)
            ->through(function (OrderStatus $status) {
                return [
                    'id' => $status->id,
                    'name' => $status->name,
                    'slug' => $status->slug,
                    'color' => $status->color,
                    'is_default' => $status->is_default,
                    'is_active' => $status->is_active,
                    'position' => $status->position,
                ];
            });

        return Inertia::render('Admin/Orders/Statuses/Index', [
            'statuses' => $statuses,
        ]);
    }

    public function store(StoreOrderStatusRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            if (! empty($data['is_default'])) {
                OrderStatus::query()->update(['is_default' => false]);
            }

            OrderStatus::create([
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'color' => $data['color'] ?? '#64748b',
                'is_default' => $data['is_default'] ?? false,
                'is_active' => $data['is_active'] ?? true,
                'position' => $data['position'] ?? 0,
            ]);
        });

        return redirect()
            ->back()
            ->with('success', 'Order status created successfully.');
    }

    public function update(UpdateOrderStatusTypeRequest $request, OrderStatus $status): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $status): void {
            if (! empty($data['is_default'])) {
                OrderStatus::query()
                    ->whereKeyNot($status->id)
                    ->update(['is_default' => false]);
            }

            $status->update([
                'name' => $data['name'],
                'slug' => $status->name === $data['name'] ? $status->slug : $this->uniqueSlug($data['name'], $status->id),
                'color' => $data['color'] ?? '#64748b',
                'is_default' => $data['is_default'] ?? false,
                'is_active' => $data['is_active'] ?? true,
                'position' => $data['position'] ?? 0,
            ]);
        });

        return redirect()
            ->back()
            ->with('success', 'Order status updated successfully.');
    }

    public function destroy(OrderStatus $status): RedirectResponse
    {
        if ($status->is_default && OrderStatus::query()->whereKeyNot($status->id)->exists()) {
            return redirect()
                ->back()
                ->with('error', 'You must designate another default status before deleting this one.');
        }

        $status->delete();

        return redirect()
            ->back()
            ->with('success', 'Order status removed.');
    }

    public function bulkDestroy(BulkDestroyOrderStatusesRequest $request): RedirectResponse
    {
        $ids = $request->validated('ids');

        if (
            OrderStatus::query()
            ->whereIn('id', $ids)
            ->where('is_default', true)
            ->exists()
        ) {
            return redirect()
                ->back()
                ->with('error', 'Cannot delete the default status. Please assign another default first.');
        }

        OrderStatus::whereIn('id', $ids)->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected order statuses deleted successfully.');
    }

    protected function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 1;

        while (
            OrderStatus::query()
            ->when($ignoreId, fn($query) => $query->whereKeyNot($ignoreId))
            ->where('slug', $slug)
            ->exists()
        ) {
            $slug = sprintf('%s-%d', $base, $counter++);
        }

        return $slug;
    }
}
