<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'display_order',
        'is_active',
        'cover_image',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
