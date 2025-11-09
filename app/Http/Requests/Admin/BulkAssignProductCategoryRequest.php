<?php

namespace App\Http\Requests\Admin;

class BulkAssignProductCategoryRequest extends BulkProductsRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return parent::rules() + [
            'category_id' => ['required', 'integer', 'exists:categories,id'],
        ];
    }
}
