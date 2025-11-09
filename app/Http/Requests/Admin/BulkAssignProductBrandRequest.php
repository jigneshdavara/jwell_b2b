<?php

namespace App\Http\Requests\Admin;

class BulkAssignProductBrandRequest extends BulkProductsRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return parent::rules() + [
            'brand_id' => ['required', 'integer', 'exists:brands,id'],
        ];
    }
}
