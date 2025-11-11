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
            'configuration.mode' => ['nullable', 'in:purchase,jobwork'],
            'configuration.notes' => ['nullable', 'string', 'max:2000'],
            'configuration.selections' => ['nullable', 'array'],
        ];
    }
}
