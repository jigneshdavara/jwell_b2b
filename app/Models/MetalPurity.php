<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MetalPurity extends Model
{
    use HasFactory;

    protected $fillable = [
        'metal_id',
        'name',
        'slug',
        'description',
        'is_active',
        'position',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function metal(): BelongsTo
    {
        return $this->belongsTo(Metal::class);
    }
}
