"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type CustomerGroupRow = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    position: number;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

const mockGroups: CustomerGroupRow[] = [
    { id: 1, name: 'Premium Retailers', slug: 'premium-retailers', description: 'High-volume retail partners.', is_active: true, position: 1 },
    { id: 2, name: 'Bulk Buyers', slug: 'bulk-buyers', description: 'Wholesale partners with bulk ordering.', is_active: true, position: 2 },
    { id: 3, name: 'Legacy Clients', slug: 'legacy-clients', description: 'Long-term partners with special terms.', is_active: false, position: 3 },
];

export default function AdminCustomerGroupsPage() {
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<{ data: CustomerGroupRow[]; meta: PaginationMeta }>({
        data: mockGroups,
        meta: { current_page: 1, last_page: 1, total: mockGroups.length, per_page: 20 }
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<CustomerGroupRow | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(20);
    const [deleteConfirm, setDeleteConfirm] = useState<CustomerGroupRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const [formState, setFormState] = useState({
        name: '',
        description: '',
        is_active: true,
        position: 0,
    });

    useEffect(() => {
        setLoading(false);
    }, []);

    const allSelected = useMemo(() => {
        if (groups.data.length === 0) return false;
        return selectedGroups.length === groups.data.length;
    }, [groups.data, selectedGroups]);

    const toggleSelectAll = () => {
        setSelectedGroups(allSelected ? [] : groups.data.map(g => g.id));
    };

    const toggleSelection = (id: number) => {
        setSelectedGroups(prev => prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]);
    };

    const resetForm = () => {
        setEditingGroup(null);
        setModalOpen(false);
        setFormState({
            name: '',
            description: '',
            is_active: true,
            position: 0,
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (group: CustomerGroupRow) => {
        setEditingGroup(group);
        setFormState({
            name: group.name,
            description: group.description ?? '',
            is_active: group.is_active,
            position: group.position,
        });
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            if (editingGroup) {
                setGroups(prev => ({
                    ...prev,
                    data: prev.data.map(g => g.id === editingGroup.id ? { ...g, ...formState } : g)
                }));
            } else {
                const newGroup: CustomerGroupRow = {
                    id: Date.now(),
                    slug: formState.name.toLowerCase().replace(/\s+/g, '-'),
                    ...formState
                };
                setGroups(prev => ({
                    ...prev,
                    data: [...prev.data, newGroup],
                    meta: { ...prev.meta, total: prev.meta.total + 1 }
                }));
            }
            resetForm();
            setLoading(false);
        }, 500);
    };

    const toggleActivation = (group: CustomerGroupRow) => {
        setGroups(prev => ({
            ...prev,
            data: prev.data.map(g => g.id === group.id ? { ...g, is_active: !g.is_active } : g)
        }));
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setGroups(prev => ({
                ...prev,
                data: prev.data.filter(g => g.id !== deleteConfirm.id),
                meta: { ...prev.meta, total: prev.meta.total - 1 }
            }));
            setDeleteConfirm(null);
        }
    };

    const handleBulkDelete = () => {
        setGroups(prev => ({
            ...prev,
            data: prev.data.filter(g => !selectedGroups.includes(g.id)),
            meta: { ...prev.meta, total: prev.meta.total - selectedGroups.length }
        }));
        setSelectedGroups([]);
        setBulkDeleteConfirm(false);
    };

    if (loading && !groups.data.length) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Customer groups</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Organise customers by engagement plans (e.g. VIP, Dormant) to target messaging and benefits.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    New group
                </button>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                    <div className="font-semibold text-slate-700">
                        Groups ({groups.meta.total})
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{selectedGroups.length} selected</span>
                        <button
                            type="button"
                            onClick={() => setBulkDeleteConfirm(true)}
                            disabled={selectedGroups.length === 0}
                            className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Bulk delete
                        </button>
                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:ring-0"
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
                            <th className="px-5 py-3 text-left">Name</th>
                            <th className="px-5 py-3 text-left">Slug</th>
                            <th className="px-5 py-3 text-left">Order</th>
                            <th className="px-5 py-3 text-left">Status</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {groups.data.map((group) => (
                            <tr key={group.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedGroups.includes(group.id)}
                                        onChange={() => toggleSelection(group.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                </td>
                                <td className="px-5 py-3 font-semibold text-slate-900">
                                    <div className="flex flex-col gap-1">
                                        <span>{group.name}</span>
                                        {group.description && <span className="text-xs font-normal text-slate-500">{group.description}</span>}
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-slate-500">{group.slug}</td>
                                <td className="px-5 py-3 text-slate-500">{group.position}</td>
                                <td className="px-5 py-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            group.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {group.is_active ? 'Active' : 'Archived'}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(group)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                            title="Edit group"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleActivation(group)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                            title={group.is_active ? 'Pause group' : 'Activate group'}
                                        >
                                            {group.is_active ? (
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
                                            onClick={() => setDeleteConfirm(group)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                            title="Delete group"
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
                <div>Showing 1 to {groups.data.length} of {groups.meta.total} entries</div>
                <div className="flex gap-2">
                    <button className="rounded-full px-3 py-1 text-sm font-semibold bg-sky-600 text-white shadow shadow-sky-600/20">1</button>
                </div>
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingGroup ? `Edit customer group: ${editingGroup.name}` : 'Create new customer group'}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={resetForm} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900">
                                    Cancel
                                </button>
                                <button type="submit" form="group-form" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700">
                                    {editingGroup ? 'Update group' : 'Create group'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={handleSubmit} className="space-y-6" id="group-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
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
                                                value={formState.position}
                                                onChange={(e) => setFormState(prev => ({ ...prev, position: Number(e.target.value) }))}
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
                                            placeholder="Optional notes for internal reference."
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
                title="Remove Group"
                message={deleteConfirm ? `Are you sure you want to remove customer group ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Groups"
                message={`Are you sure you want to delete ${selectedGroups.length} selected customer group(s)?`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
