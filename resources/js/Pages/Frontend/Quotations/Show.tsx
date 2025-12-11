import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type RelatedQuotation = {
    id: number;
    status: string;
    quantity: number;
    notes?: string | null;
    product: {
        id: number;
        name: string;
        sku: string;
        base_price?: number | null;
        making_charge_amount?: number | null;
        media: Array<{ url: string; alt: string }>;
        variants: Array<{
            id: number;
            label: string;
            metadata?: Record<string, unknown> | null;
        }>;
    };
    variant?: {
        id: number;
        label: string;
        metadata?: Record<string, unknown> | null;
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

type QuotationDetails = {
    id: number;
    status: string;
    quantity: number;
    notes?: string | null;
    admin_notes?: string | null;
    approved_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    related_quotations?: RelatedQuotation[];
    product: {
        id: number;
        name: string;
        sku: string;
        base_price?: number | null;
        making_charge_amount?: number | null;
        media: Array<{ url: string; alt: string }>;
        variants: Array<{
            id: number;
            label: string;
            metadata?: Record<string, unknown> | null;
        }>;
    };
    variant?: {
        id: number;
        label: string;
        metadata?: Record<string, unknown> | null;
    } | null;
    user?: {
        name?: string | null;
        email?: string | null;
    } | null;
    order?: {
        id: number;
        reference: string;
        status: string;
        total_amount: number;
        history: Array<{
            id: number;
            status: string;
            created_at?: string | null;
        }>;
    } | null;
    price_breakdown?: {
        metal?: number;
        diamond?: number;
        making?: number;
        subtotal?: number;
        discount?: number;
        total?: number;
    };
    tax_rate?: number;
    tax_summary?: {
        subtotal: number;
        tax: number;
        total: number;
    };
    messages: Array<{
        id: number;
        sender: 'customer' | 'admin';
        message: string;
        created_at?: string | null;
        author?: string | null;
    }>;
};

type FrontendQuotationShowProps = PageProps<{
    quotation: QuotationDetails;
}>;

const statusBadge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    pending_customer_confirmation: 'bg-amber-100 text-amber-700',
    customer_confirmed: 'bg-emerald-100 text-emerald-700',
    customer_declined: 'bg-rose-100 text-rose-700',
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

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
});

export default function FrontendQuotationShow() {
    const { quotation } = usePage<FrontendQuotationShowProps>().props;
    const messageForm = useForm({ message: '' });
    const [productDetailsModalOpen, setProductDetailsModalOpen] = useState<RelatedQuotation | QuotationDetails | null>(null);
    const confirmForm = useForm({});
    const declineForm = useForm({ notes: '' });

    // Get all quotations to display (including the main one)
    const allQuotations = quotation.related_quotations && quotation.related_quotations.length > 0
        ? [quotation, ...quotation.related_quotations]
        : [quotation];


    const submitMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!messageForm.data.message.trim()) {
            return;
        }

        messageForm.post(route('frontend.quotations.messages.store', quotation.id), {
            preserveScroll: true,
            onSuccess: () => messageForm.reset('message'),
        });
    };

    const submitConfirm = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        confirmForm.post(route('frontend.quotations.confirm', quotation.id), {
            preserveScroll: true,
        });
    };

    const submitDecline = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        declineForm.post(route('frontend.quotations.decline', quotation.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Quotation #${quotation.id}`} />

            <div className="space-y-10">
                <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-900">Quotation #{quotation.id}</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                View quotation details and manage your response
                            </p>
                        </div>
                        <Link
                            href={route('frontend.quotations.index')}
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
                                <p className="mt-3 text-lg font-semibold text-slate-900">{quotation.user?.name ?? 'Unknown'}</p>
                                <p className="mt-1 text-sm text-slate-600">{quotation.user?.email ?? '—'}</p>
                            </div>
                            {/* Quotation Details */}
                            <div className="text-right">
                                <h3 className="text-xs font-semibold text-slate-400">Quotation Details</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">#{quotation.id}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Date: <span className="font-semibold text-slate-900">{formatDate(quotation.created_at)}</span>
                                </p>
                                <div className="mt-3 flex justify-end gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            statusBadge[quotation.status] ?? 'bg-slate-200 text-slate-700'
                                        }`}
                                    >
                                        {quotation.status.replace(/_/g, ' ')}
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
                                    {allQuotations.map((item) => {
                                        const priceBreakdown = item.price_breakdown || {};
                                        const metalCost = Number(priceBreakdown.metal) || 0;
                                        const diamondCost = Number(priceBreakdown.diamond) || 0;
                                        const makingCharge = Number(priceBreakdown.making) || 0;
                                        const unitPrice = Number(priceBreakdown.total) || (metalCost + diamondCost + makingCharge);
                                        const lineTotal = unitPrice * (Number(item.quantity) || 0);
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {item.product.media?.[0] && (
                                                            <img
                                                                src={item.product.media[0].url}
                                                                alt={item.product.media[0].alt}
                                                                className="h-12 w-12 rounded-lg object-cover shadow-sm"
                                                            />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                                                            <p className="text-xs text-slate-400">SKU {item.product.sku}</p>
                                                            {item.variant && (
                                                                <p className="mt-0.5 text-xs font-medium text-slate-500">{item.variant.label}</p>
                                                            )}
                                                            {item.notes && (
                                                                <p className="mt-1 text-xs text-slate-500 italic">Note: {item.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="text-sm font-semibold text-slate-900">{currencyFormatter.format(unitPrice)}</div>
                                                    <div className="text-xs text-slate-400">
                                                        {metalCost > 0 && `Metal: ${currencyFormatter.format(metalCost)}`}
                                                        {metalCost > 0 && (diamondCost > 0 || makingCharge > 0) && ' + '}
                                                        {diamondCost > 0 && `Diamond: ${currencyFormatter.format(diamondCost)}`}
                                                        {diamondCost > 0 && makingCharge > 0 && ' + '}
                                                        {makingCharge > 0 && `Making: ${currencyFormatter.format(makingCharge)}`}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-semibold text-slate-900">{item.quantity}</span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="text-sm font-semibold text-slate-900">{currencyFormatter.format(lineTotal)}</div>
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
                                        );
                                    })}
                                </tbody>
                                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                                    {(() => {
                                        const totals = allQuotations.reduce((acc, item) => {
                                            const priceBreakdown = item.price_breakdown || {};
                                            const metalCost = Number(priceBreakdown.metal) || 0;
                                            const diamondCost = Number(priceBreakdown.diamond) || 0;
                                            const makingCharge = Number(priceBreakdown.making) || 0;
                                            const unitTotal = Number(priceBreakdown.total) || (metalCost + diamondCost + makingCharge);
                                            const quantity = Number(item.quantity) || 0;
                                            const lineTotal = unitTotal * quantity;
                                            
                                            acc.totalBase += lineTotal;
                                            
                                            return acc;
                                        }, { totalBase: 0 });
                                        
                                        // Use backend-calculated tax summary if available, otherwise calculate from totals
                                        const taxSummary = quotation.tax_summary;
                                        const subtotal = taxSummary ? taxSummary.subtotal : totals.totalBase;
                                        const tax = taxSummary ? taxSummary.tax : 0;
                                        const grandTotal = taxSummary ? taxSummary.total : (subtotal + tax);
                                        const taxRate = quotation.tax_rate ?? 18;
                                        
                                        return (
                                            <>
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-slate-600">
                                                        Subtotal
                                                    </td>
                                                    <td className="px-4 py-2"></td>
                                                    <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                                                        {currencyFormatter.format(subtotal)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-slate-600">
                                                        GST ({taxRate}%)
                                                    </td>
                                                    <td className="px-4 py-2"></td>
                                                    <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                                                        {currencyFormatter.format(tax)}
                                                    </td>
                                                </tr>
                                                <tr className="border-t-2 border-slate-300">
                                                    <td colSpan={3} className="px-4 py-3 text-right text-base font-bold text-slate-900">
                                                        Grand Total
                                                    </td>
                                                    <td className="px-4 py-3"></td>
                                                    <td className="px-4 py-3 text-right text-lg font-bold text-slate-900">
                                                        {currencyFormatter.format(grandTotal)}
                                                    </td>
                                                </tr>
                                            </>
                                        );
                                    })()}
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Customer Confirmation Section */}
                    {quotation.status === 'pending_customer_confirmation' && (
                        <div className="rounded-3xl border-2 border-amber-400 bg-amber-50 p-6 shadow-xl">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-amber-900">Action Required</h3>
                                    <p className="mt-2 text-sm text-amber-800">
                                        The admin has made changes to this quotation. Please review and confirm or decline the updated quotation.
                                    </p>
                                    {quotation.admin_notes && (
                                        <div className="mt-4 rounded-xl bg-white p-4">
                                            <p className="text-xs font-semibold text-amber-700">Admin Notes:</p>
                                            <p className="mt-1 text-sm text-amber-900 whitespace-pre-line">{quotation.admin_notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <form onSubmit={submitConfirm} className="flex-1 min-w-[200px]">
                                    <button
                                        type="submit"
                                        className="w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500"
                                    >
                                        Approve Changes
                                    </button>
                                </form>
                                <form onSubmit={submitDecline} className="flex-1 min-w-[200px]">
                                    <div className="space-y-3">
                                        <textarea
                                            value={declineForm.data.notes}
                                            onChange={(e) => declineForm.setData('notes', e.target.value)}
                                            className="w-full rounded-xl border border-amber-300 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                                            placeholder="Reason for declining (optional)"
                                            rows={3}
                                        />
                                        <button
                                            type="submit"
                                            className="w-full rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500"
                                        >
                                            Decline Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="space-y-6">
                            {quotation.order && (
                                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                                    <h2 className="text-lg font-semibold text-slate-900">Linked Order</h2>
                                    <div className="mt-4 space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                <p className="text-xs font-semibold text-slate-400">Order Reference</p>
                                                <Link
                                                    href={route('frontend.orders.show', quotation.order.id)}
                                                    className="mt-1 text-base font-semibold text-elvee-blue hover:text-feather-gold transition"
                                                >
                                                    {quotation.order.reference}
                                                </Link>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                <p className="text-xs font-semibold text-slate-400">Status</p>
                                                <p className="mt-1 text-base font-semibold text-slate-900">{quotation.order.status.replace(/_/g, ' ')}</p>
                                            </div>
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
                                                <p className="text-xs font-semibold text-slate-400">Total Amount</p>
                                                <p className="mt-1 text-xl font-semibold text-slate-900">{currencyFormatter.format(quotation.order.total_amount)}</p>
                                            </div>
                                        </div>
                                        {quotation.order?.history?.length ? (
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                                <h3 className="text-xs font-semibold text-slate-400">Status Timeline</h3>
                                                <div className="mt-3 space-y-2">
                                                    {quotation.order.history.map((entry) => (
                                                        <div key={entry.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                                                            <span className="text-sm font-semibold text-slate-700">{entry.status.replace(/_/g, ' ')}</span>
                                                            <span className="text-xs text-slate-400">{formatDate(entry.created_at)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                                <h2 className="text-lg font-semibold text-slate-900">Quotation Timeline</h2>
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400">Created</p>
                                                <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(quotation.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {quotation.approved_at && (
                                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold text-emerald-600">Approved</p>
                                                    <p className="mt-1 text-sm font-semibold text-emerald-900">{formatDate(quotation.approved_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {quotation.updated_at && quotation.updated_at !== quotation.created_at && (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-400">Last Updated</p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(quotation.updated_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        <div className="space-y-6">
                            {/* Notes */}
                            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                                <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
                                <div className="mt-4 space-y-4">
                                    {quotation.notes && (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-xs font-semibold text-slate-400">Your Notes</p>
                                            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{quotation.notes}</p>
                                        </div>
                                    )}
                                    {quotation.admin_notes && (
                                        <div className="rounded-2xl border border-elvee-blue/30 bg-elvee-blue/5 p-4">
                                            <p className="text-xs font-semibold text-elvee-blue">Admin Response</p>
                                            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{quotation.admin_notes}</p>
                                        </div>
                                    )}
                                    {!quotation.notes && !quotation.admin_notes && (
                                        <p className="text-sm text-slate-400">No notes available</p>
                                    )}
                                </div>
                            </div>

                            {/* Conversation */}
                            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                                <h2 className="text-lg font-semibold text-slate-900">Conversation</h2>
                                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-2 text-sm text-slate-600">
                                    {quotation.messages.length === 0 && (
                                        <p className="text-xs text-slate-400">No messages yet. Start the conversation below.</p>
                                    )}
                                    {quotation.messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 ${
                                                message.sender === 'admin'
                                                    ? 'border-elvee-blue/30 bg-elvee-blue/5'
                                                    : 'border-slate-200 bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between text-xs text-slate-400">
                                                <span className="font-semibold">{message.sender === 'admin' ? (message.author ?? 'Admin') : 'You'}</span>
                                                <span>{formatDate(message.created_at)}</span>
                                            </div>
                                            <p className="whitespace-pre-line text-sm text-slate-700">{message.message}</p>
                                        </div>
                                    ))}
                                </div>
                                {quotation.status !== 'rejected' && (
                                    <form onSubmit={submitMessage} className="mt-4 space-y-2">
                                        <textarea
                                            value={messageForm.data.message}
                                            onChange={(event) => messageForm.setData('message', event.target.value)}
                                            className="w-full min-h-[90px] rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                            placeholder="Share more details or ask a question..."
                                            disabled={messageForm.processing}
                                        />
                                        {messageForm.errors.message && (
                                            <p className="text-xs text-rose-500">{messageForm.errors.message}</p>
                                        )}
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={messageForm.processing || !messageForm.data.message.trim()}
                                                className="rounded-full bg-elvee-blue px-4 py-2 text-xs font-semibold text-white shadow-elvee-blue/30 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {messageForm.processing ? 'Sending…' : 'Send message'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
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
                                    {productDetailsModalOpen.product.media?.[0] && (
                                        <img
                                            src={productDetailsModalOpen.product.media[0].url}
                                            alt={productDetailsModalOpen.product.media[0].alt}
                                            className="h-32 w-32 rounded-lg object-cover shadow-lg"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h4 className="text-xl font-semibold text-slate-900">{productDetailsModalOpen.product.name}</h4>
                                        <p className="mt-1 text-sm text-slate-500">SKU: {productDetailsModalOpen.product.sku}</p>
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
                                            const priceBreakdown = productDetailsModalOpen.price_breakdown || {};
                                            const metalCost = Number(priceBreakdown.metal) || 0;
                                            const diamondCost = Number(priceBreakdown.diamond) || 0;
                                            const makingCharge = Number(priceBreakdown.making) || 0;
                                            const total = Number(priceBreakdown.total) || (metalCost + diamondCost + makingCharge);
                                            
                                            return (
                                                <>
                                                    {metalCost > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600">Metal:</span>
                                                            <span className="font-semibold text-slate-900">{currencyFormatter.format(metalCost)}</span>
                                                        </div>
                                                    )}
                                                    {diamondCost > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600">Diamond:</span>
                                                            <span className="font-semibold text-slate-900">{currencyFormatter.format(diamondCost)}</span>
                                                        </div>
                                                    )}
                                                    {makingCharge > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600">Making Charge:</span>
                                                            <span className="font-semibold text-slate-900">{currencyFormatter.format(makingCharge)}</span>
                                                        </div>
                                                    )}
                                                    <div className="border-t border-slate-300 pt-2">
                                                        <div className="flex justify-between">
                                                            <span className="font-semibold text-slate-900">Unit Price:</span>
                                                            <span className="font-semibold text-slate-900">
                                                                {currencyFormatter.format(total)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>


                                {/* Selected Variant */}
                                {productDetailsModalOpen.variant && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <h5 className="mb-3 text-sm font-semibold text-slate-700">Selected Variant</h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Label:</span>
                                                <span className="font-semibold text-slate-900">{productDetailsModalOpen.variant.label}</span>
                                            </div>
                                            {productDetailsModalOpen.variant.metadata && Object.keys(productDetailsModalOpen.variant.metadata).length > 0 && (
                                                <div className="mt-3 space-y-1">
                                                    <p className="text-xs font-semibold text-slate-500">Variant Details:</p>
                                                    {Object.entries(productDetailsModalOpen.variant.metadata).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between text-xs">
                                                            <span className="text-slate-600">{key.replace(/_/g, ' ')}:</span>
                                                            <span className="font-medium text-slate-900">{String(value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}


                                {/* Notes */}
                                {productDetailsModalOpen.notes && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <h5 className="mb-3 text-sm font-semibold text-slate-700">Notes</h5>
                                        <p className="text-sm text-slate-700 whitespace-pre-line">{productDetailsModalOpen.notes}</p>
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

