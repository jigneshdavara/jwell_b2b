import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

type OrderItem = {
    id: number;
    sku: string;
    name: string;
    quantity: number;
    total_price: number;
};

type Order = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    subtotal_amount: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    price_breakdown?: Record<string, unknown>;
    items: OrderItem[];
    user?: {
        name: string;
        email: string;
    };
    payments: Array<{
        id: number;
        status: string;
        amount: number;
        created_at?: string | null;
    }>;
    status_history: Array<{
        id: number;
        status: string;
        created_at?: string | null;
    }>;
};

type StatusOption = {
    value: string;
    label: string;
};

type AdminOrderShowPageProps = AppPageProps<{
    order: Order;
    statusOptions: StatusOption[];
}>;

export default function AdminOrdersShow() {
    const { order, statusOptions } = usePage<AdminOrderShowPageProps>().props;

    const { data, setData, post, processing } = useForm({
        status: order.status,
        meta: {
            comment: '',
        },
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('admin.orders.update-status', order.id), {
            preserveScroll: true,
        });
    };

    const paymentStatusLabel = useMemo(() => {
        if (order.payments.length === 0) {
            return 'No payments recorded';
        }

        const latest = order.payments[0];
        return `${latest.status ?? 'Pending'} · ₹ ${latest.amount.toLocaleString('en-IN')}`;
    }, [order.payments]);

    const formatDate = (input?: string | null) =>
        input
            ? new Date(input).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : 'N/A';

    return (
        <AdminLayout>
            <Head title={`Order ${order.reference}`} />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Order reference</p>
                            <h1 className="text-3xl font-semibold text-slate-900">{order.reference}</h1>
                            <p className="mt-1 text-sm text-slate-500">{order.user?.name ?? 'Guest'} · {order.user?.email ?? '—'}</p>
                        </div>
                        <div className="text-right">
                            <span className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1 text-xs font-semibold text-indigo-700">
                                {order.status_label}
                            </span>
                            <p className="mt-2 text-xs text-slate-400">Payment state: {paymentStatusLabel}</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-4">
                        <form
                            onSubmit={submit}
                            className="space-y-4 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                        >
                            <h2 className="text-lg font-semibold text-slate-900">Update status</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span className="font-semibold text-slate-800">Workflow stage</span>
                                    <select
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        value={data.status}
                                        onChange={(event) => setData('status', event.target.value)}
                                    >
                                        {statusOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span className="font-semibold text-slate-800">Operator note</span>
                                    <textarea
                                        className="min-h-[100px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        value={data.meta.comment ?? ''}
                                        onChange={(event) => setData('meta', { ...data.meta, comment: event.target.value })}
                                        placeholder="Optional note shared with production & support"
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Link
                                    href={route('admin.orders.index')}
                                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    Back
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Save status
                                </button>
                            </div>
                        </form>

                        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Line items</h2>
                            <div className="mt-4 divide-y divide-slate-200">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                                        </div>
                                        <div className="text-sm text-slate-600 md:text-right">
                                            <p>Qty: {item.quantity}</p>
                                            <p>Total: ₹ {item.total_price.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Status history</h2>
                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                {order.status_history.length === 0 && (
                                    <p className="text-xs text-slate-400">No status updates recorded yet.</p>
                                )}
                                {order.status_history.map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                                        <span className="font-semibold text-slate-800">{entry.status.replace(/_/g, ' ')}</span>
                                        <span className="text-xs text-slate-400">{formatDate(entry.created_at)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Totals</h2>
                            <dl className="mt-4 space-y-2 text-sm text-slate-600">
                                <div className="flex justify-between">
                                    <dt>Subtotal</dt>
                                    <dd>₹ {order.subtotal_amount.toLocaleString('en-IN')}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt>Tax</dt>
                                    <dd>₹ {order.tax_amount.toLocaleString('en-IN')}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt>Discount</dt>
                                    <dd>-₹ {order.discount_amount.toLocaleString('en-IN')}</dd>
                                </div>
                                <div className="flex justify-between text-base font-semibold text-slate-900">
                                    <dt>Grand Total</dt>
                                    <dd>₹ {order.total_amount.toLocaleString('en-IN')}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                                {order.payments.length === 0 && <p className="text-xs text-slate-400">No payments captured.</p>}
                                {order.payments.map((payment) => (
                                    <div key={payment.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-slate-800">{payment.status}</span>
                                            <span className="text-xs text-slate-400">{formatDate(payment.created_at)}</span>
                                        </div>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">₹ {payment.amount.toLocaleString('en-IN')}</p>
                                    </div>
                                ))}
                                {order.status === 'pending_payment' && (
                                    <p className="text-xs text-amber-600">Waiting for customer to complete payment.</p>
                                )}
                                {order.status === 'paid' && <p className="text-xs text-emerald-600">Payment confirmed.</p>}
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Price breakdown</h2>
                            <pre className="mt-4 max-h-64 overflow-auto rounded-2xl bg-slate-900/95 p-4 text-xs text-slate-100">
{JSON.stringify(order.price_breakdown ?? {}, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

