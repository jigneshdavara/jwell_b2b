'use client';

import { Head } from '@/components/Head';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { useRouter } from 'next/navigation';
import { toastError } from '@/utils/toast';
import { Invoice, InvoiceStatus } from '@/types/invoice';
import PrimaryButton from '@/components/ui/PrimaryButton';
import SecondaryButton from '@/components/ui/SecondaryButton';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
});

const statusColors: Record<InvoiceStatus, string> = {
    [InvoiceStatus.DRAFT]: 'bg-slate-100 text-slate-700',
    [InvoiceStatus.SENT]: 'bg-elvee-blue/10 text-elvee-blue',
    [InvoiceStatus.PAID]: 'bg-emerald-100 text-emerald-700',
    [InvoiceStatus.OVERDUE]: 'bg-rose-100 text-rose-700',
    [InvoiceStatus.CANCELLED]: 'bg-rose-100 text-rose-700',
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

export default function AdminInvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchInvoice();
    }, [resolvedParams.id]);

    const fetchInvoice = async () => {
        setLoading(true);
        try {
            const response = await adminService.getInvoice(Number(resolvedParams.id));
            setInvoice(response.data);
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to load invoice');
            router.push('/admin/invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!invoice) return;
        try {
            const response = await adminService.downloadInvoicePdf(Number(invoice.id));
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${invoice.invoice_number}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to download invoice PDF');
        }
    };

    const handleStatusUpdate = async (newStatus: InvoiceStatus) => {
        if (!invoice) return;
        setUpdating(true);
        try {
            await adminService.updateInvoice(Number(invoice.id), { status: newStatus });
            await fetchInvoice();
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to update invoice status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <>
                <Head title="Loading Invoice..." />
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-xs sm:text-sm text-slate-500">Loading invoice details...</p>
                </div>
            </>
        );
    }

    if (!invoice) {
        return (
            <>
                <Head title="Invoice Not Found" />
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-xs sm:text-sm text-slate-500">Invoice not found</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Invoice ${invoice.invoice_number}`} />

            <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
                <header className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900">
                                Invoice {invoice.invoice_number}
                            </h1>
                            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500">
                                {invoice.order?.user?.name ?? 'Guest'} · {invoice.order?.user?.email ?? '—'}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <PrimaryButton
                                onClick={handleDownloadPdf}
                                className="text-xs sm:text-sm"
                            >
                                Download PDF
                            </PrimaryButton>
                            <Link
                                href="/admin/invoices"
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
                                {invoice.order?.user ? (
                                    <>
                                        <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg font-semibold text-slate-900">
                                            {invoice.order.user.business_name || invoice.order.user.name}
                                        </p>
                                        <p className="mt-1 text-xs sm:text-sm text-slate-600">{invoice.order.user.email}</p>
                                        {invoice.order.user.address?.line1 && (
                                            <p className="mt-1 text-xs sm:text-sm text-slate-600">{invoice.order.user.address.line1}</p>
                                        )}
                                        {invoice.order.user.address?.line2 && (
                                            <p className="text-xs sm:text-sm text-slate-600">{invoice.order.user.address.line2}</p>
                                        )}
                                        {(invoice.order.user.address?.city ||
                                            invoice.order.user.address?.state ||
                                            invoice.order.user.address?.postal_code) && (
                                            <p className="text-xs sm:text-sm text-slate-600">
                                                {[
                                                    invoice.order.user.address.city,
                                                    invoice.order.user.address.state,
                                                    invoice.order.user.address.postal_code,
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </p>
                                        )}
                                        {invoice.order.user.gst_number && (
                                            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600">GST: {invoice.order.user.gst_number}</p>
                                        )}
                                        {invoice.order.user.pan_number && (
                                            <p className="text-xs sm:text-sm text-slate-600">PAN: {invoice.order.user.pan_number}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg font-semibold text-slate-900">Unknown</p>
                                )}
                            </div>
                            {/* Invoice Details */}
                            <div className="text-left sm:text-right">
                                <h3 className="text-[10px] sm:text-xs font-semibold text-slate-400">Invoice Details</h3>
                                <p className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg font-semibold text-slate-900">{invoice.invoice_number}</p>
                                {invoice.order?.reference && (
                                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                        Order: <Link
                                            href={`/admin/orders/${invoice.order.id}`}
                                            className="font-semibold text-elvee-blue hover:text-elvee-blue/80"
                                        >
                                            {invoice.order.reference}
                                        </Link>
                                    </p>
                                )}
                                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                    Issue Date: <span className="font-semibold text-slate-900">{formatDate(invoice.issue_date)}</span>
                                </p>
                                {invoice.due_date && (
                                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                        Due Date: <span className="font-semibold text-slate-900">{formatDate(invoice.due_date)}</span>
                                    </p>
                                )}
                                <div className="mt-2 sm:mt-3 flex sm:justify-end gap-2">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold ${statusColors[invoice.status] ?? 'bg-slate-200 text-slate-700'}`}>
                                        {invoice.status_label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Table - Invoice Style */}
                    {invoice.order?.items && invoice.order.items.length > 0 && (
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
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invoice.order.items.map((item) => (
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
                                                            {item.sku && (
                                                                <p className="text-[10px] sm:text-xs text-slate-400">SKU {item.sku}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 sm:px-4 sm:py-4 text-right">
                                                    <div className="text-xs sm:text-sm font-semibold text-slate-900">
                                                        {currencyFormatter.format(parseFloat(item.unit_price))}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 sm:px-4 sm:py-4 text-center">
                                                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">{item.quantity}</span>
                                                </td>
                                                <td className="px-3 py-3 sm:px-4 sm:py-4 text-right">
                                                    <div className="text-xs sm:text-sm font-semibold text-slate-900">
                                                        {currencyFormatter.format(parseFloat(item.total_price))}
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
                                                {currencyFormatter.format(parseFloat(invoice.subtotal_amount))}
                                            </td>
                                        </tr>
                                        {parseFloat(invoice.discount_amount) > 0 && (
                                            <tr>
                                                <td colSpan={2} className="px-3 py-2 sm:px-4 text-right text-xs sm:text-sm text-slate-600">
                                                    Discount
                                                </td>
                                                <td className="px-3 py-2 sm:px-4"></td>
                                                <td className="px-3 py-2 sm:px-4 text-right text-xs sm:text-sm font-semibold text-slate-900">
                                                    -{currencyFormatter.format(parseFloat(invoice.discount_amount))}
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td colSpan={2} className="px-3 py-2 sm:px-4 text-right text-xs sm:text-sm text-slate-600">
                                                Tax (GST)
                                            </td>
                                            <td className="px-3 py-2 sm:px-4"></td>
                                            <td className="px-3 py-2 sm:px-4 text-right text-xs sm:text-sm font-semibold text-slate-900">
                                                {currencyFormatter.format(parseFloat(invoice.tax_amount))}
                                            </td>
                                        </tr>
                                        <tr className="border-t-2 border-slate-300">
                                            <td colSpan={2} className="px-3 py-2 sm:px-4 sm:py-3 text-right text-sm sm:text-base font-bold text-slate-900">
                                                Grand Total
                                            </td>
                                            <td className="px-3 py-2 sm:px-4 sm:py-3"></td>
                                            <td className="px-3 py-2 sm:px-4 sm:py-3 text-right text-base sm:text-lg font-bold text-slate-900">
                                                {currencyFormatter.format(parseFloat(invoice.total_amount))}
                                            </td>
                                            <td className="px-3 py-2 sm:px-4 sm:py-3"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                        <div className="space-y-4 sm:space-y-6">
                            {/* Status Update */}
                            {invoice.status === InvoiceStatus.DRAFT && (
                                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
                                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Update Status</h2>
                                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                                        <SecondaryButton
                                            onClick={() => handleStatusUpdate(InvoiceStatus.SENT)}
                                            disabled={updating}
                                            className="text-xs sm:text-sm"
                                        >
                                            {updating ? 'Updating...' : 'Mark as Sent'}
                                        </SecondaryButton>
                                    </div>
                                </div>
                            )}

                            {/* Notes and Terms */}
                            {(invoice.notes || invoice.terms) && (
                                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
                                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">Additional Information</h2>
                                    <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 text-xs sm:text-sm text-slate-600">
                                        {invoice.notes && (
                                            <div>
                                                <h3 className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-slate-700 sm:text-slate-800">Notes</h3>
                                                <p className="whitespace-pre-wrap">{invoice.notes}</p>
                                            </div>
                                        )}
                                        {invoice.terms && (
                                            <div>
                                                <h3 className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-semibold text-slate-700 sm:text-slate-800">Terms</h3>
                                                <p className="whitespace-pre-wrap">{invoice.terms}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            {/* Invoice Timeline */}
                            <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/70">
                                <h2 className="text-base sm:text-lg font-semibold text-slate-900">Invoice Timeline</h2>
                                <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
                                    <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] sm:text-xs font-semibold text-slate-400">Created</p>
                                                <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{formatDate(invoice.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {invoice.updated_at && invoice.updated_at !== invoice.created_at && (
                                        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] sm:text-xs font-semibold text-slate-400">Last Updated</p>
                                                    <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{formatDate(invoice.updated_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
