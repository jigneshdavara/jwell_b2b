'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { route } from '@/utils/route';
import { frontendService } from '@/services/frontendService';
import Pagination from '@/components/ui/Pagination';
import { PaginationMeta } from '@/utils/pagination';
import { Head } from '@/components/Head';
import { formatCurrency } from '@/utils/formatting';

interface InvoiceListItem {
    id: string;
    invoice_number: string;
    status: string;
    status_label: string;
    total_amount: string;
    currency: string;
    issue_date: string | null;
    due_date: string | null;
    created_at: string;
    order_reference: string | null;
}

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    sent: 'bg-elvee-blue/10 text-elvee-blue',
    paid: 'bg-emerald-100 text-emerald-700',
    overdue: 'bg-rose-100 text-rose-700',
    cancelled: 'bg-rose-100 text-rose-700',
};

export default function InvoicesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
    const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);

    const currentPage = useMemo(() => {
        const page = searchParams.get('page');
        return page ? parseInt(page, 10) : 1;
    }, [searchParams]);

    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            try {
                const response = await frontendService.getInvoices(currentPage, 15);
                const data = response.data;
                
                setInvoices(data.items || []);
                setPaginationMeta(data.meta || null);
            } catch (error: any) {
                console.error('Failed to fetch invoices:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, [currentPage]);

    const formatDate = (date: string | null) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDateTime = (date: string | null) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading && !invoices.length) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                <Head title="My Invoices" />
                <header className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl lg:text-3xl">
                                My Invoices
                            </h1>
                            <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                                View, download, and manage all your invoices in one place.
                            </p>
                        </div>
                        <Link
                            href={route('frontend.catalog.index')}
                            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-elvee-blue px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                        >
                            Browse catalogue
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </header>

                <section className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                    {invoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-3 py-12 text-xs text-slate-500 sm:space-y-4 sm:py-16 sm:text-sm">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 text-slate-300 sm:h-16 sm:w-16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <p className="text-center">No invoices found. Invoices will appear here once your orders are processed.</p>
                            <Link
                                href={route('frontend.orders.index')}
                                className="rounded-full bg-elvee-blue px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy sm:px-4 sm:py-2 sm:text-sm"
                            >
                                View Orders
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                                            Invoice Number
                                        </th>
                                        <th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                                            Order Reference
                                        </th>
                                        <th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                                            Issue Date
                                        </th>
                                        <th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                                            Due Date
                                        </th>
                                        <th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                                            Status
                                        </th>
                                        <th className="px-2 py-2 text-right text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                                            Amount
                                        </th>
                                        <th className="px-2 py-2 text-right text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-slate-50 transition">
                                            <td className="px-2 py-2.5 sm:px-4 sm:py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                                                        {invoice.invoice_number}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 sm:text-xs">
                                                        Created {formatDate(invoice.created_at)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2.5 sm:px-4 sm:py-4">
                                                {invoice.order_reference ? (
                                                    <Link
                                                        href={route('customer.orders.show', { id: invoice.order_reference })}
                                                        className="text-xs font-medium text-elvee-blue hover:text-elvee-blue/80 transition sm:text-sm"
                                                    >
                                                        {invoice.order_reference}
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-slate-400 sm:text-sm">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2.5 sm:px-4 sm:py-4">
                                                <span className="text-xs text-slate-600 sm:text-sm">
                                                    {formatDate(invoice.issue_date)}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2.5 sm:px-4 sm:py-4">
                                                {invoice.due_date ? (
                                                    <span className="text-xs text-slate-600 sm:text-sm">
                                                        {formatDate(invoice.due_date)}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 sm:text-sm">—</span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2.5 sm:px-4 sm:py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${
                                                        statusColors[invoice.status] || 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {invoice.status_label}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2.5 text-right sm:px-4 sm:py-4">
                                                <p className="text-xs font-semibold text-slate-900 sm:text-sm">
                                                    {formatCurrency(parseFloat(invoice.total_amount), invoice.currency)}
                                                </p>
                                            </td>
                                            <td className="px-2 py-2.5 sm:px-4 sm:py-4">
                                                <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                    <Link
                                                        href={route('customer.invoices.show', { id: invoice.id })}
                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-elvee-blue hover:bg-elvee-blue/5 hover:text-elvee-blue sm:h-8 sm:w-8"
                                                        title="View invoice"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

                {paginationMeta && paginationMeta.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        <Pagination
                            meta={paginationMeta}
                            onPageChange={(page) => {
                                router.push(`?page=${page}`);
                            }}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
