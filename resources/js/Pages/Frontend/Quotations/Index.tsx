import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ConfirmationModal from '@/Components/ConfirmationModal';
import type { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type QuotationRow = {
    id: number;
    ids?: number[];
    status: string;
    approved_at?: string | null;
    admin_notes?: string | null;
    quantity: number;
    notes?: string | null;
    product: {
        id: number;
        name: string;
        sku: string;
        thumbnail?: string | null;
    };
    products?: Array<{
        id: number;
        name: string;
        sku: string;
        thumbnail?: string | null;
    }>;
    variant?: {
        id: number;
        label: string;
        metadata?: Record<string, string | number | boolean | null | undefined> | null;
    } | null;
    order_reference?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type QuotationsPageProps = PageProps<{
    quotations: QuotationRow[];
}>;

const statusLabels: Record<string, { label: string; style: string }> = {
    pending: { label: 'Pending review', style: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', style: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Rejected', style: 'bg-rose-100 text-rose-700' },
    invoiced: { label: 'Awaiting payment', style: 'bg-elvee-blue/10 text-elvee-blue' },
    converted: { label: 'Converted to order', style: 'bg-slate-200 text-slate-700' },
    pending_customer_confirmation: { label: 'Waiting for you', style: 'bg-amber-100 text-amber-700' },
    customer_confirmed: { label: 'You approved', style: 'bg-emerald-100 text-emerald-700' },
    customer_declined: { label: 'You declined', style: 'bg-rose-100 text-rose-700' },
};


export default function QuotationsIndex() {
    const { quotations } = usePage<QuotationsPageProps>().props;
    const [cancelConfirm, setCancelConfirm] = useState<{ show: boolean; quotationId: number | null }>({ show: false, quotationId: null });

    const formatDate = (input?: string | null) =>
        input
            ? new Date(input).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
              })
            : 'N/A';


    return (
        <AuthenticatedLayout>
            <Head title="Quotations" />

            <div className="space-y-10">
                <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-900">Quotation requests</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Track jewellery purchase and jobwork quotations. We'll notify you as soon as our merchandising desk replies.
                            </p>
                        </div>
                        <Link
                            href={route('frontend.catalog.index')}
                            className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
                        >
                            Browse catalogue
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </header>

                <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    {quotations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-16 text-sm text-slate-500">
                            <p>No quotation requests yet.</p>
                            <Link
                                href={route('frontend.catalog.index')}
                                className="rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
                            >
                                Start a quotation
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Quotation #</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">SKU</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Quantity</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {quotations.map((quotation) => {
                                        const statusMeta = statusLabels[quotation.status] ?? {
                                            label: quotation.status,
                                            style: 'bg-slate-200 text-slate-700',
                                        };

                                        return (
                                            <tr key={quotation.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-4">
                                                    <Link
                                                        href={route('frontend.quotations.show', quotation.id)}
                                                        className="text-sm font-semibold text-elvee-blue hover:text-feather-gold transition"
                                                    >
                                                        #{quotation.id}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {quotation.product.thumbnail && (
                                                            <img
                                                                src={quotation.product.thumbnail}
                                                                alt={quotation.product.name}
                                                                className="h-12 w-12 rounded-lg object-cover"
                                                            />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">{quotation.product.name}</p>
                                                            {quotation.products && quotation.products.length > 1 && (
                                                                <p className="text-xs text-slate-500">+{quotation.products.length - 1} more product{quotation.products.length - 1 !== 1 ? 's' : ''}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm text-slate-600">{quotation.product.sku}</p>
                                                    {quotation.products && quotation.products.length > 1 && (
                                                        <p className="text-xs text-slate-400">+{quotation.products.length - 1} more</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusMeta.style}`}>
                                                            {statusMeta.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm font-semibold text-slate-900">{quotation.quantity}</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="text-sm text-slate-600">{formatDate(quotation.created_at)}</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('frontend.quotations.show', quotation.id)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-elvee-blue hover:bg-elvee-blue/5 hover:text-elvee-blue"
                                                            title="View details"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </Link>
                                                        {quotation.status === 'pending' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCancelConfirm({ show: true, quotationId: quotation.id });
                                                                }}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                                title="Cancel request"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            <ConfirmationModal
                show={cancelConfirm.show && cancelConfirm.quotationId !== null}
                onClose={() => setCancelConfirm({ show: false, quotationId: null })}
                onConfirm={() => {
                    if (cancelConfirm.quotationId) {
                        router.delete(route('frontend.quotations.destroy', cancelConfirm.quotationId), {
                            preserveScroll: true,
                            onSuccess: () => {
                                setCancelConfirm({ show: false, quotationId: null });
                            },
                        });
                    }
                }}
                title="Cancel Quotation"
                message="Are you sure you want to cancel this quotation request? This action cannot be undone."
                confirmText="Cancel Request"
                variant="danger"
            />
        </AuthenticatedLayout>
    );
}
