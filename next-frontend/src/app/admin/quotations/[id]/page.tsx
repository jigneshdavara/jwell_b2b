'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import { route } from '@/utils/route';

type RelatedQuotation = {
    id: number;
    status: string;
    quantity: number;
    notes?: string | null;
    product: {
        id: number;
        name: string;
        sku: string;
        media: Array<{ url: string; alt: string }>;
    };
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
    created_at?: string | null;
    user?: { name?: string | null; email?: string | null; } | null;
    product: { id: number; name: string; sku: string; media: Array<{ url: string; alt: string }>; };
    price_breakdown?: { metal?: number; diamond?: number; making?: number; subtotal?: number; discount?: number; total?: number; };
    messages: Array<{ id: number; sender: 'customer' | 'admin'; message: string; created_at?: string | null; author?: string | null; }>;
};

const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const formatDate = (i?: string | null) => i ? new Date(i).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const statusBadge: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
};

export default function AdminQuotationShowPage() {
    const { id } = useParams();
    const [quotation, setQuotation] = useState<QuotationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        // Mock data
        setQuotation({
            id: Number(id),
            status: 'pending',
            quantity: 1,
            notes: 'Customer requested special engraving',
            admin_notes: '',
            created_at: new Date().toISOString(),
            user: { name: 'Diamond Partner', email: 'partner@example.com' },
            product: { id: 1, name: 'Traditional Gold Choker', sku: 'ELV-1002', media: [] },
            price_breakdown: { metal: 75000, diamond: 0, making: 10000, subtotal: 85000, discount: 0, total: 85000 },
            messages: [
                { id: 1, sender: 'customer', message: 'Is it possible to finish this by next week?', created_at: new Date().toISOString(), author: 'Diamond Partner' }
            ]
        });
        setLoading(false);
    }, [id]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        alert(`Message sent: ${newMessage}`);
        setNewMessage('');
    };

    const handleAction = (type: string) => {
        alert(`Action: ${type}`);
    };

    if (loading || !quotation) return <div className="flex justify-center py-20"><div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" /></div>;

    return (
        <div className="space-y-10">
            <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 flex justify-between items-center">
                <div><h1 className="text-3xl font-semibold text-slate-900">Quotation #{quotation.id}</h1><p className="mt-2 text-sm text-slate-500">{quotation.user?.name} · {quotation.user?.email}</p></div>
                <Link href="/admin/dashboard" className="border px-4 py-2 rounded-full text-sm font-semibold">Back</Link>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                        <div className="flex items-center gap-6">
                            <div className="h-24 w-24 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">No Image</div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold">{quotation.product.name}</h2>
                                <p className="text-slate-500">SKU: {quotation.product.sku}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge[quotation.status]}`}>{quotation.status}</span>
                                    <span className="text-sm font-medium">Qty: {quotation.quantity}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900">Conversation</h3>
                        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                            {quotation.messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.sender === 'admin' ? 'bg-elvee-blue text-white' : 'bg-slate-100 text-slate-800'}`}>
                                        <p className="text-sm">{msg.message}</p>
                                        <p className="text-[10px] mt-1 opacity-70">{msg.author} · {formatDate(msg.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 rounded-xl border px-4 py-2" placeholder="Type your message..." />
                            <button type="submit" className="bg-elvee-blue text-white px-6 py-2 rounded-xl font-semibold">Send</button>
                        </form>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900">Pricing Summary</h3>
                        {quotation.price_breakdown && (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Metal</span><span>{currencyFormatter.format(quotation.price_breakdown.metal || 0)}</span></div>
                                <div className="flex justify-between"><span>Making</span><span>{currencyFormatter.format(quotation.price_breakdown.making || 0)}</span></div>
                                <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>{currencyFormatter.format(quotation.price_breakdown.total || 0)}</span></div>
                            </div>
                        )}
                        <div className="pt-4 flex flex-col gap-2">
                            <button onClick={() => handleAction('approve')} className="w-full bg-emerald-600 text-white py-2 rounded-full font-semibold">Approve</button>
                            <button onClick={() => handleAction('reject')} className="w-full border border-rose-600 text-rose-600 py-2 rounded-full font-semibold">Reject</button>
                        </div>
                    </div>
                    
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                        <h3 className="text-lg font-semibold mb-2">Customer Notes</h3>
                        <p className="text-sm text-slate-600 italic">"{quotation.notes || 'No notes provided'}"</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

