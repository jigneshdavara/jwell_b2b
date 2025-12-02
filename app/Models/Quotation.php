<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Customer;

class Quotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'quotation_group_id',
        'product_id',
        'product_variant_id',
        'mode',
        'status',
        'quantity',
        'selections',
        'notes',
        'metadata',
        'order_id',
        'approved_at',
        'jobwork_status',
        'admin_notes',
    ];

    protected $casts = [
        'selections' => 'array',
        'metadata' => 'array',
        'approved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(QuotationMessage::class)->orderBy('created_at');
    }
}

