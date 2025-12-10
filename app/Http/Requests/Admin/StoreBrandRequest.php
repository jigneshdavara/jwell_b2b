<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBrandRequest extends FormRequest
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
            'code' => ['required', 'string', 'max:255', Rule::unique('brands', 'code')],
            'name' => ['required', 'string', 'max:255', Rule::unique('brands', 'name')],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'display_order' => ['required', 'integer', 'min:0'],
            'cover_image' => ['nullable', 'image', 'max:2048'],
        ];
    }
}
