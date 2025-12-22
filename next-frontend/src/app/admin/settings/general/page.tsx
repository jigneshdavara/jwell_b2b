'use client';

import { Head } from '@/components/Head';
import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';

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
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({
        admin_email: '',
        company_name: '',
        company_address: '',
        company_city: '',
        company_state: '',
        company_pincode: '',
        company_phone: '',
        company_email: '',
        company_gstin: '',
        logo_url: null as string | null,
        favicon_url: null as string | null,
        app_name: '',
        app_timezone: '',
        app_currency: '',
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [logoInputKey, setLogoInputKey] = useState(0);
    const [faviconInputKey, setFaviconInputKey] = useState(0);

    const [formData, setFormData] = useState({
        admin_email: '',
        company_name: '',
        company_address: '',
        company_city: '',
        company_state: '',
        company_pincode: '',
        company_phone: '',
        company_email: '',
        company_gstin: '',
        logo: null as File | null,
        favicon: null as File | null,
        remove_logo: false,
        remove_favicon: false,
        app_name: '',
        app_timezone: '',
        app_currency: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await adminService.getGeneralSettings();
            const data = response.data;
            setSettings(data);
            setFormData({
                admin_email: data.admin_email || '',
                company_name: data.company_name || '',
                company_address: data.company_address || '',
                company_city: data.company_city || '',
                company_state: data.company_state || '',
                company_pincode: data.company_pincode || '',
                company_phone: data.company_phone || '',
                company_email: data.company_email || '',
                company_gstin: data.company_gstin || '',
                logo: null,
                favicon: null,
                remove_logo: false,
                remove_favicon: false,
                app_name: data.app_name || '',
                app_timezone: data.app_timezone || '',
                app_currency: data.app_currency || '',
            });
            setLogoPreview(data.logo_url ?? null);
            setFaviconPreview(data.favicon_url ?? null);
        } catch (error: any) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initialize and sync previews with settings
    useEffect(() => {
        if (!formData.logo && !formData.remove_logo) {
            setLogoPreview(settings.logo_url ?? null);
        }
        if (!formData.favicon && !formData.remove_favicon) {
            setFaviconPreview(settings.favicon_url ?? null);
        }
    }, [settings.logo_url, settings.favicon_url, formData.logo, formData.favicon, formData.remove_logo, formData.remove_favicon]);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setFormData({ ...formData, logo: file, remove_logo: false });
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string);
            };
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
            reader.onload = (e) => {
                setFaviconPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setFaviconPreview(settings.favicon_url ?? null);
        }
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setHasSubmitted(true);
        setProcessing(true);
        setErrors({});

        const trimmedAdminEmail = formData.admin_email?.trim() || '';
        const trimmedCompanyName = formData.company_name?.trim() || '';
        const trimmedAppName = formData.app_name?.trim() || '';
        const logo = formData.logo;
        const favicon = formData.favicon;
        const hasFile = logo instanceof File || favicon instanceof File;

        // Frontend validation
        if (!trimmedAdminEmail) {
            setErrors({ admin_email: 'The admin email field is required.' });
            setHasSubmitted(false);
            setProcessing(false);
            return;
        }
        if (!trimmedCompanyName) {
            setErrors({ company_name: 'The company name field is required.' });
            setHasSubmitted(false);
            setProcessing(false);
            return;
        }
        if (!trimmedAppName) {
            setErrors({ app_name: 'The app name field is required.' });
            setHasSubmitted(false);
            setProcessing(false);
            return;
        }

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('admin_email', trimmedAdminEmail);
            formDataToSend.append('company_name', trimmedCompanyName);
            formDataToSend.append('company_address', formData.company_address?.trim() || '');
            formDataToSend.append('company_city', formData.company_city?.trim() || '');
            formDataToSend.append('company_state', formData.company_state?.trim() || '');
            formDataToSend.append('company_pincode', formData.company_pincode?.trim() || '');
            formDataToSend.append('company_phone', formData.company_phone?.trim() || '');
            formDataToSend.append('company_email', formData.company_email?.trim() || '');
            formDataToSend.append('company_gstin', formData.company_gstin?.trim() || '');
            formDataToSend.append('app_name', trimmedAppName);
            formDataToSend.append('app_timezone', formData.app_timezone);
            formDataToSend.append('app_currency', formData.app_currency);

            if (formData.remove_logo) {
                formDataToSend.append('remove_logo', 'true');
            }
            if (formData.remove_favicon) {
                formDataToSend.append('remove_favicon', 'true');
            }

            if (logo instanceof File) {
                formDataToSend.append('logo', logo);
            }
            if (favicon instanceof File) {
                formDataToSend.append('favicon', favicon);
            }

            await adminService.updateGeneralSettings(formDataToSend);
            
            // Clear file inputs and remove flags after successful save
            setFormData({
                ...formData,
                logo: null,
                favicon: null,
                remove_logo: false,
                remove_favicon: false,
            });
            setLogoInputKey(prev => prev + 1);
            setFaviconInputKey(prev => prev + 1);
            
            // Reload settings to get updated URLs
            await loadSettings();
            setHasSubmitted(false);
        } catch (error: any) {
            console.error('Failed to save settings:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: 'Failed to save settings. Please try again.' });
            }
            setHasSubmitted(false);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <>
                <Head title="General Settings" />
                <div className="flex items-center justify-center p-8">
                    <div className="text-sm text-slate-500">Loading settings...</div>
                </div>
            </>
        );
    }

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
                                {errors.company_gstin && <p className="mt-1 text-xs text-rose-500">{errors.company_gstin}</p>}
                            </div>

                            <div className="lg:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Address</label>
                                <textarea
                                    value={formData.company_address}
                                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                                    rows={2}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {errors.company_address && <p className="mt-1 text-xs text-rose-500">{errors.company_address}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">City</label>
                                <input
                                    type="text"
                                    value={formData.company_city}
                                    onChange={(e) => setFormData({ ...formData, company_city: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {errors.company_city && <p className="mt-1 text-xs text-rose-500">{errors.company_city}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">State</label>
                                <input
                                    type="text"
                                    value={formData.company_state}
                                    onChange={(e) => setFormData({ ...formData, company_state: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {errors.company_state && <p className="mt-1 text-xs text-rose-500">{errors.company_state}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Pincode</label>
                                <input
                                    type="text"
                                    value={formData.company_pincode}
                                    onChange={(e) => setFormData({ ...formData, company_pincode: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {errors.company_pincode && <p className="mt-1 text-xs text-rose-500">{errors.company_pincode}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Phone</label>
                                <input
                                    type="text"
                                    value={formData.company_phone}
                                    onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {errors.company_phone && <p className="mt-1 text-xs text-rose-500">{errors.company_phone}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                                <input
                                    type="email"
                                    value={formData.company_email}
                                    onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {errors.company_email && <p className="mt-1 text-xs text-rose-500">{errors.company_email}</p>}
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
                                    {errors.logo && <p className="mt-1 text-xs text-rose-500">{errors.logo}</p>}
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
                                    {errors.favicon && <p className="mt-1 text-xs text-rose-500">{errors.favicon}</p>}
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
                                {errors.app_name && <p className="mt-1 text-xs text-rose-500">{errors.app_name}</p>}
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
                                {errors.app_timezone && <p className="mt-1 text-xs text-rose-500">{errors.app_timezone}</p>}
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
                                {errors.app_currency && <p className="mt-1 text-xs text-rose-500">{errors.app_currency}</p>}
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
