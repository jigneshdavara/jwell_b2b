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

        $isVariantProduct = $this->boolean('is_variant_product', true);

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
            'product_catalog_ids' => ['nullable', 'array'],
            'product_catalog_ids.*' => ['integer', 'exists:product_catalogs,id'],
            'gross_weight' => ['nullable', 'numeric', 'min:0'],
            'net_weight' => ['nullable', 'numeric', 'min:0'],
            'gold_weight' => ['nullable', 'numeric', 'min:0'],
            'silver_weight' => ['nullable', 'numeric', 'min:0'],
            'other_material_weight' => ['nullable', 'numeric', 'min:0'],
            'total_weight' => ['nullable', 'numeric', 'min:0'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'making_charge' => ['required', 'numeric', 'min:0'],
            'making_charge_discount_type' => ['nullable', 'in:percentage,fixed'],
            'making_charge_discount_value' => ['nullable', 'numeric', 'min:0', 'required_with:making_charge_discount_type'],
            'making_charge_discount_overrides' => ['nullable', 'array'],
            'making_charge_discount_overrides.*.customer_group_id' => ['required', 'integer', 'exists:customer_groups,id'],
            'making_charge_discount_overrides.*.type' => ['required', 'in:percentage,fixed'],
            'making_charge_discount_overrides.*.value' => ['required', 'numeric', 'min:0'],
            'standard_pricing' => ['nullable', 'array'],
            'standard_pricing.labour_brand' => ['nullable', 'string', 'max:255'],
            'standard_pricing.diamond_rate' => ['nullable', 'numeric', 'min:0'],
            'standard_pricing.gold_rate' => ['nullable', 'numeric', 'min:0'],
            'standard_pricing.colourstone_rate' => ['nullable', 'numeric', 'min:0'],
            'is_jobwork_allowed' => ['boolean'],
            'visibility' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
            'is_variant_product' => ['boolean'],
            'uses_gold' => ['boolean'],
            'uses_silver' => ['boolean'],
            'uses_diamond' => ['boolean'],
            'gold_purity_ids' => ['nullable', 'array'],
            'gold_purity_ids.*' => ['integer', 'exists:gold_purities,id'],
            'silver_purity_ids' => ['nullable', 'array'],
            'silver_purity_ids.*' => ['integer', 'exists:silver_purities,id'],
            'diamond_options' => ['nullable', 'array'],
            'diamond_options.*.key' => ['required', 'string'],
            'diamond_options.*.type_id' => ['nullable', 'integer', 'exists:diamond_types,id'],
            'diamond_options.*.shape_id' => ['nullable', 'integer', 'exists:diamond_shapes,id'],
            'diamond_options.*.color_id' => ['nullable', 'integer', 'exists:diamond_colors,id'],
            'diamond_options.*.clarity_id' => ['nullable', 'integer', 'exists:diamond_clarities,id'],
            'diamond_options.*.cut_id' => ['nullable', 'integer', 'exists:diamond_cuts,id'],
            'diamond_options.*.weight' => ['nullable', 'numeric', 'min:0'],
            'metadata' => ['nullable', 'array'],
            'metadata.size_dimension' => ['nullable', 'array'],
            'metadata.size_dimension.unit' => ['required_with:metadata.size_dimension', 'in:mm,cm'],
            'metadata.size_dimension.values' => ['nullable', 'array'],
            'metadata.size_dimension.values.*' => ['numeric', 'min:0'],
            'variants' => [
                Rule::requiredIf($isVariantProduct),
                'array',
                Rule::when($isVariantProduct, ['min:1']),
            ],
            'variants.*.id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'variants.*.sku' => ['nullable', 'string', 'max:100'],
            'variants.*.label' => [Rule::requiredIf($isVariantProduct), 'string', 'max:255'],
            'variants.*.metal_tone' => ['nullable', 'string', 'max:100'],
            'variants.*.stone_quality' => ['nullable', 'string', 'max:100'],
            'variants.*.size' => ['nullable', 'string', 'max:100'],
            'variants.*.price_adjustment' => ['nullable', 'numeric'],
            'variants.*.is_default' => ['boolean'],
            'variants.*.gold_purity_id' => ['nullable', 'integer', 'exists:gold_purities,id'],
            'variants.*.silver_purity_id' => ['nullable', 'integer', 'exists:silver_purities,id'],
            'variants.*.diamond_option_key' => ['nullable', 'string'],
            'variants.*.size_cm' => ['nullable', 'numeric', 'min:0'],
            'variants.*.metadata' => ['nullable', 'array'],
            'media_uploads' => ['nullable', 'array'],
            'media_uploads.*' => [
                File::types(['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'm4v', 'webm'])->max(51200),
            ],
            'removed_media_ids' => ['nullable', 'array'],
            'removed_media_ids.*' => ['integer', $removedMediaRule],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->boolean('is_variant_product', true)) {
                return;
            }

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
