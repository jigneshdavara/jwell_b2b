'use client';

import { Head } from '@/components/Head';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { frontendService } from '@/services/frontendService';
import { useRouter } from 'next/navigation';
import { toastError } from '@/utils/toast';
import { Invoice } from '@/types/invoice';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { formatCurrency } from '@/utils/formatting';
import { route } from '@/utils/route';
import { getMediaUrl } from '@/utils/mediaUrl';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
});

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    sent: 'bg-elvee-blue/10 text-elvee-blue',
    paid: 'bg-emerald-100 text-emerald-700',
    overdue: 'bg-rose-100 text-rose-700',
    cancelled: 'bg-rose-100 text-rose-700',
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


export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [companySettings, setCompanySettings] = useState<any>(null);

    useEffect(() => {
        fetchInvoice();
    }, [resolvedParams.id]);

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

    const fetchInvoice = async () => {
        setLoading(true);
        try {
            const invoiceId = Number(resolvedParams.id);
            if (isNaN(invoiceId)) {
                toastError('Invalid invoice ID');
                router.push('/invoices');
                return;
            }
            const response = await frontendService.getInvoice(invoiceId);
            setInvoice(response.data);
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to load invoice');
            router.push('/invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!invoice) return;
        try {
            const response = await frontendService.downloadInvoicePdf(Number(invoice.id));
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

            <div className="space-y-3 px-3 py-3 sm:space-y-4 sm:px-4 sm:py-4 lg:space-y-6 lg:px-6 lg:py-6">
                <header className="rounded-xl sm:rounded-2xl lg:rounded-3xl bg-white p-3 sm:p-4 lg:p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-slate-900 break-words">
                                Invoice {invoice.invoice_number}
                            </h1>
                            <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs md:text-sm text-slate-500 break-words">
                                {invoice.order?.user?.name ?? 'Guest'} · {invoice.order?.user?.email ?? '—'}
                            </p>
                        </div>
                        <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-2 sm:gap-2.5">
                            <PrimaryButton
                                onClick={handleDownloadPdf}
                                className="text-[10px] sm:text-xs md:text-sm w-full sm:w-auto"
                            >
                                Download PDF
                            </PrimaryButton>
                            <Link
                                href={route('customer.invoices.index')}
                                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-slate-300 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs md:text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 w-full sm:w-auto"
                            >
                                Back to list
                            </Link>
                        </div>
                    </div>
                </header>

                <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                    {/* Invoice Header */}
                    <div className="rounded-xl sm:rounded-2xl lg:rounded-3xl bg-white p-3 sm:p-4 lg:p-6 shadow-xl ring-1 ring-slate-200/70">
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
                                {invoice.order?.user ? (
                                    <>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 sm:mt-3 sm:text-base lg:text-lg">
                                            {invoice.order.user.business_name || invoice.order.user.name}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600 sm:text-sm">{invoice.order.user.email}</p>
                                        {invoice.order.user.address?.line1 && (
                                            <p className="mt-1 text-xs text-slate-600 sm:text-sm">{invoice.order.user.address.line1}</p>
                                        )}
                                        {invoice.order.user.address?.line2 && (
                                            <p className="text-xs text-slate-600 sm:text-sm">{invoice.order.user.address.line2}</p>
                                        )}
                                        {(invoice.order.user.address?.city ||
                                            invoice.order.user.address?.state ||
                                            invoice.order.user.address?.postal_code) && (
                                            <p className="text-xs text-slate-600 sm:text-sm">
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
                                            <p className="mt-1.5 text-xs text-slate-600 sm:mt-2 sm:text-sm">GST: {invoice.order.user.gst_number}</p>
                                        )}
                                        {invoice.order.user.pan_number && (
                                            <p className="text-xs text-slate-600 sm:text-sm">PAN: {invoice.order.user.pan_number}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="mt-2 text-sm font-semibold text-slate-900 sm:mt-3 sm:text-base lg:text-lg">Your Account</p>
                                )}
                            </div>
                            {/* Invoice Details */}
                            <div className="text-left sm:text-right">
                                <h3 className="text-[10px] font-semibold text-slate-400 sm:text-xs">
                                    Invoice Details
                                </h3>
                                <p className="mt-2 text-sm font-semibold text-slate-900 sm:mt-3 sm:text-base lg:text-lg">
                                    {invoice.invoice_number}
                                </p>
                                {invoice.order?.reference && (
                                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                        Order:{" "}
                                        <Link
                                            href={route('customer.orders.show', { id: invoice.order.id })}
                                            className="font-semibold text-elvee-blue hover:text-elvee-blue/80"
                                        >
                                            {invoice.order.reference}
                                        </Link>
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                    Issue Date:{" "}
                                    <span className="font-semibold text-slate-900">
                                        {formatDate(invoice.issue_date)}
                                    </span>
                                </p>
                                {invoice.due_date && (
                                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                                        Due Date:{" "}
                                        <span className="font-semibold text-slate-900">
                                            {formatDate(invoice.due_date)}
                                        </span>
                                    </p>
                                )}
                                <div className="mt-2 flex justify-start gap-2 sm:mt-3 sm:justify-end">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${
                                            statusColors[invoice.status] ?? "bg-slate-200 text-slate-700"
                                        }`}
                                    >
                                        {invoice.status_label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Table - Invoice Style */}
                    {invoice.order?.items && invoice.order.items.length > 0 && (
                        <div className="rounded-xl sm:rounded-2xl lg:rounded-3xl bg-white p-3 sm:p-4 lg:p-6 shadow-xl ring-1 ring-slate-200/70">
                            <h2 className="mb-2 sm:mb-3 md:mb-4 text-sm sm:text-base md:text-lg font-semibold text-slate-900">Items</h2>
                            <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6">
                                <div className="inline-block min-w-full align-middle px-3 sm:px-4 lg:px-6">
                                    <table className="min-w-full text-[10px] sm:text-xs md:text-sm">
                                        <thead className="border-b-2 border-slate-200 bg-slate-50">
                                            <tr>
                                                <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 text-left text-[9px] sm:text-[10px] md:text-xs font-semibold text-slate-600">Item</th>
                                                <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 text-right text-[9px] sm:text-[10px] md:text-xs font-semibold text-slate-600 whitespace-nowrap">Unit Price</th>
                                                <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 text-center text-[9px] sm:text-[10px] md:text-xs font-semibold text-slate-600">Qty</th>
                                                <th className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-3 text-right text-[9px] sm:text-[10px] md:text-xs font-semibold text-slate-600">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {invoice.order.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-4">
                                                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                                                            {item.product?.media?.[0] && getMediaUrl(item.product.media[0].url) && (
                                                                <img
                                                                    src={getMediaUrl(item.product.media[0].url)!}
                                                                    alt={(item.product.media[0] as any)?.alt || item.name}
                                                                    className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 flex-shrink-0 rounded-lg object-cover shadow-sm"
                                                                />
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900 break-words">{item.name}</p>
                                                                {item.sku && (
                                                                    <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 break-words">SKU {item.sku}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-4 text-right whitespace-nowrap">
                                                        <div className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900">
                                                            {currencyFormatter.format(parseFloat(item.unit_price))}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-4 text-center">
                                                        <span className="font-semibold text-slate-900 text-[10px] sm:text-xs md:text-sm">{item.quantity}</span>
                                                    </td>
                                                    <td className="px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-4 text-right whitespace-nowrap">
                                                        <div className="text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900">
                                                            {currencyFormatter.format(parseFloat(item.total_price))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                                            <tr>
                                                <td colSpan={2} className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 text-right text-[10px] sm:text-xs md:text-sm text-slate-600">
                                                    Subtotal
                                                </td>
                                                <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4"></td>
                                                <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 text-right text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900 whitespace-nowrap">
                                                    {currencyFormatter.format(parseFloat(invoice.subtotal_amount))}
                                                </td>
                                            </tr>
                                            {parseFloat(invoice.discount_amount) > 0 && (
                                                <tr>
                                                    <td colSpan={2} className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 text-right text-[10px] sm:text-xs md:text-sm text-slate-600">
                                                        Discount
                                                    </td>
                                                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4"></td>
                                                    <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 text-right text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900 whitespace-nowrap">
                                                        -{currencyFormatter.format(parseFloat(invoice.discount_amount))}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td colSpan={2} className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 text-right text-[10px] sm:text-xs md:text-sm text-slate-600">
                                                    Tax (GST)
                                                </td>
                                                <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4"></td>
                                                <td className="px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 text-right text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900 whitespace-nowrap">
                                                    {currencyFormatter.format(parseFloat(invoice.tax_amount))}
                                                </td>
                                            </tr>
                                            <tr className="border-t-2 border-slate-300">
                                                <td colSpan={2} className="px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 text-right text-xs sm:text-sm md:text-base font-bold text-slate-900">
                                                    Grand Total
                                                </td>
                                                <td className="px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3"></td>
                                                <td className="px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 text-right text-sm sm:text-base md:text-lg font-bold text-slate-900 whitespace-nowrap">
                                                    {currencyFormatter.format(parseFloat(invoice.total_amount))}
                                                </td>
                                                <td className="px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
                        <div className="space-y-3 sm:space-y-4 md:space-y-6">
                            {/* Notes and Terms */}
                            {(invoice.notes || invoice.terms) && (
                                <div className="rounded-xl sm:rounded-2xl lg:rounded-3xl bg-white p-3 sm:p-4 lg:p-6 shadow-xl ring-1 ring-slate-200/70">
                                    <h2 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900">Additional Information</h2>
                                    <div className="mt-2 sm:mt-3 md:mt-4 space-y-2.5 sm:space-y-3 md:space-y-4 text-[10px] sm:text-xs md:text-sm text-slate-600">
                                        {invoice.notes && (
                                            <div>
                                                <h3 className="mb-1 sm:mb-1.5 md:mb-2 text-[10px] sm:text-xs md:text-sm font-semibold text-slate-700 md:text-slate-800">Notes</h3>
                                                <p className="whitespace-pre-wrap break-words">{invoice.notes}</p>
                                            </div>
                                        )}
                                        {invoice.terms && (
                                            <div>
                                                <h3 className="mb-1 sm:mb-1.5 md:mb-2 text-[10px] sm:text-xs md:text-sm font-semibold text-slate-700 md:text-slate-800">Terms</h3>
                                                <p className="whitespace-pre-wrap break-words">{invoice.terms}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 sm:space-y-4 md:space-y-6">
                            {/* Invoice Timeline */}
                            <div className="rounded-xl sm:rounded-2xl lg:rounded-3xl bg-white p-3 sm:p-4 lg:p-6 shadow-xl ring-1 ring-slate-200/70">
                                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-slate-900">Invoice Timeline</h2>
                                <div className="mt-2 sm:mt-3 md:mt-4 space-y-2 sm:space-y-2.5 md:space-y-3">
                                    <div className="rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3">
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-slate-400">Created</p>
                                                <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900 break-words">{formatDate(invoice.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {invoice.updated_at && invoice.updated_at !== invoice.created_at && (
                                        <div className="rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3">
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-slate-400">Last Updated</p>
                                                    <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs md:text-sm font-semibold text-slate-900 break-words">{formatDate(invoice.updated_at)}</p>
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
