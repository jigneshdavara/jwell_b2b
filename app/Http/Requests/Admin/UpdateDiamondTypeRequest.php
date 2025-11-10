<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateDiamondTypeRequest extends StoreDiamondTypeRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $diamondType = $this->route('diamond_type');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('diamond_types', 'name')->ignore($diamondType?->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}

