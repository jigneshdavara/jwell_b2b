<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateMetalPurityRequest extends StoreMetalPurityRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $metalPurity = $this->route('metal_purity');

        return [
            'metal_id' => ['required', 'integer', 'exists:metals,id'],
            'code' => ['nullable', 'string', 'max:255'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('metal_purities', 'name')
                    ->where('metal_id', $this->input('metal_id'))
                    ->ignore($metalPurity?->id),
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'display_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
