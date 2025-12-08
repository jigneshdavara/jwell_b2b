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
        'colorstone_id',
        'stones_count',
        'metadata',
        'position',
    ];

    protected $casts = [
        'stones_count' => 'integer',
        'metadata' => 'array',
        'position' => 'integer',
    ];

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function colorstone(): BelongsTo
    {
        return $this->belongsTo(Colorstone::class);
    }
}
