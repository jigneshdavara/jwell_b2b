<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateMetalToneRequest extends StoreMetalToneRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $metalTone = $this->route('metal_tone');

        return [
            'metal_id' => ['required', 'integer', 'exists:metals,id'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('metal_tones', 'name')
                    ->where('metal_id', $this->input('metal_id'))
                    ->ignore($metalTone?->id),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}




