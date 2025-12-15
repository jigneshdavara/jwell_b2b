<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiamondShapeSize extends Model
{
    use HasFactory;

    protected $fillable = [
        'diamond_type_id',
        'diamond_shape_id',
        'size',
        'secondary_size',
        'description',
        'display_order',
        'ctw',
    ];

    protected $casts = [
        'ctw' => 'decimal:3',
        'display_order' => 'integer',
    ];

    public function type(): BelongsTo
    {
        return $this->belongsTo(DiamondType::class, 'diamond_type_id');
    }

    public function shape(): BelongsTo
    {
        return $this->belongsTo(DiamondShape::class, 'diamond_shape_id');
    }

    public function diamonds(): HasMany
    {
        return $this->hasMany(Diamond::class, 'diamond_shape_size_id');
    }
}
