<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BulkDestroyOrderStatusesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage orders') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:order_statuses,id'],
        ];
    }
}

