<?php

namespace App\Enums;

enum JobworkStatus: string
{
    case Submitted = 'submitted';
    case Approved = 'approved';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}

