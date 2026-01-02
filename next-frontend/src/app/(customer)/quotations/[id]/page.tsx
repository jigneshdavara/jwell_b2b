'use client';

import { useEffect, useState, FormEvent, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import { route } from '@/utils/route';
import { getMediaUrl } from '@/utils/mediaUrl';
import { frontendService } from '@/services/frontendService';

type RelatedQuotation = {
    id: number | string;
    status: string;
    quantity: number;
    notes?: string | null;
    product: {
        id: number | string;
        name: string;
        sku: string;
        base_price?: number | null;
        making_charge_amount?: number | null;
        media: Array<{ url: string; alt: string }>;
        variants: Array<{
            id: number | string;
            label: string;
            metadata?: Record<string, unknown> | null;
        }>;
    };
    variant?: {
        id: number | string;
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
    id: number | string;
    status: string;
    quantity: number;
    notes?: string | null;
    admin_notes?: string | null;
    approved_at?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    related_quotations?: RelatedQuotation[];
    product: {
        id: number | string;
        name: string;
        sku: string;
        base_price?: number | null;
        making_charge_amount?: number | null;
        media: Array<{ url: string; alt: string }>;
        variants: Array<{
            id: number | string;
            label: string;
            metadata?: Record<string, unknown> | null;
        }>;
    };
    variant?: {
        id: number | string;
        label: string;
        metadata?: Record<string, unknown> | null;
    } | null;
    user?: {
        name?: string | null;
        email?: string | null;
    } | null;
    order?: {
        id: number | string;
        reference: string;
        status: string;
        total_amount: number;
        history: Array<{
            id: number | string;
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
        id: number | string;
        sender: 'customer' | 'admin';
        message: string;
        created_at?: string | null;
        author?: string | null;
    }>;
};

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


export default function QuotationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [declineNotes, setDeclineNotes] = useState('');
    const [productDetailsModalOpen, setProductDetailsModalOpen] = useState<RelatedQuotation | QuotationDetails | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [companySettings, setCompanySettings] = useState<any>(null);
    // Toast notifications are handled via RTK

    const fetchQuotation = useCallback(async () => {
        try {
            const quotationId = typeof params.id === 'string' ? parseInt(params.id) : Number(params.id);
            const response = await frontendService.getQuotation(quotationId);
            const data = response.data.quotation || response.data;
            
            // Map the data to match our type
            const mappedQuotation: QuotationDetails = {
                id: Number(data.id),
                status: data.status,
                quantity: Number(data.quantity),
                notes: data.notes || null,
                admin_notes: data.admin_notes || null,
                approved_at: data.approved_at || null,
                created_at: data.created_at || null,
                updated_at: data.updated_at || null,
                related_quotations: (data.related_quotations || []).map((rq: any) => ({
                    id: Number(rq.id),
                    status: rq.status,
                    quantity: Number(rq.quantity),
                    notes: rq.notes || null,
                    product: {
                        id: Number(rq.product.id),
                        name: rq.product.name,
                        sku: rq.product.sku,
                        base_price: rq.product.base_price ? Number(rq.product.base_price) : null,
                        making_charge_amount: rq.product.making_charge_amount ? Number(rq.product.making_charge_amount) : null,
                        media: (rq.product.media || []).map((m: any) => ({
                            url: getMediaUrl(m.url),
                            alt: m.alt || rq.product.name,
                        })),
                        variants: (rq.product.variants || []).map((v: any) => ({
                            id: Number(v.id),
                            label: v.label || '',
                            metadata: v.metadata || {},
                        })),
                    },
                    variant: rq.variant ? {
                        id: Number(rq.variant.id),
                        label: rq.variant.label || '',
                        metadata: rq.variant.metadata || {},
                    } : null,
                    price_breakdown: rq.price_breakdown || {},
                })),
                product: {
                    id: Number(data.product.id),
                    name: data.product.name,
                    sku: data.product.sku,
                    base_price: data.product.base_price ? Number(data.product.base_price) : null,
                    making_charge_amount: data.product.making_charge_amount ? Number(data.product.making_charge_amount) : null,
                    media: (data.product.media || []).map((m: any) => ({
                        url: getMediaUrl(m.url),
                        alt: m.alt || data.product.name,
                    })),
                    variants: (data.product.variants || []).map((v: any) => ({
                        id: Number(v.id),
                        label: v.label || '',
                        metadata: v.metadata || {},
                    })),
                },
                variant: data.variant ? {
                    id: Number(data.variant.id),
                    label: data.variant.label || '',
                    metadata: data.variant.metadata || {},
                } : null,
                user: data.user || null,
                order: data.order ? {
                    id: Number(data.order.id),
                    reference: data.order.reference,
                    status: data.order.status,
                    total_amount: Number(data.order.total_amount),
                    history: (data.order.history || []).map((h: any) => ({
                        id: Number(h.id),
                        status: h.status,
                        created_at: h.created_at || null,
                    })),
                } : null,
                price_breakdown: data.price_breakdown || {},
                tax_rate: data.tax_rate ? Number(data.tax_rate) : undefined,
                tax_summary: data.tax_summary ? {
                    subtotal: Number(data.tax_summary.subtotal),
                    tax: Number(data.tax_summary.tax),
                    total: Number(data.tax_summary.total),
                } : undefined,
                messages: (data.messages || []).map((m: any) => ({
                    id: Number(m.id),
                    sender: m.sender,
                    message: m.message,
                    created_at: m.created_at || null,
                    author: m.author || null,
                })),
            };
            
            setQuotation(mappedQuotation);
        } catch (error: any) {
            console.error('Failed to fetch quotation', error);
            // Error toast handled by API interceptor
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => {
        if (params.id) {
            fetchQuotation();
        }
    }, [params.id, fetchQuotation]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await frontendService.getPublicSettings();
                if (response?.data) {
                    setCompanySettings(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch company settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const submitMessage = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!message.trim()) {
            return;
        }

        setSubmitting(true);
        try {
            const quotationId = typeof params.id === 'string' ? parseInt(params.id) : Number(params.id);
            await frontendService.sendQuotationMessage(quotationId, message);
            setMessage('');
            await fetchQuotation();
            // Toast handled by API interceptor if backend returns response.data.message
        } catch (error: any) {
            console.error('Failed to send message', error);
            // Error toast handled by API interceptor
        } finally {
            setSubmitting(false);
        }
    };

    const submitConfirm = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const quotationId = typeof params.id === 'string' ? parseInt(params.id) : Number(params.id);
            await frontendService.confirmQuotation(quotationId);
            await fetchQuotation();
            // Toast handled by API interceptor if backend returns response.data.message
        } catch (error: any) {
            console.error('Failed to confirm quotation', error);
            // Error toast handled by API interceptor
        } finally {
            setSubmitting(false);
        }
    };

    const submitDecline = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const quotationId = typeof params.id === 'string' ? parseInt(params.id) : Number(params.id);
            await frontendService.declineQuotation(quotationId);
            await fetchQuotation();
            // Toast handled by API interceptor if backend returns response.data.message
            router.push(route('frontend.quotations.index'));
        } catch (error: any) {
            console.error('Failed to decline quotation', error);
            // Error toast handled by API interceptor
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !quotation) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    // Get all quotations to display (including the main one)
    const allQuotations = quotation.related_quotations && quotation.related_quotations.length > 0
        ? [quotation, ...quotation.related_quotations]
        : [quotation];

    return (
        <>

            <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                <header className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl lg:text-3xl">Quotation #{quotation.id}</h1>
                            <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                                View quotation details and manage your response
                            </p>
                        </div>
                        <Link
                            href={route('frontend.quotations.index')}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
                        >
                            Back to list
                        </Link>
                    </div>
                </header>

                <div className="space-y-6">
                    {/* Invoice Header */}
                    <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
                            {/* Company Details */}
                            <div>
                                <h3 className="text-[10px] font-semibold text-slate-400 sm:text-xs">From</h3>
                                {companySettings ? (
                                    <>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 sm:mt-3 sm:text-base lg:text-lg">
                                            {companySettings.company_name || 'Elvee'}
                                        </p>
                                        {companySettings.address_line1 && (
                                            <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                                                {companySettings.address_line1}
                                            </p>
                                        )}
                                        {(companySettings.city || companySettings.state || companySettings.pincode) && (
                                            <p className="text-xs text-slate-600 sm:text-sm">
                                                {[companySettings.city, companySettings.state, companySettings.pincode]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </p>
                                        )}
                                        {companySettings.phone && (
                                            <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">
                                                Phone: {companySettings.phone}
                                            </p>
                                        )}
                                        {companySettings.email && (
                                            <p className="text-xs text-slate-600 sm:text-sm">
                                                Email: {companySettings.email}
                                            </p>
                                        )}
                                        {companySettings.gstin && (
                                            <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">
                                                GSTIN: {companySettings.gstin}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 sm:mt-3 sm:text-base lg:text-lg">Elvee</p>
                                        <p className="mt-1 text-xs text-slate-600 sm:text-sm">123 Business Street</p>
                                        <p className="text-xs text-slate-600 sm:text-sm">Mumbai, Maharashtra 400001</p>
                                        <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">Phone: +91 98765 43210</p>
                                        <p className="text-xs text-slate-600 sm:text-sm">Email: info@elvee.com</p>
                                        <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">GSTIN: 27AAAAA0000A1Z5</p>
                                    </>
                                )}
                            </div>
                            {/* Bill To */}
                            <div>
                                <h3 className="text-[10px] font-semibold text-slate-400 sm:text-xs">Bill To</h3>
                                <p className="mt-2 text-sm font-semibold text-slate-900 sm:mt-3 sm:text-base lg:text-lg">{quotation.user?.name ?? 'Unknown'}</p>
                                <p className="mt-1 text-xs text-slate-600 sm:text-sm">{quotation.user?.email ?? '—'}</p>
                            </div>
                            {/* Quotation Details */}
                            <div className="text-left sm:text-right">
                                <h3 className="text-[10px] font-semibold text-slate-400 sm:text-xs">Quotation Details</h3>
                                <p className="mt-2 text-sm font-semibold text-slate-900 sm:mt-3 sm:text-base lg:text-lg">#{quotation.id}</p>
                                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                    Date: <span className="font-semibold text-slate-900">{formatDate(quotation.created_at)}</span>
                                </p>
                                <div className="mt-2 flex justify-start gap-2 sm:mt-3 sm:justify-end">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${
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
                    <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                        <h2 className="mb-3 text-base font-semibold text-slate-900 sm:mb-4 sm:text-lg">Items</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm">
                                <thead className="border-b-2 border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-2 py-2 text-left text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Item</th>
                                        <th className="px-2 py-2 text-right text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Unit Price</th>
                                        <th className="px-2 py-2 text-center text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Qty</th>
                                        <th className="px-2 py-2 text-right text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Total</th>
                                        <th className="px-2 py-2 text-center text-[10px] font-semibold text-slate-600 sm:px-4 sm:py-3 sm:text-xs">Actions</th>
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
                                                <td className="px-2 py-3 sm:px-4 sm:py-4">
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        {item.product.media?.[0] && (
                                                            <img
                                                                src={item.product.media[0].url}
                                                                alt={item.product.media[0].alt}
                                                                className="h-10 w-10 flex-shrink-0 rounded-lg object-cover shadow-sm sm:h-12 sm:w-12"
                                                            />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-semibold text-slate-900 sm:text-sm">{item.product.name}</p>
                                                            <p className="text-[10px] text-slate-400 sm:text-xs">SKU {item.product.sku}</p>
                                                            {item.variant && (
                                                                <p className="mt-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">{item.variant.label}</p>
                                                            )}
                                                            {item.notes && (
                                                                <p className="mt-1 text-[10px] text-slate-500 italic sm:text-xs">Note: {item.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-3 text-right sm:px-4 sm:py-4">
                                                    <div className="text-xs font-semibold text-slate-900 sm:text-sm">{currencyFormatter.format(unitPrice)}</div>
                                                    <div className="text-[10px] text-slate-400 sm:text-xs">
                                                        {metalCost > 0 && `Metal: ${currencyFormatter.format(metalCost)}`}
                                                        {metalCost > 0 && (diamondCost > 0 || makingCharge > 0) && ' + '}
                                                        {diamondCost > 0 && `Diamond: ${currencyFormatter.format(diamondCost)}`}
                                                        {diamondCost > 0 && makingCharge > 0 && ' + '}
                                                        {makingCharge > 0 && `Making: ${currencyFormatter.format(makingCharge)}`}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-3 text-center sm:px-4 sm:py-4">
                                                    <span className="text-xs font-semibold text-slate-900 sm:text-sm">{item.quantity}</span>
                                                </td>
                                                <td className="px-2 py-3 text-right sm:px-4 sm:py-4">
                                                    <div className="text-xs font-semibold text-slate-900 sm:text-sm">{currencyFormatter.format(lineTotal)}</div>
                                                </td>
                                                <td className="px-2 py-3 sm:px-4 sm:py-4">
                                                    <div className="flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setProductDetailsModalOpen(item)}
                                                            className="inline-flex items-center gap-0.5 rounded-full border border-elvee-blue/30 px-2 py-1 text-[9px] font-semibold text-elvee-blue transition hover:border-elvee-blue hover:bg-elvee-blue/5 sm:gap-1 sm:px-2.5 sm:py-1.5 sm:text-[10px]"
                                                            title="View product details"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-2.5 w-2.5 sm:h-3 sm:w-3">
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
                                                    <td colSpan={3} className="px-2 py-1.5 text-right text-xs text-slate-600 sm:px-4 sm:py-2 sm:text-sm">
                                                        Subtotal
                                                    </td>
                                                    <td className="px-2 py-1.5 sm:px-4 sm:py-2"></td>
                                                    <td className="px-2 py-1.5 text-right text-xs font-semibold text-slate-900 sm:px-4 sm:py-2 sm:text-sm">
                                                        {currencyFormatter.format(subtotal)}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={3} className="px-2 py-1.5 text-right text-xs text-slate-600 sm:px-4 sm:py-2 sm:text-sm">
                                                        GST ({taxRate}%)
                                                    </td>
                                                    <td className="px-2 py-1.5 sm:px-4 sm:py-2"></td>
                                                    <td className="px-2 py-1.5 text-right text-xs font-semibold text-slate-900 sm:px-4 sm:py-2 sm:text-sm">
                                                        {currencyFormatter.format(tax)}
                                                    </td>
                                                </tr>
                                                <tr className="border-t-2 border-slate-300">
                                                    <td colSpan={3} className="px-2 py-2 text-right text-sm font-bold text-slate-900 sm:px-4 sm:py-3 sm:text-base">
                                                        Grand Total
                                                    </td>
                                                    <td className="px-2 py-2 sm:px-4 sm:py-3"></td>
                                                    <td className="px-2 py-2 text-right text-base font-bold text-slate-900 sm:px-4 sm:py-3 sm:text-lg">
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
                        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 shadow-xl sm:rounded-3xl sm:p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-amber-900 sm:text-base lg:text-lg">Action Required</h3>
                                    <p className="mt-1.5 text-xs text-amber-800 sm:mt-2 sm:text-sm">
                                        The admin has made changes to this quotation. Please review and confirm or decline the updated quotation.
                                    </p>
                                    {quotation.admin_notes && (
                                        <div className="mt-3 rounded-lg bg-white p-3 sm:mt-4 sm:rounded-xl sm:p-4">
                                            <p className="text-[10px] font-semibold text-amber-700 sm:text-xs">Admin Notes:</p>
                                            <p className="mt-1 text-xs text-amber-900 whitespace-pre-line sm:text-sm">{quotation.admin_notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap">
                                <form onSubmit={submitConfirm} className="flex-1 min-w-0">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-3 sm:text-sm"
                                    >
                                        {submitting ? 'Processing...' : 'Approve Changes'}
                                    </button>
                                </form>
                                <form onSubmit={submitDecline} className="flex-1 min-w-0">
                                    <div className="space-y-2 sm:space-y-3">
                                        <textarea
                                            value={declineNotes}
                                            onChange={(e) => setDeclineNotes(e.target.value)}
                                            className="w-full rounded-lg border border-amber-300 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 sm:rounded-xl sm:px-4 sm:text-sm"
                                            placeholder="Reason for declining (optional)"
                                            rows={3}
                                            disabled={submitting}
                                        />
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-3 sm:text-sm"
                                        >
                                            {submitting ? 'Processing...' : 'Decline Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                        <div className="space-y-4 sm:space-y-6">
                            {quotation.order && (
                                <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                                    <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Linked Order</h2>
                                    <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
                                        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                                                <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">Order Reference</p>
                                                <Link
                                                    href={route('frontend.orders.show', quotation.order!.id)}
                                                    className="mt-0.5 text-xs font-semibold text-elvee-blue hover:text-feather-gold transition sm:mt-1 sm:text-sm lg:text-base"
                                                >
                                                    {quotation.order.reference}
                                                </Link>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                                                <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">Status</p>
                                                <p className="mt-0.5 text-xs font-semibold text-slate-900 sm:mt-1 sm:text-sm lg:text-base">{quotation.order.status.replace(/_/g, ' ')}</p>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:col-span-2 sm:rounded-2xl sm:px-4 sm:py-3">
                                                <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">Total Amount</p>
                                                <p className="mt-0.5 text-base font-semibold text-slate-900 sm:mt-1 sm:text-lg lg:text-xl">{currencyFormatter.format(quotation.order.total_amount)}</p>
                                            </div>
                                        </div>
                                        {quotation.order?.history?.length ? (
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                                                <h3 className="text-[10px] font-semibold text-slate-400 sm:text-xs">Status Timeline</h3>
                                                <div className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2">
                                                    {quotation.order.history.map((entry) => (
                                                        <div key={entry.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:rounded-xl sm:px-3 sm:py-2">
                                                            <span className="text-xs font-semibold text-slate-700 sm:text-sm">{entry.status.replace(/_/g, ' ')}</span>
                                                            <span className="text-[10px] text-slate-400 sm:text-xs">{formatDate(entry.created_at)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Quotation Timeline</h2>
                                <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">Created</p>
                                                <p className="mt-0.5 text-xs font-semibold text-slate-900 sm:mt-1 sm:text-sm">{formatDate(quotation.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {quotation.approved_at && (
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-semibold text-emerald-600 sm:text-xs">Approved</p>
                                                    <p className="mt-0.5 text-xs font-semibold text-emerald-900 sm:mt-1 sm:text-sm">{formatDate(quotation.approved_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {quotation.updated_at && quotation.updated_at !== quotation.created_at && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">Last Updated</p>
                                                    <p className="mt-0.5 text-xs font-semibold text-slate-900 sm:mt-1 sm:text-sm">{formatDate(quotation.updated_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            {/* Notes */}
                            <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Notes</h2>
                                <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
                                    {quotation.notes && (
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
                                            <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">Your Notes</p>
                                            <p className="mt-1.5 whitespace-pre-line text-xs text-slate-700 sm:mt-2 sm:text-sm">{quotation.notes}</p>
                                        </div>
                                    )}
                                    {quotation.admin_notes && (
                                        <div className="rounded-xl border border-elvee-blue/30 bg-elvee-blue/5 p-3 sm:rounded-2xl sm:p-4">
                                            <p className="text-[10px] font-semibold text-elvee-blue sm:text-xs">Admin Response</p>
                                            <p className="mt-1.5 whitespace-pre-line text-xs text-slate-700 sm:mt-2 sm:text-sm">{quotation.admin_notes}</p>
                                        </div>
                                    )}
                                    {!quotation.notes && !quotation.admin_notes && (
                                        <p className="text-xs text-slate-400 sm:text-sm">No notes available</p>
                                    )}
                                </div>
                            </div>

                            {/* Conversation */}
                            <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Conversation</h2>
                                <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1 text-xs text-slate-600 sm:mt-4 sm:space-y-3 sm:max-h-96 sm:pr-2 sm:text-sm">
                                    {quotation.messages.length === 0 && (
                                        <p className="text-[10px] text-slate-400 sm:text-xs">No messages yet. Start the conversation below.</p>
                                    )}
                                    {quotation.messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex flex-col gap-1.5 rounded-xl border px-3 py-2 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3 ${
                                                message.sender === 'admin'
                                                    ? 'border-elvee-blue/30 bg-elvee-blue/5'
                                                    : 'border-slate-200 bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between text-[10px] text-slate-400 sm:text-xs">
                                                <span className="font-semibold">{message.sender === 'admin' ? (message.author ?? 'Admin') : 'You'}</span>
                                                <span>{formatDate(message.created_at)}</span>
                                            </div>
                                            <p className="whitespace-pre-line text-xs text-slate-700 sm:text-sm">{message.message}</p>
                                        </div>
                                    ))}
                                </div>
                                {quotation.status !== 'rejected' && (
                                    <form onSubmit={submitMessage} className="mt-3 space-y-2 sm:mt-4">
                                        <textarea
                                            value={message}
                                            onChange={(event) => setMessage(event.target.value)}
                                            className="w-full min-h-[70px] rounded-xl border border-slate-200 px-2.5 py-2 text-xs focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 sm:min-h-[90px] sm:rounded-2xl sm:px-3 sm:text-sm"
                                            placeholder="Share more details or ask a question..."
                                            disabled={submitting}
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={submitting || !message.trim()}
                                                className="rounded-full bg-elvee-blue px-3 py-1.5 text-[10px] font-semibold text-white shadow-elvee-blue/30 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-xs"
                                            >
                                                {submitting ? 'Sending…' : 'Send message'}
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
                        <div className="flex-shrink-0 border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900 sm:text-base lg:text-lg">Product Details</h3>
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
                        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4">
                            <div className="space-y-4 sm:space-y-6">
                                {/* Product Image and Basic Info */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
                                    {productDetailsModalOpen.product.media?.[0] && (
                                        <img
                                            src={productDetailsModalOpen.product.media[0].url}
                                            alt={productDetailsModalOpen.product.media[0].alt}
                                            className="h-24 w-24 flex-shrink-0 rounded-lg object-cover shadow-lg sm:h-32 sm:w-32"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-slate-900 sm:text-base lg:text-xl">{productDetailsModalOpen.product.name}</h4>
                                        <p className="mt-0.5 text-[10px] text-slate-500 sm:mt-1 sm:text-xs lg:text-sm">SKU: {productDetailsModalOpen.product.sku}</p>
                                        <div className="mt-2 flex gap-2 sm:mt-3">
                                            <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 sm:px-3 sm:py-1 sm:text-xs">
                                                Qty: {productDetailsModalOpen.quantity}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
                                    <h5 className="mb-2 text-xs font-semibold text-slate-700 sm:mb-3 sm:text-sm">Pricing</h5>
                                    <div className="space-y-1 text-xs sm:space-y-2 sm:text-sm">
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
                                                    <div className="border-t border-slate-300 pt-1.5 sm:pt-2">
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
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
                                        <h5 className="mb-2 text-xs font-semibold text-slate-700 sm:mb-3 sm:text-sm">Selected Variant</h5>
                                        <div className="space-y-1 text-xs sm:space-y-2 sm:text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600">Label:</span>
                                                <span className="font-semibold text-slate-900">{productDetailsModalOpen.variant.label}</span>
                                            </div>
                                            {productDetailsModalOpen.variant.metadata && Object.keys(productDetailsModalOpen.variant.metadata).length > 0 && (
                                                <div className="mt-2 space-y-0.5 sm:mt-3 sm:space-y-1">
                                                    <p className="text-[10px] font-semibold text-slate-500 sm:text-xs">Variant Details:</p>
                                                    {Object.entries(productDetailsModalOpen.variant.metadata).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between text-[10px] sm:text-xs">
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
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:rounded-2xl sm:p-4">
                                        <h5 className="mb-2 text-xs font-semibold text-slate-700 sm:mb-3 sm:text-sm">Notes</h5>
                                        <p className="text-xs text-slate-700 whitespace-pre-line sm:text-sm">{productDetailsModalOpen.notes}</p>
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

