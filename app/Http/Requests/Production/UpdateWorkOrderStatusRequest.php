<?php

namespace App\Http\Requests\Production;

use App\Enums\WorkOrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWorkOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update production status') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(collect(WorkOrderStatus::cases())->pluck('value')->all())],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
