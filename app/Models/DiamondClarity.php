<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiamondClarity extends Model
{
    use HasFactory;

    protected $fillable = [
        'diamond_type_id',
        'code',
        'name',
        'description',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public function type(): BelongsTo
    {
        return $this->belongsTo(DiamondType::class, 'diamond_type_id');
    }

    public function diamonds(): HasMany
    {
        return $this->hasMany(Diamond::class, 'diamond_clarity_id');
    }
}
