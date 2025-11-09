<?php

namespace App\Services\Catalog;

use App\Models\Product;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class ProductVariantSyncService
{
    public function sync(Product $product, array $variants, ?array $variantOptions = null): void
    {
        $variantsCollection = collect($variants)
            ->map(function (array $payload) {
                return [
                    'id' => $payload['id'] ?? null,
                    'sku' => $payload['sku'] ?? null,
                    'label' => $payload['label'],
                    'metal_tone' => $payload['metal_tone'] ?? null,
                    'stone_quality' => $payload['stone_quality'] ?? null,
                    'size' => $payload['size'] ?? null,
                    'price_adjustment' => (float) ($payload['price_adjustment'] ?? 0),
                    'is_default' => (bool) ($payload['is_default'] ?? false),
                    'metadata' => $payload['metadata'] ?? [],
                ];
            });

        if ($variantsCollection->where('is_default', true)->isEmpty() && $variantsCollection->isNotEmpty()) {
            $variantsCollection = $variantsCollection->map(function (array $variant, int $index) {
                $variant['is_default'] = $index === 0;

                return $variant;
            });
        }

        $persistedIds = [];

        $variantsCollection->each(function (array $variant) use ($product, &$persistedIds): void {
            $attributes = Arr::except($variant, ['id']);

            /** @var \App\Models\ProductVariant $model */
            $model = $variant['id']
                ? $product->variants()->firstWhere('id', $variant['id'])
                : null;

            if ($model) {
                $model->update($attributes);
                $persistedIds[] = $model->id;

                return;
            }

            $created = $product->variants()->create($attributes);
            $persistedIds[] = $created->id;
        });

        if (! empty($persistedIds)) {
            $product->variants()->whereNotIn('id', $persistedIds)->delete();
        } else {
            $product->variants()->delete();
        }

        $options = $this->prepareVariantOptions($variantsCollection, $variantOptions ?? []);

        $product->update([
            'variant_options' => $options,
        ]);
    }

    protected function prepareVariantOptions(Collection $variants, array $provided): array
    {
        $keys = ['metal_tone', 'stone_quality', 'size'];

        $baseline = collect($keys)->mapWithKeys(function ($key) use ($variants, $provided) {
            $submitted = $variants->pluck($key)->filter()->unique()->values()->all();
            $library = collect(Arr::get($provided, $key, []))->filter()->unique()->values()->all();

            return [$key => array_values(array_unique(array_merge($library, $submitted)))];
        })->toArray();

        return $baseline;
    }
}
