<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiamondShapeSize extends Model
{
    use HasFactory;

    protected $fillable = [
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

    public function shape(): BelongsTo
    {
        return $this->belongsTo(DiamondShape::class, 'diamond_shape_id');
    }
}
