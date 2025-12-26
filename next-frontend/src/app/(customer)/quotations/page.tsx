'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { route } from '@/utils/route';
import { frontendService } from '@/services/frontendService';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { toastSuccess, toastError } from '@/utils/toast';
import type { QuotationRow } from '@/types';

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

const getMediaUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function QuotationsPage() {
    const [quotations, setQuotations] = useState<QuotationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelConfirm, setCancelConfirm] = useState<{ show: boolean; quotationId: number | null }>({ show: false, quotationId: null });
    // Toast notifications are handled via RTK

    const fetchQuotations = async () => {
        setLoading(true);
        try {
            const response = await frontendService.getQuotations();
            // NestJS returns { quotations: [...] } in response.data
            const quotationsData = response.data?.quotations || response.data || [];
            
            // Map backend response to frontend format (matching Laravel structure)
            const mappedQuotations: QuotationRow[] = quotationsData.map((q: any) => {
                // Handle both string and number IDs
                const quotationId = typeof q.id === 'string' ? Number(q.id) : q.id;
                
                return {
                    id: quotationId,
                    ids: q.ids ? q.ids.map((id: any) => typeof id === 'string' ? Number(id) : id) : undefined,
                    status: q.status || 'pending',
                    approved_at: q.approved_at || null,
                    admin_notes: q.admin_notes || null,
                    quantity: Number(q.quantity) || 0,
                    notes: q.notes || null,
                    product: {
                        id: typeof q.product?.id === 'string' ? Number(q.product.id) : Number(q.product?.id || 0),
                        name: q.product?.name || '',
                        sku: q.product?.sku || '',
                        thumbnail: q.product?.thumbnail ? getMediaUrl(q.product.thumbnail) : null,
                    },
                    products: q.products ? q.products.map((p: any) => ({
                        id: typeof p.id === 'string' ? Number(p.id) : Number(p.id),
                        name: p.name || '',
                        sku: p.sku || '',
                        thumbnail: p.thumbnail ? getMediaUrl(p.thumbnail) : null,
                    })) : undefined,
                    variant: q.variant ? {
                        id: typeof q.variant.id === 'string' ? Number(q.variant.id) : Number(q.variant.id),
                        label: q.variant.label || '',
                        metadata: q.variant.metadata || null,
                    } : null,
                    order_reference: q.order_reference || null,
                    created_at: q.created_at || null,
                    updated_at: q.updated_at || null,
                };
            });
            
            setQuotations(mappedQuotations);
        } catch (error: any) {
            console.error('Failed to fetch quotations:', error);
            toastError(error.response?.data?.message || 'Failed to load quotations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    // Refresh quotations when page becomes visible (e.g., after redirect from cart submission)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchQuotations();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    const formatDate = (input?: string | null) =>
        input
            ? new Date(input).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
              })
            : 'N/A';

    const handleCancel = async () => {
        if (!cancelConfirm.quotationId) return;
        
        try {
            await frontendService.deleteQuotation(cancelConfirm.quotationId);
            setQuotations(prev => prev.filter(q => q.id !== cancelConfirm.quotationId));
            setCancelConfirm({ show: false, quotationId: null });
            toastSuccess('Quotation cancelled successfully.');
        } catch (error: any) {
            console.error('Failed to cancel quotation:', error);
            toastError(error.response?.data?.message || 'Failed to cancel quotation');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    return (
        <>

            <div className="space-y-10">
                <Head title="Quotation requests" />
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
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Quotation #</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">SKU</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Quantity</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-600">Actions</th>
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
                                                        href={route('frontend.quotations.show', { id: quotation.id })}
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
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
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
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.style}`}>
                                                        {statusMeta.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm text-slate-900">{quotation.quantity}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-sm text-slate-600">{formatDate(quotation.created_at)}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={route('frontend.quotations.show', { id: quotation.id })}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-elvee-blue hover:bg-elvee-blue/5 hover:text-elvee-blue"
                                                            title="View details"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </Link>
                                                        {(quotation.status === 'pending' || quotation.status === 'pending_customer_confirmation') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setCancelConfirm({ show: true, quotationId: quotation.id })}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-300 text-rose-600 transition hover:border-rose-400 hover:bg-rose-50"
                                                                title="Cancel quotation"
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
                show={cancelConfirm.show}
                onClose={() => setCancelConfirm({ show: false, quotationId: null })}
                onConfirm={handleCancel}
                title="Cancel quotation"
                message="Are you sure you want to cancel this quotation request? This action cannot be undone."
                confirmText="Cancel quotation"
                cancelText="Keep it"
                variant="danger"
            />
        </>
    );
}
