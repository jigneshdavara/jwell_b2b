<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BulkDestroyProductCatalogsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('access admin portal') ?? false;
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:product_catalogs,id'],
        ];
    }
}

