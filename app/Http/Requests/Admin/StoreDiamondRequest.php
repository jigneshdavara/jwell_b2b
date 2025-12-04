<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreDiamondRequest extends FormRequest
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
            'diamond_clarity_id' => ['nullable', 'integer', 'exists:diamond_clarities,id'],
            'diamond_color_id' => ['nullable', 'integer', 'exists:diamond_colors,id'],
            'diamond_shape_id' => ['nullable', 'integer', 'exists:diamond_shapes,id'],
            'diamond_shape_size_id' => ['nullable', 'integer', 'exists:diamond_shape_sizes,id'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }
}
