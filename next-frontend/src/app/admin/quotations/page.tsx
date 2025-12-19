'use client';

import { Head } from '@/components/Head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';

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

type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    confirmed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-slate-100 text-slate-500',
};

export default function AdminQuotationsIndex() {
    const [loading, setLoading] = useState(true);
    const [quotationsData, setQuotationsData] = useState<QuotationRow[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [filters.status, filters.search]);

    useEffect(() => {
        loadQuotations();
    }, [currentPage, perPage, filters.status]);

    const loadQuotations = async () => {
        setLoading(true);
        try {
            const response = await adminService.getQuotations(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setQuotationsData(items.map((item: any) => ({
                id: Number(item.id),
                reference: item.reference || `QUO-${item.id}`,
                status: item.status,
                status_label: item.status_label || item.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                total_quantity: Number(item.total_quantity || 0),
                created_at: item.created_at,
                user: item.user ? { name: item.user.name, email: item.user.email } : null,
                linked_order_reference: item.linked_order_reference || item.order?.reference || null,
            })));
            setMeta({
                current_page: responseMeta.current_page || responseMeta.page || 1,
                last_page: responseMeta.last_page || responseMeta.lastPage || 1,
                total: responseMeta.total || 0,
                per_page: responseMeta.per_page || responseMeta.perPage || perPage,
            });
        } catch (error: any) {
            console.error('Failed to load quotations:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (input?: string | null) =>
        input
            ? new Date(input).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
              })
            : 'N/A';

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
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <input
                            type="text"
                            placeholder="Search by reference or customer..."
                            value={filters.search}
                            onChange={(e) => {
                                setFilters({ ...filters, search: e.target.value });
                                setCurrentPage(1);
                            }}
                            className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                        />
                        <select
                            value={filters.status}
                            onChange={(e) => {
                                setFilters({ ...filters, status: e.target.value });
                                setCurrentPage(1);
                            }}
                            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </header>

                <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 text-sm">
                        <div className="font-semibold text-slate-700">Results ({meta.total})</div>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                        </div>
                    ) : quotationsData.length === 0 ? (
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
                                    {quotationsData.map((quotation) => (
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

                {meta.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                        <div>
                            Showing {meta.total > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0} to {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} entries
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                        page === meta.current_page
                                            ? 'bg-sky-600 text-white shadow shadow-sky-600/20'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
