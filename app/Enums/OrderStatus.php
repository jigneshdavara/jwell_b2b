<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case InProduction = 'in_production';
    case QualityCheck = 'quality_check';
    case ReadyToDispatch = 'ready_to_dispatch';
    case Dispatched = 'dispatched';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case PendingPayment = 'pending_payment';
    case Paid = 'paid';
    case PaymentFailed = 'payment_failed';
    case AwaitingMaterials = 'awaiting_materials';
}

