'use client';

import { useEffect, useState, useMemo, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import { route } from '@/utils/route';
import api from '@/services/api';

type RelatedQuotation = {
    id: number;
    status: string;
    quantity: number;
    notes?: string | null;
    product: { id: number; name: string; sku: string; media: Array<{ url: string; alt: string }>; };
    variant?: { id: number; label: string; metadata?: any; } | null;
    price_breakdown?: any;
};

type QuotationDetails = RelatedQuotation & {
    admin_notes?: string | null;
    created_at?: string | null;
    related_quotations?: RelatedQuotation[];
    user?: { name?: string | null; email?: string | null; } | null;
    order?: any;
    tax_summary?: any;
    tax_rate?: number;
    messages: Array<{ id: number; sender: 'customer' | 'admin'; message: string; created_at?: string | null; author?: string | null; }>;
};

const statusBadge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
};

const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const formatDate = (i?: string | null) => i ? new Date(i).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

export default function QuotationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [declineNotes, setDeclineNotes] = useState('');
    const [productDetailsModalOpen, setProductDetailsModalOpen] = useState<RelatedQuotation | null>(null);

    const fetchQuotation = async () => {
        try {
            const response = await api.get(`/quotations/${params.id}`, { headers: { 'X-Inertia': 'true', 'X-Inertia-Version': 'mock' } });
            setQuotation(response.data.props?.quotation || response.data);
        } catch (error) {
            console.error('Failed to fetch quotation', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (params.id) fetchQuotation(); }, [params.id]);

    const submitMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        try {
            await api.post(`/quotations/${params.id}/messages`, { message });
            setMessage('');
            fetchQuotation();
        } catch (error) { console.error(error); }
    };

    const handleConfirm = async () => {
        try { await api.post(`/quotations/${params.id}/confirm`); fetchQuotation(); } catch (error) { console.error(error); }
    };

    const handleDecline = async (e: FormEvent) => {
        e.preventDefault();
        try { await api.post(`/quotations/${params.id}/decline`, { notes: declineNotes }); fetchQuotation(); } catch (error) { console.error(error); }
    };

    if (loading || !quotation) {
        return <div className="flex justify-center py-20"><div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" /></div>;
    }

    const allQuotations = [quotation, ...(quotation.related_quotations || [])];

    return (
        <>
            <div className="space-y-8">
                <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 flex justify-between items-center">
                    <div><h1 className="text-3xl font-semibold">Quotation #{quotation.id}</h1><p className="text-sm text-slate-500">View details and manage your response.</p></div>
                    <Link href={route('frontend.quotations.index')} className="border px-4 py-2 rounded-full text-sm font-semibold text-slate-600">Back to list</Link>
                </header>

                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 grid md:grid-cols-3 gap-8">
                    <div><h3 className="text-xs font-semibold text-slate-400 uppercase">From</h3><p className="mt-2 font-semibold">Elvee</p><p className="text-sm">Mumbai, Maharashtra</p></div>
                    <div><h3 className="text-xs font-semibold text-slate-400 uppercase">Bill To</h3><p className="mt-2 font-semibold">{quotation.user?.name}</p><p className="text-sm">{quotation.user?.email}</p></div>
                    <div className="text-right"><h3 className="text-xs font-semibold text-slate-400 uppercase">Details</h3><p className="mt-2 font-semibold">#{quotation.id}</p><p className="text-sm">{formatDate(quotation.created_at)}</p><span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadge[quotation.status] || 'bg-slate-100'}`}>{quotation.status.replace(/_/g, ' ')}</span></div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 overflow-x-auto">
                    <h2 className="text-lg font-semibold mb-4">Items</h2>
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left">Item</th><th className="px-4 py-3 text-right">Unit</th><th className="px-4 py-3 text-center">Qty</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-center">Info</th></tr></thead>
                        <tbody className="divide-y">
                            {allQuotations.map(item => {
                                const unit = item.price_breakdown?.total || 0;
                                return (
                                    <tr key={item.id}>
                                        <td className="px-4 py-4 flex items-center gap-3">{item.product.media?.[0] && <img src={item.product.media[0].url} className="h-10 w-10 rounded object-cover" />}<div><p className="font-semibold">{item.product.name}</p><p className="text-xs text-slate-400">SKU {item.product.sku}</p></div></td>
                                        <td className="px-4 py-4 text-right">{currencyFormatter.format(unit)}</td>
                                        <td className="px-4 py-4 text-center">{item.quantity}</td>
                                        <td className="px-4 py-4 text-right">{currencyFormatter.format(unit * item.quantity)}</td>
                                        <td className="px-4 py-4 text-center"><button onClick={() => setProductDetailsModalOpen(item)} className="text-elvee-blue">Info</button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {quotation.status === 'pending_customer_confirmation' && (
                    <div className="rounded-3xl border-2 border-amber-400 bg-amber-50 p-6 flex flex-col gap-4">
                        <h3 className="text-lg font-semibold">Action Required</h3>
                        <div className="flex gap-4">
                            <button onClick={handleConfirm} className="bg-emerald-600 text-white px-6 py-2 rounded-full font-semibold">Approve Changes</button>
                            <form onSubmit={handleDecline} className="flex-1 flex gap-2"><input value={declineNotes} onChange={e => setDeclineNotes(e.target.value)} className="flex-1 border rounded-full px-4 text-sm" placeholder="Reason (optional)" /><button type="submit" className="bg-rose-600 text-white px-6 py-2 rounded-full font-semibold">Decline</button></form>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                        <h2 className="text-lg font-semibold mb-4">Conversation</h2>
                        <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                            {quotation.messages.map(m => <div key={m.id} className={`p-3 rounded-2xl ${m.sender === 'admin' ? 'bg-elvee-blue/5 border-elvee-blue/20' : 'bg-slate-50 border-slate-200'} border`}><p className="text-xs text-slate-400 mb-1">{m.sender === 'admin' ? (m.author || 'Admin') : 'You'} · {formatDate(m.created_at)}</p><p className="text-sm">{m.message}</p></div>)}
                        </div>
                        <form onSubmit={submitMessage} className="flex gap-2"><input value={message} onChange={e => setMessage(e.target.value)} className="flex-1 border rounded-full px-4 py-2 text-sm" placeholder="Ask a question..." /><button type="submit" className="bg-elvee-blue text-white px-4 py-2 rounded-full font-semibold text-sm">Send</button></form>
                    </div>
                    {quotation.admin_notes && <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70"><h2 className="text-lg font-semibold mb-4">Admin Notes</h2><p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl">{quotation.admin_notes}</p></div>}
                </div>
            </div>

            <Modal show={!!productDetailsModalOpen} onClose={() => setProductDetailsModalOpen(null)} maxWidth="lg">
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Item Details</h3>
                    {productDetailsModalOpen && (
                        <div className="space-y-4">
                            <div className="flex gap-4">{productDetailsModalOpen.product.media?.[0] && <img src={productDetailsModalOpen.product.media[0].url} className="h-20 w-20 rounded object-cover" />}<div><p className="font-semibold">{productDetailsModalOpen.product.name}</p><p className="text-sm text-slate-500">{productDetailsModalOpen.product.sku}</p></div></div>
                            <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-2">
                                <div className="flex justify-between"><span>Unit Price</span><span>{currencyFormatter.format(productDetailsModalOpen.price_breakdown?.total || 0)}</span></div>
                                <div className="flex justify-between"><span>Quantity</span><span>{productDetailsModalOpen.quantity}</span></div>
                            </div>
                            {productDetailsModalOpen.notes && <div className="bg-amber-50 p-4 rounded-xl"><p className="text-xs font-semibold text-amber-700 uppercase mb-1">Your Notes</p><p className="text-sm">{productDetailsModalOpen.notes}</p></div>}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}

