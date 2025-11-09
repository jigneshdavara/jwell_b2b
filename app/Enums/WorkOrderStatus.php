<?php

namespace App\Enums;

enum WorkOrderStatus: string
{
    case Draft = 'draft';
    case InProduction = 'in_production';
    case QualityCheck = 'quality_check';
    case ReadyToDispatch = 'ready_to_dispatch';
    case Dispatched = 'dispatched';
    case Closed = 'closed';
}

