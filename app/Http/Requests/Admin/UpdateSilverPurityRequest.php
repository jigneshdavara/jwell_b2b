<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateSilverPurityRequest extends StoreSilverPurityRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $silverPurity = $this->route('silver_purity');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('silver_purities', 'name')->ignore($silverPurity?->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}

