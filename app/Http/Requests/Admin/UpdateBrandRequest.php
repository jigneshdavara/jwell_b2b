<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateBrandRequest extends StoreBrandRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();

        $brand = $this->route('brand');

        $rules['slug'] = [
            'nullable',
            'string',
            'max:255',
            Rule::unique('brands', 'slug')->ignore($brand?->id),
        ];

        return $rules;
    }
}
