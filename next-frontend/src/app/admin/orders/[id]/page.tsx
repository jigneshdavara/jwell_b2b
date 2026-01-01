'use client';

import Modal from '@/components/ui/Modal';
import { Head } from '@/components/Head';
import Link from 'next/link';
import { useMemo, useState, use, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { useRouter } from 'next/navigation';
import { toastError, toastSuccess } from '@/utils/toast';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';

type OrderItem = {
    id: number;
    sku: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    configuration?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    price_breakdown?: {
        metal?: number;
        diamond?: number;
        making?: number;
        subtotal?: number;
        discount?: number;
        total?: number;
    } | null;
    calculated_making_charge?: number | null;
    product?: {
        id: number;
        name: string;
        sku: string;
        base_price?: number | null;
        making_charge_amount?: number | null;
        making_charge_percentage?: number | null;
        making_charge_types?: string[];
        media: Array<{ url: string; alt: string }>;
    } | null;
};

type Order = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    subtotal_amount: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    price_breakdown?: Record<string, unknown>;
    created_at?: string | null;
    updated_at?: string | null;
    items: OrderItem[];
    user?: {
        name: string;
        email: string;
    };
    payments: Array<{
        id: number;
        status: string;
        amount: number;
        created_at?: string | null;
    }>;
    status_history: Array<{
        id: number;
        status: string;
        created_at?: string | null;
        meta?: Record<string, unknown>;
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

type StatusOption = {
    value: string;
    label: string;
};


const currencyFormatter = new Intl.NumberFormat('en-IN', {
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

const getMediaUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function AdminOrdersShow({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<Order | null>(null);
    const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
    const [productDetailsModalOpen, setProductDetailsModalOpen] = useState<OrderItem | null>(null);

    const [statusData, setStatusData] = useState({
        status: '',
        meta: {
            comment: '',
        },
    });
    const [processing, setProcessing] = useState(false);
    const [invoiceExists, setInvoiceExists] = useState<{ id: string; invoice_number: string; status: string } | null>(null);
    const [generatingInvoice, setGeneratingInvoice] = useState(false);

    useEffect(() => {
        loadOrder();
        checkInvoiceExists();
    }, [resolvedParams.id]);

    const checkInvoiceExists = async () => {
        if (!resolvedParams.id || isNaN(Number(resolvedParams.id))) {
            return;
        }
        try {
            const response = await adminService.getInvoiceByOrderId(Number(resolvedParams.id));
            // Backend returns invoice object if exists, or { exists: false } if not
            if (response.data && response.data.id && !response.data.exists) {
                setInvoiceExists({
                    id: response.data.id,
                    invoice_number: response.data.invoice_number,
                    status: response.data.status,
                });
            } else {
                setInvoiceExists(null);
            }
        } catch (error) {
            // Invoice doesn't exist or error - set to null
            setInvoiceExists(null);
        }
    };

    const handleGenerateInvoice = async () => {
        if (!order) return;
        setGeneratingInvoice(true);
        try {
            await adminService.createInvoice({ order_id: order.id });
            toastSuccess('Invoice generated successfully');
            await checkInvoiceExists();
            // Redirect to invoice page
            const invoiceResponse = await adminService.getInvoiceByOrderId(order.id);
            if (invoiceResponse.data && invoiceResponse.data.id) {
                window.location.href = `/admin/invoices/${invoiceResponse.data.id}`;
            }
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to generate invoice');
        } finally {
            setGeneratingInvoice(false);
        }
    };

    const loadOrder = async () => {
        try {
            setLoading(true);
            const response = await adminService.getOrder(Number(resolvedParams.id));
            const orderData = response.data;

            const formattedOrder: Order = {
                id: Number(orderData.id),
                reference: orderData.reference,
                status: orderData.status,
                status_label: orderData.status_label,
                subtotal_amount: Number(orderData.subtotal_amount || 0),
                tax_amount: Number(orderData.tax_amount || 0),
                discount_amount: Number(orderData.discount_amount || 0),
                total_amount: Number(orderData.total_amount || 0),
                price_breakdown: orderData.price_breakdown,
                created_at: orderData.created_at,
                updated_at: orderData.updated_at,
                items: (orderData.items || []).map((item: any) => ({
                    id: Number(item.id),
                    sku: item.sku,
                    name: item.name,
                    quantity: item.quantity,
                    unit_price: Number(item.unit_price || 0),
                    total_price: Number(item.total_price || 0),
                    configuration: item.configuration,
                    metadata: item.metadata,
                    price_breakdown: item.price_breakdown,
                    calculated_making_charge: item.calculated_making_charge ? Number(item.calculated_making_charge) : null,
                    product: item.product ? {
                        id: Number(item.product.id),
                        name: item.product.name,
                        sku: item.product.sku,
                        base_price: item.product.base_price ? Number(item.product.base_price) : null,
                        making_charge_amount: item.product.making_charge_amount ? Number(item.product.making_charge_amount) : null,
                        making_charge_percentage: item.product.making_charge_percentage ? Number(item.product.making_charge_percentage) : null,
                        making_charge_types: item.product.making_charge_types || [],
                        media: item.product.media || [],
                    } : null,
                })),
                user: orderData.user || null,
                payments: (orderData.payments || []).map((payment: any) => ({
                    id: Number(payment.id),
                    status: payment.status,
                    amount: Number(payment.amount || 0),
                    created_at: payment.created_at,
                })),
                status_history: (orderData.status_history || []).map((entry: any) => ({
                    id: Number(entry.id),
                    status: entry.status,
                    created_at: entry.created_at,
                    meta: entry.meta,
                })),
                quotations: (orderData.quotations || []).map((quotation: any) => ({
                    id: Number(quotation.id),
                    status: quotation.status,
                    quantity: quotation.quantity,
                    product: quotation.product ? {
                        id: Number(quotation.product.id),
                        name: quotation.product.name,
                        sku: quotation.product.sku,
                        media: quotation.product.media || [],
                    } : null,
                })),
            };

            setOrder(formattedOrder);
            setStatusData({
                status: formattedOrder.status,
                meta: { comment: '' },
            });
            setStatusOptions(orderData.statusOptions || []);
        } catch (error: any) {
            console.error('Failed to load order:', error);
            if (error.response?.status === 404) {
                router.push('/admin/orders');
            }
        } finally {
            setLoading(false);
        }
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!order) return;

        setProcessing(true);
        try {
            await adminService.updateOrderStatus(order.id, statusData.status, statusData.meta);
            await loadOrder();
        } catch (error: any) {
            console.error('Failed to update order status:', error);
            toastError(error.response?.data?.message || 'Failed to update order status');
        } finally {
            setProcessing(false);
        }
    };

    const paymentStatusLabel = useMemo(() => {
        if (!order || order.payments.length === 0) {
            return 'No payments recorded';
        }

        const latest = order.payments[0];
        return `${latest.status ?? 'Pending'} · ${currencyFormatter.format(latest.amount)}`;
    }, [order]);

    if (loading) {
        return (
            <>
                <Head title="Loading Order..." />
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-xs sm:text-sm text-slate-500">Loading order details...</p>
                </div>
            </>
        );
    }

    if (!order) {
        return (
            <>
                <Head title="Order Not Found" />
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-xs sm:text-sm text-slate-500">Order not found</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Order ${order.reference}`} />

            <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
                <header className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900">Order {order.reference}</h1>
                            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500">
                                {order.user?.name ?? 'Guest'} · {order.user?.email ?? '—'}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            {invoiceExists ? (
                                <Link
                                    href={`/admin/invoices/${invoiceExists.id}`}
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-elvee-blue px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-navy"
                                >
                                    View Invoice {invoiceExists.invoice_number}
                                </Link>
                            ) : (
                                <PrimaryButton
                                    onClick={handleGenerateInvoice}
                                    disabled={generatingInvoice}
                                    className="text-xs sm:text-sm"
                                >
                                    {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
                                </PrimaryButton>
                            )}
                        <Link
                            href="/admin/orders"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                        >
                            Back to list
                        </Link>
                        </div>
                    </div>
                </header>

                <div className="space-y-4 sm:space-y-6">
                    {/* Invoice Header */}
                    <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
                        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Company Details */}
                            <div>
                                <h3 className="text-[10px] sm:text-xs font-semibold text-slate-400">From</h3>
                                <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg font-semibold text-slate-900">Elvee</p>
                                <p className="mt-1 text-xs sm:text-sm text-slate-600">123 Business Street</p>
                                <p className="text-xs sm:text-sm text-slate-600">Mumbai, Maharashtra 400001</p>
                                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">Phone: +91 98765 43210</p>
                                <p className="text-xs sm:text-sm text-slate-600">Email: info@elvee.com</p>
                                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">GSTIN: 27AAAAA0000A1Z5</p>
                            </div>
                            {/* Bill To */}
                            <div>
                                <h3 className="text-[10px] sm:text-xs font-semibold text-slate-400">Bill To</h3>
                                <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg font-semibold text-slate-900">{order.user?.name ?? 'Unknown'}</p>
                                <p className="mt-1 text-xs sm:text-sm text-slate-600">{order.user?.email ?? '—'}</p>
                            </div>
                            {/* Order Details */}
                            <div className="text-left sm:text-right">
                                <h3 className="text-[10px] sm:text-xs font-semibold text-slate-400">Order Details</h3>
                                <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg font-semibold text-slate-900">{order.reference}</p>
                                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                    Date: <span className="font-semibold text-slate-900">{formatDate(order.created_at)}</span>
                                </p>
                                <div className="mt-2 sm:mt-3 flex sm:justify-end gap-2">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold ${statusColors[order.status] ?? 'bg-slate-200 text-slate-700'}`}>
                                        {order.status_label}
                                    </span>
                                </div>
                                <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-slate-400">Payment: {paymentStatusLabel}</p>
                            </div>
                        </div>
                    </div>

                    {/* Products Table - Invoice Style */}
                    <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
                        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-slate-900">Items</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm">
                                <thead className="border-b-2 border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-slate-600">Item</th>
                                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-slate-600">Unit Price</th>
                                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-slate-600">Qty</th>
                                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-slate-600">Total</th>
                                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {order.items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-3 py-3 sm:px-4 sm:py-4">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    {item.product?.media?.[0] && getMediaUrl(item.product.media[0].url) && (
                                                        <img
                                                            src={getMediaUrl(item.product.media[0].url)!}
                                                            alt={item.product.media[0].alt || item.name}
                                                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover shadow-sm"
                                                        />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs sm:text-sm font-semibold text-slate-900">{item.name}</p>
                                                        <p className="text-[10px] sm:text-xs text-slate-400">SKU {item.sku}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 sm:px-4 sm:py-4 text-right">
                                                <div className="text-xs sm:text-sm font-semibold text-slate-900">{currencyFormatter.format(item.unit_price)}</div>
                                            </td>
                                            <td className="px-3 py-3 sm:px-4 sm:py-4 text-center">
                                                <span className="font-semibold text-slate-900 text-xs sm:text-sm">{item.quantity}</span>
                                            </td>
                                            <td className="px-3 py-3 sm:px-4 sm:py-4 text-right">
                                                <div className="text-xs sm:text-sm font-semibold text-slate-900">{currencyFormatter.format(item.total_price)}</div>
                                            </td>
                                            <td className="px-3 py-3 sm:px-4 sm:py-4">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setProductDetailsModalOpen(item)}
                                                        className="inline-flex items-center gap-1 rounded-full border border-elvee-blue/30 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] font-semibold text-elvee-blue transition hover:border-elvee-blue hover:bg-elvee-blue/5"
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
                                        <td colSpan={2} className="px-3 py-2 sm:px-4 text-right text-xs sm:text-sm text-slate-600">
                                            Subtotal
                                        </td>
                                        <td className="px-3 py-2 sm:px-4"></td>
                                        <td className="px-3 py-2 sm:px-4 text-right text-xs sm:text-sm font-semibold text-slate-900">
                                            {currencyFormatter.format(order.subtotal_amount)}
                                        </td>
                                    </tr>
                                    {order.discount_amount > 0 && (
                                        <tr>
                                            <td colSpan={2} className="px-3 py-2 sm:px-4 text-right text-xs sm:text-sm text-slate-600">
                                                Discount
                                            </td>
                                            <td className="px-3 py-2 sm:px-4"></td>
                                            <td className="px-3 py-2 sm:px-4 text-right text-xs sm:text-sm font-semibold text-slate-900">
                                                -{currencyFormatter.format(order.discount_amount)}
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td colSpan={2} className="px-3 py-2 sm:px-4 text-right text-xs sm:text-sm text-slate-600">
                                            Tax (GST)
                                        </td>
                                        <td className="px-3 py-2 sm:px-4"></td>
                                        <td className="px-3 py-2 sm:px-4 text-right text-xs sm:text-sm font-semibold text-slate-900">
                                            {currencyFormatter.format(order.tax_amount)}
                                        </td>
                                    </tr>
                                    <tr className="border-t-2 border-slate-300">
                                        <td colSpan={2} className="px-3 py-2 sm:px-4 sm:py-3 text-right text-sm sm:text-base font-bold text-slate-900">
                                            Grand Total
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3"></td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-right text-base sm:text-lg font-bold text-slate-900">
                                            {currencyFormatter.format(order.total_amount)}
                                        </td>
                                        <td className="px-3 py-2 sm:px-4 sm:py-3"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                        <div className="space-y-4 sm:space-y-6">
                            {/* Status Update Form */}
                            <form
                                onSubmit={submit}
                                className="space-y-3 sm:space-y-4 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70"
                            >
                                <h2 className="text-base sm:text-lg font-semibold text-slate-900">Update Status</h2>
                                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                    <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                                        <span className="font-semibold text-slate-700 sm:text-slate-800">Workflow stage</span>
                                        <select
                                            className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                            value={statusData.status}
                                            onChange={(event) => setStatusData({ ...statusData, status: event.target.value })}
                                        >
                                            {statusOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                                        <span className="font-semibold text-slate-700 sm:text-slate-800">Operator note</span>
                                        <textarea
                                            className="min-h-[80px] sm:min-h-[100px] rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                            value={statusData.meta.comment}
                                            onChange={(event) => setStatusData({ ...statusData, meta: { ...statusData.meta, comment: event.target.value } })}
                                            placeholder="Optional note shared with production & support"
                                        />
                                    </label>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                                    <Link
                                        href="/admin/orders"
                                        className="rounded-full border border-slate-300 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 text-center"
                                    >
                                        Back
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-full bg-elvee-blue px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        Save status
                                    </button>
                                </div>
                            </form>

                            {/* Status History */}
                            <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
                                <h2 className="text-base sm:text-lg font-semibold text-slate-900">Status History</h2>
                                <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-600">
                                    {order.status_history.length === 0 && (
                                        <p className="text-[10px] sm:text-xs text-slate-400">No status updates recorded yet.</p>
                                    )}
                                    {order.status_history.map((entry) => {
                                        const comment = entry.meta?.comment;
                                        const commentText = typeof comment === 'string' ? comment : null;
                                        return (
                                            <div key={entry.id} className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2 sm:px-4 sm:py-3">
                                                <div>
                                                    <span className="font-semibold text-slate-800 text-xs sm:text-sm">{entry.status.replace(/_/g, ' ')}</span>
                                                    {commentText && (
                                                        <p className="mt-1 text-[10px] sm:text-xs text-slate-500">{commentText}</p>
                                                    )}
                                                </div>
                                                <span className="text-[10px] sm:text-xs text-slate-400">{formatDate(entry.created_at)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            {/* Order Timeline */}
                            <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
                                <h2 className="text-base sm:text-lg font-semibold text-slate-900">Order Timeline</h2>
                                <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                                    <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] sm:text-xs font-semibold text-slate-400">Created</p>
                                                <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{formatDate(order.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {order.updated_at && order.updated_at !== order.created_at && (
                                        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] sm:text-xs font-semibold text-slate-400">Last Updated</p>
                                                    <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{formatDate(order.updated_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payments */}
                            <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
                                <h2 className="text-base sm:text-lg font-semibold text-slate-900">Payments</h2>
                                <div className="mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm text-slate-600">
                                    {order.payments.length === 0 && <p className="text-[10px] sm:text-xs text-slate-400">No payments captured.</p>}
                                    {order.payments.map((payment) => (
                                        <div key={payment.id} className="rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2 sm:px-4 sm:py-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-slate-800 text-xs sm:text-sm">{payment.status}</span>
                                                <span className="text-[10px] sm:text-xs text-slate-400">{formatDate(payment.created_at)}</span>
                                            </div>
                                            <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{currencyFormatter.format(payment.amount)}</p>
                                        </div>
                                    ))}
                                    {order.status === 'pending_payment' && (
                                        <p className="text-[10px] sm:text-xs text-amber-600">Waiting for customer to complete payment.</p>
                                    )}
                                    {order.status === 'paid' && <p className="text-[10px] sm:text-xs text-emerald-600">Payment confirmed.</p>}
                                </div>
                            </div>

                            {/* Linked Quotations */}
                            {order.quotations && order.quotations.length > 0 && (
                                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
                                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">Source Quotations</h2>
                                    <p className="mt-1 text-[10px] sm:text-xs text-slate-500">This order was created from the following quotations</p>
                                    <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                                        {order.quotations.map((quotation) => (
                                            <Link
                                                key={quotation.id}
                                                href={`/admin/quotations/${quotation.id}`}
                                                className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3 transition hover:border-elvee-blue/50 hover:bg-elvee-blue/5"
                                            >
                                                {quotation.product?.media?.[0] && getMediaUrl(quotation.product.media[0].url) && (
                                                    <img
                                                        src={getMediaUrl(quotation.product.media[0].url)!}
                                                        alt={quotation.product.media[0].alt || quotation.product.name || 'Product'}
                                                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs sm:text-sm font-semibold text-slate-900">Quotation #{quotation.id}</p>
                                                    <p className="text-[10px] sm:text-xs text-slate-500 truncate">{quotation.product?.name ?? 'Product'}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-[10px] sm:text-xs text-slate-500">Qty: {quotation.quantity}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Price Breakdown */}
                            {order.price_breakdown && Object.keys(order.price_breakdown).length > 0 && (
                                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
                                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">Price Breakdown</h2>
                                    <pre className="mt-3 sm:mt-4 max-h-48 sm:max-h-64 overflow-auto rounded-xl sm:rounded-2xl bg-slate-900/95 p-3 sm:p-4 text-[10px] sm:text-xs text-slate-100">
                                        {JSON.stringify(order.price_breakdown, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Details Modal */}
            {productDetailsModalOpen && (
                <Modal show={true} onClose={() => setProductDetailsModalOpen(null)} maxWidth="4xl">
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-4 py-2.5 sm:px-6 sm:py-4">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-base sm:text-lg font-semibold text-slate-900">Product Details</h3>
                                <button
                                    type="button"
                                    onClick={() => setProductDetailsModalOpen(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 sm:h-5 sm:w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
                            <div className="space-y-4 sm:space-y-6">
                                {/* Product Image and Basic Info */}
                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                                    {productDetailsModalOpen.product?.media?.[0] && getMediaUrl(productDetailsModalOpen.product.media[0].url) && (
                                        <img
                                            src={getMediaUrl(productDetailsModalOpen.product.media[0].url)!}
                                            alt={productDetailsModalOpen.product.media[0].alt || productDetailsModalOpen.name}
                                            className="h-24 w-24 sm:h-32 sm:w-32 rounded-lg object-cover shadow-lg mx-auto sm:mx-0"
                                        />
                                    )}
                                    <div className="flex-1 text-center sm:text-left">
                                        <h4 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">{productDetailsModalOpen.name}</h4>
                                        <p className="mt-1 text-xs sm:text-sm text-slate-500">SKU: {productDetailsModalOpen.sku}</p>
                                        <div className="mt-2 sm:mt-3 flex justify-center sm:justify-start gap-2">
                                            <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-slate-700">
                                                Qty: {productDetailsModalOpen.quantity}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                    <h5 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-700">Pricing</h5>
                                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                        {(() => {
                                            // Use stored price breakdown from order if available
                                            const priceBreakdown = productDetailsModalOpen.price_breakdown;
                                            const metalCost = priceBreakdown?.metal ?? 0;
                                            const diamondCost = priceBreakdown?.diamond ?? 0;
                                            const makingCharge = priceBreakdown?.making ?? productDetailsModalOpen.calculated_making_charge ?? 0;
                                            const discount = priceBreakdown?.discount ?? 0;

                                            return (
                                                <>
                                                    {metalCost > 0 && (
                                                        <div className="flex justify-between gap-2">
                                                            <span className="text-slate-600">Metal:</span>
                                                            <span className="font-semibold text-slate-900 text-right">{currencyFormatter.format(metalCost)}</span>
                                                        </div>
                                                    )}
                                                    {diamondCost > 0 && (
                                                        <div className="flex justify-between gap-2">
                                                            <span className="text-slate-600">Diamond:</span>
                                                            <span className="font-semibold text-slate-900 text-right">{currencyFormatter.format(diamondCost)}</span>
                                                        </div>
                                                    )}
                                                    {makingCharge > 0 && (
                                                        <div className="flex justify-between gap-2">
                                                            <span className="text-slate-600">Making Charge:</span>
                                                            <span className="font-semibold text-slate-900 text-right">{currencyFormatter.format(makingCharge)}</span>
                                                        </div>
                                                    )}
                                                    {discount > 0 && (
                                                        <div className="flex justify-between gap-2 text-rose-600">
                                                            <span>Discount:</span>
                                                            <span className="font-semibold text-right">-{currencyFormatter.format(discount)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                        <div className="border-t border-slate-300 pt-2 mt-2">
                                            <div className="flex justify-between gap-2">
                                                <span className="font-semibold text-slate-900">Unit Price:</span>
                                                <span className="font-semibold text-slate-900 text-right">{currencyFormatter.format(productDetailsModalOpen.unit_price)}</span>
                                            </div>
                                            <div className="flex justify-between gap-2 mt-2">
                                                <span className="font-semibold text-slate-900">Total Price:</span>
                                                <span className="font-semibold text-slate-900 text-right">{currencyFormatter.format(productDetailsModalOpen.total_price)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/* Configuration */}
                                {productDetailsModalOpen.configuration && Object.keys(productDetailsModalOpen.configuration).length > 0 && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                        <h5 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-700">Configuration</h5>
                                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                            {Object.entries(productDetailsModalOpen.configuration).map(([key, value]) => (
                                                <div key={key} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                                                    <span className="text-slate-600 break-words">{key.replace(/_/g, ' ')}:</span>
                                                    <span className="font-semibold text-slate-900 break-words sm:text-right">
                                                        {value === null || value === undefined || value === '' ? '—' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Metadata */}
                                {productDetailsModalOpen.metadata && Object.keys(productDetailsModalOpen.metadata).length > 0 && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                        <h5 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-slate-700">Additional Information</h5>
                                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                            {Object.entries(productDetailsModalOpen.metadata).map(([key, value]) => (
                                                <div key={key} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                                                    <span className="text-slate-600 break-words">{key.replace(/_/g, ' ')}:</span>
                                                    <span className="font-semibold text-slate-900 break-words sm:text-right">
                                                        {value === null || value === undefined || value === '' ? '—' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : typeof value === 'object' ? JSON.stringify(value) : String(value)}
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
