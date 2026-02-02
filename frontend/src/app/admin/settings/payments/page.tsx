'use client';

import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentSettingsSchema, type PaymentSettingsFormData } from '@/lib/validation/admin.schema';
import TextInput from '@/components/ui/TextInput';
import InputLabel from '@/components/ui/InputLabel';
import InputError from '@/components/ui/InputError';
import Checkbox from '@/components/ui/Checkbox';

export default function AdminPaymentSettings() {
    const [loading, setLoading] = useState(true);
    const {
        control,
        handleSubmit: handleFormSubmit,
        formState: { errors },
        reset,
        setError,
        trigger,
    } = useForm<PaymentSettingsFormData>({
        resolver: zodResolver(paymentSettingsSchema),
        mode: 'onSubmit',
        reValidateMode: 'onBlur',
        shouldFocusError: true,
        defaultValues: {
            publishable_key: '',
            secret_key: '',
            webhook_secret: '',
            is_active: true,
        },
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await adminService.getPaymentSettings();
            if (response.data?.gateway) {
                const gateway = response.data.gateway;
                reset({
                    publishable_key: gateway.config?.publishable_key || '',
                    secret_key: gateway.config?.secret_key || '',
                    webhook_secret: gateway.config?.webhook_secret || '',
                    is_active: gateway.is_active ?? true,
                });
            }
        } catch (error: any) {
            console.error('Failed to load payment settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: PaymentSettingsFormData) => {
        setProcessing(true);
        
        try {
            await adminService.updatePaymentSettings(data);
            // Show success message
            const flashEvent = new CustomEvent('flash-message', { detail: { success: 'Payment settings saved successfully.' } });
            window.dispatchEvent(flashEvent);
        } catch (error: any) {
            console.error('Failed to save payment settings:', error);
            const errorMessage = error?.response?.data?.message || 'Failed to save payment settings. Please try again.';
            
            // Set form errors if validation errors exist
            if (error?.response?.data?.errors) {
                const serverErrors = error.response.data.errors;
                Object.keys(serverErrors).forEach((key) => {
                    setError(key as keyof PaymentSettingsFormData, {
                        type: 'server',
                        message: serverErrors[key][0],
                    });
                });
            } else {
                // Show general error via toast or flash message
                const flashEvent = new CustomEvent('flash-message', { detail: { error: errorMessage } });
                window.dispatchEvent(flashEvent);
            }
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <>
                <Head title="Payment Gateway" />
                <div className="flex items-center justify-center p-8">
                    <div className="text-sm text-slate-500">Loading payment settings...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Payment Gateway" />

            <div className="space-y-6 px-1 py-4 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8">
                <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Payment gateway</h1>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                        Manage Stripe credentials for the demo environment. Rotate keys periodically and keep webhook secrets in sync
                        with Stripe Dashboard.
                    </p>
                </div>

                <form
                    onSubmit={handleFormSubmit(onSubmit)}
                    className="max-w-3xl space-y-4 sm:space-y-6 rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="publishable_key">Stripe publishable key</InputLabel>
                            <Controller
                                name="publishable_key"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <TextInput
                                            id="publishable_key"
                                            type="text"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                trigger('publishable_key');
                                            }}
                                            onBlur={async () => {
                                                field.onBlur();
                                                await trigger('publishable_key');
                                            }}
                                            className={`mt-1.5 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            placeholder="pk_test_..."
                                        />
                                        <InputError message={errors.publishable_key?.message} />
                                    </>
                                )}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="secret_key">Stripe secret key</InputLabel>
                            <Controller
                                name="secret_key"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <TextInput
                                            id="secret_key"
                                            type="password"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                trigger('secret_key');
                                            }}
                                            onBlur={async () => {
                                                field.onBlur();
                                                await trigger('secret_key');
                                            }}
                                            className={`mt-1.5 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            placeholder="sk_test_..."
                                        />
                                        <InputError message={errors.secret_key?.message} />
                                    </>
                                )}
                            />
                        </div>
                    </div>
                    <div>
                        <InputLabel htmlFor="webhook_secret">Webhook signing secret</InputLabel>
                        <Controller
                            name="webhook_secret"
                            control={control}
                            render={({ field, fieldState }) => (
                                <>
                                    <TextInput
                                        id="webhook_secret"
                                        type="text"
                                        value={field.value || ''}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            trigger('webhook_secret');
                                        }}
                                        onBlur={async () => {
                                            field.onBlur();
                                            await trigger('webhook_secret');
                                        }}
                                        className={`mt-1.5 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                        placeholder="whsec_... optional"
                                    />
                                    <InputError message={errors.webhook_secret?.message} />
                                </>
                            )}
                        />
                    </div>
                    <Controller
                        name="is_active"
                        control={control}
                        render={({ field }) => (
                            <label className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200 px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm text-slate-600">
                                <Checkbox
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                />
                                <span>Enable this gateway for checkout</span>
                            </label>
                        )}
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-2 sm:text-sm"
                        >
                            {processing ? 'Saving...' : 'Save configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
