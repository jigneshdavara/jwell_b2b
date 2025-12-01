<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateCustomerGroupRequest extends StoreCustomerGroupRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $customerGroup = $this->route('group'); // Route parameter is 'group' from resource route

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('customer_groups', 'name')->ignore($customerGroup ? $customerGroup->id : null)],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
