'use client';

import { Head } from '@/components/Head';
import { useEffect, useMemo, useState } from 'react';
import { adminService } from '@/services/adminService';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { toastSuccess, toastError, toastInfo } from '@/utils/toast';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';

type DiamondType = {
    id: number;
    name: string;
    code: string | null;
};

type DiamondClarityRow = {
    id: number;
    diamond_type_id: number;
    type: DiamondType | null;
    code: string;
    name: string;
    description?: string | null;
    display_order: number;
    is_active: boolean;
};


export default function AdminDiamondClaritiesIndex() {
    const [loading, setLoading] = useState(true);
    const [clarities, setClarities] = useState<{ data: DiamondClarityRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });
    const [types, setTypes] = useState<DiamondType[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingClarity, setEditingClarity] = useState<DiamondClarityRow | null>(null);
    const [selectedClarities, setSelectedClarities] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<DiamondClarityRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    // Toast notifications are handled via RTK

    const [formData, setFormData] = useState({
        diamond_type_id: '' as string | number,
        code: '',
        name: '',
        description: '',
        display_order: 0 as string | number,
        is_active: true,
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadTypes();
        loadClarities();
    }, [currentPage, perPage]);

    useEffect(() => {
        const existingIds = new Set(clarities.data.map((clarity) => clarity.id));
        setSelectedClarities((prev) => prev.filter((id) => existingIds.has(id)));
    }, [clarities.data]);

    const allSelected = useMemo(() => {
        if (clarities.data.length === 0) {
            return false;
        }
        return selectedClarities.length === clarities.data.length;
    }, [clarities.data, selectedClarities]);


    const loadTypes = async () => {
        try {
            const response = await adminService.getDiamondTypes(1, 100); // Load all active types
            const items = response.data.items || response.data.data || [];
            setTypes(items.map((item: any) => ({
                id: Number(item.id),
                name: item.name || '',
                code: item.code || null,
            })).filter((type: DiamondType) => type.name)); // Filter active types if needed
        } catch (error: any) {
            console.error('Failed to load diamond types:', error);
        }
    };

    const loadClarities = async () => {
        setLoading(true);
        try {
            const response = await adminService.getDiamondClarities(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setClarities({
                data: items.map((item: any) => {
                    const type = item.diamond_types || item.type;
                    return {
                        id: Number(item.id),
                        diamond_type_id: Number(item.diamond_type_id || 0),
                        type: type ? {
                            id: Number(type.id),
                            name: type.name || '',
                            code: type.code || null,
                        } : null,
                        code: item.code || '',
                        name: item.name || '',
                        description: item.description || null,
                        display_order: Number(item.display_order || 0),
                        is_active: item.is_active ?? true,
                    };
                }),
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
            
            // Sync current page state with API response
            const apiPage = responseMeta.current_page || responseMeta.page || currentPage;
            if (apiPage !== currentPage) {
                setCurrentPage(apiPage);
            }
        } catch (error: any) {
            console.error('Failed to load diamond clarities:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedClarities([]);
        } else {
            setSelectedClarities(clarities.data.map((clarity) => clarity.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedClarities((prev) =>
            prev.includes(id) ? prev.filter((clarityId) => clarityId !== id) : [...prev, id]
        );
    };

    const resetForm = () => {
        setEditingClarity(null);
        setModalOpen(false);
        setFormErrors({});
        setFormData({
            diamond_type_id: '',
            code: '',
            name: '',
            description: '',
            display_order: 0,
            is_active: true,
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (clarity: DiamondClarityRow) => {
        setEditingClarity(clarity);
        setFormErrors({});
        setFormData({
            diamond_type_id: clarity.diamond_type_id,
            code: clarity.code,
            name: clarity.name,
            description: clarity.description ?? '',
            display_order: clarity.display_order,
            is_active: clarity.is_active,
        });
        setModalOpen(true);
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setFormErrors({});
        
        try {
            const payload: any = {
                diamond_type_id: Number(formData.diamond_type_id),
                code: formData.code,
                name: formData.name,
                description: formData.description || null,
                display_order: formData.display_order === '' ? 0 : Number(formData.display_order),
                is_active: formData.is_active,
            };

            if (editingClarity) {
                await adminService.updateDiamondClarity(editingClarity.id, payload);
                toastSuccess('Diamond clarity updated successfully.');
            } else {
                await adminService.createDiamondClarity(payload);
                toastSuccess('Diamond clarity created successfully.');
            }
            resetForm();
            await loadClarities();
        } catch (error: any) {
            console.error('Failed to save diamond clarity:', error);
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                toastError(error.response?.data?.message || 'Failed to save diamond clarity. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };

    const toggleClarity = async (clarity: DiamondClarityRow) => {
        try {
            await adminService.updateDiamondClarity(clarity.id, {
                diamond_type_id: clarity.diamond_type_id,
                code: clarity.code,
                name: clarity.name,
                description: clarity.description,
                is_active: !clarity.is_active,
                display_order: clarity.display_order,
            });
            await loadClarities();
            toastSuccess(`Diamond clarity ${!clarity.is_active ? 'activated' : 'deactivated'} successfully.`);
        } catch (error: any) {
            console.error('Failed to toggle diamond clarity status:', error);
            toastError(error.response?.data?.message || 'Failed to update diamond clarity. Please try again.');
        }
    };

    const deleteClarity = (clarity: DiamondClarityRow) => {
        setDeleteConfirm(clarity);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteDiamondClarity(deleteConfirm.id);
                setDeleteConfirm(null);
                toastSuccess('Diamond clarity deleted successfully.');
                await loadClarities();
            } catch (error: any) {
                console.error('Failed to delete diamond clarity:', error);
                setDeleteConfirm(null);
                toastError(error.response?.data?.message || 'Failed to delete diamond clarity. Please try again.');
            }
        }
    };

    const bulkDelete = () => {
        if (selectedClarities.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        try {
            const response = await adminService.bulkDeleteDiamondClarities(selectedClarities);
            setSelectedClarities([]);
            setBulkDeleteConfirm(false);
            const message = response.data?.message || `${selectedClarities.length} diamond clarit${selectedClarities.length === 1 ? 'y' : 'ies'} deleted successfully.`;
            toastSuccess(message);
            await loadClarities();
        } catch (error: any) {
            console.error('Failed to bulk delete diamond clarities:', error);
            setBulkDeleteConfirm(false);
            toastError(error.response?.data?.message || 'Failed to delete diamond clarities. Please try again.');
        }
    };


    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    return (
        <>
            <Head title="Diamond clarities" />
            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Diamond clarities</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage diamond clarity grades for catalogue specifications.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New clarity
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">
                            Clarities ({clarities.meta.total})
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedClarities.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedClarities.length === 0}
                                className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Bulk delete
                            </button>
                            <select
                                value={perPage}
                                onChange={handlePerPageChange}
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
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                <th className="px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        aria-label="Select all diamond clarities"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Type</th>
                                <th className="px-5 py-3 text-left">Code</th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Order</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {clarities.data.map((clarity) => (
                                <tr key={clarity.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedClarities.includes(clarity.id)}
                                            onChange={() => toggleSelection(clarity.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select diamond clarity ${clarity.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 text-slate-700">{clarity.type ? clarity.type.name : '-'}</td>
                                    <td className="px-5 py-3 text-slate-700">{clarity.code}</td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{clarity.name}</span>
                                            {clarity.description && <span className="text-xs text-slate-500">{clarity.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{clarity.display_order}</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                clarity.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {clarity.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(clarity)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                title="Edit clarity"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleClarity(clarity)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                                title={clarity.is_active ? 'Pause clarity' : 'Activate clarity'}
                                            >
                                                {clarity.is_active ? (
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
                                                onClick={() => deleteClarity(clarity)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                title="Delete clarity"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {clarities.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No diamond clarities defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination 
                    meta={clarities.meta} 
                    onPageChange={setCurrentPage} 
                />
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingClarity ? `Edit diamond clarity: ${editingClarity.name}` : 'Create new diamond clarity'}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="clarity-form"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingClarity ? 'Update diamond clarity' : 'Create diamond clarity'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
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
                        <form onSubmit={submit} className="space-y-6" id="clarity-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Type <span className="text-rose-500">*</span></span>
                                            <select
                                                value={formData.diamond_type_id === '' ? '' : String(formData.diamond_type_id)}
                                                onChange={(event) => setFormData({ ...formData, diamond_type_id: event.target.value === '' ? '' : Number(event.target.value) })}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            >
                                                <option value="">Select type</option>
                                                {types.map((type) => (
                                                    <option key={type.id} value={type.id}>
                                                        {type.name} {type.code ? `(${type.code})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.diamond_type_id && <span className="text-xs text-rose-500">{formErrors.diamond_type_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Code <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={formData.code}
                                                onChange={(event) => setFormData({ ...formData, code: event.target.value })}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                placeholder="e.g., A1, VVS"
                                                required
                                            />
                                            {formErrors.code && <span className="text-xs text-rose-500">{formErrors.code}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Name <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                            {formErrors.name && <span className="text-xs text-rose-500">{formErrors.name}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Display Order <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                value={formData.display_order === '' || formData.display_order === undefined ? '' : formData.display_order}
                                                onChange={(event) => {
                                                    const value = event.target.value;
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
                                                required
                                            />
                                            {formErrors.display_order && <span className="text-xs text-rose-500">{formErrors.display_order}</span>}
                                        </label>
                                    </div>

                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
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
                                            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                                            className="min-h-[200px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Optional notes for team."
                                        />
                                        {formErrors.description && <span className="text-xs text-rose-500">{formErrors.description}</span>}
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
                title="Remove Diamond Clarity"
                message={deleteConfirm ? `Are you sure you want to remove diamond clarity ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Diamond Clarities"
                message={`Are you sure you want to delete ${selectedClarities.length} selected diamond clarity/clarities?`}
                confirmText="Delete"
                variant="danger"
            />
        </>
    );
}
