<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateCustomerTypeRequest extends StoreCustomerTypeRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $customerType = $this->route('customer_type');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('customer_types', 'name')->ignore($customerType?->id)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}

