'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import { route } from '@/utils/route';

type OrderItem = {
    id: number;
    sku: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    configuration?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    price_breakdown?: {
        metal?: number;
        diamond?: number;
        making?: number;
        subtotal?: number;
        discount?: number;
        total?: number;
    } | null;
    calculated_making_charge?: number | null;
    product?: {
        id: number;
        name: string;
        sku: string;
        media: Array<{ url: string; alt: string }>;
    } | null;
};

type OrderDetails = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    subtotal_amount: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    created_at?: string | null;
    updated_at?: string | null;
    items: OrderItem[];
    user?: { name: string; email: string; };
    payments: Array<{ id: number; status: string; amount: number; created_at?: string | null; }>;
    status_history: Array<{ id: number; status: string; created_at?: string | null; meta?: any; }>;
    quotations?: Array<{ id: number; status: string; quantity: number; product?: any; }>;
};

const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
const formatDate = (i?: string | null) => i ? new Date(i).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    dispatched: 'bg-elvee-blue/10 text-elvee-blue',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
};

export default function AdminOrderShowPage() {
    const { id } = useParams();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [productDetailsModalOpen, setProductDetailsModalOpen] = useState<OrderItem | null>(null);
    const [statusValue, setStatusValue] = useState('');
    const [comment, setComment] = useState('');

    useEffect(() => {
        // Mock data
        setOrder({
            id: Number(id),
            reference: `ORD-2025-00${id}`,
            status: 'approved',
            status_label: 'Approved',
            subtotal_amount: 125000,
            tax_amount: 0,
            discount_amount: 0,
            total_amount: 125000,
            created_at: new Date().toISOString(),
            items: [
                { id: 1, sku: 'ELV-1001', name: 'Diamond Solitaire Ring', quantity: 1, unit_price: 125000, total_price: 125000, product: { id: 1, name: 'Diamond Ring', sku: 'ELV-1001', media: [] } }
            ],
            user: { name: 'Diamond Partner', email: 'partner@example.com' },
            payments: [{ id: 1, status: 'succeeded', amount: 125000, created_at: new Date().toISOString() }],
            status_history: [{ id: 1, status: 'approved', created_at: new Date().toISOString() }]
        });
        setStatusValue('approved');
        setLoading(false);
    }, [id]);

    const handleSubmitStatus = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Status updated to ${statusValue} with comment: ${comment}`);
    };

    if (loading || !order) return <div className="flex justify-center py-20"><div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" /></div>;

    return (
        <div className="space-y-10">
            <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 flex justify-between items-center">
                <div><h1 className="text-3xl font-semibold">Order {order.reference}</h1><p className="text-sm text-slate-500">{order.user?.name} · {order.user?.email}</p></div>
                <Link href="/admin/dashboard" className="border px-4 py-2 rounded-full text-sm font-semibold">Back</Link>
            </header>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 overflow-x-auto">
                        <h2 className="text-lg font-semibold mb-4">Items</h2>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-left">Item</th><th className="px-4 py-3 text-right">Unit</th><th className="px-4 py-3 text-center">Qty</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
                            <tbody className="divide-y">
                                {order.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-4 flex items-center gap-3"><div><p className="font-semibold">{item.name}</p><p className="text-xs text-slate-400">SKU {item.sku}</p></div></td>
                                        <td className="px-4 py-4 text-right">{currencyFormatter.format(item.unit_price)}</td>
                                        <td className="px-4 py-4 text-center">{item.quantity}</td>
                                        <td className="px-4 py-4 text-right font-semibold">{currencyFormatter.format(item.total_price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <form onSubmit={handleSubmitStatus} className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 space-y-4">
                        <h2 className="text-lg font-semibold">Update Status</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <select value={statusValue} onChange={e => setStatusValue(e.target.value)} className="rounded-xl border px-4 py-2">
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="delivered">Delivered</option>
                            </select>
                            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Operator note..." className="rounded-xl border px-4 py-2" />
                        </div>
                        <button type="submit" className="bg-elvee-blue text-white px-6 py-2 rounded-full font-semibold">Save Status</button>
                    </form>
                </div>

                <div className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 space-y-4">
                        <h2 className="text-lg font-semibold">Order Summary</h2>
                        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{currencyFormatter.format(order.subtotal_amount)}</span></div>
                        <div className="flex justify-between font-bold border-t pt-3"><span>Total</span><span>{currencyFormatter.format(order.total_amount)}</span></div>
                    </div>
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                        <h2 className="text-lg font-semibold mb-4">Status History</h2>
                        <div className="space-y-3">
                            {order.status_history.map(h => (
                                <div key={h.id} className="flex justify-between items-center text-sm border-b pb-2">
                                    <span className="capitalize font-medium">{h.status.replace(/_/g, ' ')}</span>
                                    <span className="text-xs text-slate-400">{formatDate(h.created_at)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

