'use client';

import { Head } from '@/components/Head';
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    const [logoObjectUrl, setLogoObjectUrl] = useState<string | null>(null);
    const [faviconObjectUrl, setFaviconObjectUrl] = useState<string | null>(null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [removeFavicon, setRemoveFavicon] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

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
        app_name: '',
        app_timezone: '',
        app_currency: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const getImageUrl = useCallback((imagePath: string | null | undefined): string | null => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
        const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        return `${baseUrl}/${cleanPath}`.replace(/(?<!:)\/{2,}/g, '/');
    }, []);

    const loadSettings = useCallback(async () => {
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
                app_name: data.app_name || '',
                app_timezone: data.app_timezone || '',
                app_currency: data.app_currency || '',
            });
            setLogoPreview(getImageUrl(data.logo_url));
            setFaviconPreview(getImageUrl(data.favicon_url));
        } catch (error: any) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    }, [getImageUrl]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Cleanup object URLs
    useEffect(() => {
        return () => {
            if (logoObjectUrl) {
                URL.revokeObjectURL(logoObjectUrl);
            }
            if (faviconObjectUrl) {
                URL.revokeObjectURL(faviconObjectUrl);
            }
        };
    }, [logoObjectUrl, faviconObjectUrl]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setRemoveLogo(false);

        if (logoObjectUrl) {
            URL.revokeObjectURL(logoObjectUrl);
            setLogoObjectUrl(null);
        }

        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setLogoPreview(objectUrl);
            setLogoObjectUrl(objectUrl);
        } else {
            setLogoPreview(settings.logo_url ? getImageUrl(settings.logo_url) : null);
        }
    };

    const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setRemoveFavicon(false);

        if (faviconObjectUrl) {
            URL.revokeObjectURL(faviconObjectUrl);
            setFaviconObjectUrl(null);
        }

        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setFaviconPreview(objectUrl);
            setFaviconObjectUrl(objectUrl);
        } else {
            setFaviconPreview(settings.favicon_url ? getImageUrl(settings.favicon_url) : null);
        }
    };

    const removeLogoHandler = () => {
        setRemoveLogo(true);
        if (logoObjectUrl) {
            URL.revokeObjectURL(logoObjectUrl);
            setLogoObjectUrl(null);
        }
        setLogoPreview(null);
        if (logoInputRef.current) {
            logoInputRef.current.value = '';
        }
    };

    const removeFaviconHandler = () => {
        setRemoveFavicon(true);
        if (faviconObjectUrl) {
            URL.revokeObjectURL(faviconObjectUrl);
            setFaviconObjectUrl(null);
        }
        setFaviconPreview(null);
        if (faviconInputRef.current) {
            faviconInputRef.current.value = '';
        }
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        const trimmedAdminEmail = formData.admin_email?.trim() || '';
        const trimmedCompanyName = formData.company_name?.trim() || '';
        const trimmedAppName = formData.app_name?.trim() || '';

        // Frontend validation
        if (!trimmedAdminEmail) {
            setErrors({ admin_email: 'The admin email field is required.' });
            setProcessing(false);
            return;
        }
        if (!trimmedCompanyName) {
            setErrors({ company_name: 'The company name field is required.' });
            setProcessing(false);
            return;
        }
        if (!trimmedAppName) {
            setErrors({ app_name: 'The app name field is required.' });
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

            const logoFile = logoInputRef.current?.files?.[0];
            if (logoFile) {
                formDataToSend.append('logo', logoFile);
            } else if (removeLogo) {
                formDataToSend.append('remove_logo', 'true');
            }

            const faviconFile = faviconInputRef.current?.files?.[0];
            if (faviconFile) {
                formDataToSend.append('favicon', faviconFile);
            } else if (removeFavicon) {
                formDataToSend.append('remove_favicon', 'true');
            }

            await adminService.updateGeneralSettings(formDataToSend);

            // Reset form state
            if (logoObjectUrl) {
                URL.revokeObjectURL(logoObjectUrl);
                setLogoObjectUrl(null);
            }
            if (faviconObjectUrl) {
                URL.revokeObjectURL(faviconObjectUrl);
                setFaviconObjectUrl(null);
            }
            setRemoveLogo(false);
            setRemoveFavicon(false);
            if (logoInputRef.current) logoInputRef.current.value = '';
            if (faviconInputRef.current) faviconInputRef.current.value = '';

            // Reload settings to get updated URLs
            await loadSettings();
        } catch (error: any) {
            console.error('Failed to save settings:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: error.response?.data?.message || 'Failed to save settings. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <>
                <Head title="General Settings" />
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
                        <p className="text-sm text-slate-600">Loading settings...</p>
                    </div>
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
                    <p className="mt-2 text-sm text-slate-500">Manage your application's general settings and branding.</p>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Company Information */}
                    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                        <h2 className="mb-6 text-lg font-semibold text-slate-900">Company Information</h2>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Admin Email <span className="text-rose-500">*</span></label>
                                <input
                                    type="email"
                                    value={formData.admin_email}
                                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {errors.admin_email && <p className="mt-1 text-xs text-rose-500">{errors.admin_email}</p>}
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Company Name <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {errors.company_name && <p className="mt-1 text-xs text-rose-500">{errors.company_name}</p>}
                            </div>
                            <div className="lg:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Company Address</label>
                                <input
                                    type="text"
                                    value={formData.company_address}
                                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
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
                        </div>
                    </div>

                    {/* Branding */}
                    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                        <h2 className="mb-6 text-lg font-semibold text-slate-900">Branding</h2>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Logo</label>
                                <div className="space-y-3">
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                                    />
                                    {logoPreview && logoObjectUrl && (
                                        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <img src={logoPreview} alt="Logo preview" className="h-16 w-auto object-contain" />
                                            <button
                                                type="button"
                                                onClick={removeLogoHandler}
                                                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                                            >
                                                Remove selected image
                                            </button>
                                        </div>
                                    )}
                                    {logoPreview && !logoObjectUrl && settings.logo_url && !removeLogo && (
                                        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <img src={logoPreview} alt="Current logo" className="h-16 w-auto object-contain" />
                                            <button
                                                type="button"
                                                onClick={removeLogoHandler}
                                                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                                            >
                                                Remove image
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Favicon</label>
                                <div className="space-y-3">
                                    <input
                                        ref={faviconInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFaviconChange}
                                        className="w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                                    />
                                    {faviconPreview && faviconObjectUrl && (
                                        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <img src={faviconPreview} alt="Favicon preview" className="h-8 w-8 object-contain" />
                                            <button
                                                type="button"
                                                onClick={removeFaviconHandler}
                                                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                                            >
                                                Remove selected image
                                            </button>
                                        </div>
                                    )}
                                    {faviconPreview && !faviconObjectUrl && settings.favicon_url && !removeFavicon && (
                                        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <img src={faviconPreview} alt="Current favicon" className="h-8 w-8 object-contain" />
                                            <button
                                                type="button"
                                                onClick={removeFaviconHandler}
                                                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                                            >
                                                Remove image
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Application Settings */}
                    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                        <h2 className="mb-6 text-lg font-semibold text-slate-900">Application Settings</h2>
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">App Name <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.app_name}
                                    onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {errors.app_name && <p className="mt-1 text-xs text-rose-500">{errors.app_name}</p>}
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Timezone <span className="text-rose-500">*</span></label>
                                <select
                                    value={formData.app_timezone}
                                    onChange={(e) => setFormData({ ...formData, app_timezone: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
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
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Currency <span className="text-rose-500">*</span></label>
                                <select
                                    value={formData.app_currency}
                                    onChange={(e) => setFormData({ ...formData, app_currency: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
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

                    {errors.general && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                            {errors.general}
                        </div>
                    )}

                    <div className="flex justify-end gap-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
