<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiamondType extends Model
{
    use HasFactory;

    protected $fillable = [
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

    public function clarities(): HasMany
    {
        return $this->hasMany(DiamondClarity::class);
    }

    public function colors(): HasMany
    {
        return $this->hasMany(DiamondColor::class);
    }

    public function shapes(): HasMany
    {
        return $this->hasMany(DiamondShape::class);
    }

    public function shapeSizes(): HasMany
    {
        return $this->hasMany(DiamondShapeSize::class);
    }

    public function diamonds(): HasMany
    {
        return $this->hasMany(Diamond::class);
    }
}


