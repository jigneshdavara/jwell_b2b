<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreColorstoneShapeSizeRequest extends FormRequest
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
            'colorstone_shape_id' => ['required', 'integer', 'exists:colorstone_shapes,id'],
            'size' => ['nullable', 'string', 'max:255'],
            'secondary_size' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'ctw' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
