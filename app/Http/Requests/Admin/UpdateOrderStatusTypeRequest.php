<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateOrderStatusTypeRequest extends StoreOrderStatusRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $status = $this->route('status'); // Route parameter is 'status' from resource route

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('order_statuses', 'name')->ignore($status ? $status->id : null)],
            'color' => ['nullable', 'string', 'max:7'],
            'is_default' => ['boolean'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}

