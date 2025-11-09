<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateOfferRequest extends StoreOfferRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();

        $offer = $this->route('offer');

        $rules['code'] = [
            'required',
            'string',
            'max:50',
            Rule::unique('offers', 'code')->ignore($offer?->id),
        ];

        return $rules;
    }

    public function authorize(): bool
    {
        return $this->user()?->can('manage offers') ?? false;
    }
}
