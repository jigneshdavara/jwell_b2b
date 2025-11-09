<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PriceRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'metal',
        'purity',
        'price_per_gram',
        'currency',
        'source',
        'effective_at',
        'metadata',
    ];

    protected $casts = [
        'price_per_gram' => 'float',
        'effective_at' => 'datetime',
        'metadata' => 'array',
    ];
}
