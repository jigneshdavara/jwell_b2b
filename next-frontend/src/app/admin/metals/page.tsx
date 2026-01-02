"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import { adminService } from "@/services/adminService";
import { PaginationMeta, PaginationLink, generatePaginationLinks } from "@/utils/pagination";
import { toastError } from "@/utils/toast";

type MetalRow = {
    id: number;
    code: string | null;
    name: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
};


export default function AdminMetalsPage() {
    const [loading, setLoading] = useState(true);
    const [metals, setMetals] = useState<{ data: MetalRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [editingMetal, setEditingMetal] = useState<MetalRow | null>(null);
    const [selectedMetals, setSelectedMetals] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
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
        loadMetals();
    }, [perPage, currentPage]);

    const loadMetals = async () => {
        setLoading(true);
        try {
            const response = await adminService.getMetals(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const meta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };
            
            setMetals({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    code: item.code,
                    name: item.name,
                    description: item.description,
                    is_active: item.is_active,
                    display_order: item.display_order,
                })),
                meta: {
                    current_page: meta.current_page || meta.page || currentPage,
                    last_page: meta.last_page || meta.lastPage || 1,
                    total: meta.total || 0,
                    per_page: meta.per_page || meta.perPage || perPage,
                    from: meta.from,
                    to: meta.to,
                    links: meta.links || generatePaginationLinks(meta.current_page || meta.page || currentPage, meta.last_page || meta.lastPage || 1),
                },
            });
            
            // Sync current page state with API response
            const apiPage = meta.current_page || meta.page || currentPage;
            if (apiPage !== currentPage) {
                setCurrentPage(apiPage);
            }
        } catch (error: any) {
            console.error('Failed to load metals:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                code: formState.code,
                name: formState.name,
                description: formState.description || null,
                is_active: formState.is_active,
                display_order: Number(formState.display_order),
            };

            if (editingMetal) {
                await adminService.updateMetal(editingMetal.id, payload);
            } else {
                await adminService.createMetal(payload);
            }
            resetForm();
            await loadMetals();
        } catch (error: any) {
            console.error('Failed to save metal:', error);
            toastError(error.response?.data?.message || 'Failed to save metal. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMetal = async (metal: MetalRow) => {
        try {
            await adminService.updateMetal(metal.id, {
                code: metal.code || '',
                name: metal.name,
                description: metal.description || null,
                is_active: !metal.is_active,
                display_order: metal.display_order,
            });
            await loadMetals();
        } catch (error: any) {
            console.error('Failed to toggle metal:', error);
            toastError(error.response?.data?.message || 'Failed to update metal. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteMetal(deleteConfirm.id);
                await loadMetals();
            } catch (error: any) {
                console.error('Failed to delete metal:', error);
                toastError(error.response?.data?.message || 'Failed to delete metal. Please try again.');
            } finally {
                setDeleteConfirm(null);
            }
        }
    };

    const handleBulkDelete = async () => {
        try {
            await adminService.bulkDeleteMetals(selectedMetals);
            setSelectedMetals([]);
            await loadMetals();
        } catch (error: any) {
            console.error('Failed to delete metals:', error);
            toastError(error.response?.data?.message || 'Failed to delete metals. Please try again.');
        } finally {
            setBulkDeleteConfirm(false);
        }
    };

    if (loading && !metals.data.length) return null;

    return (
        <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Metals</h1>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500">Manage metal types for catalogue specifications.</p>
                </div>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    New metal
                </button>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-3 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm">
                    <div className="font-semibold text-slate-700">
                        Metals ({metals.meta.total})
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500">
                        <span>{selectedMetals.length} selected</span>
                        <button
                            type="button"
                            onClick={() => setBulkDeleteConfirm(true)}
                            disabled={selectedMetals.length === 0}
                            className="inline-flex items-center rounded-full border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
                        >
                            Bulk delete
                        </button>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs focus:ring-0 sm:px-3"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                        <tr>
                                <th className="px-3 py-2 sm:px-5 sm:py-3">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleSelectAll}
                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                            </th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Code</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Name</th>
                                <th className="px-3 py-2 text-left hidden lg:table-cell sm:px-5 sm:py-3">Order</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Status</th>
                                <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                            {metals.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-4 sm:px-5 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                        No metals defined yet.
                                    </td>
                                </tr>
                            ) : (
                                metals.data.map((metal) => (
                            <tr key={metal.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 py-2 sm:px-5 sm:py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedMetals.includes(metal.id)}
                                        onChange={() => toggleSelection(metal.id)}
                                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                </td>
                                        <td className="px-3 py-2 font-medium text-slate-700 sm:px-5 sm:py-3">{metal.code || '-'}</td>
                                        <td className="px-3 py-2 font-semibold text-slate-900 sm:px-5 sm:py-3">
                                    <div className="flex flex-col gap-1">
                                                <span className="text-xs sm:text-sm">{metal.name}</span>
                                                {metal.description && <span className="text-[10px] sm:text-xs font-normal text-slate-500">{metal.description}</span>}
                                    </div>
                                </td>
                                        <td className="px-3 py-2 text-slate-500 hidden lg:table-cell sm:px-5 sm:py-3">{metal.display_order}</td>
                                        <td className="px-3 py-2 sm:px-5 sm:py-3">
                                    <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs font-semibold ${
                                            metal.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {metal.is_active ? 'Active' : 'Archived'}
                                    </span>
                                </td>
                                        <td className="px-3 py-2 text-right sm:px-5 sm:py-3">
                                            <div className="flex justify-end gap-1.5 sm:gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(metal)}
                                                    className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                            title="Edit metal"
                                        >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleMetal(metal)}
                                                    className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                            title={metal.is_active ? 'Pause metal' : 'Activate metal'}
                                        >
                                            {metal.is_active ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                                </svg>
                                            ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteConfirm(metal)}
                                                    className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                            title="Delete metal"
                                        >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                                ))
                            )}
                    </tbody>
                </table>
                </div>
            </div>

            <Pagination 
                meta={metals.meta} 
                onPageChange={setCurrentPage} 
            />

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-4">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-sm sm:text-base lg:text-xl font-semibold text-slate-900 truncate">
                                {editingMetal ? `Edit metal: ${editingMetal.name}` : 'Create new metal'}
                            </h2>
                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                <button type="button" onClick={resetForm} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900">
                                    Cancel
                                </button>
                                <button type="submit" form="metal-form" className="rounded-full bg-slate-900 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700">
                                    {editingMetal ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                                    aria-label="Close modal"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4">
                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" id="metal-form">
                            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="grid gap-3 sm:gap-4">
                                        <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                            <span>Code <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={formState.code}
                                                onChange={(e) => setFormState(prev => ({ ...prev, code: e.target.value }))}
                                                className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                                placeholder="e.g., AU, AG"
                                                required
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                            <span>Name <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={formState.name}
                                                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                                                className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                                required
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                            <span>Display order <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                value={formState.display_order === 0 ? '' : formState.display_order}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormState(prev => ({ ...prev, display_order: value === '' ? 0 : Number(value) }));
                                                }}
                                                onBlur={(e) => {
                                                    if (e.target.value === '') {
                                                        setFormState(prev => ({ ...prev, display_order: 0 }));
                                                    }
                                                }}
                                                onFocus={(e) => {
                                                    if (e.target.value === '0') {
                                                        e.target.select();
                                                    }
                                                }}
                                                className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                                required
                                            />
                                        </label>
                                    </div>
                                    <label className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={formState.is_active}
                                            onChange={(e) => setFormState(prev => ({ ...prev, is_active: e.target.checked }))}
                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Active for selection
                                    </label>
                                </div>
                                <div className="space-y-4 sm:space-y-6">
                                    <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={formState.description}
                                            onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                                            className="min-h-[140px] sm:min-h-[160px] lg:min-h-[200px] rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
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
