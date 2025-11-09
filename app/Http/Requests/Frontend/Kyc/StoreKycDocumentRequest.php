<?php

namespace App\Http\Requests\Frontend\Kyc;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKycDocumentRequest extends FormRequest
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
            'document_type' => ['required', 'string', Rule::in($this->documentTypes())],
            'document_file' => ['required', 'file', 'max:8192', 'mimes:pdf,jpeg,jpg,png'],
        ];
    }

    public function documentTypes(): array
    {
        return [
            'gst_certificate',
            'trade_license',
            'pan_card',
            'aadhaar',
            'bank_statement',
            'store_photos',
        ];
    }
}
