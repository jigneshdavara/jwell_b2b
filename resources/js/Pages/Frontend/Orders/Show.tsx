import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import type { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

type OrderShowItem = {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    configuration?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    product?: {
        id: number;
        name: string;
        sku: string;
        base_price?: number | null;
        making_charge_amount?: number | null;
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
        mode: string;
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

type OrderShowProps = PageProps<{
    order: OrderDetails;
}>;

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

export default function FrontendOrdersShow() {
    const { order } = usePage<OrderShowProps>().props;
    const [productDetailsModalOpen, setProductDetailsModalOpen] = useState<OrderShowItem | null>(null);

    return (
        <AuthenticatedLayout>
            <Head title={`Order ${order.reference}`} />

            <div className="space-y-10">
                <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-900">Order {order.reference}</h1>
                            <p className="mt-2 text-sm text-slate-500">View order details and track fulfilment</p>
                        </div>
                        <Link
                            href={route('frontend.orders.index')}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                        >
                            Back to list
                        </Link>
                    </div>
                </header>

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
                                <p className="mt-3 text-lg font-semibold text-slate-900">{order.reference}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Date: <span className="font-semibold text-slate-900">{formatDate(order.created_at)}</span>
                                </p>
                                <div className="mt-3 flex justify-end gap-2">
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] ?? 'bg-slate-200 text-slate-700'}`}>
                                        {order.status_label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Table - Invoice Style */}
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
                                    {order.items.map((item) => (
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
                                                        <Link
                                                            href={route('frontend.catalog.show', { product: item.product?.id ?? item.id })}
                                                            className="text-sm font-semibold text-slate-900 hover:text-feather-gold transition"
                                                        >
                                                            {item.name}
                                                        </Link>
                                                        <p className="text-xs text-slate-400">SKU {item.sku}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="text-sm font-semibold text-slate-900">{currencyFormatter.format(item.unit_price)}</div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="font-semibold text-slate-900">{item.quantity}</span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="text-sm font-semibold text-slate-900">{currencyFormatter.format(item.total_price)}</div>
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
                                            {currencyFormatter.format(order.subtotal_amount)}
                                        </td>
                                    </tr>
                                    {order.discount_amount > 0 && (
                                        <tr>
                                            <td colSpan={2} className="px-4 py-2 text-right text-sm text-slate-600">
                                                Discount
                                            </td>
                                            <td className="px-4 py-2"></td>
                                            <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                                                -{currencyFormatter.format(order.discount_amount)}
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td colSpan={2} className="px-4 py-2 text-right text-sm text-slate-600">
                                            Tax (GST)
                                        </td>
                                        <td className="px-4 py-2"></td>
                                        <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                                            {currencyFormatter.format(order.tax_amount)}
                                        </td>
                                    </tr>
                                    <tr className="border-t-2 border-slate-300">
                                        <td colSpan={2} className="px-4 py-3 text-right text-base font-bold text-slate-900">
                                            Grand Total
                                        </td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-right text-lg font-bold text-slate-900">
                                            {currencyFormatter.format(order.total_amount)}
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
                                    {order.payments.length === 0 && (
                                        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                                            No payments recorded yet.
                                        </p>
                                    )}
                                    {order.payments.map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{payment.status}</p>
                                                <p className="text-xs text-slate-400">{formatDate(payment.created_at)}</p>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900">{currencyFormatter.format(payment.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                                {(order.status === 'pending_payment' || order.status === 'payment_failed') && (
                                    <div className="mt-4 flex justify-end">
                                        <Link
                                            href={route('frontend.orders.pay', order.id)}
                                            className="rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
                                        >
                                            Proceed to payment
                                        </Link>
                                    </div>
                                )}
                                {order.status === 'payment_failed' && (
                                    <p className="mt-2 text-xs text-rose-500">Previous attempt failed. Please retry the payment.</p>
                                )}
                            </div>

                            {/* Status History */}
                            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                                <h2 className="text-lg font-semibold text-slate-900">Status History</h2>
                                <div className="mt-4 space-y-3 text-sm text-slate-600">
                                    {order.status_history.map((entry) => (
                                        <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                                            <span className="font-semibold text-slate-800">{entry.status.replace(/_/g, ' ')}</span>
                                            <span className="text-xs text-slate-400">{formatDate(entry.created_at)}</span>
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
                                                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(order.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {order.updated_at && order.updated_at !== order.created_at && (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-400">Last Updated</p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(order.updated_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Linked Quotations */}
                            {order.quotations && order.quotations.length > 0 && (
                                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                                    <h2 className="text-lg font-semibold text-slate-900">Source Quotations</h2>
                                    <p className="mt-1 text-xs text-slate-500">This order was created from the following quotations</p>
                                    <div className="mt-4 space-y-3">
                                        {order.quotations.map((quotation) => (
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
                                                    <p className="text-xs text-slate-400">{quotation.mode === 'jobwork' ? 'Jobwork' : 'Jewellery'}</p>
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
                                        {productDetailsModalOpen.product?.base_price && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Base Price:</span>
                                                <span className="font-semibold text-slate-900">{currencyFormatter.format(Number(productDetailsModalOpen.product.base_price))}</span>
                                            </div>
                                        )}
                                        {productDetailsModalOpen.product?.making_charge_amount && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Making Charge:</span>
                                                <span className="font-semibold text-slate-900">{currencyFormatter.format(Number(productDetailsModalOpen.product.making_charge_amount))}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-slate-300 pt-2">
                                            <div className="flex justify-between">
                                                <span className="font-semibold text-slate-900">Unit Price:</span>
                                                <span className="font-semibold text-slate-900">{currencyFormatter.format(productDetailsModalOpen.unit_price)}</span>
                                            </div>
                                            <div className="flex justify-between mt-2">
                                                <span className="font-semibold text-slate-900">Total Price:</span>
                                                <span className="font-semibold text-slate-900">{currencyFormatter.format(productDetailsModalOpen.total_price)}</span>
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

                                {/* Metadata */}
                                {productDetailsModalOpen.metadata && Object.keys(productDetailsModalOpen.metadata).length > 0 && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <h5 className="mb-3 text-sm font-semibold text-slate-700">Additional Information</h5>
                                        <div className="space-y-2 text-sm">
                                            {Object.entries(productDetailsModalOpen.metadata).map(([key, value]) => (
                                                <div key={key} className="flex justify-between">
                                                    <span className="text-slate-600">{key.replace(/_/g, ' ')}:</span>
                                                    <span className="font-semibold text-slate-900">
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
        </AuthenticatedLayout>
    );
}
