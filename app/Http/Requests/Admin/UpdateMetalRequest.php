<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateMetalRequest extends StoreMetalRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $metal = $this->route('metal');

        return [
            'code' => ['nullable', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255', Rule::unique('metals', 'name')->ignore($metal?->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
