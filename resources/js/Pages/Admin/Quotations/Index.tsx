import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

type QuotationRow = {
    id: number;
    ids?: number[];
    mode: 'purchase' | 'jobwork' | 'both';
    modes?: string[];
    status: string;
    jobwork_status?: string | null;
    quantity: number;
    approved_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    product: {
        id: number;
        name: string;
    };
    products?: Array<{
        id: number;
        name: string;
    }>;
    user?: {
        name?: string | null;
        email?: string | null;
    } | null;
    order_reference?: string | null;
};

type AdminQuotationIndexProps = PageProps<{
    quotations: {
        data: QuotationRow[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        order_reference?: string;
        customer_name?: string;
        customer_email?: string;
    };
}>;

const statusBadge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    pending_customer_confirmation: 'bg-amber-100 text-amber-700',
    customer_confirmed: 'bg-emerald-100 text-emerald-700',
    customer_declined: 'bg-rose-100 text-rose-700',
};

const jobworkBadges: Record<string, string> = {
    material_sending: 'bg-slate-100 text-slate-600',
    material_received: 'bg-sky-100 text-sky-700',
    under_preparation: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-emerald-100 text-emerald-700',
    awaiting_billing: 'bg-amber-100 text-amber-700',
    billing_confirmed: 'bg-emerald-100 text-emerald-700',
    ready_to_ship: 'bg-slate-900 text-white',
};

export default function AdminQuotationsIndex() {
    const { quotations, filters } = usePage<AdminQuotationIndexProps>().props;
    const [orderRef, setOrderRef] = useState(filters.order_reference ?? '');
    const [customerName, setCustomerName] = useState(filters.customer_name ?? '');
    const [customerEmail, setCustomerEmail] = useState(filters.customer_email ?? '');

    const applyFilters = () => {
        router.get(
            route('admin.quotations.index'),
            {
                order_reference: orderRef || undefined,
                customer_name: customerName || undefined,
                customer_email: customerEmail || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const clearFilters = () => {
        setOrderRef('');
        setCustomerName('');
        setCustomerEmail('');
        router.get(route('admin.quotations.index'), {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Quotations" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Quotation requests</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Review customer quotation submissions for jewellery and jobwork. Approve to convert into orders or guide production
                        teams.
                    </p>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="mb-6 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-700">Order Reference</label>
                                <input
                                    type="text"
                                    value={orderRef}
                                    onChange={(e) => setOrderRef(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilters();
                                        }
                                    }}
                                    placeholder="Search by order reference..."
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-700">Customer Name</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilters();
                                        }
                                    }}
                                    placeholder="Search by customer name..."
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-700">Customer Email</label>
                                <input
                                    type="text"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilters();
                                        }
                                    }}
                                    placeholder="Search by customer email..."
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={applyFilters}
                                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={clearFilters}
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Reference</th>
                                <th className="px-4 py-3 text-left">Customer</th>
                                <th className="px-4 py-3 text-left">Mode</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Jobwork stage</th>
                                <th className="px-4 py-3 text-left">Total Qty</th>
                                <th className="px-4 py-3 text-left">Date</th>
                                <th className="px-4 py-3 text-left">Order ref</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {quotations.data.map((quotation) => (
                                <tr key={quotation.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-slate-900">#{quotation.id}</div>
                                        <div className="text-xs font-medium text-slate-600">
                                            {quotation.products && quotation.products.length > 1
                                                ? `${quotation.products.length} products`
                                                : quotation.product.name}
                                        </div>
                                        {quotation.products && quotation.products.length > 1 && (
                                            <div className="mt-1 text-xs text-slate-400">
                                                {quotation.products.map((p) => p.name).join(', ')}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        <div className="font-medium text-slate-900">{quotation.user?.name ?? '—'}</div>
                                        <div className="text-xs text-slate-400">{quotation.user?.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {quotation.mode === 'both' ? (
                                            <div className="flex flex-col gap-1">
                                                <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700">
                                                    Jewellery
                                                </span>
                                                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold text-sky-700">
                                                    Jobwork
                                                </span>
                                            </div>
                                        ) : (
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                                                    quotation.mode === 'jobwork'
                                                        ? 'bg-sky-100 text-sky-700'
                                                        : 'bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                {quotation.mode === 'jobwork' ? 'Jobwork' : 'Jewellery'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                                                statusBadge[quotation.status] ?? 'bg-slate-200 text-slate-700'
                                            }`}
                                        >
                                            {quotation.status.replace(/_/g, ' ')}
                                        </span>
                                        {quotation.approved_at && (
                                            <div className="mt-1 text-xs text-slate-400">
                                                Approved {new Date(quotation.approved_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {quotation.jobwork_status ? (
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                                                    jobworkBadges[quotation.jobwork_status] ??
                                                    'bg-slate-200 text-slate-600'
                                                }`}
                                            >
                                                {quotation.jobwork_status.replace(/_/g, ' ')}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-slate-900">{quotation.quantity}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-600">
                                        {quotation.created_at && (
                                            <div>
                                                <div className="font-medium text-slate-900">
                                                    {new Date(quotation.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-slate-400">
                                                    {new Date(quotation.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{quotation.order_reference ?? '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={route('admin.quotations.show', quotation.id)}
                                            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                                        >
                                            Manage
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {quotations.data.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500">
                                        No quotation submissions yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
                        {quotations.links.map((link, index) => (
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
            </div>
        </AdminLayout>
    );
}
