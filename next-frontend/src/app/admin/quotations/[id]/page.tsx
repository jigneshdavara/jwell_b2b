'use client';

import React, { useState, useEffect } from 'react';
import { Head } from '@/components/Head';
import Link from 'next/link';
import { adminService } from '@/services/adminService';

type QuotationDetails = {
    id: number;
    status: string;
    quantity: number;
    notes?: string | null;
    admin_notes?: string | null;
    created_at?: string | null;
    product: {
        id: number;
        name: string;
        sku: string;
        media: Array<{ url: string; alt: string }>;
    };
    user?: {
        name?: string | null;
        email?: string | null;
    } | null;
    price_breakdown?: {
        metal?: number;
        diamond?: number;
        making?: number;
        subtotal?: number;
        discount?: number;
        total?: number;
    };
};

const statusBadge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
};

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

export default function AdminQuotationShow({ params }: { params: { id: string } }) {
    const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuotation();
    }, [params.id]);

    const loadQuotation = async () => {
        try {
            setLoading(true);
            const response = await adminService.getQuotation(Number(params.id));
            if (response.data) {
                setQuotation(response.data);
            }
        } catch (error: any) {
            console.error('Failed to load quotation:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Head title={`Quotation #${params.id}`} />
                <div className="flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                </div>
            </>
        );
    }

    if (!quotation) {
        return (
            <>
                <Head title={`Quotation #${params.id}`} />
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <p className="text-slate-600">Quotation not found.</p>
                    <Link href="/admin/quotations" className="mt-4 inline-block text-sm font-semibold text-elvee-blue hover:text-elvee-blue/80">
                        Back to list
                    </Link>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Quotation #${params.id}`} />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold text-slate-900">Quotation #{params.id}</h1>
                        <Link
                            href="/admin/quotations"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <div className="grid gap-8 md:grid-cols-3">
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">From</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">Elvee</p>
                                <p className="mt-1 text-sm text-slate-600">123 Business Street</p>
                                <p className="text-sm text-slate-600">Mumbai, Maharashtra 400001</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Bill To</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">{quotation.user?.name ?? 'Unknown'}</p>
                                <p className="mt-1 text-sm text-slate-600">{quotation.user?.email ?? '—'}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Quotation Details</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">#{params.id}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Date: <span className="font-semibold text-slate-900">{quotation.created_at && formatDate(quotation.created_at)}</span>
                                </p>
                                <div className="mt-3 flex justify-end gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                                            statusBadge[quotation.status] ?? 'bg-slate-200 text-slate-700'
                                        }`}
                                    >
                                        {quotation.status.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Items</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b-2 border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Item</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Unit Price</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Qty</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-slate-50/50 transition">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-slate-900">{quotation.product.name}</p>
                                                    <p className="text-xs text-slate-400">SKU {quotation.product.sku}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="text-sm font-semibold text-slate-900">₹ {quotation.price_breakdown?.total?.toLocaleString('en-IN')}</div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="font-semibold text-slate-900">{quotation.quantity}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="text-sm font-semibold text-slate-900">₹ {( (quotation.price_breakdown?.total || 0) * quotation.quantity).toLocaleString('en-IN')}</div>
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right font-semibold text-slate-600 text-xs uppercase tracking-wider">Total Amount</td>
                                        <td className="px-4 py-3 text-right font-bold text-slate-900 text-lg">₹ {( (quotation.price_breakdown?.total || 0) * quotation.quantity).toLocaleString('en-IN')}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
