<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateDiamondCutRequest extends StoreDiamondCutRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $diamondCut = $this->route('diamond_cut');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('diamond_cuts', 'name')->ignore($diamondCut?->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}

