<?php

namespace App\Models;

use App\Enums\WorkOrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'jobwork_request_id',
        'status',
        'assigned_to',
        'due_date',
        'notes',
        'metadata',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'metadata' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function jobworkRequest(): BelongsTo
    {
        return $this->belongsTo(JobworkRequest::class);
    }

    public function scopeStatus($query, WorkOrderStatus $status)
    {
        return $query->where('status', $status->value);
    }
}
