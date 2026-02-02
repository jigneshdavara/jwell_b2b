'use client';

import { Head } from '@/components/Head';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';
import { InvoiceListItem, InvoiceStatus } from '@/types/invoice';
import PrimaryButton from '@/components/ui/PrimaryButton';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const statusColors: Record<InvoiceStatus, string> = {
    [InvoiceStatus.DRAFT]: 'bg-gray-100 text-gray-700',
    [InvoiceStatus.SENT]: 'bg-blue-100 text-blue-700',
    [InvoiceStatus.PAID]: 'bg-emerald-100 text-emerald-700',
    [InvoiceStatus.OVERDUE]: 'bg-rose-100 text-rose-700',
    [InvoiceStatus.CANCELLED]: 'bg-rose-100 text-rose-700',
};

export default function AdminInvoicesIndex() {
    const [loading, setLoading] = useState(true);
    const [invoicesData, setInvoicesData] = useState<InvoiceListItem[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({ current_page: 1, last_page: 1, total: 0, per_page: 20 });
    const [filters, setFilters] = useState({ status: '', search: '' });
    const [currentPage, setCurrentPage] = useState(1);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await adminService.getInvoices({
                page: currentPage,
                per_page: meta.per_page,
                ...(filters.status && { status: filters.status }),
                ...(filters.search && { search: filters.search }),
            });
            
            // Handle response structure
            const items = response.data?.items || response.data?.data || [];
            const responseMeta = response.data?.meta || {};
            
            setInvoicesData(items);
            setMeta({
                current_page: responseMeta.page || responseMeta.current_page || currentPage,
                last_page: responseMeta.total_pages || responseMeta.last_page || 1,
                total: responseMeta.total || 0,
                per_page: responseMeta.per_page || meta.per_page,
            });
        } catch (error: any) {
            console.error('Failed to fetch invoices:', error);
            // Set empty data on error
            setInvoicesData([]);
            setMeta({
                current_page: 1,
                last_page: 1,
                total: 0,
                per_page: meta.per_page,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [currentPage, filters.status]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchInvoices();
    };

    const handleDownloadPdf = async (invoiceId: string) => {
        try {
            const response = await adminService.downloadInvoicePdf(Number(invoiceId));
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoiceId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download invoice PDF:', error);
        }
    };

    return (
        <>
            <Head title="Invoices" />
            <div className="py-10 lg:py-12">
                <div className="mx-auto max-w-[95rem] px-4">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
                            <p className="mt-2 text-sm text-slate-600">
                                Manage and view all invoices
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <form onSubmit={handleSearch} className="flex gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search by invoice number, order reference, or customer name..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:ring-2 focus:ring-feather-gold/20"
                                />
                            </div>
                            <div>
                                <select
                                    value={filters.status}
                                    onChange={(e) => {
                                        setFilters({ ...filters, status: e.target.value });
                                        setCurrentPage(1);
                                    }}
                                    className="rounded-xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:ring-2 focus:ring-feather-gold/20"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="paid">Paid</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <PrimaryButton type="submit">Search</PrimaryButton>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {loading ? (
                            <div className="p-12 text-center text-slate-500">Loading...</div>
                        ) : invoicesData.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">No invoices found</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                                Invoice Number
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                                Order Reference
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                                Issue Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                                                Due Date
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-700">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {invoicesData.map((invoice) => (
                                            <tr key={invoice.id} className="hover:bg-slate-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                                                    <Link
                                                        href={`/admin/invoices/${invoice.id}`}
                                                        className="text-elvee-blue hover:text-feather-gold hover:underline"
                                                    >
                                                        {invoice.invoice_number}
                                                    </Link>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                    {invoice.order?.reference || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                    {invoice.order?.user?.name || '-'}
                                                    {invoice.order?.user?.email && (
                                                        <div className="text-xs text-slate-500">
                                                            {invoice.order.user.email}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                            statusColors[invoice.status] || 'bg-gray-100 text-gray-700'
                                                        }`}
                                                    >
                                                        {invoice.status_label}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                                                    {currencyFormatter.format(parseFloat(invoice.total_amount))}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                    {invoice.issue_date
                                                        ? new Date(invoice.issue_date).toLocaleDateString('en-IN')
                                                        : '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                                    {invoice.due_date
                                                        ? new Date(invoice.due_date).toLocaleDateString('en-IN')
                                                        : '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={`/admin/invoices/${invoice.id}`}
                                                            className="text-elvee-blue hover:text-feather-gold"
                                                        >
                                                            View
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDownloadPdf(invoice.id)}
                                                            className="text-elvee-blue hover:text-feather-gold"
                                                        >
                                                            PDF
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {meta.total > 0 && (
                        <div className="mt-6">
                            <Pagination
                                meta={meta}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

