'use client';

import { Head } from '@/components/Head';
import Link from 'next/link';
import { useState } from 'react';

type QuotationRow = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    total_quantity: number;
    created_at?: string | null;
    user?: {
        name: string;
        email: string;
    } | null;
    linked_order_reference?: string | null;
};

type Pagination<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

// Mock data for quotations
const mockQuotations: QuotationRow[] = [
    {
        id: 1,
        reference: 'QUO-2023-001',
        status: 'pending',
        status_label: 'Pending',
        total_quantity: 5,
        created_at: '2023-12-01T10:00:00Z',
        user: { name: 'John Doe', email: 'john@example.com' },
    },
    {
        id: 2,
        reference: 'QUO-2023-002',
        status: 'approved',
        status_label: 'Approved',
        total_quantity: 10,
        created_at: '2023-12-05T14:30:00Z',
        user: { name: 'Jane Smith', email: 'jane@example.com' },
        linked_order_reference: 'ORD-2023-002',
    },
];

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    confirmed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-slate-100 text-slate-500',
};

export default function AdminQuotationsIndex() {
    const [quotationsData, setQuotationsData] = useState<QuotationRow[]>(mockQuotations);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
    });

    const formatDate = (input?: string | null) =>
        input
            ? new Date(input).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
              })
            : 'N/A';

    const quotations = {
        data: quotationsData,
        total: quotationsData.length,
        links: [
            { url: '#', label: '&laquo; Previous', active: false },
            { url: '#', label: '1', active: true },
            { url: '#', label: 'Next &raquo;', active: false },
        ],
    };

    return (
        <>
            <Head title="Quotations" />

            <div className="space-y-10">
                <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-900">Quotations</h1>
                            <p className="mt-2 text-sm text-slate-500">Review quotation requests and issue commercial offers.</p>
                        </div>
                    </div>
                </header>

                <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    {quotations.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-16 text-sm text-slate-500">
                            <p>No quotation requests recorded.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Quotation</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Total Qty</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Linked Order</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {quotations.data.map((quotation) => (
                                        <tr key={quotation.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-4">
                                                <Link
                                                    href={`/admin/quotations/${quotation.id}`}
                                                    className="text-sm font-semibold text-elvee-blue hover:text-feather-gold transition"
                                                >
                                                    {quotation.reference}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{quotation.user?.name ?? '—'}</p>
                                                    {quotation.user?.email && (
                                                        <p className="text-xs text-slate-500">{quotation.user.email}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColors[quotation.status] ?? 'bg-slate-200 text-slate-700'}`}>
                                                    {quotation.status_label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-slate-600">{quotation.total_quantity}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-slate-600">{formatDate(quotation.created_at)}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {quotation.linked_order_reference ? (
                                                    <span className="text-sm font-semibold text-emerald-600">{quotation.linked_order_reference}</span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/quotations/${quotation.id}`}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-elvee-blue hover:bg-elvee-blue/5 hover:text-elvee-blue"
                                                        title="Manage quotation"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {quotations.links.length > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                        {quotations.links.map((link, index) => (
                            <button
                                key={index}
                                className={`rounded-full px-4 py-2 transition ${
                                    link.active
                                        ? 'bg-elvee-blue text-white shadow-lg shadow-elvee-blue/30'
                                        : link.url
                                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                        : 'bg-slate-100 text-slate-400'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
