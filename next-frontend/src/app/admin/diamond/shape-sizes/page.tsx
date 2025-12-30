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

type DiamondShape = {
    id: number;
    name: string;
    code: string | null;
    is_active?: boolean;
};

type DiamondShapeSizeRow = {
    id: number;
    diamond_type_id: number;
    type: DiamondType | null;
    diamond_shape_id: number;
    shape: DiamondShape | null;
    size: string;
    secondary_size: string | null;
    description?: string | null;
    display_order: number;
    ctw: number;
};


export default function AdminDiamondShapeSizesIndex() {
    const [loading, setLoading] = useState(true);
    const [sizes, setSizes] = useState<{ data: DiamondShapeSizeRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10, from: undefined, to: undefined }
    });
    const [shapes, setShapes] = useState<DiamondShape[]>([]);
    const [types, setTypes] = useState<DiamondType[]>([]);
    const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSize, setEditingSize] = useState<DiamondShapeSizeRow | null>(null);
    const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<DiamondShapeSizeRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    // Toast notifications are handled via RTK

    const [formData, setFormData] = useState({
        diamond_type_id: '' as string | number,
        diamond_shape_id: '' as string | number,
        size: '',
        secondary_size: '',
        description: '',
        display_order: 0 as string | number,
        ctw: '' as string | number,
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadTypes();
        loadShapes();
        loadSizes();
    }, [currentPage, perPage, selectedShapeId]);

    useEffect(() => {
        const existingIds = new Set(sizes.data.map((size) => size.id));
        setSelectedSizes((prev) => prev.filter((id) => existingIds.has(id)));
    }, [sizes.data]);

    const allSelected = useMemo(() => {
        if (sizes.data.length === 0) {
            return false;
        }
        return selectedSizes.length === sizes.data.length;
    }, [sizes.data, selectedSizes]);


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
        try {
            const response = await adminService.getDiamondShapes(1, 100); // Load all active shapes
            const items = response.data.items || response.data.data || [];
            setShapes(items.map((item: any) => ({
                id: Number(item.id),
                name: item.name || '',
                code: item.code || null,
                is_active: item.is_active ?? true,
            })).filter((shape: DiamondShape) => shape.name && shape.is_active !== false)); // Filter active shapes
        } catch (error: any) {
            console.error('Failed to load diamond shapes:', error);
        }
    };

    const loadSizes = async () => {
        setLoading(true);
        try {
            const response = await adminService.getDiamondShapeSizes(currentPage, perPage, selectedShapeId || undefined);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setSizes({
                data: items.map((item: any) => {
                    const type = item.diamond_types || item.type;
                    const shape = item.diamond_shapes || item.shape;
                    return {
                        id: Number(item.id),
                        diamond_type_id: Number(item.diamond_type_id || 0),
                        type: type ? {
                            id: Number(type.id),
                            name: type.name || '',
                            code: type.code || null,
                        } : null,
                        diamond_shape_id: Number(item.diamond_shape_id || 0),
                        shape: shape ? {
                            id: Number(shape.id),
                            name: shape.name || '',
                            code: shape.code || null,
                        } : null,
                        size: item.size || '',
                        secondary_size: item.secondary_size || null,
                        description: item.description || null,
                        display_order: Number(item.display_order || 0),
                        ctw: Number(item.ctw || 0),
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
            console.error('Failed to load diamond shape sizes:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedSizes([]);
        } else {
            setSelectedSizes(sizes.data.map((size) => size.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedSizes((prev) =>
            prev.includes(id) ? prev.filter((sizeId) => sizeId !== id) : [...prev, id]
        );
    };

    const resetForm = () => {
        setEditingSize(null);
        setModalOpen(false);
        setFormErrors({});
        setFormData({
            diamond_type_id: '',
            diamond_shape_id: selectedShapeId ? selectedShapeId : (shapes.length > 0 ? shapes[0].id : ''),
            size: '',
            secondary_size: '',
            description: '',
            display_order: 0,
            ctw: '',
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (size: DiamondShapeSizeRow) => {
        setEditingSize(size);
        setFormErrors({});
        setFormData({
            diamond_type_id: size.diamond_type_id,
            diamond_shape_id: size.diamond_shape_id,
            size: size.size,
            secondary_size: size.secondary_size ?? '',
            description: size.description ?? '',
            display_order: size.display_order,
            ctw: size.ctw,
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
                diamond_shape_id: Number(formData.diamond_shape_id),
                size: formData.size,
                secondary_size: formData.secondary_size || null,
                description: formData.description || null,
                display_order: formData.display_order === '' ? 0 : Number(formData.display_order),
                ctw: formData.ctw === '' ? 0 : Number(formData.ctw),
            };

            if (editingSize) {
                await adminService.updateDiamondShapeSize(editingSize.id, payload);
                toastSuccess('Diamond shape size updated successfully.');
            } else {
                await adminService.createDiamondShapeSize(payload);
                toastSuccess('Diamond shape size created successfully.');
            }
            resetForm();
            await loadSizes();
        } catch (error: any) {
            console.error('Failed to save diamond shape size:', error);
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                toastError(error.response?.data?.message || 'Failed to save diamond shape size. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };

    const deleteSize = (size: DiamondShapeSizeRow) => {
        setDeleteConfirm(size);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteDiamondShapeSize(deleteConfirm.id);
                setDeleteConfirm(null);
                toastSuccess('Diamond shape size deleted successfully.');
                await loadSizes();
            } catch (error: any) {
                console.error('Failed to delete diamond shape size:', error);
                setDeleteConfirm(null);
                toastError(error.response?.data?.message || 'Failed to delete diamond shape size. Please try again.');
            }
        }
    };

    const bulkDelete = () => {
        if (selectedSizes.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        try {
            const response = await adminService.bulkDeleteDiamondShapeSizes(selectedSizes);
            setSelectedSizes([]);
            setBulkDeleteConfirm(false);
            const message = response.data?.message || `${selectedSizes.length} diamond shape size(s) deleted successfully.`;
            toastSuccess(message);
            await loadSizes();
        } catch (error: any) {
            console.error('Failed to bulk delete diamond shape sizes:', error);
            setBulkDeleteConfirm(false);
            toastError(error.response?.data?.message || 'Failed to delete diamond shape sizes. Please try again.');
        }
    };


    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const handleShapeFilter = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const shapeId = event.target.value ? Number(event.target.value) : null;
        setSelectedShapeId(shapeId);
        setCurrentPage(1);
    };

    return (
        <>
            <Head title="Diamond shape sizes" />
            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Diamond shape sizes</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage diamond shape sizes and carat weights for catalogue specifications.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New size
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="flex items-center gap-4">
                            <div className="font-semibold text-slate-700">
                                Sizes ({sizes.meta.total})
                            </div>
                            <select
                                value={selectedShapeId || ''}
                                onChange={handleShapeFilter}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                            >
                                <option value="">All shapes</option>
                                {shapes.map((shape) => (
                                    <option key={shape.id} value={shape.id}>
                                        {shape.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedSizes.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedSizes.length === 0}
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
                                        aria-label="Select all diamond shape sizes"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Type</th>
                                <th className="px-5 py-3 text-left">Shape</th>
                                <th className="px-5 py-3 text-left">Size</th>
                                <th className="px-5 py-3 text-left">Secondary Size</th>
                                <th className="px-5 py-3 text-left">CTW</th>
                                <th className="px-5 py-3 text-left">Order</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {sizes.data.map((size) => (
                                <tr key={size.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedSizes.includes(size.id)}
                                            onChange={() => toggleSelection(size.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select diamond shape size ${size.size}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 text-slate-700">{size.type ? size.type.name : '-'}</td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        {size.shape?.name || '-'}
                                    </td>
                                    <td className="px-5 py-3 text-slate-700">{size.size}</td>
                                    <td className="px-5 py-3 text-slate-500">{size.secondary_size || '-'}</td>
                                    <td className="px-5 py-3 text-slate-500">{typeof size.ctw === 'number' ? size.ctw.toFixed(3) : (parseFloat(String(size.ctw)) || 0).toFixed(3)}</td>
                                    <td className="px-5 py-3 text-slate-500">{size.display_order}</td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(size)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                title="Edit size"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteSize(size)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                title="Delete size"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sizes.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No diamond shape sizes defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination 
                    meta={sizes.meta} 
                    onPageChange={setCurrentPage} 
                />
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingSize ? `Edit diamond shape size` : 'Create new diamond shape size'}
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
                                    form="size-form"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingSize ? 'Update diamond shape size' : 'Create diamond shape size'}
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
                        <form onSubmit={submit} className="space-y-6" id="size-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Type <span className="text-rose-500">*</span></span>
                                            <select
                                                value={formData.diamond_type_id === '' ? '' : String(formData.diamond_type_id)}
                                                onChange={(event) => setFormData({ ...formData, diamond_type_id: event.target.value === '' ? '' : Number(event.target.value) })}
                                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-4 py-2"
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
                                            <span>Diamond Shape <span className="text-rose-500">*</span></span>
                                            <select
                                                value={formData.diamond_shape_id === '' ? '' : String(formData.diamond_shape_id)}
                                                onChange={(event) => setFormData({ ...formData, diamond_shape_id: event.target.value === '' ? '' : Number(event.target.value) })}
                                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-4 py-2"
                                                required
                                            >
                                                <option value="">Select a shape</option>
                                                {shapes.map((shape) => (
                                                    <option key={shape.id} value={shape.id}>
                                                        {shape.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.diamond_shape_id && <span className="text-xs text-rose-500">{formErrors.diamond_shape_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Size <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={formData.size}
                                                onChange={(event) => setFormData({ ...formData, size: event.target.value })}
                                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-4 py-2"
                                                placeholder="e.g., 1.00, 2.00x3.00"
                                                required
                                            />
                                            {formErrors.size && <span className="text-xs text-rose-500">{formErrors.size}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Secondary Size</span>
                                            <input
                                                type="text"
                                                value={formData.secondary_size}
                                                onChange={(event) => setFormData({ ...formData, secondary_size: event.target.value })}
                                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-4 py-2"
                                                placeholder="e.g., (S), (T)"
                                            />
                                            {formErrors.secondary_size && <span className="text-xs text-rose-500">{formErrors.secondary_size}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>CTW (Carat Total Weight) <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={formData.ctw === '' ? '' : formData.ctw}
                                                onChange={(event) => setFormData({ ...formData, ctw: event.target.value === '' ? '' : Number(event.target.value) })}
                                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-4 py-2"
                                                min={0}
                                                required
                                            />
                                            {formErrors.ctw && <span className="text-xs text-rose-500">{formErrors.ctw}</span>}
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
                                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-4 py-2"
                                                min={0}
                                                required
                                            />
                                            {formErrors.display_order && <span className="text-xs text-rose-500">{formErrors.display_order}</span>}
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={formData.description}
                                            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                                            className="min-h-[200px] rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-4 py-2"
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
                title="Remove Diamond Shape Size"
                message={deleteConfirm ? `Are you sure you want to remove this diamond shape size?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Diamond Shape Sizes"
                message={`Are you sure you want to delete ${selectedSizes.length} selected diamond shape size(s)?`}
                confirmText="Delete"
                variant="danger"
            />
        </>
    );
}
