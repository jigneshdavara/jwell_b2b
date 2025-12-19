'use client';

import { Head } from '@/components/Head';
import { useState } from 'react';

type CatalogRow = {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
};

const mockCatalogs: CatalogRow[] = [
    { id: 1, name: 'Summer Collection 2025', description: 'Lightweight jewelry for summer', is_active: true },
    { id: 2, name: 'Bridal Essentials', description: 'Premium bridal jewelry sets', is_active: true },
];

export default function AdminCatalogsIndex() {
    const [allCatalogs] = useState<CatalogRow[]>(mockCatalogs);

    return (
        <>
            <Head title="Catalogs" />
            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Catalogs</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage product catalogs and collections.</p>
                    </div>
                </div>
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Description</th>
                                <th className="px-5 py-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {allCatalogs.map((catalog) => (
                                <tr key={catalog.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{catalog.name}</td>
                                    <td className="px-5 py-3 text-slate-500">{catalog.description || '—'}</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            catalog.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {catalog.is_active ? 'Active' : 'Inactive'}
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
