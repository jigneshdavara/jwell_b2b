<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreRateOverrideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage rates') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'metal' => ['required', 'string', 'max:50'],
            'purity' => ['required', 'string', 'max:50'],
            'price_per_gram' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
            'notes' => ['nullable', 'string', 'max:500'],
            'effective_at' => ['nullable', 'date'],
        ];
    }
}
