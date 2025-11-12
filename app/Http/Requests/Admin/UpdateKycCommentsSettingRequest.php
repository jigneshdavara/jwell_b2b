<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateKycCommentsSettingRequest extends FormRequest
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
            'allow_replies' => ['required', 'boolean'],
        ];
    }
}

