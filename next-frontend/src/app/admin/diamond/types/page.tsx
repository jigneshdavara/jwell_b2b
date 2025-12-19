'use client';

import { Head } from '@/components/Head';
import { useState } from 'react';

type DiamondTypeRow = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
};

const mockDiamondTypes: DiamondTypeRow[] = [
    { id: 1, name: 'Natural', slug: 'natural', is_active: true },
    { id: 2, name: 'Lab Grown', slug: 'lab-grown', is_active: true },
];

export default function AdminDiamondTypesIndex() {
    const [allTypes] = useState<DiamondTypeRow[]>(mockDiamondTypes);

    return (
        <>
            <Head title="Diamond Types" />
            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Diamond Types</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage broad categories of diamond stones.</p>
                    </div>
                </div>
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Slug</th>
                                <th className="px-5 py-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {allTypes.map((type) => (
                                <tr key={type.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{type.name}</td>
                                    <td className="px-5 py-3 text-slate-500">{type.slug}</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            type.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {type.is_active ? 'Active' : 'Inactive'}
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
