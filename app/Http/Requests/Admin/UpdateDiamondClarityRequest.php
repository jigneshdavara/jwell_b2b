<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateDiamondClarityRequest extends StoreDiamondClarityRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $diamondClarity = $this->route('diamond_clarity');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('diamond_clarities', 'name')->ignore($diamondClarity?->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}

