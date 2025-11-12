<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AssignProductsToCatalogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('access admin portal') ?? false;
    }

    public function rules(): array
    {
        return [
            'product_ids' => ['required', 'array'],
            'product_ids.*' => ['integer', 'exists:products,id'],
        ];
    }
}

