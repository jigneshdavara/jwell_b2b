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
        $clarity = $this->route('clarity'); // Route parameter is 'clarity' from resource route

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('diamond_clarities', 'name')->ignore($clarity ? $clarity->id : null)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
