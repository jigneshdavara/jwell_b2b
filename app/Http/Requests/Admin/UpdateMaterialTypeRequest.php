<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateMaterialTypeRequest extends StoreMaterialTypeRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $materialType = $this->route('material_type');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('material_types', 'name')->ignore($materialType?->id),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }
}

