import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

type OrderRow = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    total_amount: number;
    user?: {
        name: string;
    } | null;
};

type Pagination<T> = {
    data: T[];
};

type AdminOrdersIndexPageProps = AppPageProps<{
    orders: Pagination<OrderRow>;
    statuses: string[];
}>;

export default function AdminOrdersIndex() {
    const { props } = usePage<AdminOrdersIndexPageProps>();

    return (
        <AdminLayout>
            <Head title="Orders" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
                            <p className="text-sm text-slate-500">Track commercial orders, statuses, and fulfillment readiness.</p>
                        </div>
                        <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
                            Workflow · {props.statuses.join(' → ')}
                        </span>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Reference</th>
                                <th className="px-5 py-3 text-left">Customer</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {props.orders.data.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-sky-600">
                                        <Link href={route('admin.orders.show', order.id)}>{order.reference}</Link>
                                    </td>
                                    <td className="px-5 py-3 text-slate-600">{order.user?.name ?? '—'}</td>
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                            {order.status_label}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right font-semibold text-slate-900">
                                        ₹ {order.total_amount.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                            {props.orders.data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No orders captured yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

