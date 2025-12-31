'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { route } from '@/utils/route';
import { frontendService } from '@/services/frontendService';
import Pagination from '@/components/ui/Pagination';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';
import { Head } from '@/components/Head';
import type { OrderListItem } from '@/types';
import { formatCurrency } from '@/utils/formatting';

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

export default function OrdersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<OrderListItem[]>([]);
    const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);

    // Get current page from URL
    const currentPage = useMemo(() => {
        const page = searchParams.get('page');
        return page ? parseInt(page, 10) : 1;
    }, [searchParams]);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const response = await frontendService.getOrders(currentPage, 15);
                const ordersData = response.data?.orders || { data: [], meta: {} };
                
                // Map backend response to frontend format (matching Laravel structure)
                const mappedOrders: OrderListItem[] = (ordersData.data || []).map((order: any) => ({
                    id: typeof order.id === 'string' ? Number(order.id) : Number(order.id),
                    reference: order.reference || '',
                    status: order.status || 'pending',
                    status_label: order.status_label || order.status || 'Pending',
                    total_amount: Number(order.total_amount) || 0,
                    created_at: order.created_at || null,
                    items: (order.items || []).map((item: any) => ({
                        id: typeof item.id === 'string' ? Number(item.id) : Number(item.id),
                        name: item.name || '',
                        quantity: Number(item.quantity) || 0,
                    })),
                }));
                
                setOrders(mappedOrders);
                
                // Generate pagination meta
                if (ordersData.meta) {
                    const meta = ordersData.meta;
                    const links = generatePaginationLinks(
                        meta.current_page || currentPage,
                        meta.last_page || 1
                    );
                    
                    setPaginationMeta({
                        current_page: meta.current_page || currentPage,
                        last_page: meta.last_page || 1,
                        per_page: meta.per_page || 15,
                        total: meta.total || 0,
                        from: meta.from || 0,
                        to: meta.to || 0,
                        links,
                    });
                }
            } catch (error: any) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [currentPage]);

    const formatDate = (input?: string | null) =>
        input
            ? new Date(input).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
              })
            : 'N/A';

    const formatDateTime = (input?: string | null) =>
        input
            ? new Date(input).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
              })
            : 'N/A';


    if (loading && !orders) {
        return (
            <div className="flex items-center justify-center py-12 sm:py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent sm:h-12 sm:w-12" />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                <Head title="My Orders" />
            <header className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl lg:text-3xl">My orders</h1>
                            <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                                Track production, payments, and fulfilment for your confirmed jewellery purchases and jobwork conversions.
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
                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-3 py-12 text-xs text-slate-500 sm:space-y-4 sm:py-16 sm:text-sm">
                            <p className="text-center">No confirmed orders yet. Submit a quotation and approve it to generate an order.</p>
                            <Link
                                href={route('frontend.catalog.index')}
                                className="rounded-full bg-elvee-blue px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy sm:px-4 sm:py-2 sm:text-sm"
                            >
                                Browse catalogue
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Order Reference</th>
                                        <th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Status</th>
                                        <th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Items</th>
                                        <th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Date</th>
                                        <th className="px-2 py-2 text-right text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Total</th>
                                        <th className="px-2 py-2 text-right text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50">
                                            <td className="px-2 py-2.5 sm:px-4 sm:py-4">
                                                <p className="text-xs font-semibold text-slate-900 sm:text-sm">{order.reference}</p>
                                            </td>
                                            <td className="px-2 py-2.5 sm:px-4 sm:py-4">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${statusColors[order.status] ?? 'bg-slate-200 text-slate-700'}`}>
                                                    {order.status_label}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2.5 sm:px-4 sm:py-4">
                                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                                    <span className="text-xs text-slate-900 sm:text-sm">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                                                    <div className="flex flex-wrap gap-0.5 sm:gap-1">
                                                        {order.items.slice(0, 2).map((item) => (
                                                            <span key={item.id} className="text-[10px] text-slate-500 sm:text-xs">
                                                                {item.name} × {item.quantity}
                                                            </span>
                                                        ))}
                                                        {order.items.length > 2 && (
                                                            <span className="text-[10px] text-slate-400 sm:text-xs">+{order.items.length - 2} more</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2.5 sm:px-4 sm:py-4">
                                                <span className="text-xs text-slate-600 sm:text-sm">{formatDate(order.created_at)}</span>
                                            </td>
                                            <td className="px-2 py-2.5 text-right sm:px-4 sm:py-4">
                                                <p className="text-xs font-semibold text-slate-900 sm:text-sm">{formatCurrency(order.total_amount)}</p>
                                            </td>
                                            <td className="px-2 py-2.5 sm:px-4 sm:py-4">
                                                <div className="flex items-center justify-end gap-1 sm:gap-2">
                                                    <Link
                                                        href={route('frontend.orders.show', { order: order.id })}
                                                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-elvee-blue hover:bg-elvee-blue/5 hover:text-elvee-blue sm:h-8 sm:w-8"
                                                        title="View details"
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
