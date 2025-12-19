'use client';

import { Head } from '@/components/Head';
import { useState } from 'react';

type DiamondClarityRow = {
    id: number;
    name: string;
    is_active: boolean;
};

const mockClarities: DiamondClarityRow[] = [
    { id: 1, name: 'VVS1', is_active: true },
    { id: 2, name: 'VS1', is_active: true },
    { id: 3, name: 'SI1', is_active: true },
];

export default function AdminDiamondClaritiesIndex() {
    const [allClarities] = useState<DiamondClarityRow[]>(mockClarities);

    return (
        <>
            <Head title="Diamond Clarities" />
            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Diamond Clarities</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage clarity grades for diamonds.</p>
                    </div>
                </div>
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {allClarities.map((clarity) => (
                                <tr key={clarity.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{clarity.name}</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            clarity.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {clarity.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
