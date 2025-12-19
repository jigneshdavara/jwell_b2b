'use client';

import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Link from 'next/link';

type CatalogRow = {
    id: number;
    name: string;
    description?: string | null;
    is_active: boolean;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

export default function AdminCatalogsIndex() {
    const [loading, setLoading] = useState(true);
    const [catalogs, setCatalogs] = useState<{ data: CatalogRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 20 }
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCatalog, setEditingCatalog] = useState<CatalogRow | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<CatalogRow | null>(null);
    const [formState, setFormState] = useState({
        name: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        loadCatalogs();
    }, [currentPage, perPage]);

    const loadCatalogs = async () => {
        setLoading(true);
        try {
            const response = await adminService.getCatalogs(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setCatalogs({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    name: item.name,
                    description: item.description,
                    is_active: item.is_active,
                })),
                meta: {
                    current_page: responseMeta.current_page || responseMeta.page || 1,
                    last_page: responseMeta.last_page || responseMeta.lastPage || 1,
                    total: responseMeta.total || 0,
                    per_page: responseMeta.per_page || responseMeta.perPage || perPage,
                },
            });
        } catch (error: any) {
            console.error('Failed to load catalogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingCatalog(null);
        setModalOpen(false);
        setFormState({
            name: '',
            description: '',
            is_active: true,
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (catalog: CatalogRow) => {
        setEditingCatalog(catalog);
        setFormState({
            name: catalog.name,
            description: catalog.description || '',
            is_active: catalog.is_active,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formState.name,
                description: formState.description || null,
                is_active: formState.is_active,
            };

            if (editingCatalog) {
                await adminService.updateCatalog(editingCatalog.id, payload);
            } else {
                await adminService.createCatalog(payload);
            }
            resetForm();
            await loadCatalogs();
        } catch (error: any) {
            console.error('Failed to save catalog:', error);
            alert(error.response?.data?.message || 'Failed to save catalog. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteCatalog(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadCatalogs();
            } catch (error: any) {
                console.error('Failed to delete catalog:', error);
                alert(error.response?.data?.message || 'Failed to delete catalog. Please try again.');
            }
        }
    };

    return (
        <>
            <Head title="Catalogs" />
            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Catalogs</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage product catalogs and collections.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New catalog
                    </button>
                </div>
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">Catalogs ({catalogs.meta.total})</div>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                        </div>
                    ) : catalogs.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-500">
                            <p>No catalogs found.</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 text-left">Name</th>
                                    <th className="px-5 py-3 text-left">Description</th>
                                    <th className="px-5 py-3 text-left">Status</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {catalogs.data.map((catalog) => (
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
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/admin/catalogs/${catalog.id}`}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                    title="Manage products"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(catalog)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                    title="Edit catalog"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteConfirm(catalog)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                    title="Delete catalog"
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
                    )}
                </div>

                {catalogs.meta.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                        <div>
                            Showing {catalogs.meta.total > 0 ? (catalogs.meta.current_page - 1) * catalogs.meta.per_page + 1 : 0} to {Math.min(catalogs.meta.current_page * catalogs.meta.per_page, catalogs.meta.total)} of {catalogs.meta.total} entries
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: catalogs.meta.last_page }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                        page === catalogs.meta.current_page
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

                <Modal show={modalOpen} onClose={resetForm} maxWidth="2xl">
                    <form onSubmit={handleSubmit} className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">{editingCatalog ? 'Edit Catalog' : 'Create New Catalog'}</h3>
                        <div className="space-y-4">
                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Name <span className="text-rose-500">*</span></span>
                                <input
                                    type="text"
                                    value={formState.name}
                                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                    className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                />
                            </label>
                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Description</span>
                                <textarea
                                    value={formState.description}
                                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                                    className="min-h-[100px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                            </label>
                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={formState.is_active}
                                    onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                />
                                Active
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={resetForm} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                            <button type="submit" disabled={loading} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                                {editingCatalog ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </Modal>

                <ConfirmationModal
                    show={deleteConfirm !== null}
                    onClose={() => setDeleteConfirm(null)}
                    onConfirm={handleDelete}
                    title="Delete Catalog"
                    message={deleteConfirm ? `Are you sure you want to delete catalog "${deleteConfirm.name}"?` : ''}
                    confirmText="Delete"
                    variant="danger"
                />
            </div>
        </>
    );
}
