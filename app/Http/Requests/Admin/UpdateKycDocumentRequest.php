<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateKycDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('approve kyc') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['pending', 'approved', 'rejected', 'needs_revision'])],
            'remarks' => ['nullable', 'string', 'max:500'],
        ];
    }
}
