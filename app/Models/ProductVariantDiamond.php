<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariantDiamond extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_variant_id',
        'diamond_shape_id',
        'diamond_color_id',
        'diamond_clarity_id',
        'diamonds_count',
        'total_carat',
        'metadata',
        'position',
    ];

    protected $casts = [
        'diamonds_count' => 'integer',
        'total_carat' => 'float',
        'metadata' => 'array',
        'position' => 'integer',
    ];

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function diamondShape(): BelongsTo
    {
        return $this->belongsTo(DiamondShape::class);
    }

    public function diamondColor(): BelongsTo
    {
        return $this->belongsTo(DiamondColor::class);
    }

    public function diamondClarity(): BelongsTo
    {
        return $this->belongsTo(DiamondClarity::class);
    }
}
