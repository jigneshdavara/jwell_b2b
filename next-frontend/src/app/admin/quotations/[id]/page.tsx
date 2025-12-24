'use client';

import React, { useState, useEffect, use } from 'react';
import { Head } from '@/components/Head';
import Link from 'next/link';
import { adminService } from '@/services/adminService';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

type RelatedQuotation = {
    id: string | number;
    status: string;
    quantity: number;
    notes?: string | null;
    product: {
        id: number;
        name: string;
        sku: string;
        media: Array<{ url: string; alt?: string }>;
    };
    variant?: {
        id: string | number;
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
    id: string | number;
    status: string;
    quantity: number;
    notes?: string | null;
    admin_notes?: string | null;
    created_at?: string | null;
    related_quotations?: RelatedQuotation[];
    product: {
        id: number;
        name: string;
        sku: string;
        media: Array<{ url: string; alt?: string }>;
    };
    variant?: {
        id: string | number;
        label: string;
        metadata?: Record<string, unknown> | null;
    } | null;
    user?: {
        name?: string | null;
        email?: string | null;
    } | null;
    order?: {
        id: string | number;
        reference: string;
        status: string;
        total_amount: number;
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
    messages?: Array<{
        id: number;
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

// Helper function to get media URL
const getMediaUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    // Remove double slashes
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`.replace(/(?<!:)\/{2,}/g, '/');
};

export default function AdminQuotationShow({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [productDetailsModalOpen, setProductDetailsModalOpen] = useState<RelatedQuotation | null>(null);
    const [removeItemConfirm, setRemoveItemConfirm] = useState<{ show: boolean; itemId: string | number | null }>({
        show: false,
        itemId: null,
    });

    useEffect(() => {
        loadQuotation();
    }, [resolvedParams.id]);

    const loadQuotation = async () => {
        try {
            setLoading(true);
            const response = await adminService.getQuotation(Number(resolvedParams.id));
            if (response.data) {
                setQuotation(response.data);
            }
        } catch (error: any) {
            console.error('Failed to load quotation:', error);
        } finally {
            setLoading(false);
        }
    };

    // Combine main quotation with related quotations for display
    const allQuotations = React.useMemo(() => {
        if (!quotation) return [];
        const main: RelatedQuotation = {
            id: quotation.id,
            status: quotation.status,
            quantity: quotation.quantity,
            notes: quotation.notes,
            product: quotation.product,
            variant: quotation.variant,
            price_breakdown: quotation.price_breakdown,
        };
        return [main, ...(quotation.related_quotations || [])];
    }, [quotation]);

    const handleRemoveItem = async () => {
        if (!removeItemConfirm.itemId) return;
        try {
            await adminService.deleteQuotation(Number(removeItemConfirm.itemId));
            setRemoveItemConfirm({ show: false, itemId: null });
            await loadQuotation();
        } catch (error: any) {
            console.error('Failed to remove item:', error);
            alert(error.response?.data?.message || 'Failed to remove item');
        }
    };

    if (loading) {
        return (
            <>
                <Head title={`Quotation #${resolvedParams.id}`} />
                <div className="flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                </div>
            </>
        );
    }

    if (!quotation) {
        return (
            <>
                <Head title={`Quotation #${resolvedParams.id}`} />
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <p className="text-slate-600">Quotation not found.</p>
                    <Link href="/admin/quotations" className="mt-4 inline-block text-sm font-semibold text-elvee-blue hover:text-elvee-blue/80">
                        Back to list
                    </Link>
                </div>
            </>
        );
    }

    // Calculate totals for tax summary
    const taxSummary = quotation.tax_summary;
    const taxRate = quotation.tax_rate ?? 18;

    return (
        <>
            <Head title={`Quotation #${resolvedParams.id}`} />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold text-slate-900">Quotation #{resolvedParams.id}</h1>
                        <Link
                            href="/admin/quotations"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <div className="grid gap-8 md:grid-cols-3">
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">From</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">Elvee</p>
                                <p className="mt-1 text-sm text-slate-600">123 Business Street</p>
                                <p className="text-sm text-slate-600">Mumbai, Maharashtra 400001</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Bill To</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">{quotation.user?.name ?? 'Unknown'}</p>
                                <p className="mt-1 text-sm text-slate-600">{quotation.user?.email ?? '—'}</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Quotation Details</h3>
                                <p className="mt-3 text-lg font-semibold text-slate-900">#{resolvedParams.id}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Date: <span className="font-semibold text-slate-900">{quotation.created_at && formatDate(quotation.created_at)}</span>
                                </p>
                                <div className="mt-3 flex justify-end gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
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
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Items</h2>
                            <button
                                type="button"
                                onClick={() => {
                                    // TODO: Implement add item modal
                                    alert('Add item functionality coming soon');
                                }}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Item
                            </button>
                        </div>
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
                                        const variantLabel = item.variant?.metadata?.auto_label as string || item.variant?.label || '';
                                        
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {item.product.media?.[0] && (
                                                            <img
                                                                src={getMediaUrl(item.product.media[0].url)}
                                                                alt={item.product.media[0].alt || item.product.name}
                                                                className="h-12 w-12 rounded-lg object-cover shadow-sm"
                                                            />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                                                            <p className="text-xs text-slate-400">SKU {item.product.sku}</p>
                                                            {variantLabel && (
                                                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                                    {variantLabel}
                                                                </p>
                                                            )}
                                                            {item.notes && (
                                                                <p className="mt-1 text-xs text-slate-500 italic">Note: {item.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="text-sm font-semibold text-slate-900">₹ {unitPrice.toLocaleString('en-IN')}</div>
                                                    <div className="text-xs text-slate-400">
                                                        {metalCost > 0 && `Metal: ₹ ${metalCost.toLocaleString('en-IN')}`}
                                                        {metalCost > 0 && (diamondCost > 0 || makingCharge > 0) && ' + '}
                                                        {diamondCost > 0 && `Diamond: ₹ ${diamondCost.toLocaleString('en-IN')}`}
                                                        {diamondCost > 0 && makingCharge > 0 && ' + '}
                                                        {makingCharge > 0 && `Making: ₹ ${makingCharge.toLocaleString('en-IN')}`}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="font-semibold text-slate-900">{item.quantity}</span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="text-sm font-semibold text-slate-900">₹ {lineTotal.toLocaleString('en-IN')}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center justify-center gap-2">
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
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                // TODO: Implement change product modal
                                                                alert('Change product functionality coming soon');
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                                                            title="Change product"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRemoveItemConfirm({ show: true, itemId: item.id });
                                                            }}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                                                            title="Remove item"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
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
                                        const subtotal = taxSummary ? taxSummary.subtotal : allQuotations.reduce((acc, item) => {
                                            const priceBreakdown = item.price_breakdown || {};
                                            const metalCost = Number(priceBreakdown.metal) || 0;
                                            const diamondCost = Number(priceBreakdown.diamond) || 0;
                                            const makingCharge = Number(priceBreakdown.making) || 0;
                                            const unitTotal = Number(priceBreakdown.total) || (metalCost + diamondCost + makingCharge);
                                            const quantity = Number(item.quantity) || 0;
                                            return acc + (unitTotal * quantity);
                                        }, 0);
                                        const tax = taxSummary ? taxSummary.tax : 0;
                                        const grandTotal = taxSummary ? taxSummary.total : (subtotal + tax);
                                        
                                        return (
                                            <>
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-2 text-right text-sm text-slate-600">
                                                        Subtotal
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                                                        ₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-2 text-right text-sm text-slate-600">
                                                        GST ({taxRate}%)
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                                                        ₹ {tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                                <tr className="border-t-2 border-slate-300">
                                                    <td colSpan={4} className="px-4 py-3 text-right text-base font-bold text-slate-900">
                                                        Grand Total
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-lg font-bold text-slate-900">
                                                        ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </>
                                        );
                                    })()}
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Details Modal */}
            {productDetailsModalOpen && (
                <Modal
                    isOpen={!!productDetailsModalOpen}
                    onClose={() => setProductDetailsModalOpen(null)}
                    title="Product Details"
                >
                    <div className="space-y-4">
                        {productDetailsModalOpen.product.media?.[0] && (
                            <img
                                src={getMediaUrl(productDetailsModalOpen.product.media[0].url)}
                                alt={productDetailsModalOpen.product.media[0].alt || productDetailsModalOpen.product.name}
                                className="h-48 w-full rounded-lg object-cover"
                            />
                        )}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{productDetailsModalOpen.product.name}</h3>
                            <p className="text-sm text-slate-600">SKU: {productDetailsModalOpen.product.sku}</p>
                            {productDetailsModalOpen.variant?.label && (
                                <p className="mt-1 text-sm text-slate-500">Variant: {productDetailsModalOpen.variant.label}</p>
                            )}
                            {productDetailsModalOpen.notes && (
                                <p className="mt-2 text-sm text-slate-600 italic">Note: {productDetailsModalOpen.notes}</p>
                            )}
                        </div>
                        {productDetailsModalOpen.price_breakdown && (
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <h4 className="text-sm font-semibold text-slate-900 mb-2">Price Breakdown</h4>
                                <div className="space-y-1 text-sm">
                                    {productDetailsModalOpen.price_breakdown.metal && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Metal:</span>
                                            <span className="font-semibold text-slate-900">₹ {Number(productDetailsModalOpen.price_breakdown.metal).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    {productDetailsModalOpen.price_breakdown.diamond && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Diamond:</span>
                                            <span className="font-semibold text-slate-900">₹ {Number(productDetailsModalOpen.price_breakdown.diamond).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    {productDetailsModalOpen.price_breakdown.making && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-600">Making:</span>
                                            <span className="font-semibold text-slate-900">₹ {Number(productDetailsModalOpen.price_breakdown.making).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                    {productDetailsModalOpen.price_breakdown.total && (
                                        <div className="mt-2 flex justify-between border-t border-slate-300 pt-2">
                                            <span className="font-semibold text-slate-900">Unit Total:</span>
                                            <span className="font-bold text-slate-900">₹ {Number(productDetailsModalOpen.price_breakdown.total).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Remove Item Confirmation Modal */}
            <ConfirmationModal
                isOpen={removeItemConfirm.show}
                onClose={() => setRemoveItemConfirm({ show: false, itemId: null })}
                onConfirm={handleRemoveItem}
                title="Remove Item"
                message="Are you sure you want to remove this item from the quotation?"
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
            />
        </>
    );
}
