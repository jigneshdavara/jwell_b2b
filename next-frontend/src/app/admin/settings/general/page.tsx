'use client';

import { Head } from '@/components/Head';
import React, { useEffect, useState } from 'react';

// Mock data for settings
const mockSettings = {
    admin_email: 'admin@example.com',
    company_name: 'Elvee Jewels',
    company_address: '123 Business Street',
    company_city: 'Mumbai',
    company_state: 'Maharashtra',
    company_pincode: '400001',
    company_phone: '+91 98765 43210',
    company_email: 'info@elvee.com',
    company_gstin: '27AAAAA0000A1Z5',
    logo_url: '/images/logo.png',
    favicon_url: '/images/favicon.ico',
    app_name: 'Elvee B2B',
    app_timezone: 'Asia/Kolkata',
    app_currency: 'INR',
};

const timezones = [
    'Asia/Kolkata',
    'Asia/Dubai',
    'Asia/Singapore',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
];

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

export default function AdminGeneralSettingsIndex() {
    const settings = mockSettings;
    const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo_url ?? null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(settings.favicon_url ?? null);
    const [logoInputKey, setLogoInputKey] = useState(0);
    const [faviconInputKey, setFaviconInputKey] = useState(0);

    const [formData, setFormData] = useState({
        admin_email: settings.admin_email || '',
        company_name: settings.company_name || '',
        company_address: settings.company_address || '',
        company_city: settings.company_city || '',
        company_state: settings.company_state || '',
        company_pincode: settings.company_pincode || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_gstin: settings.company_gstin || '',
        logo: null as File | null,
        favicon: null as File | null,
        remove_logo: false,
        remove_favicon: false,
        app_name: settings.app_name || '',
        app_timezone: settings.app_timezone || '',
        app_currency: settings.app_currency || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setFormData({ ...formData, logo: file, remove_logo: false });
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setLogoPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setLogoPreview(settings.logo_url ?? null);
        }
    };

    const handleFaviconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setFormData({ ...formData, favicon: file, remove_favicon: false });
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setFaviconPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setFaviconPreview(settings.favicon_url ?? null);
        }
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setProcessing(false);
            alert('Settings saved (mock)');
        }, 1000);
    };

    return (
        <>
            <Head title="General Settings" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">General Settings</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Manage basic application settings, company details, and branding.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-8">
                    {/* Email Settings */}
                    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                        <h2 className="mb-6 text-lg font-semibold text-slate-900">Email Settings</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Admin Email <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.admin_email}
                                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                />
                                {errors.admin_email && <p className="mt-1 text-xs text-rose-500">{errors.admin_email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Company Details */}
                    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                        <h2 className="mb-6 text-lg font-semibold text-slate-900">Company Details</h2>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Company Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                />
                                {errors.company_name && <p className="mt-1 text-xs text-rose-500">{errors.company_name}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">GSTIN</label>
                                <input
                                    type="text"
                                    value={formData.company_gstin}
                                    onChange={(e) => setFormData({ ...formData, company_gstin: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                            </div>

                            <div className="lg:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Address</label>
                                <textarea
                                    value={formData.company_address}
                                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                                    rows={2}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">City</label>
                                <input
                                    type="text"
                                    value={formData.company_city}
                                    onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">State</label>
                                <input
                                    type="text"
                                    value={formData.company_state}
                                    onChange={(e) => setFormData({ ...formData, company_state: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Pincode</label>
                                <input
                                    type="text"
                                    value={formData.company_pincode}
                                    onChange={(e) => setFormData({ ...formData, company_pincode: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Phone</label>
                                <input
                                    type="text"
                                    value={formData.company_phone}
                                    onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                                <input
                                    type="email"
                                    value={formData.company_email}
                                    onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Branding */}
                    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                        <h2 className="mb-6 text-lg font-semibold text-slate-900">Branding</h2>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Logo</label>
                                <div className="space-y-3">
                                    {logoPreview && (
                                        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <img src={logoPreview} alt="Logo preview" className="h-16 w-auto object-contain" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, logo: null, remove_logo: true });
                                                    setLogoPreview(null);
                                                }}
                                                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        key={logoInputKey}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Favicon</label>
                                <div className="space-y-3">
                                    {faviconPreview && (
                                        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <img src={faviconPreview} alt="Favicon preview" className="h-8 w-8 object-contain" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, favicon: null, remove_favicon: true });
                                                    setFaviconPreview(null);
                                                }}
                                                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        key={faviconInputKey}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFaviconChange}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Application Settings */}
                    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                        <h2 className="mb-6 text-lg font-semibold text-slate-900">Application Settings</h2>
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    App Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.app_name}
                                    onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Timezone <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formData.app_timezone}
                                    onChange={(e) => setFormData({ ...formData, app_timezone: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                >
                                    {timezones.map((tz) => (
                                        <option key={tz} value={tz}>
                                            {tz}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Currency <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={formData.app_currency}
                                    onChange={(e) => setFormData({ ...formData, app_currency: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                >
                                    {currencies.map((curr) => (
                                        <option key={curr} value={curr}>
                                            {curr}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-elvee-blue px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {processing ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
