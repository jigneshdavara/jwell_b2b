<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage offers') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:50', 'unique:offers,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', Rule::in(['percentage', 'fixed', 'making_charge'])],
            'value' => ['required', 'numeric', 'min:0'],
            'constraints' => ['nullable', 'array'],
            'constraints.min_order_total' => ['nullable', 'numeric', 'min:0'],
            'constraints.customer_types' => ['nullable', 'array'],
            'constraints.customer_types.*' => ['string', Rule::in(UserType::Retailer->value, UserType::Wholesaler->value)],
            'constraints.customer_group_ids' => ['nullable', 'array'],
            'constraints.customer_group_ids.*' => ['integer', 'exists:customer_groups,id'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['boolean'],
        ];
    }
}
