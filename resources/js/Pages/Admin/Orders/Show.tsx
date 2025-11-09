import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';

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

    return (
        <AdminLayout>
            <Head title={`Order ${order.reference}`} />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Order {order.reference}</h1>
                            <p className="text-sm text-slate-500">{order.user?.name ?? 'Unassigned'} · {order.user?.email ?? '—'}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                            {order.status_label}
                        </span>
                    </div>
                </div>

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
                    <div className="flex justify-end">
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
                            <div key={item.id} className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
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

                <div className="grid gap-4 md:grid-cols-2">
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
                        <h2 className="text-lg font-semibold text-slate-900">Price breakdown</h2>
                        <pre className="mt-4 max-h-64 overflow-auto rounded-2xl bg-slate-900/95 p-4 text-xs text-slate-100">
{JSON.stringify(order.price_breakdown ?? {}, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

