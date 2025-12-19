"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type MetalRow = {
    id: number;
    code: string | null;
    name: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

const mockMetals: MetalRow[] = [
    { id: 1, code: 'AU', name: 'Gold', description: '24K, 22K, 18K Yellow and White Gold', is_active: true, display_order: 1 },
    { id: 2, code: 'AG', name: 'Silver', description: '925 Sterling Silver', is_active: true, display_order: 2 },
    { id: 3, code: 'PT', name: 'Platinum', description: '950 Platinum', is_active: false, display_order: 3 },
];

export default function AdminMetalsPage() {
    const [loading, setLoading] = useState(true);
    const [metals, setMetals] = useState<{ data: MetalRow[]; meta: PaginationMeta }>({
        data: mockMetals,
        meta: { current_page: 1, last_page: 1, total: mockMetals.length, per_page: 10 }
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [editingMetal, setEditingMetal] = useState<MetalRow | null>(null);
    const [selectedMetals, setSelectedMetals] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [deleteConfirm, setDeleteConfirm] = useState<MetalRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const [formState, setFormState] = useState({
        code: '',
        name: '',
        description: '',
        is_active: true,
        display_order: 0,
        errors: { code: '', name: '', description: '' }
    });

    useEffect(() => {
        setLoading(false);
    }, []);

    const allSelected = useMemo(() => {
        if (metals.data.length === 0) return false;
        return selectedMetals.length === metals.data.length;
    }, [metals.data, selectedMetals]);

    const toggleSelectAll = () => {
        setSelectedMetals(allSelected ? [] : metals.data.map(m => m.id));
    };

    const toggleSelection = (id: number) => {
        setSelectedMetals(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]);
    };

    const resetForm = () => {
        setEditingMetal(null);
        setModalOpen(false);
        setFormState({
            code: '',
            name: '',
            description: '',
            is_active: true,
            display_order: 0,
            errors: { code: '', name: '', description: '' }
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (metal: MetalRow) => {
        setEditingMetal(metal);
        setFormState({
            code: metal.code ?? '',
            name: metal.name,
            description: metal.description ?? '',
            is_active: metal.is_active,
            display_order: metal.display_order,
            errors: { code: '', name: '', description: '' }
        });
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            if (editingMetal) {
                setMetals(prev => ({
                    ...prev,
                    data: prev.data.map(m => m.id === editingMetal.id ? { 
                        ...m, 
                        ...formState,
                        display_order: Number(formState.display_order)
                    } : m)
                }));
            } else {
                const newMetal: MetalRow = {
                    id: Date.now(),
                    ...formState,
                    display_order: Number(formState.display_order)
                };
                setMetals(prev => ({
                    ...prev,
                    data: [...prev.data, newMetal],
                    meta: { ...prev.meta, total: prev.meta.total + 1 }
                }));
            }
            resetForm();
            setLoading(false);
        }, 500);
    };

    const toggleMetal = (metal: MetalRow) => {
        setMetals(prev => ({
            ...prev,
            data: prev.data.map(m => m.id === metal.id ? { ...m, is_active: !m.is_active } : m)
        }));
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setMetals(prev => ({
                ...prev,
                data: prev.data.filter(m => m.id !== deleteConfirm.id),
                meta: { ...prev.meta, total: prev.meta.total - 1 }
            }));
            setDeleteConfirm(null);
        }
    };

    const handleBulkDelete = () => {
        setMetals(prev => ({
            ...prev,
            data: prev.data.filter(m => !selectedMetals.includes(m.id)),
            meta: { ...prev.meta, total: prev.meta.total - selectedMetals.length }
        }));
        setSelectedMetals([]);
        setBulkDeleteConfirm(false);
    };

    if (loading && !metals.data.length) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Metals</h1>
                    <p className="mt-2 text-sm text-slate-500">Manage metal types for catalogue specifications.</p>
                </div>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    New metal
                </button>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                    <div className="font-semibold text-slate-700">
                        Metals ({metals.meta.total})
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{selectedMetals.length} selected</span>
                        <button
                            type="button"
                            onClick={() => setBulkDeleteConfirm(true)}
                            disabled={selectedMetals.length === 0}
                            className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Bulk delete
                        </button>
                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                        <tr>
                            <th className="px-5 py-3">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleSelectAll}
                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                            </th>
                            <th className="px-5 py-3 text-left">Code</th>
                            <th className="px-5 py-3 text-left">Name</th>
                            <th className="px-5 py-3 text-left">Order</th>
                            <th className="px-5 py-3 text-left">Status</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {metals.data.map((metal) => (
                            <tr key={metal.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedMetals.includes(metal.id)}
                                        onChange={() => toggleSelection(metal.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                </td>
                                <td className="px-5 py-3 font-medium text-slate-700">{metal.code || '-'}</td>
                                <td className="px-5 py-3 font-semibold text-slate-900">
                                    <div className="flex flex-col gap-1">
                                        <span>{metal.name}</span>
                                        {metal.description && <span className="text-xs font-normal text-slate-500">{metal.description}</span>}
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-slate-500">{metal.display_order}</td>
                                <td className="px-5 py-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            metal.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {metal.is_active ? 'Active' : 'Archived'}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(metal)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                            title="Edit metal"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleMetal(metal)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                            title={metal.is_active ? 'Pause metal' : 'Activate metal'}
                                        >
                                            {metal.is_active ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteConfirm(metal)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                            title="Delete metal"
                                        >
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

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <div>Showing 1 to {metals.data.length} of {metals.meta.total} entries</div>
                <div className="flex gap-2">
                    <button className="rounded-full px-3 py-1 text-sm font-semibold bg-sky-600 text-white shadow shadow-sky-600/20">1</button>
                </div>
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingMetal ? `Edit metal: ${editingMetal.name}` : 'Create new metal'}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={resetForm} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900">
                                    Cancel
                                </button>
                                <button type="submit" form="metal-form" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700">
                                    {editingMetal ? 'Update metal' : 'Create metal'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={handleSubmit} className="space-y-6" id="metal-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Code <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={formState.code}
                                                onChange={(e) => setFormState(prev => ({ ...prev, code: e.target.value }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                placeholder="e.g., AU, AG"
                                                required
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Name <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={formState.name}
                                                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Display order <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                value={formState.display_order}
                                                onChange={(e) => setFormState(prev => ({ ...prev, display_order: Number(e.target.value) }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                        </label>
                                    </div>
                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={formState.is_active}
                                            onChange={(e) => setFormState(prev => ({ ...prev, is_active: e.target.checked }))}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Active for selection
                                    </label>
                                </div>
                                <div className="space-y-6">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={formState.description}
                                            onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                                            className="min-h-[200px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Optional notes for team."
                                        />
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                show={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Remove Metal"
                message={deleteConfirm ? `Are you sure you want to remove metal ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Metals"
                message={`Are you sure you want to delete ${selectedMetals.length} selected metal(s)?`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
