import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

type QuotationRow = {
    id: number;
    mode: 'purchase' | 'jobwork';
    status: string;
    jobwork_status?: string | null;
    quantity: number;
    approved_at?: string | null;
    product: {
        id: number;
        name: string;
        sku: string;
    };
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
    };
    mode: 'all' | 'purchase' | 'jobwork';
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
    const { quotations, mode } = usePage<AdminQuotationIndexProps>().props;

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
                    <div className="mb-6 flex flex-wrap gap-3 text-xs">
                        <Link
                            href={route('admin.quotations.index')}
                            className={`rounded-full px-4 py-2 font-semibold transition ${
                                mode === 'all'
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                        >
                            All
                        </Link>
                        <Link
                            href={route('admin.quotations.jewellery')}
                            className={`rounded-full px-4 py-2 font-semibold transition ${
                                mode === 'purchase'
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                        >
                            Jewellery
                        </Link>
                        <Link
                            href={route('admin.quotations.jobwork')}
                            className={`rounded-full px-4 py-2 font-semibold transition ${
                                mode === 'jobwork'
                                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                        >
                            Jobwork
                        </Link>
                    </div>

                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Reference</th>
                                <th className="px-4 py-3 text-left">Customer</th>
                                <th className="px-4 py-3 text-left">Mode</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Jobwork stage</th>
                                <th className="px-4 py-3 text-left">Order ref</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {quotations.data.map((quotation) => (
                                <tr key={quotation.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-slate-900">{quotation.product.name}</div>
                                        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                            SKU {quotation.product.sku}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">Qty {quotation.quantity}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        <div>{quotation.user?.name ?? '—'}</div>
                                        <div className="text-xs text-slate-400">{quotation.user?.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                                                quotation.mode === 'jobwork'
                                                    ? 'bg-sky-100 text-sky-700'
                                                    : 'bg-slate-200 text-slate-700'
                                            }`}
                                        >
                                            {quotation.mode === 'jobwork' ? 'Jobwork' : 'Jewellery'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                                                statusBadge[quotation.status] ?? 'bg-slate-200 text-slate-700'
                                            }`}
                                        >
                                            {quotation.status}
                                        </span>
                                        {quotation.approved_at && (
                                            <div className="mt-1 text-xs text-slate-400">
                                                Approved {new Date(quotation.approved_at).toLocaleDateString()}
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
                                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
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

