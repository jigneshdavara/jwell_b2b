<?php

namespace App\Http\Controllers\Admin\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class GeneralSettingsController extends Controller
{
    public function index(): Response
    {
        $settings = [
            'admin_email' => Setting::get('admin_email', config('mail.from.address', '')),
            'company_name' => Setting::get('company_name', 'Elvee Jewellery Pvt. Ltd.'),
            'company_address' => Setting::get('company_address', ''),
            'company_city' => Setting::get('company_city', 'Mumbai'),
            'company_state' => Setting::get('company_state', 'Maharashtra'),
            'company_pincode' => Setting::get('company_pincode', ''),
            'company_phone' => Setting::get('company_phone', '+91 99888 77665'),
            'company_email' => Setting::get('company_email', 'hello@elvee.in'),
            'company_gstin' => Setting::get('company_gstin', '27AAAAA0000A1Z5'),
            'logo_path' => Setting::get('logo_path', ''),
            'favicon_path' => Setting::get('favicon_path', ''),
            'app_name' => Setting::get('app_name', 'Elvee B2B'),
            'app_timezone' => Setting::get('app_timezone', config('app.timezone', 'Asia/Kolkata')),
            'app_currency' => Setting::get('app_currency', config('app.currency', 'INR')),
        ];

        $logoUrl = $settings['logo_path'] ? Storage::disk('public')->url($settings['logo_path']) : null;
        $faviconUrl = $settings['favicon_path'] ? Storage::disk('public')->url($settings['favicon_path']) : null;

        return Inertia::render('Admin/Settings/General/Index', [
            'settings' => array_merge($settings, [
                'logo_url' => $logoUrl,
                'favicon_url' => $faviconUrl,
            ]),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'admin_email' => ['required', 'email', 'max:255'],
            'company_name' => ['required', 'string', 'max:255'],
            'company_address' => ['nullable', 'string', 'max:500'],
            'company_city' => ['nullable', 'string', 'max:100'],
            'company_state' => ['nullable', 'string', 'max:100'],
            'company_pincode' => ['nullable', 'string', 'max:10'],
            'company_phone' => ['nullable', 'string', 'max:20'],
            'company_email' => ['nullable', 'email', 'max:255'],
            'company_gstin' => ['nullable', 'string', 'max:15'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'favicon' => ['nullable', 'image', 'max:512'],
            'app_name' => ['required', 'string', 'max:100'],
            'app_timezone' => ['required', 'string', 'max:50'],
            'app_currency' => ['required', 'string', 'max:3'],
        ]);
        
        // Convert empty strings to null for nullable fields
        $nullableFields = ['company_address', 'company_city', 'company_state', 'company_pincode', 'company_phone', 'company_email', 'company_gstin'];
        foreach ($nullableFields as $field) {
            if (isset($data[$field]) && $data[$field] === '') {
                $data[$field] = null;
            }
        }

        // Update text settings
        Setting::set('admin_email', $data['admin_email'], 'string', 'email');
        Setting::set('company_name', $data['company_name'], 'string', 'company');
        Setting::set('company_address', $data['company_address'] ?: '', 'string', 'company');
        Setting::set('company_city', $data['company_city'] ?: '', 'string', 'company');
        Setting::set('company_state', $data['company_state'] ?: '', 'string', 'company');
        Setting::set('company_pincode', $data['company_pincode'] ?: '', 'string', 'company');
        Setting::set('company_phone', $data['company_phone'] ?: '', 'string', 'company');
        Setting::set('company_email', $data['company_email'] ?: '', 'string', 'company');
        Setting::set('company_gstin', $data['company_gstin'] ?: '', 'string', 'company');
        Setting::set('app_name', $data['app_name'], 'string', 'general');
        Setting::set('app_timezone', $data['app_timezone'], 'string', 'general');
        Setting::set('app_currency', $data['app_currency'], 'string', 'general');

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('settings', 'public');
            Setting::set('logo_path', $logoPath, 'string', 'general');
        }

        // Handle favicon upload
        if ($request->hasFile('favicon')) {
            $faviconPath = $request->file('favicon')->store('settings', 'public');
            Setting::set('favicon_path', $faviconPath, 'string', 'general');
        }

        return redirect()
            ->back()
            ->with('success', 'Settings updated successfully.');
    }
}
