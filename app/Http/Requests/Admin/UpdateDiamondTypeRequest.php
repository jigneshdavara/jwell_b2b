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
        $type = $this->route('type'); // Route parameter is 'type' from resource route

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('diamond_types', 'name')->ignore($type ? $type->id : null)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
