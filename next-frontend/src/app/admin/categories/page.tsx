"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import React from "react";
import { adminService } from "@/services/adminService";

type CategoryRow = {
    id: number;
    parent_id: number | null;
    parent: { id: number; name: string } | null;
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

export default function AdminCategoriesPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ data: CategoryRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });
    const [currentPage, setCurrentPage] = useState(1);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [deleteConfirm, setDeleteConfirm] = useState<CategoryRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const [formState, setFormState] = useState({
        parent_id: '' as string | number,
        code: '',
        name: '',
        description: '',
        is_active: true,
        display_order: 0,
    });

    useEffect(() => {
        loadCategories();
    }, [currentPage, perPage]);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const response = await adminService.getCategories(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setData({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    parent_id: item.parent_id ? Number(item.parent_id) : null,
                    parent: item.parent ? { id: Number(item.parent.id), name: item.parent.name } : null,
                    code: item.code,
                    name: item.name,
                    description: item.description,
                    is_active: item.is_active,
                    display_order: item.display_order || 0,
                })),
                meta: {
                    current_page: responseMeta.current_page || responseMeta.page || 1,
                    last_page: responseMeta.last_page || responseMeta.lastPage || 1,
                    total: responseMeta.total || 0,
                    per_page: responseMeta.per_page || responseMeta.perPage || perPage,
                },
            });
        } catch (error: any) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const allSelected = useMemo(() => {
        if (data.data.length === 0) return false;
        return selectedCategories.length === data.data.length;
    }, [data.data, selectedCategories]);

    const toggleSelectAll = () => {
        setSelectedCategories(allSelected ? [] : data.data.map(c => c.id));
    };

    const toggleSelection = (id: number) => {
        setSelectedCategories(prev => prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]);
    };

    const resetForm = () => {
        setEditingCategory(null);
        setModalOpen(false);
        setFormState({
            parent_id: '',
            code: '',
            name: '',
            description: '',
            is_active: true,
            display_order: 0,
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (category: CategoryRow) => {
        setEditingCategory(category);
        setFormState({
            parent_id: category.parent_id ? String(category.parent_id) : '',
            code: category.code ?? '',
            name: category.name,
            description: category.description ?? '',
            is_active: category.is_active,
            display_order: category.display_order,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', formState.name);
            if (formState.code) formData.append('code', formState.code);
            if (formState.description) formData.append('description', formState.description);
            if (formState.parent_id) formData.append('parent_id', String(formState.parent_id));
            formData.append('is_active', String(formState.is_active));
            formData.append('display_order', String(formState.display_order));

            if (editingCategory) {
                await adminService.updateCategory(editingCategory.id, formData);
            } else {
                await adminService.createCategory(formData);
            }
            resetForm();
            await loadCategories();
        } catch (error: any) {
            console.error('Failed to save category:', error);
            alert(error.response?.data?.message || 'Failed to save category. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleActivation = async (category: CategoryRow) => {
        try {
            const formData = new FormData();
            formData.append('name', category.name);
            if (category.code) formData.append('code', category.code);
            if (category.description) formData.append('description', category.description || '');
            if (category.parent_id) formData.append('parent_id', String(category.parent_id));
            formData.append('is_active', String(!category.is_active));
            formData.append('display_order', String(category.display_order));
            await adminService.updateCategory(category.id, formData);
            await loadCategories();
        } catch (error: any) {
            console.error('Failed to toggle category:', error);
            alert(error.response?.data?.message || 'Failed to update category. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteCategory(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadCategories();
            } catch (error: any) {
                console.error('Failed to delete category:', error);
                alert(error.response?.data?.message || 'Failed to delete category. Please try again.');
            }
        }
    };

    if (loading && !data.data.length) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
                    <p className="mt-2 text-sm text-slate-500">Manage product categories for catalogue organization.</p>
                </div>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    New category
                </button>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                    <div className="font-semibold text-slate-700">Categories ({data.meta.total})</div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{selectedCategories.length} selected</span>
                        <button
                            type="button"
                            onClick={() => setBulkDeleteConfirm(true)}
                            disabled={selectedCategories.length === 0}
                            className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Bulk delete
                        </button>
                        <select value={perPage} onChange={(e) => {
                            setPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }} className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:ring-0">
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
                                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold" />
                            </th>
                            <th className="px-5 py-3 text-left">Code</th>
                            <th className="px-5 py-3 text-left">Name</th>
                            <th className="px-5 py-3 text-left">Parent</th>
                            <th className="px-5 py-3 text-left">Order</th>
                            <th className="px-5 py-3 text-left">Status</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {data.data.map((category) => (
                            <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3">
                                    <input type="checkbox" checked={selectedCategories.includes(category.id)} onChange={() => toggleSelection(category.id)} className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold" />
                                </td>
                                <td className="px-5 py-3 text-slate-700">{category.code || '-'}</td>
                                <td className="px-5 py-3 font-semibold text-slate-900">
                                    <div className="flex flex-col gap-1">
                                        <span>{category.name}</span>
                                        {category.description && <span className="text-xs text-slate-500 font-normal">{category.description}</span>}
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-slate-500">{category.parent?.name ?? '—'}</td>
                                <td className="px-5 py-3 text-slate-500">{category.display_order}</td>
                                <td className="px-5 py-3">
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${category.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {category.is_active ? 'Active' : 'Archived'}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEditModal(category)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M16.862 4.487l1.687-1.688a1.875 1.125 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                        <button onClick={() => toggleActivation(category)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600">
                                            {category.is_active ? <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M15.75 5.25v13.5m-7.5-13.5v13.5" strokeLinecap="round" strokeLinejoin="round" /></svg> : <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </button>
                                        <button onClick={() => setDeleteConfirm(category)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M14.74 9l-.34 9m-4.74-9l.34 9m9.96-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data.meta.last_page > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                        Showing {data.meta.total > 0 ? (data.meta.current_page - 1) * data.meta.per_page + 1 : 0} to {Math.min(data.meta.current_page * data.meta.per_page, data.meta.total)} of {data.meta.total} entries
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: data.meta.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                    page === data.meta.current_page
                                        ? 'bg-sky-600 text-white shadow shadow-sky-600/20'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">{editingCategory ? `Edit category: ${editingCategory.name}` : 'Create new category'}</h2>
                            <div className="flex items-center gap-3">
                                <button onClick={resetForm} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900">Cancel</button>
                                <button type="submit" form="category-form" disabled={loading} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">{editingCategory ? 'Update category' : 'Create category'}</button>
                            </div>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={handleSubmit} className="space-y-6" id="category-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Parent Category</span>
                                        <select
                                            value={formState.parent_id}
                                            onChange={e => setFormState(prev => ({ ...prev, parent_id: e.target.value }))}
                                            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        >
                                            <option value="">None (Top Level)</option>
                                            {data.data.filter(c => !editingCategory || c.id !== editingCategory.id).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Code</span>
                                        <input type="text" value={formState.code} onChange={e => setFormState(prev => ({ ...prev, code: e.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200" placeholder="e.g., RNG, NKL" />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Name <span className="text-rose-500">*</span></span>
                                        <input type="text" value={formState.name} onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200" required />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Display order <span className="text-rose-500">*</span></span>
                                        <input type="number" value={formState.display_order} onChange={e => setFormState(prev => ({ ...prev, display_order: Number(e.target.value) }))} className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200" min={0} required />
                                    </label>
                                </div>
                                <div className="space-y-6">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea value={formState.description} onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))} className="min-h-[200px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200" placeholder="Optional notes for internal reference." />
                                    </label>
                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                        <input type="checkbox" checked={formState.is_active} onChange={e => setFormState(prev => ({ ...prev, is_active: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold" />
                                        Active for selection
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal show={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Remove Category" message={deleteConfirm ? `Are you sure you want to remove category ${deleteConfirm.name}?` : ''} confirmText="Remove" variant="danger" />
            <ConfirmationModal show={bulkDeleteConfirm} onClose={() => setBulkDeleteConfirm(false)} onConfirm={async () => {
                try {
                    await adminService.bulkDeleteCategories(selectedCategories);
                    setSelectedCategories([]);
                    setBulkDeleteConfirm(false);
                    await loadCategories();
                } catch (error: any) {
                    console.error('Failed to delete categories:', error);
                    alert(error.response?.data?.message || 'Failed to delete categories. Please try again.');
                }
            }} title="Delete Categories" message={`Are you sure you want to delete ${selectedCategories.length} selected category(s)?`} confirmText="Delete" variant="danger" />
        </div>
    );
}
