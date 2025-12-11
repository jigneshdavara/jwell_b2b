<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDiamondColorRequest extends FormRequest
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
        $color = $this->route('color');

        return [
            'diamond_type_id' => ['required', 'integer', 'exists:diamond_types,id'],
            'code' => [
                'required',
                'string',
                'max:255',
                Rule::unique('diamond_colors', 'code')
                    ->where('diamond_type_id', $this->input('diamond_type_id'))
                    ->ignore($color?->id),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('diamond_colors', 'name')
                    ->where('diamond_type_id', $this->input('diamond_type_id'))
                    ->ignore($color?->id),
            ],
            'description' => ['nullable', 'string'],
            'display_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
