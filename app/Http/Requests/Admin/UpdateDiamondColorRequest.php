<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateDiamondColorRequest extends StoreDiamondColorRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $diamondColor = $this->route('diamond_color');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('diamond_colors', 'name')->ignore($diamondColor?->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}

