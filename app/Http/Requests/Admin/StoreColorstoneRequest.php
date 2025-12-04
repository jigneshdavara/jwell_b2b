<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreColorstoneRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'colorstone_color_id' => ['nullable', 'integer', 'exists:colorstone_colors,id'],
            'colorstone_quality_id' => ['nullable', 'integer', 'exists:colorstone_qualities,id'],
            'colorstone_shape_id' => ['nullable', 'integer', 'exists:colorstone_shapes,id'],
            'colorstone_shape_size_id' => ['nullable', 'integer', 'exists:colorstone_shape_sizes,id'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }
}
