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
        'collection',
        'producttype',
        'gender',
        'making_charge_amount',
        'making_charge_percentage',
        'making_charge_discount_type',
        'making_charge_discount_value',
        'making_charge_discount_overrides',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'making_charge_discount_value' => 'float',
        'making_charge_discount_overrides' => 'array',
        'making_charge_percentage' => 'float',
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
     * Infer making charge type from making_charge_amount and making_charge_percentage values.
     */
    public function getMakingChargeTypeAttribute(): string
    {
        $hasFixed = (float) ($this->attributes['making_charge_amount'] ?? 0) > 0;
        $hasPercentage = (float) ($this->attributes['making_charge_percentage'] ?? 0) > 0;

        if ($hasFixed && $hasPercentage) {
            return 'both';
        } elseif ($hasPercentage) {
            return 'percentage';
        } else {
            return 'fixed';
        }
    }
}
