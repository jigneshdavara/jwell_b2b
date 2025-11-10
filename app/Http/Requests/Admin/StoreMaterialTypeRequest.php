<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaterialTypeRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('material_types', 'name')],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }
}

