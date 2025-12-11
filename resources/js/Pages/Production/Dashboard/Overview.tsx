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
};

const labels: Record<string, string> = {
    in_queue: 'In Queue',
    quality_check: 'In QC',
    dispatch_ready: 'Ready to Dispatch',
};

export default function ProductionDashboardOverview() {
    const { metrics } =
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

            </div>
        </ProductionLayout>
    );
}

