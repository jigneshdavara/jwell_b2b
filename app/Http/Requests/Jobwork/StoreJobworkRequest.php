<?php

namespace App\Http\Requests\Jobwork;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobworkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'submission_mode' => ['required', Rule::in(['catalogue', 'custom'])],
            'product_id' => [
                'nullable',
                'integer',
                'exists:products,id',
                Rule::requiredIf(fn () => $this->input('submission_mode') === 'catalogue'),
            ],
            'product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'type' => ['required', 'in:customer_supplied,vendor_supplied'],
            'reference_design' => ['nullable', 'string', 'max:500'],
            'reference_url' => ['nullable', 'url', 'max:255'],
            'reference_media' => ['nullable', 'array'],
            'reference_media.*' => ['nullable', 'url', 'max:255'],
            'metal' => ['required', 'string', 'max:100'],
            'purity' => ['required', 'string', 'max:50'],
            'diamond_quality' => ['nullable', 'string', 'max:50'],
            'quantity' => ['required', 'integer', 'min:1'],
            'special_instructions' => ['nullable', 'string'],
            'delivery_deadline' => ['nullable', 'date', 'after:today'],
            'wastage_percentage' => ['nullable', 'numeric', 'between:0,10'],
            'manufacturing_charge' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->input('submission_mode') === 'custom') {
                if (! $this->filled('reference_design') && empty(array_filter((array) $this->input('reference_media')))) {
                    $validator->errors()->add('reference_design', 'Provide design notes or at least one reference media URL.');
                }
            }
        });
    }

    public function prepareForValidation(): void
    {
        $mode = $this->input('submission_mode');

        if ($mode === 'catalogue') {
            $this->merge([
                'reference_media' => array_filter((array) $this->input('reference_media', [])),
            ]);
        }
    }

    public function messages(): array
    {
        return [
            'product_id.required' => 'Select a catalogue design to continue.',
        ];
    }
}
