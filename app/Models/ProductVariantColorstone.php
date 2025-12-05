<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariantColorstone extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_variant_id',
        'colorstone_shape_id',
        'colorstone_color_id',
        'colorstone_quality_id',
        'stones_count',
        'total_carat',
        'metadata',
        'position',
    ];

    protected $casts = [
        'stones_count' => 'integer',
        'total_carat' => 'float',
        'metadata' => 'array',
        'position' => 'integer',
    ];

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function colorstoneShape(): BelongsTo
    {
        return $this->belongsTo(ColorstoneShape::class);
    }

    public function colorstoneColor(): BelongsTo
    {
        return $this->belongsTo(ColorstoneColor::class);
    }

    public function colorstoneQuality(): BelongsTo
    {
        return $this->belongsTo(ColorstoneQuality::class);
    }
}
