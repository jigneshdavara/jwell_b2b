<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Metal extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'position',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function purities(): HasMany
    {
        return $this->hasMany(MetalPurity::class);
    }

    public function tones(): HasMany
    {
        return $this->hasMany(MetalTone::class);
    }
}
