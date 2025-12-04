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
        'code',
        'name',
        'description',
        'is_active',
        'display_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function metal(): BelongsTo
    {
        return $this->belongsTo(Metal::class);
    }
}
