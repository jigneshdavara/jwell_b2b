<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends StoreCategoryRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = parent::rules();

        $category = $this->route('category'); // Route parameter is 'category' from resource route

        $rules['slug'] = [
            'nullable',
            'string',
            'max:255',
            Rule::unique('categories', 'slug')->ignore($category ? $category->id : null),
        ];

        $rules['parent_id'][] = Rule::notIn([$category ? $category->id : null]);

        return $rules;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'parent_id' => $this->parent_id === null || $this->parent_id === '' ? null : $this->parent_id,
        ]);
    }
}
