'use client';

import { Head } from '@/components/Head';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';

type QuotationRow = {
    id: number;
    ids?: number[];
    status: string;
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


const statusBadge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    pending_customer_confirmation: 'bg-amber-100 text-amber-700',
    customer_confirmed: 'bg-emerald-100 text-emerald-700',
    customer_declined: 'bg-rose-100 text-rose-700',
};

export default function AdminQuotationsIndex() {
    const [loading, setLoading] = useState(true);
    const [quotationsData, setQuotationsData] = useState<QuotationRow[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        order_reference: '',
        customer_name: '',
        customer_email: '',
    });

    useEffect(() => {
        loadQuotations();
    }, [currentPage, filters.order_reference, filters.customer_name, filters.customer_email]);

    const loadQuotations = async () => {
        setLoading(true);
        try {
            const response = await adminService.getQuotations({
                page: currentPage,
                order_reference: filters.order_reference || undefined,
                customer_name: filters.customer_name || undefined,
                customer_email: filters.customer_email || undefined,
            });
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: 20 };

            const formattedItems = items.map((item: any) => ({
                id: Number(item.id),
                ids: item.ids ? item.ids.map((id: string) => Number(id)) : undefined,
                status: item.status,
                quantity: Number(item.quantity || 0),
                approved_at: item.approved_at,
                created_at: item.created_at,
                updated_at: item.updated_at,
                product: item.product ? {
                    id: Number(item.product.id),
                    name: item.product.name,
                } : { id: 0, name: '' },
                products: item.products ? item.products.map((p: any) => ({
                    id: Number(p.id),
                    name: p.name,
                })) : undefined,
                user: item.user ? {
                    name: item.user.name,
                    email: item.user.email,
                } : null,
                order_reference: item.order_reference || null,
            }));

            const lastPage = responseMeta.lastPage || responseMeta.last_page || 1;
            const current = responseMeta.page || responseMeta.current_page || currentPage;

            setQuotationsData(formattedItems);
            setPagination({
                current_page: current,
                last_page: lastPage,
                per_page: responseMeta.per_page || responseMeta.perPage || 20,
                total: responseMeta.total || 0,
                from: responseMeta.from,
                to: responseMeta.to,
                links: responseMeta.links || generatePaginationLinks(current, lastPage),
            });
            
            // Sync current page state with API response
            if (current !== currentPage) {
                setCurrentPage(current);
            }
        } catch (error: any) {
            console.error('Failed to load quotations:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        setCurrentPage(1);
        loadQuotations();
    };

    const clearFilters = () => {
        setFilters({
            order_reference: '',
            customer_name: '',
            customer_email: '',
        });
        setCurrentPage(1);
    };


    return (
        <>
            <Head title="Quotations" />

            <div className="space-y-6 sm:space-y-8 px-1 py-4 sm:px-6 sm:py-6 lg:px-8">
                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Quotation requests</h1>
                            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                                Review customer quotation submissions for jewellery and jobwork. Approve to convert into orders or guide production
                                teams.
                            </p>
                        </div>
                        <Link
                            href="/admin/quotations/report"
                            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-elvee-blue px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 12.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13.5 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6 20.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM7.5 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM10.5 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 7.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16.5 20.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM18 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM19.5 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16.5 7.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM18 3.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                            </svg>
                            View Report
                        </Link>
                    </div>
                </div>

                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900">Filters</h2>
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                            <div>
                                <label className="mb-1.5 sm:mb-2 block text-[10px] sm:text-xs font-semibold text-slate-700">Order Reference</label>
                                <input
                                    type="text"
                                    value={filters.order_reference}
                                    onChange={(e) => setFilters({ ...filters, order_reference: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilters();
                                        }
                                    }}
                                    placeholder="Search by order reference..."
                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 sm:mb-2 block text-[10px] sm:text-xs font-semibold text-slate-700">Customer Name</label>
                                <input
                                    type="text"
                                    value={filters.customer_name}
                                    onChange={(e) => setFilters({ ...filters, customer_name: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilters();
                                        }
                                    }}
                                    placeholder="Search by customer name..."
                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 sm:mb-2 block text-[10px] sm:text-xs font-semibold text-slate-700">Customer Email</label>
                                <input
                                    type="text"
                                    value={filters.customer_email}
                                    onChange={(e) => setFilters({ ...filters, customer_email: e.target.value })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilters();
                                        }
                                    }}
                                    placeholder="Search by customer email..."
                                    className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                                onClick={applyFilters}
                                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 sm:px-4 sm:py-2 sm:text-sm"
                            >
                                Apply Filters
                            </button>
                            <button
                                onClick={clearFilters}
                                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-4 sm:py-2 sm:text-sm"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12 sm:py-16">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                        </div>
                    ) : quotationsData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 py-8 sm:py-12 text-xs sm:text-sm text-slate-500">
                            <p>No quotation submissions yet.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                                    <thead className="bg-slate-50 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-slate-500">
                                        <tr>
                                            <th className="px-3 py-2 text-left sm:px-4 sm:py-3">Reference</th>
                                            <th className="px-3 py-2 text-left sm:px-4 sm:py-3">Customer</th>
                                            <th className="px-3 py-2 text-left sm:px-4 sm:py-3">Status</th>
                                            <th className="px-3 py-2 text-left sm:px-4 sm:py-3 hidden md:table-cell">Total Qty</th>
                                            <th className="px-3 py-2 text-left sm:px-4 sm:py-3 hidden lg:table-cell">Date</th>
                                            <th className="px-3 py-2 text-left sm:px-4 sm:py-3 hidden md:table-cell">Order ref</th>
                                            <th className="px-3 py-2 text-right sm:px-4 sm:py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {quotationsData.map((quotation) => (
                                            <tr key={quotation.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 sm:px-4 sm:py-3">
                                                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">#{quotation.id}</div>
                                                    <div className="text-[10px] sm:text-xs font-medium text-slate-600">
                                                        {quotation.products && quotation.products.length > 1
                                                            ? `${quotation.products.length} products`
                                                            : quotation.product.name}
                                                    </div>
                                                    {quotation.products && quotation.products.length > 1 && (
                                                        <div className="mt-1 text-[10px] sm:text-xs text-slate-400">
                                                            {quotation.products.map((p) => p.name).join(', ')}
                                                        </div>
                                                    )}
                                                    <div className="mt-1 md:hidden space-y-0.5">
                                                        <div>
                                                            <span className="text-[10px] text-slate-500">Qty: </span>
                                                            <span className="text-[10px] font-semibold text-slate-900">{quotation.quantity}</span>
                                                            {quotation.created_at && (
                                                                <>
                                                                    <span className="text-[10px] text-slate-500 ml-2">· </span>
                                                                    <span className="text-[10px] text-slate-500">
                                                                        {new Date(quotation.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {quotation.order_reference && (
                                                            <div>
                                                                <span className="text-[10px] text-slate-500">Order: </span>
                                                                <span className="text-[10px] font-medium text-slate-700">{quotation.order_reference}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">
                                                    <div className="font-medium text-slate-900">{quotation.user?.name ?? '—'}</div>
                                                    <div className="text-[10px] sm:text-xs text-slate-400">{quotation.user?.email}</div>
                                                </td>
                                                <td className="px-3 py-2 sm:px-4 sm:py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold ${
                                                            statusBadge[quotation.status] ?? 'bg-slate-200 text-slate-700'
                                                        }`}
                                                    >
                                                        {quotation.status.replace(/_/g, ' ')}
                                                    </span>
                                                    {quotation.approved_at && (
                                                        <div className="mt-1 text-[10px] sm:text-xs text-slate-400">
                                                            Approved {new Date(quotation.approved_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 sm:px-4 sm:py-3 hidden md:table-cell">
                                                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">{quotation.quantity}</div>
                                                </td>
                                                <td className="px-3 py-2 sm:px-4 sm:py-3 text-[10px] sm:text-xs text-slate-600 hidden lg:table-cell">
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
                                                <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600 hidden md:table-cell">{quotation.order_reference ?? '—'}</td>
                                                <td className="px-3 py-2 sm:px-4 sm:py-3 text-right">
                                                    <Link
                                                        href={`/admin/quotations/${quotation.id}`}
                                                        className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 sm:px-3 sm:py-1.5 sm:text-xs md:px-4 md:py-2"
                                                    >
                                                        Manage
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Pagination 
                                meta={pagination} 
                                onPageChange={setCurrentPage} 
                            />
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
