import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';

type OrderShowItem = {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    total_price: number;
};

type OrderPayment = {
    id: number;
    status: string;
    amount: number;
    created_at?: string | null;
};

type OrderDetails = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    total_amount: number;
    subtotal_amount: number;
    tax_amount: number;
    discount_amount: number;
    created_at?: string | null;
    items: OrderShowItem[];
    payments: OrderPayment[];
};

type OrderShowProps = PageProps<{
    order: OrderDetails;
}>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    pending_payment: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    in_production: 'bg-indigo-100 text-indigo-700',
    quality_check: 'bg-blue-100 text-blue-700',
    ready_to_dispatch: 'bg-purple-100 text-purple-700',
    dispatched: 'bg-sky-100 text-sky-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
};

export default function FrontendOrdersShow() {
    const { order } = usePage<OrderShowProps>().props;

    return (
        <AuthenticatedLayout>
            <Head title={`Order ${order.reference}`} />

            <div className="space-y-10">
                <header className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Order reference</p>
                    <h1 className="text-3xl font-semibold text-slate-900">{order.reference}</h1>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                statusColors[order.status] ?? 'bg-slate-200 text-slate-700'
                            }`}
                        >
                            {order.status_label}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                            {order.items.length} items
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                            {order.created_at
                                ? new Date(order.created_at).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                  })
                                : 'N/A'}
                        </span>
                    </div>
                </header>

                <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-4">
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Items</h2>
                            <div className="mt-4 space-y-4">
                                {order.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600"
                                    >
                                        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                            <p className="font-semibold text-slate-900">{item.name}</p>
                                            <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
                                                SKU {item.sku}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                                Qty {item.quantity}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-900">
                                                {currencyFormatter.format(item.total_price)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {order.items.length === 0 && (
                                    <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                                        No line items attached to this order.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                {order.payments.length === 0 && (
                                    <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                                        No payments recorded yet.
                                    </p>
                                )}
                                {order.payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{payment.status}</p>
                                            <p className="text-xs text-slate-400">
                                                {payment.created_at
                                                    ? new Date(payment.created_at).toLocaleDateString('en-IN', {
                                                          day: '2-digit',
                                                          month: 'short',
                                                          year: 'numeric',
                                                      })
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-900">
                                            {currencyFormatter.format(payment.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
                            <dl className="mt-4 space-y-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <dt>Subtotal</dt>
                                    <dd>{currencyFormatter.format(order.subtotal_amount)}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt>Tax</dt>
                                    <dd>{currencyFormatter.format(order.tax_amount)}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt>Discount</dt>
                                    <dd>-{currencyFormatter.format(order.discount_amount)}</dd>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                                    <dt>Total</dt>
                                    <dd>{currencyFormatter.format(order.total_amount)}</dd>
                                </div>
                            </dl>
                        </div>
                    </aside>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

