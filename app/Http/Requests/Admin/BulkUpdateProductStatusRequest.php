<?php

namespace App\Http\Requests\Admin;

class BulkUpdateProductStatusRequest extends BulkProductsRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return parent::rules() + [
            'action' => ['required', 'string', 'in:activate,deactivate'],
        ];
    }
}
