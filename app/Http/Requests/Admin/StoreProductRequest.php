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
        $removedMediaRule = Rule::exists('product_medias', 'id');

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
            'style_id' => ['nullable', 'integer', 'exists:styles,id'],
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
            'catalog_ids' => ['nullable', 'array'],
            'catalog_ids.*' => ['integer', 'exists:catalogs,id'],
            'collection' => ['required', 'string', 'max:255'],
            'producttype' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'string', 'max:50', Rule::in(['Men', 'Women', 'Unisex', 'Kids'])],
            'making_charge_amount' => ['nullable', 'numeric', 'min:0'],
            'making_charge_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
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
            'variants.*.size_id' => ['nullable', 'integer', 'exists:sizes,id'],
            'variants.*.inventory_quantity' => ['nullable', 'integer', 'min:0'],
            'variants.*.is_default' => ['nullable', 'boolean'],
            'variants.*.metadata' => ['nullable', 'array'],
            'variants.*.metals' => ['nullable', 'array'],
            'variants.*.diamonds' => ['nullable', 'array'],
            'variants.*.diamonds.*.diamond_id' => ['required', 'integer', 'exists:diamonds,id'],
            'variants.*.diamonds.*.diamonds_count' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            // Ensure at least one making charge option is provided
            $makingChargeTypes = $this->input('making_charge_types', []);
            $makingChargeAmount = $this->input('making_charge_amount');
            $makingChargePercentage = $this->input('making_charge_percentage');

            $hasFixed = in_array('fixed', $makingChargeTypes) && $makingChargeAmount !== null && $makingChargeAmount !== '' && (float) $makingChargeAmount > 0;
            $hasPercentage = in_array('percentage', $makingChargeTypes) && $makingChargePercentage !== null && $makingChargePercentage !== '' && (float) $makingChargePercentage > 0;

            if (empty($makingChargeTypes) || (!$hasFixed && !$hasPercentage)) {
                $validator->errors()->add('making_charge_types', 'Please select at least one making charge option (Fixed Amount or Percentage).');
                if (!$hasFixed && in_array('fixed', $makingChargeTypes)) {
                    $validator->errors()->add('making_charge_amount', 'Fixed making charge value is required when Fixed Amount is selected.');
                }
                if (!$hasPercentage && in_array('percentage', $makingChargeTypes)) {
                    $validator->errors()->add('making_charge_percentage', 'Percentage value is required when Percentage is selected.');
                }
            }
        });
    }
}
