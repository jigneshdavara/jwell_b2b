import ProductionLayout from '@/Layouts/ProductionLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';

type WorkOrder = {
    id: number;
    status: string;
    due_date?: string | null;
    order?: {
        reference: string;
    } | null;
    jobwork_request?: {
        id: number;
    } | null;
};

type ProductionWorkOrdersPageProps = AppPageProps<{
    workOrders: {
        data: WorkOrder[];
    };
    statuses: string[];
}>;

export default function ProductionWorkOrdersIndex() {
    const { props } = usePage<ProductionWorkOrdersPageProps>();

    return (
        <ProductionLayout>
            <Head title="Work Orders" />

            <div className="space-y-8">
                <div className="rounded-3xl border border-slate-800/60 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/40">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <h1 className="text-2xl font-semibold text-white">Work orders</h1>
                        <div className="text-xs uppercase tracking-[0.35em] text-slate-400">
                            Statuses · {props.statuses.join(' / ')}
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/70 shadow-xl shadow-slate-950/40">
                    <table className="min-w-full divide-y divide-slate-800 text-sm text-slate-200">
                        <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.3em] text-slate-400">
                            <tr>
                                <th className="px-5 py-3 text-left">ID</th>
                                <th className="px-5 py-3 text-left">Order / Jobwork</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-left">Due date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {props.workOrders.data.map((workOrder) => (
                                <tr key={workOrder.id} className="hover:bg-slate-800/60">
                                    <td className="px-5 py-3 font-semibold text-white">WO-{workOrder.id}</td>
                                    <td className="px-5 py-3 text-slate-300">
                                        {workOrder.order
                                            ? `Order ${workOrder.order.reference}`
                                            : workOrder.jobwork_request
                                            ? `Jobwork #${workOrder.jobwork_request.id}`
                                            : '—'}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-200">
                                            {workOrder.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-slate-300">{workOrder.due_date ?? '—'}</td>
                                </tr>
                            ))}
                            {props.workOrders.data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-5 py-6 text-center text-sm text-slate-400">
                                        No work orders available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ProductionLayout>
    );
}

