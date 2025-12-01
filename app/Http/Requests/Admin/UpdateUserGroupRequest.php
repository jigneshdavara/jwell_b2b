<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateUserGroupRequest extends StoreUserGroupRequest
{
    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userGroup = $this->route('group'); // Route parameter is 'group' from resource route

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('user_groups', 'name')->ignore($userGroup ? $userGroup->id : null)],
            'description' => ['nullable', 'string'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string'],
            'is_active' => ['boolean'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
