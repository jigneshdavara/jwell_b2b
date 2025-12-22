'use client';

import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';

export default function AdminPaymentSettings() {
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        publishable_key: '',
        secret_key: '',
        webhook_secret: '',
        is_active: true,
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await adminService.getPaymentSettings();
            if (response.data?.gateway) {
                const gateway = response.data.gateway;
                setFormData({
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

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});
        
        try {
            await adminService.updatePaymentSettings(formData);
            // Show success message
            const flashEvent = new CustomEvent('flash-message', { detail: { success: 'Payment settings saved successfully.' } });
            window.dispatchEvent(flashEvent);
        } catch (error: any) {
            console.error('Failed to save payment settings:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: 'Failed to save payment settings. Please try again.' });
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

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Payment gateway</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Manage Stripe credentials for the demo environment. Rotate keys periodically and keep webhook secrets in sync
                        with Stripe Dashboard.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="max-w-3xl space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span className="font-semibold text-slate-800">Stripe publishable key</span>
                            <input
                                type="text"
                                value={formData.publishable_key}
                                onChange={(event) => setFormData({ ...formData, publishable_key: event.target.value })}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="pk_test_..."
                                required
                            />
                            {errors.publishable_key && <p className="mt-1 text-xs text-rose-500">{errors.publishable_key}</p>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span className="font-semibold text-slate-800">Stripe secret key</span>
                            <input
                                type="password"
                                value={formData.secret_key}
                                onChange={(event) => setFormData({ ...formData, secret_key: event.target.value })}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="sk_test_..."
                                required
                            />
                            {errors.secret_key && <p className="mt-1 text-xs text-rose-500">{errors.secret_key}</p>}
                        </label>
                    </div>
                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">Webhook signing secret</span>
                        <input
                            type="text"
                            value={formData.webhook_secret}
                            onChange={(event) => setFormData({ ...formData, webhook_secret: event.target.value })}
                            className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            placeholder="whsec_... optional"
                        />
                        {errors.webhook_secret && <p className="mt-1 text-xs text-rose-500">{errors.webhook_secret}</p>}
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        <span>Enable this gateway for checkout</span>
                    </label>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Saving...' : 'Save configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
