"use client";

import { useEffect, useState } from "react";

export default function AdminPaymentSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        publishable_key: 'pk_test_mock_123456789',
        secret_key: 'sk_test_mock_123456789',
        webhook_secret: 'whsec_mock_123456789',
        is_active: true,
    });

    useEffect(() => {
        setLoading(false);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Payment settings saved (mock)');
    };

    if (loading) return null;

    return (
        <div className="space-y-8">
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <h1 className="text-2xl font-semibold text-slate-900">Payment gateway</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Manage Stripe credentials for the demo environment. Rotate keys periodically and keep webhook secrets in sync
                    with Stripe Dashboard.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="max-w-3xl space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
            >
                <div className="grid gap-6 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">Stripe publishable key</span>
                        <input
                            type="text"
                            value={formData.publishable_key}
                            onChange={(e) => setFormData(prev => ({ ...prev, publishable_key: e.target.value }))}
                            className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            placeholder="pk_test_..."
                            required
                        />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">Stripe secret key</span>
                        <input
                            type="password"
                            value={formData.secret_key}
                            onChange={(e) => setFormData(prev => ({ ...prev, secret_key: e.target.value }))}
                            className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            placeholder="sk_test_..."
                            required
                        />
                    </label>
                </div>
                <label className="flex flex-col gap-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Webhook signing secret</span>
                    <input
                        type="text"
                        value={formData.webhook_secret}
                        onChange={(e) => setFormData(prev => ({ ...prev, webhook_secret: e.target.value }))}
                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="whsec_... optional"
                    />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Enable this gateway for checkout</span>
                </label>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500"
                    >
                        Save configuration
                    </button>
                </div>
            </form>
        </div>
    );
}
