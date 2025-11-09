import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';

type PaymentsPageProps = PageProps<{
    gateway: {
        id: number;
        name: string;
        slug: string;
        is_active: boolean;
        config: {
            publishable_key: string;
            secret_key: string;
            webhook_secret: string;
        };
    };
}>;

export default function AdminPaymentSettings() {
    const { gateway } = usePage<PaymentsPageProps>().props;
    const { data, setData, put, processing } = useForm({
        publishable_key: gateway.config.publishable_key ?? '',
        secret_key: gateway.config.secret_key ?? '',
        webhook_secret: gateway.config.webhook_secret ?? '',
        is_active: gateway.is_active,
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('admin.settings.payments.update'));
    };

    return (
        <AdminLayout>
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
                                value={data.publishable_key}
                                onChange={(event) => setData('publishable_key', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="pk_test_..."
                                required
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span className="font-semibold text-slate-800">Stripe secret key</span>
                            <input
                                type="password"
                                value={data.secret_key}
                                onChange={(event) => setData('secret_key', event.target.value)}
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
                            value={data.webhook_secret}
                            onChange={(event) => setData('webhook_secret', event.target.value)}
                            className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            placeholder="whsec_... optional"
                        />
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(event) => setData('is_active', event.target.checked)}
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
                            Save configuration
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
