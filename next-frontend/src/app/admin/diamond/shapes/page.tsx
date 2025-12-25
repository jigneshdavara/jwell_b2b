'use client';

import { Head } from '@/components/Head';
import { useEffect, useMemo, useState } from 'react';
import { adminService } from '@/services/adminService';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import FlashMessage from '@/components/shared/FlashMessage';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';

type DiamondType = {
    id: number;
    name: string;
    code: string | null;
};

type DiamondShapeRow = {
    id: number;
    diamond_type_id: number;
    type: DiamondType | null;
    code: string;
    name: string;
    description?: string | null;
    display_order: number;
    is_active: boolean;
};


export default function AdminDiamondShapesIndex() {
    const [loading, setLoading] = useState(true);
    const [shapes, setShapes] = useState<{ data: DiamondShapeRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10, from: undefined, to: undefined }
    });
    const [types, setTypes] = useState<DiamondType[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingShape, setEditingShape] = useState<DiamondShapeRow | null>(null);
    const [selectedShapes, setSelectedShapes] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<DiamondShapeRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

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
        loadShapes();
    }, [currentPage, perPage]);

    useEffect(() => {
        const existingIds = new Set(shapes.data.map((shape) => shape.id));
        setSelectedShapes((prev) => prev.filter((id) => existingIds.has(id)));
    }, [shapes.data]);

    const allSelected = useMemo(() => {
        if (shapes.data.length === 0) {
            return false;
        }
        return selectedShapes.length === shapes.data.length;
    }, [shapes.data, selectedShapes]);


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

    const loadShapes = async () => {
        setLoading(true);
        try {
            const response = await adminService.getDiamondShapes(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setShapes({
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
            console.error('Failed to load diamond shapes:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedShapes([]);
        } else {
            setSelectedShapes(shapes.data.map((shape) => shape.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedShapes((prev) =>
            prev.includes(id) ? prev.filter((shapeId) => shapeId !== id) : [...prev, id]
        );
    };

    const resetForm = () => {
        setEditingShape(null);
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

    const openEditModal = (shape: DiamondShapeRow) => {
        setEditingShape(shape);
        setFormErrors({});
        setFormData({
            diamond_type_id: shape.diamond_type_id,
            code: shape.code,
            name: shape.name,
            description: shape.description ?? '',
            display_order: shape.display_order,
            is_active: shape.is_active,
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

            if (editingShape) {
                await adminService.updateDiamondShape(editingShape.id, payload);
                setFlashMessage({ type: 'success', message: 'Diamond shape updated successfully.' });
            } else {
                await adminService.createDiamondShape(payload);
                setFlashMessage({ type: 'success', message: 'Diamond shape created successfully.' });
            }
            resetForm();
            await loadShapes();
        } catch (error: any) {
            console.error('Failed to save diamond shape:', error);
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                setFlashMessage({ type: 'error', message: error.response?.data?.message || 'Failed to save diamond shape. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    const toggleShape = async (shape: DiamondShapeRow) => {
        try {
            await adminService.updateDiamondShape(shape.id, {
                diamond_type_id: shape.diamond_type_id,
                code: shape.code,
                name: shape.name,
                description: shape.description,
                is_active: !shape.is_active,
                display_order: shape.display_order,
            });
            await loadShapes();
            setFlashMessage({ type: 'success', message: `Diamond shape ${!shape.is_active ? 'activated' : 'deactivated'} successfully.` });
        } catch (error: any) {
            console.error('Failed to toggle diamond shape status:', error);
            setFlashMessage({ type: 'error', message: error.response?.data?.message || 'Failed to update diamond shape. Please try again.' });
        }
    };

    const deleteShape = (shape: DiamondShapeRow) => {
        setDeleteConfirm(shape);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteDiamondShape(deleteConfirm.id);
                setDeleteConfirm(null);
                setFlashMessage({ type: 'success', message: 'Diamond shape deleted successfully.' });
                await loadShapes();
            } catch (error: any) {
                console.error('Failed to delete diamond shape:', error);
                setDeleteConfirm(null);
                setFlashMessage({ type: 'error', message: error.response?.data?.message || 'Failed to delete diamond shape. Please try again.' });
            }
        }
    };

    const bulkDelete = () => {
        if (selectedShapes.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        try {
            const response = await adminService.bulkDeleteDiamondShapes(selectedShapes);
            setSelectedShapes([]);
            setBulkDeleteConfirm(false);
            const message = response.data?.message || `${selectedShapes.length} diamond shape(s) deleted successfully.`;
            setFlashMessage({ type: 'success', message });
            await loadShapes();
        } catch (error: any) {
            console.error('Failed to bulk delete diamond shapes:', error);
            setBulkDeleteConfirm(false);
            setFlashMessage({ type: 'error', message: error.response?.data?.message || 'Failed to delete diamond shapes. Please try again.' });
        }
    };


    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    return (
        <>
            <Head title="Diamond shapes" />
            <div className="space-y-8">
                {flashMessage && (
                    <FlashMessage
                        type={flashMessage.type}
                        message={flashMessage.message}
                        onClose={() => setFlashMessage(null)}
                    />
                )}
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Diamond shapes</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage diamond shapes for catalogue specifications.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New shape
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">
                            Shapes ({shapes.meta.total})
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedShapes.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedShapes.length === 0}
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
                                        aria-label="Select all diamond shapes"
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
                            {shapes.data.map((shape) => (
                                <tr key={shape.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedShapes.includes(shape.id)}
                                            onChange={() => toggleSelection(shape.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select diamond shape ${shape.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 text-slate-700">{shape.type ? shape.type.name : '-'}</td>
                                    <td className="px-5 py-3 text-slate-700">{shape.code}</td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{shape.name}</span>
                                            {shape.description && <span className="text-xs text-slate-500">{shape.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{shape.display_order}</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                shape.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {shape.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(shape)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                title="Edit shape"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleShape(shape)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                                title={shape.is_active ? 'Pause shape' : 'Activate shape'}
                                            >
                                                {shape.is_active ? (
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
                                                onClick={() => deleteShape(shape)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                title="Delete shape"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {shapes.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No diamond shapes defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination 
                    meta={shapes.meta} 
                    onPageChange={setCurrentPage} 
                />
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingShape ? `Edit diamond shape: ${editingShape.name}` : 'Create new diamond shape'}
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
                                    form="shape-form"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingShape ? 'Update diamond shape' : 'Create diamond shape'}
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
                        <form onSubmit={submit} className="space-y-6" id="shape-form">
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
                                                placeholder="e.g., RND, PRI"
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
                                                onChange={(event) => setFormData({ ...formData, display_order: event.target.value === '' ? '' : Number(event.target.value) })}
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
                title="Remove Diamond Shape"
                message={deleteConfirm ? `Are you sure you want to remove diamond shape ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Diamond Shapes"
                message={`Are you sure you want to delete ${selectedShapes.length} selected diamond shape(s)?`}
                confirmText="Delete"
                variant="danger"
            />
        </>
    );
}
