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
        'description',
        'brand_id',
        'category_id',
        'material_id',
        'gross_weight',
        'net_weight',
        'gold_weight',
        'silver_weight',
        'other_material_weight',
        'total_weight',
        'base_price',
        'making_charge',
        'making_charge_discount_type',
        'making_charge_discount_value',
        'making_charge_discount_overrides',
        'is_jobwork_allowed',
        'visibility',
        'is_active',
        'metadata',
        'material_type',
        'style',
        'standard_pricing',
        'variant_options',
        'is_variant_product',
        'mixed_metal_tones_per_purity',
        'mixed_metal_purities_per_tone',
        'metal_mix_mode',
        'uses_gold',
        'uses_silver',
        'uses_diamond',
        'diamond_mixing_mode',
        'metal_ids',
        'metal_purity_ids',
        'metal_tone_ids',
        'diamond_options',
        'diamond_type_ids',
        'diamond_clarity_ids',
        'diamond_color_ids',
        'diamond_shape_ids',
        'diamond_cut_ids',
    ];

    protected $casts = [
        'is_jobwork_allowed' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array',
        'standard_pricing' => 'array',
        'variant_options' => 'array',
        'is_variant_product' => 'boolean',
        'mixed_metal_tones_per_purity' => 'boolean',
        'mixed_metal_purities_per_tone' => 'boolean',
        'metal_mix_mode' => 'array',
        'uses_gold' => 'boolean',
        'uses_silver' => 'boolean',
        'uses_diamond' => 'boolean',
        'diamond_mixing_mode' => 'string',
        'metal_ids' => 'array',
        'metal_purity_ids' => 'array',
        'metal_tone_ids' => 'array',
        'diamond_options' => 'array',
        'diamond_type_ids' => 'array',
        'diamond_clarity_ids' => 'array',
        'diamond_color_ids' => 'array',
        'diamond_shape_ids' => 'array',
        'diamond_cut_ids' => 'array',
        'making_charge_discount_value' => 'float',
        'making_charge_discount_overrides' => 'array',
        'gold_weight' => 'float',
        'silver_weight' => 'float',
        'other_material_weight' => 'float',
        'total_weight' => 'float',
    ];

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
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
        return $this->belongsToMany(ProductCatalog::class)->withTimestamps();
    }
}
