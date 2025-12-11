<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\MakingChargeDiscount;
use App\Models\Product;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class MakingChargeDiscountService
{
    /**
     * Resolve the most relevant making charge discount for a product.
     *
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function resolve(Product $product, ?Customer $user = null, array $context = []): array
    {
        // Get metal cost from context if available, otherwise 0
        $metalCost = (float) ($context['metal'] ?? $context['metal_cost'] ?? 0);
        
        // Calculate making charge based on configured types (fixed, percentage, or both)
        $makingCharge = $product->calculateMakingCharge($metalCost);

        if ($makingCharge <= 0) {
            return $this->emptyDiscount();
        }

        $now = $this->resolveCurrentTime($context);
        $customerGroupId = $this->resolveCustomerGroupId($user, $context);
        $customerType = $this->resolveCustomerType($user, $context);
        $quantity = max(1, (int) ($context['quantity'] ?? 1));
        $unitSubtotal = (float) ($context['unit_subtotal'] ?? ($makingCharge + (float) ($context['base'] ?? 0)));
        $lineSubtotal = (float) ($context['line_subtotal'] ?? ($unitSubtotal * $quantity));

        $candidates = collect();

        if ($productDiscount = $this->productLevelDiscount($product, $customerType, $customerGroupId, $makingCharge)) {
            $candidates->push($productDiscount);
        }

        $globalDiscounts = $this->globalDiscounts($product, $customerType, $customerGroupId, $makingCharge, $lineSubtotal, $now);

        if ($globalDiscounts->isNotEmpty()) {
            $candidates = $candidates->merge($globalDiscounts);
        }

        if ($candidates->isEmpty()) {
            return $this->emptyDiscount();
        }

        $best = $candidates->reduce(function (?array $carry, array $candidate) {
            if ($carry === null) {
                return $candidate;
            }

            if ($candidate['amount'] > $carry['amount']) {
                return $candidate;
            }

            if ($candidate['amount'] === $carry['amount'] && ($candidate['priority'] ?? 0) > ($carry['priority'] ?? 0)) {
                return $candidate;
            }

            return $carry;
        });

        return Arr::except($best ?? [], ['priority']);
    }

    protected function resolveCurrentTime(array $context): Carbon
    {
        $now = $context['now'] ?? null;

        if ($now instanceof Carbon) {
            return $now;
        }

        if (is_string($now)) {
            return Carbon::parse($now);
        }

        return Carbon::now();
    }

    protected function resolveCustomerGroupId(?Customer $user, array $context): ?int
    {
        if (isset($context['customer_group_id']) && $context['customer_group_id'] !== null) {
            return (int) $context['customer_group_id'];
        }

        if (! $user) {
            return null;
        }

        if (isset($user->customer_group_id) && $user->customer_group_id !== null) {
            return (int) $user->customer_group_id;
        }

        $metadata = $user->getAttribute('metadata');
        if (is_array($metadata) && isset($metadata['customer_group_id']) && $metadata['customer_group_id'] !== null) {
            return (int) $metadata['customer_group_id'];
        }

        return null;
    }

    protected function resolveCustomerType(?Customer $user, array $context): ?string
    {
        if (isset($context['customer_type']) && is_string($context['customer_type'])) {
            return strtolower($context['customer_type']);
        }

        if (! $user) {
            return null;
        }

        if (isset($user->type) && is_string($user->type)) {
            return strtolower($user->type);
        }

        $metadata = $user->getAttribute('metadata');
        if (is_array($metadata) && isset($metadata['customer_type']) && is_string($metadata['customer_type'])) {
            return strtolower($metadata['customer_type']);
        }

        return null;
    }

    protected function productLevelDiscount(Product $product, ?string $customerType, ?int $customerGroupId, float $makingCharge): ?array
    {
        return null;
    }

    protected function globalDiscounts(
        Product $product,
        ?string $customerType,
        ?int $customerGroupId,
        float $makingCharge,
        float $lineSubtotal,
        Carbon $now
    ): Collection {
        return MakingChargeDiscount::query()
            ->where('is_active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', $now);
            })
            ->get()
            ->filter(function (MakingChargeDiscount $discount) use ($product, $customerType, $customerGroupId, $lineSubtotal) {
                if (! $discount->is_auto) {
                    return false;
                }

                if ($discount->brand_id && $discount->brand_id !== $product->brand_id) {
                    return false;
                }

                if ($discount->category_id && $discount->category_id !== $product->category_id) {
                    return false;
                }

                $allowedTypes = collect($discount->customer_types ?? [])
                    ->filter(fn ($type) => is_string($type))
                    ->map(fn ($type) => strtolower($type))
                    ->values();

                if ($allowedTypes->isNotEmpty()) {
                    if ($customerType === null || ! $allowedTypes->contains($customerType)) {
                        return false;
                    }
                }

                if ($discount->customer_group_id) {
                    if ($customerGroupId === null || $discount->customer_group_id !== $customerGroupId) {
                        return false;
                    }
                }

                if ($discount->min_cart_total && $lineSubtotal < $discount->min_cart_total) {
                    return false;
                }

                return true;
            })
            ->map(function (MakingChargeDiscount $discount) use ($makingCharge) {
                $priority = 200;

                $hasCustomerTypes = ! empty($discount->customer_types);

                if ($hasCustomerTypes) {
                    $priority = 280;
                } elseif ($discount->customer_group_id) {
                    $priority = 260;
                } elseif ($discount->brand_id || $discount->category_id) {
                    $priority = 220;
                }

                return $this->buildDiscountPayload(
                    $discount->discount_type,
                    (float) $discount->value,
                    $makingCharge,
                    [
                        'source' => 'global',
                        'name' => $discount->name,
                        'priority' => $priority,
                        'customer_types' => $discount->customer_types,
                        'meta' => [
                            'discount_id' => $discount->id,
                            'brand_id' => $discount->brand_id,
                            'category_id' => $discount->category_id,
                            'customer_group_id' => $discount->customer_group_id,
                            'customer_types' => $discount->customer_types,
                            'min_cart_total' => $discount->min_cart_total,
                        ],
                    ],
                );
            })
            ->filter();
    }

    protected function buildDiscountPayload(string $type, float $value, float $makingCharge, array $attributes = []): ?array
    {
        $value = max(0, $value);

        if ($value <= 0) {
            return null;
        }

        $amount = $type === 'percentage'
            ? $makingCharge * (min($value, 100) / 100)
            : $value;

        $amount = min($amount, $makingCharge);

        return array_merge([
            'amount' => round($amount, 2),
            'type' => $type,
            'value' => round($value, 2),
            'priority' => $attributes['priority'] ?? 0,
            'source' => $attributes['source'] ?? null,
            'name' => $attributes['name'] ?? null,
            'meta' => $attributes['meta'] ?? [],
            'customer_types' => $attributes['customer_types'] ?? ($attributes['meta']['customer_types'] ?? null),
        ], $attributes);
    }

    protected function emptyDiscount(): array
    {
        return [
            'amount' => 0.0,
            'type' => null,
            'value' => 0.0,
            'source' => null,
            'name' => null,
            'meta' => [],
        ];
    }
}

