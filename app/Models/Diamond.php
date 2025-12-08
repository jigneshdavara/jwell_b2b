<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Diamond extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'diamond_clarity_id',
        'diamond_color_id',
        'diamond_shape_id',
        'diamond_shape_size_id',
        'price',
        'description',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function clarity(): BelongsTo
    {
        return $this->belongsTo(DiamondClarity::class, 'diamond_clarity_id');
    }

    public function color(): BelongsTo
    {
        return $this->belongsTo(DiamondColor::class, 'diamond_color_id');
    }

    public function shape(): BelongsTo
    {
        return $this->belongsTo(DiamondShape::class, 'diamond_shape_id');
    }

    public function shapeSize(): BelongsTo
    {
        return $this->belongsTo(DiamondShapeSize::class, 'diamond_shape_size_id');
    }
}
