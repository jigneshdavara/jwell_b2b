import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const titleMap: Record<string, string> = {
    open_orders: 'Open Orders',
    jobwork_requests: 'Jobwork Requests',
    active_offers: 'Active Offers',
};

type DashboardProps = {
    stats: Record<string, number>;
    recentOrders: Array<{
        reference: string;
        status: string;
        total: number;
        items: number;
        placed_on: string;
    }>;
    jobworkTimeline: Array<{
        id: number;
        status?: string | null;
        product?: string | null;
        quantity: number;
        submitted_on: string | null;
    }>;
    dueOrders: Array<{
        reference: string;
        total: number;
        placed_on: string | null;
    }>;
};

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    in_production: 'bg-sky-100 text-sky-700',
    quality_check: 'bg-indigo-100 text-indigo-700',
    ready_to_dispatch: 'bg-purple-100 text-purple-700',
    dispatched: 'bg-blue-100 text-blue-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
    submitted: 'bg-slate-100 text-slate-700',
    material_sending: 'bg-slate-100 text-slate-700',
    material_received: 'bg-sky-100 text-sky-700',
    under_preparation: 'bg-indigo-100 text-indigo-700',
    awaiting_billing: 'bg-amber-100 text-amber-700',
    billing_confirmed: 'bg-emerald-100 text-emerald-700',
    ready_to_ship: 'bg-slate-900 text-white',
};

export default function FrontendDashboardOverview() {
    const { stats, recentOrders, jobworkTimeline, dueOrders } = usePage<PageProps<DashboardProps>>().props;

    return (
        <AuthenticatedLayout>
            <Head title="Customer Dashboard" />

            <div className="space-y-10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">Your trading cockpit</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Manage open orders, monitor jobwork and unlock offers aligned to your brand portfolio.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <a
                            href="mailto:support@aurumcraft.test"
                            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                        >
                            Contact Relationship Manager
                        </a>
                        <a
                            href="#catalog"
                            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500"
                        >
                            Browse Collections
                        </a>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(stats).map(([key, value]) => (
                        <div key={key} className="metric-card">
                            <p className="text-sm font-medium text-slate-500">
                                {titleMap[key] ?? key.replace(/_/g, ' ')}
                            </p>
                            <p className="mt-4 text-4xl font-semibold text-slate-900">
                                {value}
                            </p>
                            <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-400">
                                Updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80 lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
                            <Link
                                href={route('frontend.catalog.index')}
                                className="text-sm font-medium text-sky-600 hover:text-sky-500"
                            >
                                View catalogue
                            </Link>
                        </div>
                        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-500">Reference</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-500">Status</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-500">Total</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-500">Items</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-500">Placed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {recentOrders.map((order) => (
                                        <tr key={order.reference}>
                                            <td className="px-4 py-3 font-medium text-slate-700">{order.reference}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                        statusColors[order.status] ?? 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {order.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                {currencyFormatter.format(order.total)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-500">{order.items}</td>
                                            <td className="px-4 py-3 text-right text-slate-500">
                                                {new Date(order.placed_on).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                    {recentOrders.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-4 py-6 text-center text-sm text-slate-500"
                                            >
                                                No orders yet. Start with the catalogue to build your first purchase list.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Jobwork Timeline</h2>
                            <p className="mt-1 text-xs uppercase tracking-[0.35em] text-slate-400">Live production updates</p>
                            <div className="mt-6 space-y-5">
                                {jobworkTimeline.map((job) => (
                                    <div key={job.id} className="rounded-2xl border border-slate-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-slate-800">Quotation #{job.id}</p>
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                    (job.status && statusColors[job.status]) ??
                                                    'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {(job.status ?? 'pending').replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-600">
                                            {job.product ?? 'Catalogue design'} · {job.quantity} pcs
                                        </p>
                                        <div className="mt-3 text-xs text-slate-500">
                                            Submitted{' '}
                                            {job.submitted_on
                                                ? new Date(job.submitted_on).toLocaleDateString('en-IN', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : 'N/A'}
                                        </div>
                                    </div>
                                ))}
                                {jobworkTimeline.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                                        No jobwork submitted yet. Launch a custom request directly from any product page.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Due payments</h2>
                            <p className="mt-1 text-xs uppercase tracking-[0.35em] text-slate-400">Awaiting confirmation</p>
                            <div className="mt-4 space-y-4">
                                {dueOrders.map((order) => (
                                    <div key={order.reference} className="rounded-2xl border border-slate-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-slate-800">{order.reference}</p>
                                            <span className="text-sm font-semibold text-slate-900">
                                                {currencyFormatter.format(order.total)}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Raised{' '}
                                            {order.placed_on
                                                ? new Date(order.placed_on).toLocaleDateString('en-IN', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : 'N/A'}
                                        </p>
                                    </div>
                                ))}
                                {dueOrders.length === 0 && (
                                    <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                                        No pending payments right now.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

