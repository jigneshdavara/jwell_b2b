<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends StoreOrderStatusRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $orderStatus = $this->route('order_status');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('order_statuses', 'name')->ignore($orderStatus?->id)],
            'color' => ['nullable', 'string', 'max:7'],
            'is_default' => ['boolean'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
