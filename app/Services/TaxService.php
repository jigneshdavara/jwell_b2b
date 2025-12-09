<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\Tax;

class TaxService
{
    /**
     * Get the default tax rate (percentage).
     * 
     * Priority:
     * 1. Setting 'default_tax_rate'
     * 2. First active tax's rate
     * 3. Default 18% (GST for India)
     */
    public function getDefaultTaxRate(): float
    {
        // Check settings first
        $settingRate = Setting::get('default_tax_rate');
        if ($settingRate !== null && is_numeric($settingRate)) {
            return (float) $settingRate;
        }

        // Get first active tax
        $tax = Tax::query()
            ->where('is_active', true)
            ->orderBy('id')
            ->first();

        if ($tax) {
            return (float) $tax->rate;
        }

        // Default to 18% GST (India)
        return 18.0;
    }

    /**
     * Calculate tax amount from subtotal.
     */
    public function calculateTax(float $subtotal, ?float $taxRate = null): float
    {
        $rate = $taxRate ?? $this->getDefaultTaxRate();

        if ($rate <= 0) {
            return 0.0;
        }

        return round(($subtotal * $rate) / 100, 2);
    }

    /**
     * Get all active taxes for a tax group (if needed for future multi-tax support).
     */
    public function getActiveTaxes(?int $taxGroupId = null): \Illuminate\Support\Collection
    {
        $query = Tax::query()->where('is_active', true);

        if ($taxGroupId) {
            $query->where('tax_group_id', $taxGroupId);
        }

        return $query->orderBy('id')->get();
    }
}
