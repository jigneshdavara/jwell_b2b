'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { route } from '@/utils/route';
import { frontendService } from '@/services/frontendService';
import Pagination from '@/components/ui/Pagination';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';
import { Head } from '@/components/Head';
import Modal from '@/components/ui/Modal';

type OrderListItem = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    total_amount: number;
    created_at?: string | null;
    items: Array<{
        id: number;
        name: string;
        quantity: number;
    }>;
};

type OrderShowItem = {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    configuration?: Record<string, unknown> | null;
    price_breakdown?: {
        metal?: number;
        diamond?: number;
        making?: number;
        subtotal?: number;
        discount?: number;
        total?: number;
    } | null;
    product?: {
        id: number;
        name: string;
        sku: string;
        media: Array<{ url: string; alt: string }>;
    } | null;
};

type OrderPayment = {
    id: number;
    status: string;
    amount: number;
    created_at?: string | null;
};

type OrderDetails = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    total_amount: number;
    subtotal_amount: number;
    tax_amount: number;
    discount_amount: number;
    created_at?: string | null;
    updated_at?: string | null;
    items: OrderShowItem[];
    payments: OrderPayment[];
    status_history: Array<{
        id: number;
        status: string;
        created_at?: string | null;
    }>;
    quotations?: Array<{
        id: number;
        status: string;
        quantity: number;
        product?: {
            id: number;
            name: string;
            sku: string;
            media: Array<{ url: string; alt: string }>;
        } | null;
    }>;
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const currencyFormatterDetailed = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
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

export default function OrdersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<OrderListItem[]>([]);
    const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [orderDetailsModal, setOrderDetailsModal] = useState<OrderDetails | null>(null);
    const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
    const [productDetailsModalOpen, setProductDetailsModalOpen] = useState<OrderShowItem | null>(null);

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

    const getMediaUrl = (url: string): string => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${baseUrl}${cleanUrl}`.replace(/(?<!:)\/{2,}/g, '/');
    };

    const openOrderDetailsModal = async (orderId: number) => {
        try {
            setOrderDetailsLoading(true);
            const response = await frontendService.getOrder(orderId);
            const data = response.data?.order || response.data;
            
            // Map the data to match our type
            const mappedOrder: OrderDetails = {
                id: Number(data.id),
                reference: data.reference || '',
                status: data.status || 'pending',
                status_label: data.status_label || data.status || 'Pending',
                total_amount: Number(data.total_amount) || 0,
                subtotal_amount: Number(data.subtotal_amount) || 0,
                tax_amount: Number(data.tax_amount) || 0,
                discount_amount: Number(data.discount_amount) || 0,
                created_at: data.created_at || null,
                updated_at: data.updated_at || null,
                items: (data.items || []).map((item: any) => ({
                    id: Number(item.id),
                    name: item.name || '',
                    sku: item.sku || '',
                    quantity: Number(item.quantity) || 0,
                    unit_price: Number(item.unit_price) || 0,
                    total_price: Number(item.total_price) || 0,
                    configuration: item.configuration || null,
                    price_breakdown: item.price_breakdown || null,
                    product: item.product ? {
                        id: Number(item.product.id),
                        name: item.product.name || '',
                        sku: item.product.sku || '',
                        media: (item.product.media || []).map((m: any) => ({
                            url: getMediaUrl(m.url),
                            alt: m.alt || item.product.name,
                        })),
                    } : null,
                })),
                payments: (data.payments || []).map((p: any) => ({
                    id: Number(p.id),
                    status: p.status || 'pending',
                    amount: Number(p.amount) || 0,
                    created_at: p.created_at || null,
                })),
                status_history: (data.status_history || []).map((h: any) => ({
                    id: Number(h.id),
                    status: h.status || '',
                    created_at: h.created_at || null,
                })),
                quotations: data.quotations ? (data.quotations || []).map((q: any) => ({
                    id: Number(q.id),
                    status: q.status || '',
                    quantity: Number(q.quantity) || 0,
                    product: q.product ? {
                        id: Number(q.product.id),
                        name: q.product.name || '',
                        sku: q.product.sku || '',
                        media: (q.product.media || []).map((m: any) => ({
                            url: getMediaUrl(m.url),
                            alt: m.alt || q.product.name,
                        })),
                    } : null,
                })) : undefined,
            };
            
            setOrderDetailsModal(mappedOrder);
        } catch (error: any) {
            console.error('Failed to fetch order details:', error);
            alert(error.response?.data?.message || 'Failed to load order details');
        } finally {
            setOrderDetailsLoading(false);
        }
    };

    if (loading && !orders) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-10">
                <Head title="My Orders" />
            <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-900">My orders</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Track production, payments, and fulfilment for your confirmed jewellery purchases and jobwork conversions.
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
                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-16 text-sm text-slate-500">
                            <p>No confirmed orders yet. Submit a quotation and approve it to generate an order.</p>
                            <Link
                                href={route('frontend.catalog.index')}
                                className="rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
                            >
                                Browse catalogue
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Order Reference</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Items</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Total</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-semibold text-slate-900">{order.reference}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] ?? 'bg-slate-200 text-slate-700'}`}>
                                                    {order.status_label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm text-slate-900">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {order.items.slice(0, 2).map((item) => (
                                                            <span key={item.id} className="text-xs text-slate-500">
                                                                {item.name} × {item.quantity}
                                                            </span>
                                                        ))}
                                                        {order.items.length > 2 && (
                                                            <span className="text-xs text-slate-400">+{order.items.length - 2} more</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="text-sm text-slate-600">{formatDate(order.created_at)}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <p className="text-sm font-semibold text-slate-900">{currencyFormatter.format(order.total_amount)}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openOrderDetailsModal(order.id)}
                                                        disabled={orderDetailsLoading}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-elvee-blue hover:bg-elvee-blue/5 hover:text-elvee-blue disabled:cursor-not-allowed disabled:opacity-50"
                                                        title="View details"
                                                    >
                                                        {orderDetailsLoading ? (
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-elvee-blue" />
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
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
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Pagination
                            meta={paginationMeta}
                            onPageChange={(page) => {
                                router.push(`?page=${page}`);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {orderDetailsModal && (
                <Modal show={true} onClose={() => setOrderDetailsModal(null)} maxWidth="6xl">
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-900">Order {orderDetailsModal.reference}</h3>
                                <button
                                    type="button"
                                    onClick={() => setOrderDetailsModal(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                            <div className="space-y-6">
                                {/* Invoice Header */}
                                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                                    <div className="grid gap-8 md:grid-cols-3">
                                        {/* Company Details */}
                                        <div>
                                            <h3 className="text-xs font-semibold text-slate-400">From</h3>
                                            <p className="mt-3 text-lg font-semibold text-slate-900">Elvee</p>
                                            <p className="mt-1 text-sm text-slate-600">123 Business Street</p>
                                            <p className="text-sm text-slate-600">Mumbai, Maharashtra 400001</p>
                                            <p className="mt-2 text-sm text-slate-600">Phone: +91 98765 43210</p>
                                            <p className="text-sm text-slate-600">Email: info@elvee.com</p>
                                            <p className="mt-2 text-sm text-slate-600">GSTIN: 27AAAAA0000A1Z5</p>
                                        </div>
                                        {/* Bill To */}
                                        <div>
                                            <h3 className="text-xs font-semibold text-slate-400">Bill To</h3>
                                            <p className="mt-3 text-lg font-semibold text-slate-900">Your Account</p>
                                        </div>
                                        {/* Order Details */}
                                        <div className="text-right">
                                            <h3 className="text-xs font-semibold text-slate-400">Order Details</h3>
                                            <p className="mt-3 text-lg font-semibold text-slate-900">{orderDetailsModal.reference}</p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Date: <span className="font-semibold text-slate-900">{formatDateTime(orderDetailsModal.created_at)}</span>
                                            </p>
                                            <div className="mt-3 flex justify-end gap-2">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColors[orderDetailsModal.status] ?? 'bg-slate-200 text-slate-700'}`}>
                                                    {orderDetailsModal.status_label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Products Table */}
                                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Items</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="border-b-2 border-slate-200 bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Item</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Unit Price</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Qty</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Total</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {orderDetailsModal.items.map((item) => (
                                                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-3">
                                                                {item.product?.media?.[0] && (
                                                                    <img
                                                                        src={item.product.media[0].url}
                                                                        alt={item.product.media[0].alt}
                                                                        className="h-12 w-12 rounded-lg object-cover shadow-sm"
                                                                    />
                                                                )}
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                                                    <p className="text-xs text-slate-400">SKU {item.sku}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="text-sm font-semibold text-slate-900">{currencyFormatterDetailed.format(item.unit_price)}</div>
                                                        </td>
                                                        <td className="px-4 py-4 text-center">
                                                            <span className="font-semibold text-slate-900">{item.quantity}</span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <div className="text-sm font-semibold text-slate-900">{currencyFormatterDetailed.format(item.total_price)}</div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center justify-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setProductDetailsModalOpen(item)}
                                                                    className="inline-flex items-center gap-1 rounded-full border border-elvee-blue/30 px-2.5 py-1.5 text-[10px] font-semibold text-elvee-blue transition hover:border-elvee-blue hover:bg-elvee-blue/5"
                                                                    title="View product details"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                                                <tr>
                                                    <td colSpan={2} className="px-4 py-2 text-right text-sm text-slate-600">
                                                        Subtotal
                                                    </td>
                                                    <td className="px-4 py-2"></td>
                                                    <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                                                        {currencyFormatterDetailed.format(orderDetailsModal.subtotal_amount)}
                                                    </td>
                                                    <td className="px-4 py-2"></td>
                                                </tr>
                                                {orderDetailsModal.discount_amount > 0 && (
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-2 text-right text-sm text-slate-600">
                                                            Discount
                                                        </td>
                                                        <td className="px-4 py-2"></td>
                                                        <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                                                            -{currencyFormatterDetailed.format(orderDetailsModal.discount_amount)}
                                                        </td>
                                                        <td className="px-4 py-2"></td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td colSpan={2} className="px-4 py-2 text-right text-sm text-slate-600">
                                                        Tax (GST)
                                                    </td>
                                                    <td className="px-4 py-2"></td>
                                                    <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                                                        {currencyFormatterDetailed.format(orderDetailsModal.tax_amount)}
                                                    </td>
                                                    <td className="px-4 py-2"></td>
                                                </tr>
                                                <tr className="border-t-2 border-slate-300">
                                                    <td colSpan={2} className="px-4 py-3 text-right text-base font-bold text-slate-900">
                                                        Grand Total
                                                    </td>
                                                    <td className="px-4 py-3"></td>
                                                    <td className="px-4 py-3 text-right text-lg font-bold text-slate-900">
                                                        {currencyFormatterDetailed.format(orderDetailsModal.total_amount)}
                                                    </td>
                                                    <td className="px-4 py-3"></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-2">
                                    <div className="space-y-6">
                                        {/* Payments */}
                                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                                            <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
                                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                                {orderDetailsModal.payments.length === 0 && (
                                                    <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                                                        No payments recorded yet.
                                                    </p>
                                                )}
                                                {orderDetailsModal.payments.map((payment) => (
                                                    <div
                                                        key={payment.id}
                                                        className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{payment.status}</p>
                                                            <p className="text-xs text-slate-400">{formatDateTime(payment.created_at)}</p>
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-900">{currencyFormatterDetailed.format(payment.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {(orderDetailsModal.status === 'pending_payment' || orderDetailsModal.status === 'payment_failed') && (
                                                <div className="mt-4 flex justify-end">
                                                    <Link
                                                        href={route('frontend.orders.pay', orderDetailsModal.id)}
                                                        className="rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
                                                    >
                                                        Proceed to payment
                                                    </Link>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status History */}
                                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                                            <h2 className="text-lg font-semibold text-slate-900">Status History</h2>
                                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                                {orderDetailsModal.status_history.map((entry) => (
                                                    <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                                                        <span className="font-semibold text-slate-800">{entry.status.replace(/_/g, ' ')}</span>
                                                        <span className="text-xs text-slate-400">{formatDateTime(entry.created_at)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Order Timeline */}
                                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                                            <h2 className="text-lg font-semibold text-slate-900">Order Timeline</h2>
                                            <div className="mt-4 space-y-3">
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-400">Created</p>
                                                            <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(orderDetailsModal.created_at)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {orderDetailsModal.updated_at && orderDetailsModal.updated_at !== orderDetailsModal.created_at && (
                                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-xs font-semibold text-slate-400">Last Updated</p>
                                                                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(orderDetailsModal.updated_at)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Linked Quotations */}
                                        {orderDetailsModal.quotations && orderDetailsModal.quotations.length > 0 && (
                                            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                                                <h2 className="text-lg font-semibold text-slate-900">Source Quotations</h2>
                                                <p className="mt-1 text-xs text-slate-500">This order was created from the following quotations</p>
                                                <div className="mt-4 space-y-3">
                                                    {orderDetailsModal.quotations.map((quotation) => (
                                                        <Link
                                                            key={quotation.id}
                                                            href={route('frontend.quotations.show', quotation.id)}
                                                            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-elvee-blue/50 hover:bg-elvee-blue/5"
                                                        >
                                                            {quotation.product?.media?.[0] && (
                                                                <img
                                                                    src={quotation.product.media[0].url}
                                                                    alt={quotation.product.media[0].alt}
                                                                    className="h-10 w-10 rounded-lg object-cover"
                                                                />
                                                            )}
                                                            <div className="flex-1">
                                                                <p className="text-sm font-semibold text-slate-900">Quotation #{quotation.id}</p>
                                                                <p className="text-xs text-slate-500">{quotation.product?.name ?? 'Product'}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs text-slate-500">Qty: {quotation.quantity}</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Product Details Modal */}
            {productDetailsModalOpen && (
                <Modal show={true} onClose={() => setProductDetailsModalOpen(null)} maxWidth="4xl">
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-900">Product Details</h3>
                                <button
                                    type="button"
                                    onClick={() => setProductDetailsModalOpen(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                            <div className="space-y-6">
                                {/* Product Image and Basic Info */}
                                <div className="flex gap-6">
                                    {productDetailsModalOpen.product?.media?.[0] && (
                                        <img
                                            src={productDetailsModalOpen.product.media[0].url}
                                            alt={productDetailsModalOpen.product.media[0].alt}
                                            className="h-32 w-32 rounded-lg object-cover shadow-lg"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h4 className="text-xl font-semibold text-slate-900">{productDetailsModalOpen.name}</h4>
                                        <p className="mt-1 text-sm text-slate-500">SKU: {productDetailsModalOpen.sku}</p>
                                        <div className="mt-3 flex gap-2">
                                            <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                                                Qty: {productDetailsModalOpen.quantity}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <h5 className="mb-3 text-sm font-semibold text-slate-700">Pricing</h5>
                                    <div className="space-y-2 text-sm">
                                        {(() => {
                                            const priceBreakdown = productDetailsModalOpen.price_breakdown;
                                            const metalCost = priceBreakdown?.metal ?? 0;
                                            const diamondCost = priceBreakdown?.diamond ?? 0;
                                            const makingCharge = priceBreakdown?.making ?? 0;
                                            const discount = priceBreakdown?.discount ?? 0;

                                            return (
                                                <>
                                                    {metalCost > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600">Metal:</span>
                                                            <span className="font-semibold text-slate-900">{currencyFormatterDetailed.format(metalCost)}</span>
                                                        </div>
                                                    )}
                                                    {diamondCost > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600">Diamond:</span>
                                                            <span className="font-semibold text-slate-900">{currencyFormatterDetailed.format(diamondCost)}</span>
                                                        </div>
                                                    )}
                                                    {makingCharge > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600">Making Charge:</span>
                                                            <span className="font-semibold text-slate-900">{currencyFormatterDetailed.format(makingCharge)}</span>
                                                        </div>
                                                    )}
                                                    {discount > 0 && (
                                                        <div className="flex justify-between text-rose-600">
                                                            <span>Discount:</span>
                                                            <span className="font-semibold">-{currencyFormatterDetailed.format(discount)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                        <div className="border-t border-slate-300 pt-2">
                                            <div className="flex justify-between">
                                                <span className="font-semibold text-slate-900">Unit Price:</span>
                                                <span className="font-semibold text-slate-900">{currencyFormatterDetailed.format(productDetailsModalOpen.unit_price)}</span>
                                            </div>
                                            <div className="flex justify-between mt-2">
                                                <span className="font-semibold text-slate-900">Total Price:</span>
                                                <span className="font-semibold text-slate-900">{currencyFormatterDetailed.format(productDetailsModalOpen.total_price)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Configuration */}
                                {productDetailsModalOpen.configuration && Object.keys(productDetailsModalOpen.configuration).length > 0 && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <h5 className="mb-3 text-sm font-semibold text-slate-700">Configuration</h5>
                                        <div className="space-y-2 text-sm">
                                            {Object.entries(productDetailsModalOpen.configuration).map(([key, value]) => (
                                                <div key={key} className="flex justify-between">
                                                    <span className="text-slate-600">{key.replace(/_/g, ' ')}:</span>
                                                    <span className="font-semibold text-slate-900">
                                                        {value === null || value === undefined || value === '' ? '—' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}
