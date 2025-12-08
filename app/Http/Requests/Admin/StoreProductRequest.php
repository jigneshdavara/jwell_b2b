<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Illuminate\Validation\Rules\File;

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
        $removedMediaRule = Rule::exists('product_media', 'id');

        if ($productId) {
            $removedMediaRule = $removedMediaRule->where('product_id', $productId);
        }

        return [
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->ignore($productId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'titleline' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'brand_id' => ['required', 'exists:brands,id'],
            'category_id' => ['required', 'exists:categories,id'],
            'collection' => ['required', 'string', 'max:255'],
            'producttype' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'string', 'max:50', Rule::in(['Men', 'Women', 'Unisex', 'Kids'])],
            'making_charge' => ['required', 'numeric', 'min:0'],
            'making_charge_discount_type' => ['nullable', 'in:percentage,fixed'],
            'making_charge_discount_value' => ['nullable', 'numeric', 'min:0', 'required_with:making_charge_discount_type'],
            'making_charge_discount_overrides' => ['nullable', 'array'],
            'making_charge_discount_overrides.*.customer_group_id' => ['required', 'integer', 'exists:customer_groups,id'],
            'making_charge_discount_overrides.*.type' => ['required', 'in:percentage,fixed'],
            'making_charge_discount_overrides.*.value' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'media_uploads' => ['nullable', 'array'],
            'media_uploads.*' => [
                File::types(['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'm4v', 'webm'])->max(51200),
            ],
            'removed_media_ids' => ['nullable', 'array'],
            'removed_media_ids.*' => ['integer', $removedMediaRule],
            'variants' => ['nullable', 'array'],
            'variants.*.label' => ['required', 'string', 'max:255'],
            'variants.*.sku' => ['nullable', 'string', 'max:100'],
            'variants.*.price_adjustment' => ['nullable', 'numeric'],
            'variants.*.inventory_quantity' => ['nullable', 'integer', 'min:0'],
            'variants.*.is_default' => ['nullable', 'boolean'],
            'variants.*.metadata' => ['nullable', 'array'],
            'variants.*.metals' => ['nullable', 'array'],
            'variants.*.diamonds' => ['nullable', 'array'],
            'variants.*.diamonds.*.diamond_id' => ['required', 'integer', 'exists:diamonds,id'],
            'variants.*.diamonds.*.diamonds_count' => ['nullable', 'integer', 'min:0'],
            'variants.*.colorstones' => ['nullable', 'array'],
            'variants.*.colorstones.*.colorstone_id' => ['required', 'integer', 'exists:colorstones,id'],
            'variants.*.colorstones.*.stones_count' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $overrides = collect($this->input('making_charge_discount_overrides', []));
            $duplicateGroups = $overrides
                ->pluck('customer_group_id')
                ->filter()
                ->duplicates();

            if ($duplicateGroups->isNotEmpty()) {
                $validator->errors()->add('making_charge_discount_overrides', 'Duplicate customer group entries detected.');
            }
        });
    }
}
