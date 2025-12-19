'use client';

import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useMemo, useState } from 'react';

type TaxRow = {
    id: number;
    name: string;
    code: string;
    rate: number;
    description?: string | null;
    is_active: boolean;
    tax_group: { id: number; name: string } | null;
    created_at?: string | null;
    updated_at?: string | null;
};

// Mock data for taxes
const mockTaxes: TaxRow[] = [
    { id: 1, name: 'CGST 9%', code: 'CGST', rate: 9, description: 'Central Goods and Services Tax', is_active: true, tax_group: { id: 1, name: 'GST 18%' }, created_at: '2023-01-15T10:00:00Z', updated_at: '2023-01-15T10:00:00Z' },
    { id: 2, name: 'SGST 9%', code: 'SGST', rate: 9, description: 'State Goods and Services Tax', is_active: true, tax_group: { id: 1, name: 'GST 18%' }, created_at: '2023-01-15T10:00:00Z', updated_at: '2023-01-15T10:00:00Z' },
    { id: 3, name: 'IGST 5%', code: 'IGST', rate: 5, description: 'Integrated Goods and Services Tax', is_active: true, tax_group: { id: 2, name: 'GST 5%' }, created_at: '2023-02-20T11:30:00Z', updated_at: '2023-02-20T11:30:00Z' },
];

const mockTaxGroups = [
    { id: 1, name: 'GST 18%' },
    { id: 2, name: 'GST 5%' },
];

export default function AdminTaxesIndex() {
    const [allTaxes, setAllTaxes] = useState<TaxRow[]>(mockTaxes);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<TaxRow | null>(null);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<TaxRow | null>(null);

    const [formData, setFormData] = useState({
        tax_group_id: '',
        name: '',
        code: '',
        rate: 0,
        description: '',
        is_active: true,
    });
    const [processing, setProcessing] = useState(false);

    const paginatedTaxes = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return allTaxes.slice(start, start + perPage);
    }, [allTaxes, currentPage, perPage]);

    const totalPages = Math.ceil(allTaxes.length / perPage);

    const resetFormAndModal = () => {
        setEditingTax(null);
        setModalOpen(false);
        setFormData({ tax_group_id: '', name: '', code: '', rate: 0, description: '', is_active: true });
    };

    const openEditModal = (tax: TaxRow) => {
        setEditingTax(tax);
        setFormData({
            tax_group_id: tax.tax_group?.id.toString() ?? '',
            name: tax.name,
            code: tax.code,
            rate: tax.rate,
            description: tax.description ?? '',
            is_active: tax.is_active,
        });
        setModalOpen(true);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setTimeout(() => {
            const selectedGroup = mockTaxGroups.find(g => g.id === Number(formData.tax_group_id));
            if (editingTax) {
                setAllTaxes(allTaxes.map(t => t.id === editingTax.id ? { ...t, ...formData, tax_group: selectedGroup ?? null } : t));
            } else {
                setAllTaxes([...allTaxes, { id: Date.now(), ...formData, tax_group: selectedGroup ?? null }]);
            }
            setProcessing(false);
            resetFormAndModal();
        }, 500);
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setAllTaxes(allTaxes.filter(t => t.id !== deleteConfirm.id));
            setDeleteConfirm(null);
        }
    };

    return (
        <>
            <Head title="Taxes" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Taxes</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Manage tax rates and assign them to tax groups.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New tax
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">Taxes ({allTaxes.length})</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(Number(e.target.value))}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                            </select>
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Code</th>
                                <th className="px-5 py-3 text-left">Tax Group</th>
                                <th className="px-5 py-3 text-right">Rate</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {paginatedTaxes.map((tax) => (
                                <tr key={tax.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{tax.name}</td>
                                    <td className="px-5 py-3 text-slate-500">{tax.code}</td>
                                    <td className="px-5 py-3 text-slate-500">{tax.tax_group?.name ?? '—'}</td>
                                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{tax.rate}%</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            tax.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {tax.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => openEditModal(tax)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button type="button" onClick={() => setDeleteConfirm(tax)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal show={modalOpen} onClose={resetFormAndModal} maxWidth="xl">
                <form onSubmit={submit} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900">{editingTax ? 'Edit Tax' : 'New Tax'}</h3>
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Tax Group</label>
                            <select
                                value={formData.tax_group_id}
                                onChange={(e) => setFormData({ ...formData, tax_group_id: e.target.value })}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                required
                            >
                                <option value="">Select a tax group</option>
                                {mockTaxGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Rate (%)</label>
                            <input
                                type="number"
                                value={formData.rate}
                                onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                                step="0.01"
                                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                required
                            />
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                        <button type="button" onClick={resetFormAndModal} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                        <button type="submit" disabled={processing} className="rounded-full bg-elvee-blue px-5 py-2 text-sm font-semibold text-white">Save</button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                show={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Remove Tax"
                message={deleteConfirm ? `Are you sure you want to remove tax ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />
        </>
    );
}
