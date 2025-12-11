<?php

namespace App\Http\Requests\Frontend\Cart;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'quantity' => ['nullable', 'integer', 'min:1'],
            'configuration' => ['nullable', 'array'],
            'configuration.notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
