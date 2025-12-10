<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDiamondClarityRequest extends FormRequest
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
        $clarity = $this->route('clarity');

        return [
            'diamond_type_id' => ['required', 'integer', 'exists:diamond_types,id'],
            'code' => [
                'required',
                'string',
                'max:255',
                Rule::unique('diamond_clarities', 'code')
                    ->where('diamond_type_id', $this->input('diamond_type_id'))
                    ->ignore($clarity?->id),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('diamond_clarities', 'name')
                    ->where('diamond_type_id', $this->input('diamond_type_id'))
                    ->ignore($clarity?->id),
            ],
            'description' => ['nullable', 'string'],
            'display_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
