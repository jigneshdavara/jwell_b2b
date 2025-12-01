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
        $shape = $this->route('shape'); // Route parameter is 'shape' from resource route

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('diamond_shapes', 'name')->ignore($shape ? $shape->id : null)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
