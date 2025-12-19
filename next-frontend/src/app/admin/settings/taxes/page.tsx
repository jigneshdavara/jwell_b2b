'use client';

import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useEffect, useMemo, useState } from 'react';
import { adminService } from '@/services/adminService';

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

export default function AdminTaxesIndex() {
    const [loading, setLoading] = useState(true);
    const [allTaxes, setAllTaxes] = useState<TaxRow[]>([]);
    const [taxGroups, setTaxGroups] = useState<Array<{ id: number; name: string }>>([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
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

    useEffect(() => {
        loadTaxes();
        loadTaxGroups();
    }, [currentPage, perPage]);

    const loadTaxes = async () => {
        setLoading(true);
        try {
            const response = await adminService.getTaxes(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };
            
            setAllTaxes(items.map((item: any) => ({
                id: Number(item.id),
                name: item.name,
                code: item.code,
                rate: Number(item.rate),
                description: item.description,
                is_active: item.is_active,
                tax_group: item.tax_group ? { id: Number(item.tax_group.id), name: item.tax_group.name } : null,
                created_at: item.created_at,
                updated_at: item.updated_at,
            })));
            setMeta({
                current_page: responseMeta.current_page || responseMeta.page || 1,
                last_page: responseMeta.last_page || responseMeta.lastPage || 1,
                total: responseMeta.total || 0,
                per_page: responseMeta.per_page || responseMeta.perPage || perPage,
            });
        } catch (error: any) {
            console.error('Failed to load taxes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTaxGroups = async () => {
        try {
            const response = await adminService.getTaxGroups(1, 100);
            const items = response.data.items || response.data.data || [];
            setTaxGroups(items.map((item: any) => ({ id: Number(item.id), name: item.name })));
        } catch (error: any) {
            console.error('Failed to load tax groups:', error);
        }
    };

    const totalPages = meta.last_page;

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

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        try {
            const payload = {
                tax_group_id: formData.tax_group_id ? Number(formData.tax_group_id) : null,
                name: formData.name,
                code: formData.code,
                rate: formData.rate,
                description: formData.description || null,
                is_active: formData.is_active,
            };

            if (editingTax) {
                await adminService.updateTax(editingTax.id, payload);
            } else {
                await adminService.createTax(payload);
            }
            resetFormAndModal();
            await loadTaxes();
        } catch (error: any) {
            console.error('Failed to save tax:', error);
            alert(error.response?.data?.message || 'Failed to save tax. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteTax(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadTaxes();
            } catch (error: any) {
                console.error('Failed to delete tax:', error);
                alert(error.response?.data?.message || 'Failed to delete tax. Please try again.');
            }
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
                        <div className="font-semibold text-slate-700">Taxes ({meta.total})</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                        </div>
                    ) : (
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
                                {allTaxes.map((tax) => (
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
                                {allTaxes.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                                            No taxes found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
                    <div>
                        Showing {meta.total > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0} to {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total} entries
                    </div>
                    <div className="flex gap-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                    page === meta.current_page ? 'bg-sky-600 text-white shadow shadow-sky-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
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
                                {taxGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
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
