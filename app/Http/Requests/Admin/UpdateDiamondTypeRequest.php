<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDiamondTypeRequest extends FormRequest
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
        $typeId = $this->route('type')->id ?? null;

        return [
            'code' => ['nullable', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255', Rule::unique('diamond_types', 'name')->ignore($typeId)],
            'description' => ['nullable', 'string'],
            'display_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}


