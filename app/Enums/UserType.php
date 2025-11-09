<?php

namespace App\Enums;

enum UserType: string
{
    case Retailer = 'retailer';
    case Wholesaler = 'wholesaler';
    case Admin = 'admin';
    case SuperAdmin = 'super-admin';
    case Sales = 'sales';
    case Production = 'production';
}

