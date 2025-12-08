<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Colorstone extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'colorstone_color_id',
        'colorstone_quality_id',
        'colorstone_shape_id',
        'colorstone_shape_size_id',
        'price',
        'description',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function color(): BelongsTo
    {
        return $this->belongsTo(ColorstoneColor::class, 'colorstone_color_id');
    }

    public function quality(): BelongsTo
    {
        return $this->belongsTo(ColorstoneQuality::class, 'colorstone_quality_id');
    }

    public function shape(): BelongsTo
    {
        return $this->belongsTo(ColorstoneShape::class, 'colorstone_shape_id');
    }

    public function shapeSize(): BelongsTo
    {
        return $this->belongsTo(ColorstoneShapeSize::class, 'colorstone_shape_size_id');
    }
}
