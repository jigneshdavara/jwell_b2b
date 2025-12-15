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
            'style_ids' => ['nullable', 'array'],
            'style_ids.*' => ['integer', 'exists:styles,id'],
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
            'metadata' => ['nullable', 'array'],
            'metadata.show_all_variants_by_size' => ['nullable', 'boolean'],
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

            // Ensure at least one variant is provided
            $variants = $this->input('variants', []);
            if (empty($variants) || !is_array($variants) || count($variants) === 0) {
                $errorMessage = 'At least one product variant is required. Please generate the variant matrix before saving.';
                $validator->errors()->add('variants', $errorMessage);
                // Set flash error message for header display
                session()->flash('error', $errorMessage);
            } else {
                // Ensure each variant has at least one metal
                foreach ($variants as $index => $variant) {
                    $metals = $variant['metals'] ?? [];
                    $metalId = $variant['metal_id'] ?? null;

                    // Check if metals array has at least one valid metal
                    $hasValidMetal = false;
                    if (is_array($metals)) {
                        foreach ($metals as $metal) {
                            if (!empty($metal['metal_id']) && $metal['metal_id'] > 0) {
                                $hasValidMetal = true;
                                break;
                            }
                        }
                    }

                    // Also check if metal_id is set directly on variant (legacy support)
                    if (!$hasValidMetal && !empty($metalId) && $metalId > 0) {
                        $hasValidMetal = true;
                    }

                    if (!$hasValidMetal) {
                        $errorMessage = "Variant #" . ($index + 1) . " must have at least one metal.";
                        $validator->errors()->add("variants.{$index}.metals", $errorMessage);
                        // Set flash error message for header display if not already set
                        if (!session()->has('error')) {
                            session()->flash('error', 'One or more variants are missing required metals. Please ensure all variants have at least one metal configured.');
                        }
                    }
                }
            }
        });
    }
}
