import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';

type GeneralSettingsProps = PageProps<{
    settings: {
        admin_email: string;
        company_name: string;
        company_address: string;
        company_city: string;
        company_state: string;
        company_pincode: string;
        company_phone: string;
        company_email: string;
        company_gstin: string;
        logo_url?: string | null;
        favicon_url?: string | null;
        app_name: string;
        app_timezone: string;
        app_currency: string;
    };
}>;

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
    const { settings } = usePage<GeneralSettingsProps>().props;
    const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo_url ?? null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(settings.favicon_url ?? null);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [logoInputKey, setLogoInputKey] = useState(0);
    const [faviconInputKey, setFaviconInputKey] = useState(0);

    const form = useForm({
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

    // Clear errors on mount to prevent stale validation errors
    useEffect(() => {
        form.clearErrors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize and sync previews with settings
    useEffect(() => {
        // Update logo preview from settings if no file is selected and not being removed
        if (!form.data.logo && !form.data.remove_logo) {
            setLogoPreview(settings.logo_url ?? null);
        }
        // Update favicon preview from settings if no file is selected and not being removed
        if (!form.data.favicon && !form.data.remove_favicon) {
            setFaviconPreview(settings.favicon_url ?? null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.logo_url, settings.favicon_url, form.data.logo, form.data.favicon, form.data.remove_logo, form.data.remove_favicon]);

    // Initialize previews on mount from settings
    useEffect(() => {
        if (settings.logo_url && !logoPreview && !form.data.logo) {
            setLogoPreview(settings.logo_url);
        }
        if (settings.favicon_url && !faviconPreview && !form.data.favicon) {
            setFaviconPreview(settings.favicon_url);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        form.setData('logo', file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            // Reset to original logo if file input is cleared
            setLogoPreview(settings.logo_url ?? null);
        }
    };

    const handleFaviconChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        form.setData('favicon', file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFaviconPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            // Reset to original favicon if file input is cleared
            setFaviconPreview(settings.favicon_url ?? null);
        }
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setHasSubmitted(true);

        const trimmedAdminEmail = form.data.admin_email?.trim() || '';
        const trimmedCompanyName = form.data.company_name?.trim() || '';
        const trimmedAppName = form.data.app_name?.trim() || '';
        const logo = form.data.logo;
        const favicon = form.data.favicon;
        const hasFile = logo instanceof File || favicon instanceof File;

        // Frontend validation
        if (!trimmedAdminEmail) {
            form.setError('admin_email', 'The admin email field is required.');
            setHasSubmitted(false);
            return;
        }
        if (!trimmedCompanyName) {
            form.setError('company_name', 'The company name field is required.');
            setHasSubmitted(false);
            return;
        }
        if (!trimmedAppName) {
            form.setError('app_name', 'The app name field is required.');
            setHasSubmitted(false);
            return;
        }

        // Use transform to set cleaned data and method spoofing
        form.transform((data) => {
            const transformed: Record<string, any> = {
                admin_email: trimmedAdminEmail,
                company_name: trimmedCompanyName,
                company_address: data.company_address?.trim() || null,
                company_city: data.company_city?.trim() || null,
                company_state: data.company_state?.trim() || null,
                company_pincode: data.company_pincode?.trim() || null,
                company_phone: data.company_phone?.trim() || null,
                company_email: data.company_email?.trim() || null,
                company_gstin: data.company_gstin?.trim() || null,
                app_name: trimmedAppName,
                app_timezone: data.app_timezone,
                app_currency: data.app_currency,
                _method: 'PUT', // method spoofing for update
            };

            // Include remove flags if set
            if (data.remove_logo) {
                transformed.remove_logo = true;
            }
            if (data.remove_favicon) {
                transformed.remove_favicon = true;
            }

            // Only include logo/favicon if they are actually files
            if (logo instanceof File) {
                transformed.logo = logo;
            }
            if (favicon instanceof File) {
                transformed.favicon = favicon;
            }

            return transformed;
        });

        form.post(route('admin.settings.general.update'), {
            preserveScroll: true,
            forceFormData: hasFile, // required when file present
            onSuccess: () => {
                form.clearErrors();
                setHasSubmitted(false);
                // Clear file inputs and remove flags after successful save
                form.setData('logo', null);
                form.setData('favicon', null);
                form.setData('remove_logo', false);
                form.setData('remove_favicon', false);
                // Reset file inputs to clear "No file chosen" state
                setLogoInputKey(prev => prev + 1);
                setFaviconInputKey(prev => prev + 1);
                // Previews will be updated by useEffect when settings prop updates
            },
            onError: (errors: any) => {
                setHasSubmitted(false);
                // Errors are automatically displayed by Inertia via form.errors
                if (errors && Object.keys(errors).length > 0) {
                    const firstErrorField = Object.keys(errors)[0];
                    const errorElement = document.querySelector(`[name="${firstErrorField}"]`) ||
                        document.querySelector(`input[id*="${firstErrorField}"]`);
                    if (errorElement) {
                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            },
            onFinish: () => {
                // Reset transform so it doesn't affect other requests
                form.transform((data) => data);
            },
        });
    };

    return (
        <AdminLayout>
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
                                    value={form.data.admin_email}
                                    onChange={(e) => form.setData('admin_email', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                />
                                {form.errors.admin_email && <p className="mt-1 text-xs text-rose-500">{form.errors.admin_email}</p>}
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
                                    value={form.data.company_name}
                                    onChange={(e) => form.setData('company_name', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                />
                                {form.errors.company_name && <p className="mt-1 text-xs text-rose-500">{form.errors.company_name}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">GSTIN</label>
                                <input
                                    type="text"
                                    value={form.data.company_gstin}
                                    onChange={(e) => form.setData('company_gstin', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {form.errors.company_gstin && <p className="mt-1 text-xs text-rose-500">{form.errors.company_gstin}</p>}
                            </div>

                            <div className="lg:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Address</label>
                                <textarea
                                    value={form.data.company_address}
                                    onChange={(e) => form.setData('company_address', e.target.value)}
                                    rows={2}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {form.errors.company_address && <p className="mt-1 text-xs text-rose-500">{form.errors.company_address}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">City</label>
                                <input
                                    type="text"
                                    value={form.data.company_city}
                                    onChange={(e) => form.setData('company_city', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {form.errors.company_city && <p className="mt-1 text-xs text-rose-500">{form.errors.company_city}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">State</label>
                                <input
                                    type="text"
                                    value={form.data.company_state}
                                    onChange={(e) => form.setData('company_state', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {form.errors.company_state && <p className="mt-1 text-xs text-rose-500">{form.errors.company_state}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Pincode</label>
                                <input
                                    type="text"
                                    value={form.data.company_pincode}
                                    onChange={(e) => form.setData('company_pincode', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {form.errors.company_pincode && <p className="mt-1 text-xs text-rose-500">{form.errors.company_pincode}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Phone</label>
                                <input
                                    type="text"
                                    value={form.data.company_phone}
                                    onChange={(e) => form.setData('company_phone', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {form.errors.company_phone && <p className="mt-1 text-xs text-rose-500">{form.errors.company_phone}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                                <input
                                    type="email"
                                    value={form.data.company_email}
                                    onChange={(e) => form.setData('company_email', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                {form.errors.company_email && <p className="mt-1 text-xs text-rose-500">{form.errors.company_email}</p>}
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
                                                    form.setData('logo', null);
                                                    form.setData('remove_logo', true);
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
                                    {form.errors.logo && <p className="mt-1 text-xs text-rose-500">{form.errors.logo}</p>}
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
                                                    form.setData('favicon', null);
                                                    form.setData('remove_favicon', true);
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
                                    {form.errors.favicon && <p className="mt-1 text-xs text-rose-500">{form.errors.favicon}</p>}
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
                                    value={form.data.app_name}
                                    onChange={(e) => form.setData('app_name', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                />
                                {form.errors.app_name && <p className="mt-1 text-xs text-rose-500">{form.errors.app_name}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Timezone <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={form.data.app_timezone}
                                    onChange={(e) => form.setData('app_timezone', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                >
                                    {timezones.map((tz) => (
                                        <option key={tz} value={tz}>
                                            {tz}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.app_timezone && <p className="mt-1 text-xs text-rose-500">{form.errors.app_timezone}</p>}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Currency <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={form.data.app_currency}
                                    onChange={(e) => form.setData('app_currency', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                >
                                    {currencies.map((curr) => (
                                        <option key={curr} value={curr}>
                                            {curr}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.app_currency && <p className="mt-1 text-xs text-rose-500">{form.errors.app_currency}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-full bg-elvee-blue px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {form.processing ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

