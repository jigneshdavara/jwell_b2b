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
        'diamond_id',
        'diamonds_count',
        'metadata',
        'position',
    ];

    protected $casts = [
        'diamonds_count' => 'integer',
        'metadata' => 'array',
        'position' => 'integer',
    ];

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function diamond(): BelongsTo
    {
        return $this->belongsTo(Diamond::class);
    }
}
