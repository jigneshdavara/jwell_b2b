<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreDiamondShapeSizeRequest extends FormRequest
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
            'diamond_type_id' => ['required', 'integer', 'exists:diamond_types,id'],
            'diamond_shape_id' => ['required', 'integer', 'exists:diamond_shapes,id'],
            'size' => ['required', 'string', 'max:255'],
            'secondary_size' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'display_order' => ['required', 'integer', 'min:0'],
            'ctw' => ['required', 'numeric', 'min:0'],
        ];
    }
}
