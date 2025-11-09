<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage products') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->baseRules();
    }

    /**
     * @param  int|null  $productId
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    protected function baseRules(?int $productId = null): array
    {
        return [
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->ignore($productId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'brand_id' => ['required', 'exists:brands,id'],
            'category_id' => ['required', 'exists:categories,id'],
            'material_id' => ['required', 'exists:materials,id'],
            'gross_weight' => ['nullable', 'numeric', 'min:0'],
            'net_weight' => ['nullable', 'numeric', 'min:0'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'making_charge' => ['required', 'numeric', 'min:0'],
            'standard_pricing' => ['nullable', 'array'],
            'standard_pricing.labour_brand' => ['nullable', 'string', 'max:255'],
            'standard_pricing.diamond_rate' => ['nullable', 'numeric', 'min:0'],
            'standard_pricing.gold_rate' => ['nullable', 'numeric', 'min:0'],
            'standard_pricing.colourstone_rate' => ['nullable', 'numeric', 'min:0'],
            'is_jobwork_allowed' => ['boolean'],
            'visibility' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
            'variant_options' => ['nullable', 'array'],
            'variant_options.metal_tone' => ['nullable', 'array'],
            'variant_options.metal_tone.*' => ['nullable', 'string', 'max:100'],
            'variant_options.stone_quality' => ['nullable', 'array'],
            'variant_options.stone_quality.*' => ['nullable', 'string', 'max:100'],
            'variant_options.size' => ['nullable', 'array'],
            'variant_options.size.*' => ['nullable', 'string', 'max:100'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'variants.*.sku' => ['nullable', 'string', 'max:100'],
            'variants.*.label' => ['required', 'string', 'max:255'],
            'variants.*.metal_tone' => ['nullable', 'string', 'max:100'],
            'variants.*.stone_quality' => ['nullable', 'string', 'max:100'],
            'variants.*.size' => ['nullable', 'string', 'max:100'],
            'variants.*.price_adjustment' => ['nullable', 'numeric'],
            'variants.*.is_default' => ['boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $variants = collect($this->input('variants', []));

            if ($variants->isEmpty()) {
                $validator->errors()->add('variants', 'Add at least one variant option for the product.');

                return;
            }

            if ($variants->where('is_default', true)->count() === 0) {
                $validator->errors()->add('variants', 'Select a default variant for catalogue display.');
            }

            $skus = $variants->pluck('sku')->filter();
            if ($skus->count() !== $skus->unique()->count()) {
                $validator->errors()->add('variants', 'Variant SKU values must be unique.');
            }
        });
    }
}
