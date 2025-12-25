'use client';

import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';

type StyleRow = {
    id: number;
    code: string | null;
    name: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
};


export default function AdminStylesIndex() {
    const [loading, setLoading] = useState(true);
    const [styles, setStyles] = useState<{ data: StyleRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingStyle, setEditingStyle] = useState<StyleRow | null>(null);
    const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<StyleRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        is_active: true,
        display_order: 0,
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadStyles();
    }, [currentPage, perPage]);

    const loadStyles = async () => {
        setLoading(true);
        try {
            const response = await adminService.getStyles(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setStyles({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    code: item.code || null,
                    name: item.name,
                    description: item.description || null,
                    is_active: item.is_active,
                    display_order: item.display_order || 0,
                })),
                meta: {
                    current_page: responseMeta.current_page || responseMeta.page || currentPage,
                    last_page: responseMeta.last_page || responseMeta.lastPage || 1,
                    total: responseMeta.total || 0,
                    per_page: responseMeta.per_page || responseMeta.perPage || perPage,
                    from: responseMeta.from,
                    to: responseMeta.to,
                    links: responseMeta.links || generatePaginationLinks(responseMeta.current_page || responseMeta.page || currentPage, responseMeta.last_page || responseMeta.lastPage || 1),
                },
            });
        } catch (error: any) {
            console.error('Failed to load styles:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetFormAndModal = () => {
        setEditingStyle(null);
        setModalOpen(false);
        setFormData({
            code: '',
            name: '',
            description: '',
            is_active: true,
            display_order: 0,
        });
    };

    const openCreateModal = () => {
        resetFormAndModal();
        setModalOpen(true);
    };

    const openEditModal = (style: StyleRow) => {
        setEditingStyle(style);
        setFormData({
            code: style.code || '',
            name: style.name,
            description: style.description || '',
            is_active: style.is_active,
            display_order: style.display_order,
        });
        setModalOpen(true);
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        try {
            const payload = {
                code: formData.code || null,
                name: formData.name,
                description: formData.description || null,
                is_active: formData.is_active,
                display_order: Number(formData.display_order) || 0,
            };

            if (editingStyle) {
                await adminService.updateStyle(editingStyle.id, payload);
            } else {
                await adminService.createStyle(payload);
            }
            resetFormAndModal();
            await loadStyles();
        } catch (error: any) {
            console.error('Failed to save style:', error);
            alert(error.response?.data?.message || 'Failed to save style. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const toggleStyle = async (style: StyleRow) => {
        try {
            await adminService.updateStyle(style.id, {
                code: style.code || null,
                name: style.name,
                description: style.description || null,
                is_active: !style.is_active,
                display_order: style.display_order,
            });
            await loadStyles();
        } catch (error: any) {
            console.error('Failed to toggle style status:', error);
            alert(error.response?.data?.message || 'Failed to update style. Please try again.');
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedStyles((prev) =>
            prev.includes(id) ? prev.filter((styleId) => styleId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedStyles.length === styles.data.length) {
            setSelectedStyles([]);
        } else {
            setSelectedStyles(styles.data.map((style) => style.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedStyles.length === 0) {
            return;
        }
        try {
            await adminService.bulkDeleteStyles(selectedStyles);
            setSelectedStyles([]);
            setBulkDeleteConfirm(false);
            await loadStyles();
        } catch (error: any) {
            console.error('Failed to delete styles:', error);
            alert(error.response?.data?.message || 'Failed to delete styles. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteStyle(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadStyles();
            } catch (error: any) {
                console.error('Failed to delete style:', error);
                alert(error.response?.data?.message || 'Failed to delete style. Please try again.');
            }
        }
    };

    return (
        <>
            <Head title="Styles" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Styles</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage styles for catalogue specifications.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New style
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">
                            Styles ({styles.meta.total})
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedStyles.length} selected</span>
                            <button
                                type="button"
                                onClick={() => setBulkDeleteConfirm(true)}
                                disabled={selectedStyles.length === 0}
                                className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Bulk delete
                            </button>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    {loading && styles.data.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-slate-500">Loading styles...</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedStyles.length === styles.data.length && styles.data.length > 0}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label="Select all styles"
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
                                {styles.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                            No styles defined yet.
                                        </td>
                                    </tr>
                                ) : (
                                    styles.data.map((style) => (
                                        <tr key={style.id} className="hover:bg-slate-50">
                                            <td className="px-5 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStyles.includes(style.id)}
                                                    onChange={() => toggleSelection(style.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                    aria-label={`Select style ${style.name}`}
                                                />
                                            </td>
                                            <td className="px-5 py-3 text-slate-700">{style.code || '-'}</td>
                                            <td className="px-5 py-3 font-semibold text-slate-900">
                                                <div className="flex flex-col gap-1">
                                                    <span>{style.name}</span>
                                                    {style.description && <span className="text-xs text-slate-500">{style.description}</span>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-slate-500">{style.display_order}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                    style.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {style.is_active ? 'Active' : 'Archived'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(style)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                        title="Edit style"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleStyle(style)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                                        title={style.is_active ? 'Pause style' : 'Activate style'}
                                                    >
                                                        {style.is_active ? (
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
                                                        onClick={() => setDeleteConfirm(style)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                        title="Delete style"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
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
                    )}
                </div>

                <Pagination 
                    meta={styles.meta} 
                    onPageChange={setCurrentPage} 
                />
            </div>

            <Modal show={modalOpen} onClose={resetFormAndModal} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingStyle ? `Edit style: ${editingStyle.name}` : 'Create new style'}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={resetFormAndModal}
                                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="style-form"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingStyle ? 'Update style' : 'Create style'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetFormAndModal}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                                    aria-label="Close modal"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={submit} className="space-y-6" id="style-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Code</span>
                                            <input
                                                type="text"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                placeholder="e.g., CLS, MOD"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Name</span>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Display order</span>
                                            <input
                                                type="number"
                                                value={formData.display_order}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData({ ...formData, display_order: value === '' ? '' : Number(value) });
                                                }}
                                                onBlur={(e) => {
                                                    if (e.target.value === '') {
                                                        setFormData({ ...formData, display_order: 0 });
                                                    }
                                                }}
                                                onFocus={(e) => {
                                                    if (e.target.value === '0') {
                                                        e.target.select();
                                                    }
                                                }}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                min={0}
                                            />
                                        </label>
                                    </div>

                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Active for selection
                                    </label>
                                </div>

                                <div className="space-y-6">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="min-h-[200px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Optional notes for team (e.g. usage, category)."
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
                title="Remove Style"
                message={deleteConfirm ? `Are you sure you want to remove style ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Styles"
                message={`Are you sure you want to delete ${selectedStyles.length} selected style(s)?`}
                confirmText="Delete"
                variant="danger"
            />
        </>
    );
}
