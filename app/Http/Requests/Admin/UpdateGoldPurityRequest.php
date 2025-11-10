<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateGoldPurityRequest extends StoreGoldPurityRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $goldPurity = $this->route('gold_purity');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('gold_purities', 'name')->ignore($goldPurity?->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}

