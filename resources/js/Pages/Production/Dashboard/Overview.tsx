import ProductionLayout from '@/Layouts/ProductionLayout';
import type { PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const statusColors: Record<string, string> = {
    queued: 'bg-amber-100 text-amber-700',
    in_production: 'bg-sky-100 text-sky-700',
    qc: 'bg-indigo-100 text-indigo-700',
    ready_to_dispatch: 'bg-purple-100 text-purple-700',
    dispatched: 'bg-blue-100 text-blue-700',
    delivered: 'bg-emerald-100 text-emerald-700',
};

type ProductionDashboardProps = {
    metrics: Record<string, number>;
    activeWorkOrders: Array<{
        id: number;
        code: string;
        status: string;
        stage_notes?: string | null;
        deadline: string | null;
        order_reference?: string | null;
    }>;
    jobworkHandovers: Array<{
        id: number;
        status: string;
        quantity: number;
        metal: string;
        deadline: string | null;
    }>;
};

const labels: Record<string, string> = {
    in_queue: 'In Queue',
    quality_check: 'In QC',
    dispatch_ready: 'Ready to Dispatch',
};

export default function ProductionDashboardOverview() {
    const { metrics, activeWorkOrders, jobworkHandovers } =
        usePage<PageProps<ProductionDashboardProps>>().props;

    return (
        <ProductionLayout>
            <Head title="Production Control" />

            <div className="space-y-8">
                <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/40">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Ops Console</p>
                            <h1 className="mt-2 text-3xl font-semibold text-white">Production Control Room</h1>
                            <p className="mt-2 text-sm text-slate-400">
                                Track throughput, QC queues, and dispatch readiness in real time.
                            </p>
                        </div>
                        <a
                            href="mailto:production@elvee.in"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                        >
                            Escalate an issue
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </a>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {Object.entries(metrics).map(([key, value]) => (
                        <div key={key} className="rounded-2xl border border-slate-800/60 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/50">
                            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{labels[key] ?? key.replace(/_/g, ' ')}</p>
                            <p className="mt-4 text-4xl font-semibold text-white">{value}</p>
                            <p className="mt-3 text-xs text-slate-500">Live feed synced</p>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40">
                        <h2 className="text-lg font-semibold text-white">Active Work Orders</h2>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Prioritised by due date</p>
                        <div className="mt-6 space-y-4">
                            {activeWorkOrders.map((order) => (
                                <div key={order.id} className="rounded-2xl border border-slate-800/60 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{order.code ?? `WO-${order.id}`}</p>
                                            <p className="text-xs text-slate-400">Linked to order {order.order_reference ?? 'N/A'}</p>
                                        </div>
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                statusColors[order.status] ?? 'bg-slate-800 text-slate-200'
                                            }`}
                                        >
                                            {order.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    {order.stage_notes && (
                                        <p className="mt-3 text-xs text-slate-400">{order.stage_notes}</p>
                                    )}
                                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                        <span>
                                            Deadline {order.deadline ? new Date(order.deadline).toLocaleDateString('en-IN') : 'TBD'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {activeWorkOrders.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
                                    No work orders in production.
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40">
                        <h2 className="text-lg font-semibold text-white">Jobwork Awaiting Conversion</h2>
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Ready to schedule</p>
                        <div className="mt-6 space-y-4">
                            {jobworkHandovers.map((job) => (
                                <div key={job.id} className="rounded-2xl border border-slate-800/60 p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-white">Request #{job.id}</p>
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                statusColors[job.status] ?? 'bg-slate-800 text-slate-200'
                                            }`}
                                        >
                                            {job.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-300">
                                        {job.quantity} pcs · {job.metal}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">
                                        Deadline {job.deadline ? new Date(job.deadline).toLocaleDateString('en-IN') : 'TBD'}
                                    </p>
                                </div>
                            ))}
                            {jobworkHandovers.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
                                    All jobwork requests have been converted.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </ProductionLayout>
    );
}

