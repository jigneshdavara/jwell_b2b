<?php

namespace App\Models;

use App\Enums\JobworkStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Customer;

class JobworkRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'product_variant_id',
        'type',
        'submission_mode',
        'reference_design',
        'reference_url',
        'reference_media',
        'metal_id',
        'metal_purity_id',
        'metal_tone_id',
        'metal',
        'purity',
        'diamond_quality',
        'quantity',
        'special_instructions',
        'delivery_deadline',
        'wastage_percentage',
        'manufacturing_charge',
        'status',
        'converted_work_order_id',
        'metadata',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'delivery_deadline' => 'datetime',
        'wastage_percentage' => 'float',
        'manufacturing_charge' => 'float',
        'reference_media' => 'array',
        'metadata' => 'array',
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

    public function convertedWorkOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class, 'converted_work_order_id');
    }

    public function workOrders(): HasMany
    {
        return $this->hasMany(WorkOrder::class);
    }

    public function scopeStatus($query, JobworkStatus $status)
    {
        return $query->where('status', $status->value);
    }
}
