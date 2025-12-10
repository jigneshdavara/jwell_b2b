<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'type',
        'url',
        'display_order',
        'metadata',
    ];

    protected $casts = [
        'display_order' => 'integer',
        'metadata' => 'array',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the URL attribute, normalizing double slashes.
     */
    public function getUrlAttribute($value): ?string
    {
        if (empty($value)) {
            return $value;
        }

        // Replace double slashes with single slash, but preserve http:// and https://
        return preg_replace('#(?<!:)/{2,}#', '/', $value);
    }
}
