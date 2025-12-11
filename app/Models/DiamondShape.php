<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiamondShape extends Model
{
    use HasFactory;

    protected $fillable = [
        'diamond_type_id',
        'code',
        'name',
        'description',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public function type(): BelongsTo
    {
        return $this->belongsTo(DiamondType::class, 'diamond_type_id');
    }

    public function sizes(): HasMany
    {
        return $this->hasMany(DiamondShapeSize::class);
    }
}
