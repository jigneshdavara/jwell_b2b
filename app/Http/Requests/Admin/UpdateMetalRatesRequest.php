<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMetalRatesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'currency' => ['nullable', 'string', 'max:10'],
            'rates' => ['required', 'array', 'min:1'],
            'rates.*.purity' => ['required', 'string', 'max:50'],
            'rates.*.price_per_gram' => ['required', 'numeric', 'gt:0'],
        ];
    }
}

