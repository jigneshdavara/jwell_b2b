<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'sku',
        'name',
        'titleline',
        'description',
        'brand_id',
        'category_id',
        'subcategory_ids',
        'collection',
        'producttype',
        'gender',
        'making_charge_amount',
        'making_charge_percentage',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'making_charge_percentage' => 'float',
        'subcategory_ids' => 'array',
        'metadata' => 'array',
    ];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(ProductMedia::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function catalogs(): BelongsToMany
    {
        return $this->belongsToMany(Catalog::class, 'catalog_products')->withTimestamps();
    }

    /**
     * Calculate making charge based on metal cost and configured types.
     * 
     * @param float $metalCost The metal cost to calculate percentage on
     * @return float The calculated making charge amount
     */
    public function calculateMakingCharge(float $metalCost = 0.0): float
    {
        $types = $this->metadata['making_charge_types'] ?? [];
        
        // Infer types from existing data if not stored in metadata (backward compatibility)
        if (empty($types)) {
            $hasFixed = $this->making_charge_amount !== null && (float) $this->making_charge_amount > 0;
            $hasPercentage = $this->making_charge_percentage !== null && (float) $this->making_charge_percentage > 0;
            
            if ($hasFixed && $hasPercentage) {
                $types = ['fixed', 'percentage'];
            } elseif ($hasFixed) {
                $types = ['fixed'];
            } elseif ($hasPercentage) {
                $types = ['percentage'];
            }
        }

        $makingCharge = 0.0;

        // Fixed amount
        if (in_array('fixed', $types, true)) {
            $makingCharge += max(0.0, (float) ($this->making_charge_amount ?? 0));
        }

        // Percentage of metal cost
        if (in_array('percentage', $types, true) && $metalCost > 0) {
            $percentage = max(0.0, (float) ($this->making_charge_percentage ?? 0));
            $makingCharge += $metalCost * ($percentage / 100);
        }

        return round($makingCharge, 2);
    }

    /**
     * Get making charge types configured for this product.
     * 
     * @return array<string>
     */
    public function getMakingChargeTypes(): array
    {
        $types = $this->metadata['making_charge_types'] ?? [];
        
        // Infer types from existing data if not stored in metadata (backward compatibility)
        if (empty($types)) {
            $hasFixed = $this->making_charge_amount !== null && (float) $this->making_charge_amount > 0;
            $hasPercentage = $this->making_charge_percentage !== null && (float) $this->making_charge_percentage > 0;
            
            if ($hasFixed && $hasPercentage) {
                return ['fixed', 'percentage'];
            } elseif ($hasFixed) {
                return ['fixed'];
            } elseif ($hasPercentage) {
                return ['percentage'];
            }
        }

        return $types;
    }
}
