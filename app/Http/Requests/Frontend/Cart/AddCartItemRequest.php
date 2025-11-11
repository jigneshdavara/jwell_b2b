<?php

namespace App\Http\Requests\Frontend\Cart;

use Illuminate\Foundation\Http\FormRequest;

class AddCartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'configuration' => ['sometimes', 'array'],
            'configuration.mode' => ['nullable', 'in:purchase,jobwork'],
            'configuration.notes' => ['nullable', 'string', 'max:2000'],
            'configuration.selections' => ['nullable', 'array'],
        ];
    }
}
