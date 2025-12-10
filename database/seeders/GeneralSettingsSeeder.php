<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class GeneralSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // General settings
        Setting::set('app_name', 'Elvee B2B', 'string', 'general');
        Setting::set('app_timezone', 'Asia/Kolkata', 'string', 'general');
        Setting::set('app_currency', 'INR', 'string', 'general');
        Setting::set('logo_path', '', 'string', 'general');
        Setting::set('favicon_path', '', 'string', 'general');

        // Company settings
        Setting::set('company_name', 'Elvee Jewellery Pvt. Ltd.', 'string', 'company');
        Setting::set('company_address', 'M1- M6, Gujarat Hira Bourse, Gem &
Jewellery Park Pal, Road, Ichchhapor, Hazira', 'string', 'company');
        Setting::set('company_city', 'Surat', 'string', 'company');
        Setting::set('company_state', 'Gujarat', 'string', 'company');
        Setting::set('company_pincode', '394510', 'string', 'company');
        Setting::set('company_phone', '+91 261 610 5100', 'string', 'company');
        Setting::set('company_email', 'info@elvee.in', 'string', 'company');
        Setting::set('company_gstin', '27AAAAA0000A1Z5', 'string', 'company');

        // Email settings
        Setting::set('admin_email', 'info@titliya.com', 'string', 'email');
    }
}


