<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTeamUserRequest extends FormRequest
{
    private const ALLOWED_TYPES = ['admin', 'super-admin', 'production', 'sales'];

    public function authorize(): bool
    {
        return $this->user()?->can('manage customers') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
                Rule::unique('customers', 'email'),
            ],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'type' => ['required', 'string', Rule::in(self::ALLOWED_TYPES)],
            'user_group_id' => ['nullable', 'integer', 'exists:user_groups,id'],
        ];
    }
}

