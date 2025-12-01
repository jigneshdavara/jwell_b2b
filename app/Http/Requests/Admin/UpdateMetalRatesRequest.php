<?php

namespace App\Http\Requests\Admin;

use App\Models\Metal;
use App\Models\MetalPurity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateMetalRatesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $metal = $this->route('metal');
        $normalizedMetal = Str::lower($metal);

        // Get the metal model to find its purities
        $metalModel = Metal::query()
            ->whereRaw('LOWER(slug) = ?', [$normalizedMetal])
            ->first();

        $validPurityNames = [];
        if ($metalModel) {
            $validPurityNames = MetalPurity::query()
                ->where('metal_id', $metalModel->id)
                ->where('is_active', true)
                ->pluck('name')
                ->all();
        }

        return [
            'currency' => ['nullable', 'string', 'max:10'],
            'rates' => ['required', 'array', 'min:1'],
            'rates.*.purity' => [
                'required',
                'string',
                'max:50',
                Rule::in($validPurityNames),
            ],
            'rates.*.price_per_gram' => ['required', 'numeric', 'gt:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'rates.*.purity.in' => 'The selected purity must exist in the metal purities table for this metal.',
        ];
    }
}
