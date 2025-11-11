<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyMakingChargeDiscountsRequest;
use App\Http\Requests\Admin\StoreMakingChargeDiscountRequest;
use App\Http\Requests\Admin\UpdateMakingChargeDiscountRequest;
use App\Models\Brand;
use App\Enums\UserType;
use App\Models\Category;
use App\Models\CustomerType;
use App\Models\MakingChargeDiscount;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MakingChargeDiscountController extends Controller
{
    public function index(): Response
    {
        $discounts = MakingChargeDiscount::query()
            ->with(['brand:id,name', 'category:id,name', 'customerGroup:id,name'])
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(function (MakingChargeDiscount $discount) {
                return [
                    'id' => $discount->id,
                    'name' => $discount->name,
                    'description' => $discount->description,
                    'discount_type' => $discount->discount_type,
                    'value' => $discount->value,
                    'is_auto' => $discount->is_auto,
                    'is_active' => $discount->is_active,
                    'brand' => $discount->brand ? [
                        'id' => $discount->brand->id,
                        'name' => $discount->brand->name,
                    ] : null,
                    'category' => $discount->category ? [
                        'id' => $discount->category->id,
                        'name' => $discount->category->name,
                    ] : null,
                    'customer_group' => $discount->customerGroup ? [
                        'id' => $discount->customerGroup->id,
                        'name' => $discount->customerGroup->name,
                    ] : null,
                    'customer_types' => $discount->customer_types ?? [],
                    'min_cart_total' => $discount->min_cart_total,
                    'starts_at' => optional($discount->starts_at)?->toDateString(),
                    'ends_at' => optional($discount->ends_at)?->toDateString(),
                    'updated_at' => optional($discount->updated_at)?->toDateTimeString(),
                ];
            });

        return Inertia::render('Admin/Offers/MakingChargeDiscounts/Index', [
            'discounts' => $discounts,
            'discountTypes' => ['percentage', 'fixed'],
            'brands' => Brand::query()->select('id', 'name')->orderBy('name')->get(),
            'categories' => Category::query()->select('id', 'name')->orderBy('name')->get(),
            'customerTypes' => $this->customerTypeOptions(),
        ]);
    }

    public function store(StoreMakingChargeDiscountRequest $request): RedirectResponse
    {
        $data = $request->validated();

        MakingChargeDiscount::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'discount_type' => $data['discount_type'],
            'value' => $data['value'],
            'brand_id' => $data['brand_id'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            'customer_group_id' => $data['customer_group_id'] ?? null,
            'customer_types' => $this->normalizeCustomerTypes($data['customer_types'] ?? null),
            'min_cart_total' => $data['min_cart_total'] ?? null,
            'is_auto' => $request->boolean('is_auto', true),
            'is_active' => $request->boolean('is_active', true),
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Making charge discount created successfully.');
    }

    public function update(UpdateMakingChargeDiscountRequest $request, MakingChargeDiscount $makingChargeDiscount): RedirectResponse
    {
        $data = $request->validated();

        $makingChargeDiscount->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'discount_type' => $data['discount_type'],
            'value' => $data['value'],
            'brand_id' => $data['brand_id'] ?? null,
            'category_id' => $data['category_id'] ?? null,
            'customer_group_id' => $data['customer_group_id'] ?? null,
            'customer_types' => $this->normalizeCustomerTypes($data['customer_types'] ?? null),
            'min_cart_total' => $data['min_cart_total'] ?? null,
            'is_auto' => $request->boolean('is_auto', true),
            'is_active' => $request->boolean('is_active', true),
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Making charge discount updated successfully.');
    }

    public function destroy(MakingChargeDiscount $makingChargeDiscount): RedirectResponse
    {
        $makingChargeDiscount->delete();

        return redirect()
            ->back()
            ->with('success', 'Making charge discount removed.');
    }

    public function bulkDestroy(BulkDestroyMakingChargeDiscountsRequest $request): RedirectResponse
    {
        MakingChargeDiscount::whereIn('id', $request->validated('ids'))->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected discounts deleted successfully.');
    }

    protected function customerTypeOptions(): array
    {
        $types = CustomerType::query()
            ->where('is_active', true)
            ->orderBy('position')
            ->orderBy('name')
            ->get(['slug', 'name']);

        if ($types->isNotEmpty()) {
            return $types->map(fn (CustomerType $type) => [
                'value' => $type->slug,
                'label' => $type->name,
            ])->all();
        }

        return collect([UserType::Retailer, UserType::Wholesaler])
            ->map(fn (UserType $type) => [
                'value' => $type->value,
                'label' => ucfirst(str_replace('-', ' ', $type->value)),
            ])
            ->all();
    }

    /**
     * @param  array<int, string>|null  $types
     * @return array<int, string>|null
     */
    protected function normalizeCustomerTypes($types): ?array
    {
        if (empty($types) || ! is_array($types)) {
            return null;
        }

        $allowed = [UserType::Retailer->value, UserType::Wholesaler->value];

        $normalized = collect($types)
            ->filter(fn ($type) => is_string($type) && in_array($type, $allowed, true))
            ->unique()
            ->values()
            ->all();

        return empty($normalized) ? null : $normalized;
    }
}
