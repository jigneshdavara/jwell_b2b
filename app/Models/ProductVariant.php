<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'sku',
        'label',
        // Legacy columns - kept for data migration, but should not be used in new code
        'size',
        'inventory_quantity',
        'is_default',
        'metadata',
    ];

    protected $casts = [
        'inventory_quantity' => 'integer',
        'is_default' => 'boolean',
        'metadata' => 'array',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function metals(): HasMany
    {
        return $this->hasMany(ProductVariantMetal::class)->orderBy('position');
    }

    public function diamonds(): HasMany
    {
        return $this->hasMany(ProductVariantDiamond::class)->orderBy('position');
    }
}
