<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariantMetal extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_variant_id',
        'metal_id',
        'metal_purity_id',
        'metal_tone_id',
        'metal_weight',
        'metadata',
        'position',
    ];

    protected $casts = [
        'metal_weight' => 'float',
        'metadata' => 'array',
    ];

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function metal(): BelongsTo
    {
        return $this->belongsTo(Metal::class);
    }

    public function metalPurity(): BelongsTo
    {
        return $this->belongsTo(MetalPurity::class);
    }

    public function metalTone(): BelongsTo
    {
        return $this->belongsTo(MetalTone::class);
    }
}
