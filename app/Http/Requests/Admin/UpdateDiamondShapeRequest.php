<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateDiamondShapeRequest extends StoreDiamondShapeRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $diamondShape = $this->route('diamond_shape');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('diamond_shapes', 'name')->ignore($diamondShape?->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}

