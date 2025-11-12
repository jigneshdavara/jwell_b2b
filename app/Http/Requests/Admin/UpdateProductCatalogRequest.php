<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductCatalogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('access admin portal') ?? false;
    }

    public function rules(): array
    {
        $catalogId = $this->route('product_catalog')?->id ?? $this->route('catalog')?->id ?? $this->route('productCatalog')?->id ?? $this->route('id');

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('product_catalogs', 'slug')->ignore($catalogId),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

