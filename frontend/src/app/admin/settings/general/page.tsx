'use client';

import { Head } from '@/components/Head';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { getMediaUrlNullable } from '@/utils/mediaUrl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generalSettingsSchema, GeneralSettingsFormData } from '@/lib/validation/admin.schema';
import TextInput from '@/components/ui/TextInput';
import InputLabel from '@/components/ui/InputLabel';
import InputError from '@/components/ui/InputError';

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

    // React Hook Form setup
    const {
        control,
        handleSubmit: handleFormSubmit,
        formState: { errors },
        reset,
        setError,
    } = useForm<GeneralSettingsFormData>({
        resolver: zodResolver(generalSettingsSchema),
        mode: 'onSubmit',
        reValidateMode: 'onBlur',
        shouldFocusError: true,
        defaultValues: {
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
            app_timezone: timezones[0] || '',
            app_currency: currencies[0] || '',
        },
    });

    const [processing, setProcessing] = useState(false);


    const loadSettings = useCallback(async () => {
        try {
            const response = await adminService.getGeneralSettings();
            const data = response.data;
            setSettings(data);
            reset({
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
                app_timezone: data.app_timezone || timezones[0] || '',
                app_currency: data.app_currency || currencies[0] || '',
            });
            setLogoPreview(getMediaUrlNullable(data.logo_url));
            setFaviconPreview(getMediaUrlNullable(data.favicon_url));
        } catch (error: any) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

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
            setLogoPreview(settings.logo_url ? getMediaUrlNullable(settings.logo_url) : null);
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
            setFaviconPreview(settings.favicon_url ? getMediaUrlNullable(settings.favicon_url) : null);
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

    const submit = async (formData: GeneralSettingsFormData) => {
        setProcessing(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('admin_email', formData.admin_email.trim());
            formDataToSend.append('company_name', formData.company_name.trim());
            formDataToSend.append('company_address', formData.company_address?.trim() || '');
            formDataToSend.append('company_city', formData.company_city?.trim() || '');
            formDataToSend.append('company_state', formData.company_state?.trim() || '');
            formDataToSend.append('company_pincode', formData.company_pincode?.trim() || '');
            formDataToSend.append('company_phone', formData.company_phone?.trim() || '');
            formDataToSend.append('company_email', formData.company_email?.trim() || '');
            formDataToSend.append('company_gstin', formData.company_gstin?.trim() || '');
            formDataToSend.append('app_name', formData.app_name.trim());
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
                // Set backend validation errors
                Object.keys(error.response.data.errors).forEach((key) => {
                    setError(key as keyof GeneralSettingsFormData, {
                        type: 'server',
                        message: error.response.data.errors[key][0] || 'Validation error',
                    });
                });
            } else {
                setError('root', {
                    type: 'server',
                    message: error.response?.data?.message || 'Failed to save settings. Please try again.',
                });
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
            <div className="space-y-6 px-1 py-4 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8">
                <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">General Settings</h1>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-500">Manage your application&apos;s general settings and branding.</p>
                </div>

                <form onSubmit={handleFormSubmit(submit)} className="space-y-4 sm:space-y-6">
                    {/* Company Information */}
                    <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                        <h2 className="mb-4 sm:mb-6 text-base sm:text-lg font-semibold text-slate-900">Company Information</h2>
                        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="admin_email" className="text-xs sm:text-sm font-semibold text-slate-700">
                                    Admin Email <span className="text-rose-500">*</span>
                                </InputLabel>
                                <Controller
                                    name="admin_email"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <TextInput
                                                {...field}
                                                id="admin_email"
                                                type="email"
                                                className={fieldState.error || errors.admin_email ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                            />
                                            <InputError message={errors.admin_email?.message} />
                                        </>
                                    )}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="company_name" className="text-xs sm:text-sm font-semibold text-slate-700">
                                    Company Name <span className="text-rose-500">*</span>
                                </InputLabel>
                                <Controller
                                    name="company_name"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <TextInput
                                                {...field}
                                                id="company_name"
                                                className={fieldState.error || errors.company_name ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                            />
                                            <InputError message={errors.company_name?.message} />
                                        </>
                                    )}
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <InputLabel htmlFor="company_address" className="text-xs sm:text-sm font-semibold text-slate-700">Company Address</InputLabel>
                                <Controller
                                    name="company_address"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <TextInput
                                                {...field}
                                                id="company_address"
                                                className={fieldState.error || errors.company_address ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                            />
                                            <InputError message={errors.company_address?.message} />
                                        </>
                                    )}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="company_city" className="text-xs sm:text-sm font-semibold text-slate-700">City</InputLabel>
                                <Controller
                                    name="company_city"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <TextInput
                                                {...field}
                                                id="company_city"
                                                className={fieldState.error || errors.company_city ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                            />
                                            <InputError message={errors.company_city?.message} />
                                        </>
                                    )}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="company_state" className="text-xs sm:text-sm font-semibold text-slate-700">State</InputLabel>
                                <Controller
                                    name="company_state"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <TextInput
                                                {...field}
                                                id="company_state"
                                                className={fieldState.error || errors.company_state ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                            />
                                            <InputError message={errors.company_state?.message} />
                                        </>
                                    )}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="company_pincode" className="text-xs sm:text-sm font-semibold text-slate-700">Pincode</InputLabel>
                                <Controller
                                    name="company_pincode"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <TextInput
                                                {...field}
                                                id="company_pincode"
                                                className={fieldState.error || errors.company_pincode ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                            />
                                            <InputError message={errors.company_pincode?.message} />
                                        </>
                                    )}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="company_phone" className="text-xs sm:text-sm font-semibold text-slate-700">Phone</InputLabel>
                                <Controller
                                    name="company_phone"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <TextInput
                                                {...field}
                                                id="company_phone"
                                                className={fieldState.error || errors.company_phone ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                            />
                                            <InputError message={errors.company_phone?.message} />
                                        </>
                                    )}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="company_email" className="text-xs sm:text-sm font-semibold text-slate-700">Email</InputLabel>
                                <Controller
                                    name="company_email"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <TextInput
                                                {...field}
                                                id="company_email"
                                                type="email"
                                                className={fieldState.error || errors.company_email ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                            />
                                            <InputError message={errors.company_email?.message} />
                                        </>
                                    )}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="company_gstin" className="text-xs sm:text-sm font-semibold text-slate-700">GSTIN</InputLabel>
                                <Controller
                                    name="company_gstin"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <TextInput
                                                {...field}
                                                id="company_gstin"
                                                className={fieldState.error || errors.company_gstin ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                            />
                                            <InputError message={errors.company_gstin?.message} />
                                        </>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Branding */}
                    <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                        <h2 className="mb-4 sm:mb-6 text-base sm:text-lg font-semibold text-slate-900">Branding</h2>
                        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Logo</label>
                                <div className="space-y-2 sm:space-y-3">
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 px-3 py-2 text-xs file:mr-2 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700 sm:px-4 sm:py-3 sm:text-sm sm:file:mr-4 sm:file:px-4 sm:file:py-2 sm:file:text-sm"
                                    />
                                    {logoPreview && logoObjectUrl && (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                            <img src={logoPreview} alt="Logo preview" className="h-12 w-auto object-contain sm:h-16" />
                                            <button
                                                type="button"
                                                onClick={removeLogoHandler}
                                                className="rounded-full border border-rose-200 px-3 py-1 text-[10px] font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 sm:text-xs"
                                            >
                                                Remove selected image
                                            </button>
                                        </div>
                                    )}
                                    {logoPreview && !logoObjectUrl && settings.logo_url && !removeLogo && (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                            <img src={logoPreview} alt="Current logo" className="h-12 w-auto object-contain sm:h-16" />
                                            <button
                                                type="button"
                                                onClick={removeLogoHandler}
                                                className="rounded-full border border-rose-200 px-3 py-1 text-[10px] font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 sm:text-xs"
                                            >
                                                Remove image
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Favicon</label>
                                <div className="space-y-2 sm:space-y-3">
                                    <input
                                        ref={faviconInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFaviconChange}
                                        className="w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 px-3 py-2 text-xs file:mr-2 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700 sm:px-4 sm:py-3 sm:text-sm sm:file:mr-4 sm:file:px-4 sm:file:py-2 sm:file:text-sm"
                                    />
                                    {faviconPreview && faviconObjectUrl && (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                            <img src={faviconPreview} alt="Favicon preview" className="h-6 w-6 object-contain sm:h-8 sm:w-8" />
                                            <button
                                                type="button"
                                                onClick={removeFaviconHandler}
                                                className="rounded-full border border-rose-200 px-3 py-1 text-[10px] font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 sm:text-xs"
                                            >
                                                Remove selected image
                                            </button>
                                        </div>
                                    )}
                                    {faviconPreview && !faviconObjectUrl && settings.favicon_url && !removeFavicon && (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                            <img src={faviconPreview} alt="Current favicon" className="h-6 w-6 object-contain sm:h-8 sm:w-8" />
                                            <button
                                                type="button"
                                                onClick={removeFaviconHandler}
                                                className="rounded-full border border-rose-200 px-3 py-1 text-[10px] font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 sm:text-xs"
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
                    <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                        <h2 className="mb-4 sm:mb-6 text-base sm:text-lg font-semibold text-slate-900">Application Settings</h2>
                        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="app_name" className="text-xs sm:text-sm font-semibold text-slate-700">
                                    App Name <span className="text-rose-500">*</span>
                                </InputLabel>
                                <Controller
                                    name="app_name"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <TextInput
                                                {...field}
                                                id="app_name"
                                                className={fieldState.error || errors.app_name ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                            />
                                            <InputError message={errors.app_name?.message} />
                                        </>
                                    )}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="app_timezone" className="text-xs sm:text-sm font-semibold text-slate-700">
                                    Timezone <span className="text-rose-500">*</span>
                                </InputLabel>
                                <Controller
                                    name="app_timezone"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <select
                                                {...field}
                                                id="app_timezone"
                                                className={`w-full rounded-xl border bg-white text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm ${
                                                    fieldState.error || errors.app_timezone ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/20'
                                                }`}
                                            >
                                                {timezones.map((tz) => (
                                                    <option key={tz} value={tz}>
                                                        {tz}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.app_timezone?.message} />
                                        </>
                                    )}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="app_currency" className="text-xs sm:text-sm font-semibold text-slate-700">
                                    Currency <span className="text-rose-500">*</span>
                                </InputLabel>
                                <Controller
                                    name="app_currency"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <select
                                                {...field}
                                                id="app_currency"
                                                className={`w-full rounded-xl border bg-white text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm ${
                                                    fieldState.error || errors.app_currency ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/20'
                                                }`}
                                            >
                                                {currencies.map((curr) => (
                                                    <option key={curr} value={curr}>
                                                        {curr}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.app_currency?.message} />
                                        </>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {errors.root && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 sm:p-4 text-xs sm:text-sm text-rose-900">
                            {errors.root.message}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 sm:gap-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-2.5 sm:text-sm"
                        >
                            {processing ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
