<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiamondShape extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'ecat_name',
        'description',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    public function sizes(): HasMany
    {
        return $this->hasMany(DiamondShapeSize::class);
    }
}
