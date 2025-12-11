<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMetalPurityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage products') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'metal_id' => ['required', 'integer', 'exists:metals,id'],
            'code' => ['required', 'string', 'max:255', Rule::unique('metal_purities', 'code')->where('metal_id', $this->input('metal_id'))],
            'name' => ['required', 'string', 'max:255', Rule::unique('metal_purities', 'name')->where('metal_id', $this->input('metal_id'))],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'display_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
