<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MakingChargeDiscount extends Model
{
    protected $fillable = [
        'name',
        'description',
        'discount_type',
        'value',
        'brand_id',
        'category_id',
        'customer_group_id',
        'customer_types',
        'min_cart_total',
        'is_auto',
        'is_active',
        'starts_at',
        'ends_at',
    ];

    protected $casts = [
        'value' => 'float',
        'min_cart_total' => 'float',
        'is_auto' => 'bool',
        'is_active' => 'bool',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'customer_types' => 'array',
    ];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function customerGroup(): BelongsTo
    {
        return $this->belongsTo(CustomerGroup::class);
    }
}
