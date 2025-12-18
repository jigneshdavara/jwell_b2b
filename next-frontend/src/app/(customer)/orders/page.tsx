'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { route } from '@/utils/route';
import api from '@/services/api';

type OrderListItem = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    total_amount: number;
    created_at?: string | null;
    items: Array<{ id: number; name: string; quantity: number; }>;
};

type OrdersData = {
    data: OrderListItem[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    dispatched: 'bg-elvee-blue/10 text-elvee-blue',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<OrdersData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            // Mock orders data
            const mockOrders: OrdersData = {
                data: [
                    { id: 1, reference: 'ORD-2025-001', status: 'approved', status_label: 'Approved', total_amount: 125000, created_at: new Date().toISOString(), items: [{ id: 1, name: 'Diamond Ring', quantity: 1 }] },
                    { id: 2, reference: 'ORD-2025-002', status: 'pending', status_label: 'Pending', total_amount: 85000, created_at: new Date().toISOString(), items: [{ id: 2, name: 'Gold Bracelet', quantity: 1 }] },
                ],
                links: [],
            };
            setOrders(mockOrders);
            setLoading(false);
        };
        fetchOrders();
    }, []);

    const formatDate = (input?: string | null) => input ? new Date(input).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    if (loading && !orders) {
        return (
            <div className="flex items-center justify-center py-20"><div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" /></div>
        );
    }

    return (
        <div className="space-y-10">
                <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">My orders</h1>
                        <p className="mt-2 text-sm text-slate-500">Track production and fulfillment.</p>
                    </div>
                    <Link href={route('frontend.catalog.index')} className="bg-elvee-blue text-white px-4 py-2 rounded-full text-sm font-semibold">Browse catalogue</Link>
                </header>

                <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    {!orders?.data || orders.data.length === 0 ? (
                        <div className="py-16 text-center text-slate-500 space-y-4">
                            <p>No confirmed orders yet.</p>
                            <Link href={route('frontend.catalog.index')} className="bg-elvee-blue text-white px-4 py-2 rounded-full inline-block">Browse catalogue</Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b border-slate-200 text-xs text-slate-600 font-semibold uppercase">
                                    <tr><th className="px-4 py-3 text-left">Order Reference</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Items</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {orders.data.map(o => (
                                        <tr key={o.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-4 font-semibold text-slate-900">{o.reference}</td>
                                            <td className="px-4 py-4"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[o.status] || 'bg-slate-100'}`}>{o.status_label}</span></td>
                                            <td className="px-4 py-4">{o.items.length} item{o.items.length !== 1 ? 's' : ''}</td>
                                            <td className="px-4 py-4 text-slate-600">{formatDate(o.created_at)}</td>
                                            <td className="px-4 py-4 text-right font-semibold">{currencyFormatter.format(o.total_amount)}</td>
                                            <td className="px-4 py-4 text-right">
                                                <Link href={route('frontend.orders.show', o.id)} className="p-2 border rounded hover:bg-slate-50 text-slate-600 inline-block"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" strokeWidth={2} /></svg></Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
    );
}

