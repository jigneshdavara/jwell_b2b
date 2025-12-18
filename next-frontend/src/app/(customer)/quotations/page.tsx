'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { route } from '@/utils/route';
import api from '@/services/api';

type QuotationRow = {
    id: number;
    status: string;
    quantity: number;
    product: { id: number; name: string; sku: string; thumbnail?: string | null; };
    created_at?: string | null;
};

const statusLabels: Record<string, { label: string; style: string }> = {
    pending: { label: 'Pending review', style: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', style: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Rejected', style: 'bg-rose-100 text-rose-700' },
    invoiced: { label: 'Awaiting payment', style: 'bg-elvee-blue/10 text-elvee-blue' },
    converted: { label: 'Converted to order', style: 'bg-slate-200 text-slate-700' },
};

export default function QuotationsPage() {
    const [quotations, setQuotations] = useState<QuotationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelConfirm, setCancelConfirm] = useState<{ show: boolean; quotationId: number | null }>({ show: false, quotationId: null });

    const fetchQuotations = async () => {
        setLoading(true);
        // Mock quotations data
        const mockQuotations: QuotationRow[] = [
            { id: 101, status: 'approved', quantity: 1, product: { id: 1, name: 'Diamond Ring', sku: 'ELV-1001' }, created_at: new Date().toISOString() },
            { id: 102, status: 'pending', quantity: 2, product: { id: 2, name: 'Gold Bracelet', sku: 'ELV-1002' }, created_at: new Date().toISOString() },
        ];
        setQuotations(mockQuotations);
        setLoading(false);
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    const formatDate = (input?: string | null) => input ? new Date(input).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    const handleCancel = async () => {
        if (!cancelConfirm.quotationId) return;
        // Mock cancel
        setQuotations(prev => prev.filter(q => q.id !== cancelConfirm.quotationId));
        setCancelConfirm({ show: false, quotationId: null });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20"><div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" /></div>
        );
    }

    return (
        <>
            <div className="space-y-10">
                <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">Quotation requests</h1>
                        <p className="mt-2 text-sm text-slate-500">Track purchase and jobwork quotations.</p>
                    </div>
                    <Link href={route('frontend.catalog.index')} className="bg-elvee-blue text-white px-4 py-2 rounded-full text-sm font-semibold">Browse catalogue</Link>
                </header>

                <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    {quotations.length === 0 ? (
                        <div className="py-16 text-center text-slate-500 space-y-4">
                            <p>No quotation requests yet.</p>
                            <Link href={route('frontend.catalog.index')} className="bg-elvee-blue text-white px-4 py-2 rounded-full inline-block">Start a quotation</Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 text-xs text-slate-600 font-semibold uppercase">
                                    <tr><th className="px-4 py-3 text-left">Quotation #</th><th className="px-4 py-3 text-left">Product</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Qty</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {quotations.map(q => (
                                        <tr key={q.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-4 font-semibold text-elvee-blue">#{q.id}</td>
                                            <td className="px-4 py-4 flex items-center gap-3">
                                                {q.product.thumbnail && <img src={q.product.thumbnail} alt="" className="h-10 w-10 rounded object-cover" />}
                                                <div><p className="font-semibold text-slate-900">{q.product.name}</p><p className="text-xs text-slate-400">{q.product.sku}</p></div>
                                            </td>
                                            <td className="px-4 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[q.status]?.style || 'bg-slate-100'}`}>{statusLabels[q.status]?.label || q.status}</span></td>
                                            <td className="px-4 py-4 font-semibold">{q.quantity}</td>
                                            <td className="px-4 py-4 text-slate-600">{formatDate(q.created_at)}</td>
                                            <td className="px-4 py-4 text-right flex gap-2 justify-end">
                                                <Link href={route('frontend.quotations.show', q.id)} className="p-2 border rounded hover:bg-slate-50 text-slate-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" strokeWidth={2} /></svg></Link>
                                                {q.status === 'pending' && <button onClick={() => setCancelConfirm({ show: true, quotationId: q.id })} className="p-2 border border-rose-200 text-rose-500 rounded hover:bg-rose-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg></button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
            <ConfirmationModal show={cancelConfirm.show} onClose={() => setCancelConfirm({ show: false, quotationId: null })} onConfirm={handleCancel} title="Cancel Quotation" message="Are you sure you want to cancel this quotation request?" />
        </>
    );
}

