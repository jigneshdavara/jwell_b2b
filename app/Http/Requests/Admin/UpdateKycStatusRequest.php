<?php

namespace App\Http\Requests\Admin;

use App\Enums\KycStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateKycStatusRequest extends FormRequest
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
            'status' => ['required', Rule::in(collect(KycStatus::cases())->pluck('value')->all())],
            'remarks' => [
                'nullable',
                'string',
                'max:500',
                Rule::requiredIf(fn () => $this->input('status') === KycStatus::Rejected->value),
            ],
        ];
    }
}
