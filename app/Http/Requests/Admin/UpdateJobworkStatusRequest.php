<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJobworkStatusRequest extends FormRequest
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
            'jobwork_status' => ['required', Rule::in([
                'material_sending',
                'material_received',
                'under_preparation',
                'completed',
                'awaiting_billing',
                'billing_confirmed',
                'ready_to_ship',
            ])],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

