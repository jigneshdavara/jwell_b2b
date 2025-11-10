import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

type OrderListItem = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    total_amount: number;
    created_at?: string | null;
    items: Array<{
        id: number;
        name: string;
        quantity: number;
    }>;
};

type OrdersIndexProps = PageProps<{
    orders: {
        data: OrderListItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
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

export default function FrontendOrdersIndex() {
    const { orders } = usePage<OrdersIndexProps>().props;

    return (
        <AuthenticatedLayout>
            <Head title="My Orders" />

            <div className="space-y-10">
                <header className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">My orders</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Track production, payments, and fulfilment for your confirmed jewellery purchases and jobwork conversions.
                        </p>
                    </div>
                    <Link
                        href={route('frontend.catalog.index')}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-slate-900/30 transition hover:bg-slate-700"
                    >
                        Browse catalogue
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </header>

                <section className="space-y-4">
                    {orders.data.map((order) => (
                        <article key={order.id} className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{order.reference}</p>
                                    <p className="text-xs text-slate-500">
                                        Placed on{' '}
                                        {order.created_at
                                            ? new Date(order.created_at).toLocaleDateString('en-IN', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                              })
                                            : 'N/A'}
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
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
                                    </div>
                                </div>
                                <div className="text-right text-sm text-slate-600">
                                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Total</p>
                                    <p className="text-lg font-semibold text-slate-900">
                                        {currencyFormatter.format(order.total_amount)}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                                {order.items.map((item) => (
                                    <span key={item.id} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                                        {item.name} × {item.quantity}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-4 text-right">
                                <Link
                                    href={route('frontend.orders.show', order.id)}
                                    className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    View details
                                </Link>
                            </div>
                        </article>
                    ))}
                    {orders.data.length === 0 && (
                        <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                            No confirmed orders yet. Submit a quotation and approve it to generate an order.
                        </div>
                    )}
                </section>

                <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                    {orders.links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.url ?? '#'}
                            preserveScroll
                            className={`rounded-full px-4 py-2 transition ${
                                link.active
                                    ? 'bg-sky-600 text-white shadow-lg'
                                    : link.url
                                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    : 'bg-slate-100 text-slate-400'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

