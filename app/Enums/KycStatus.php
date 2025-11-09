<?php

namespace App\Enums;

enum KycStatus: string
{
    case Pending = 'pending';
    case Review = 'review';
    case Approved = 'approved';
    case Rejected = 'rejected';
}

