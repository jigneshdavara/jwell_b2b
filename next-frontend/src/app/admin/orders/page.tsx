'use client';

import { Head } from '@/components/Head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';

type OrderRow = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    total_amount: number;
    created_at?: string | null;
    user?: {
        name: string;
        email: string;
    } | null;
    items_count: number;
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

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    pending_payment: 'bg-amber-100 text-amber-700',
    payment_failed: 'bg-rose-100 text-rose-700',
    awaiting_materials: 'bg-indigo-100 text-indigo-700',
    under_production: 'bg-indigo-100 text-indigo-700',
    approved: 'bg-emerald-100 text-emerald-700',
    in_production: 'bg-indigo-100 text-indigo-700',
    quality_check: 'bg-blue-100 text-blue-700',
    ready_to_dispatch: 'bg-purple-100 text-purple-700',
    dispatched: 'bg-elvee-blue/10 text-elvee-blue',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
    paid: 'bg-emerald-100 text-emerald-700',
};

export default function AdminOrdersIndex() {
    const [loading, setLoading] = useState(true);
    const [ordersData, setOrdersData] = useState<OrderRow[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(20);

    useEffect(() => {
        loadOrders();
    }, [currentPage]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await adminService.getOrders({
                page: currentPage,
                per_page: perPage,
            });
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setOrdersData(items.map((item: any) => ({
                id: Number(item.id),
                reference: item.reference || `ORD-${item.id}`,
                status: item.status,
                status_label: item.status_label || item.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                total_amount: Number(item.total_amount || 0),
                created_at: item.created_at,
                user: item.user ? { name: item.user.name, email: item.user.email } : null,
                items_count: item.items_count || item.items?.length || 0,
            })));
            setMeta({
                current_page: responseMeta.current_page || responseMeta.page || 1,
                last_page: responseMeta.last_page || responseMeta.total_pages || responseMeta.lastPage || 1,
                total: responseMeta.total || 0,
                per_page: responseMeta.per_page || responseMeta.perPage || perPage,
            });
        } catch (error: any) {
            console.error('Failed to load orders:', error);
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
            <Head title="Orders" />

            <div className="space-y-10">
                <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-900">Orders</h1>
                            <p className="mt-2 text-sm text-slate-500">Track commercial orders, statuses, and fulfilment readiness.</p>
                        </div>
                    </div>
                </header>

                <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                        </div>
                    ) : ordersData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-16 text-sm text-slate-500">
                            <p>No orders captured yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Order Reference</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Items</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Total</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {ordersData.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-4">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="text-sm font-semibold text-elvee-blue hover:text-feather-gold transition"
                                                >
                                                    {order.reference}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{order.user?.name ?? '—'}</p>
                                                    {order.user?.email && (
                                                        <p className="text-xs text-slate-500">{order.user.email}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] ?? 'bg-slate-200 text-slate-700'}`}>
                                                    {order.status_label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-slate-600">{order.items_count} item{order.items_count !== 1 ? 's' : ''}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-slate-600">{formatDate(order.created_at)}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <p className="text-sm font-semibold text-slate-900">{currencyFormatter.format(order.total_amount)}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-elvee-blue hover:bg-elvee-blue/5 hover:text-elvee-blue"
                                                        title="View details"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                {meta.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                        {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`rounded-full px-4 py-2 transition ${
                                    page === meta.current_page
                                        ? 'bg-elvee-blue text-white shadow-lg shadow-elvee-blue/30'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
