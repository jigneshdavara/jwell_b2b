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

type DiamondColorRow = {
    id: number;
    diamond_type_id: number;
    type: DiamondType | null;
    code: string;
    name: string;
    description?: string | null;
    display_order: number;
    is_active: boolean;
};


export default function AdminDiamondColorsIndex() {
    const [loading, setLoading] = useState(true);
    const [colors, setColors] = useState<{ data: DiamondColorRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });
    const [types, setTypes] = useState<DiamondType[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingColor, setEditingColor] = useState<DiamondColorRow | null>(null);
    const [selectedColors, setSelectedColors] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<DiamondColorRow | null>(null);
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
        loadColors();
    }, [currentPage, perPage]);

    useEffect(() => {
        const existingIds = new Set(colors.data.map((color) => color.id));
        setSelectedColors((prev) => prev.filter((id) => existingIds.has(id)));
    }, [colors.data]);

    const allSelected = useMemo(() => {
        if (colors.data.length === 0) {
            return false;
        }
        return selectedColors.length === colors.data.length;
    }, [colors.data, selectedColors]);


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

    const loadColors = async () => {
        setLoading(true);
        try {
            const response = await adminService.getDiamondColors(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setColors({
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
            console.error('Failed to load diamond colors:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedColors([]);
        } else {
            setSelectedColors(colors.data.map((color) => color.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedColors((prev) =>
            prev.includes(id) ? prev.filter((colorId) => colorId !== id) : [...prev, id]
        );
    };

    const resetForm = () => {
        setEditingColor(null);
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

    const openEditModal = (color: DiamondColorRow) => {
        setEditingColor(color);
        setFormErrors({});
        setFormData({
            diamond_type_id: color.diamond_type_id,
            code: color.code,
            name: color.name,
            description: color.description ?? '',
            display_order: color.display_order,
            is_active: color.is_active,
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

            if (editingColor) {
                await adminService.updateDiamondColor(editingColor.id, payload);
                toastSuccess('Diamond color updated successfully.');
            } else {
                await adminService.createDiamondColor(payload);
                toastSuccess('Diamond color created successfully.');
            }
            resetForm();
            await loadColors();
        } catch (error: any) {
            console.error('Failed to save diamond color:', error);
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                toastError(error.response?.data?.message || 'Failed to save diamond color. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };

    const toggleColor = async (color: DiamondColorRow) => {
        try {
            await adminService.updateDiamondColor(color.id, {
                diamond_type_id: color.diamond_type_id,
                code: color.code,
                name: color.name,
                description: color.description,
                is_active: !color.is_active,
                display_order: color.display_order,
            });
            await loadColors();
            toastSuccess(`Diamond color ${!color.is_active ? 'activated' : 'deactivated'} successfully.`);
        } catch (error: any) {
            console.error('Failed to toggle diamond color status:', error);
            toastError(error.response?.data?.message || 'Failed to update diamond color. Please try again.');
        }
    };

    const deleteColor = (color: DiamondColorRow) => {
        setDeleteConfirm(color);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteDiamondColor(deleteConfirm.id);
                toastSuccess('Diamond color deleted successfully.');
                await loadColors();
            } catch (error: any) {
                console.error('Failed to delete diamond color:', error);
                toastError(error.response?.data?.message || 'Failed to delete diamond color. Please try again.');
            } finally {
                setDeleteConfirm(null);
            }
        }
    };

    const bulkDelete = () => {
        if (selectedColors.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        try {
            const response = await adminService.bulkDeleteDiamondColors(selectedColors);
            setSelectedColors([]);
            const message = response.data?.message || `${selectedColors.length} diamond color${selectedColors.length === 1 ? '' : 's'} deleted successfully.`;
            toastSuccess(message);
            await loadColors();
        } catch (error: any) {
            console.error('Failed to bulk delete diamond colors:', error);
            toastError(error.response?.data?.message || 'Failed to delete diamond colors. Please try again.');
        } finally {
            setBulkDeleteConfirm(false);
        }
    };


    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    return (
        <>
            <Head title="Diamond colors" />
            <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Diamond colors</h1>
                        <p className="mt-2 text-xs sm:text-sm text-slate-500">Manage diamond color grades for catalogue specifications.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New color
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-3 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm">
                        <div className="font-semibold text-slate-700">
                            Colors ({colors.meta.total})
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500">
                            <span>{selectedColors.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedColors.length === 0}
                                className="inline-flex items-center rounded-full border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
                            >
                                Bulk delete
                            </button>
                            <select
                                value={perPage}
                                onChange={handlePerPageChange}
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
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        aria-label="Select all diamond colors"
                                    />
                                </th>
                                    <th className="px-3 py-2 text-left hidden md:table-cell sm:px-5 sm:py-3">Type</th>
                                    <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Code</th>
                                    <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Name</th>
                                    <th className="px-3 py-2 text-left hidden lg:table-cell sm:px-5 sm:py-3">Order</th>
                                    <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Status</th>
                                    <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                                {colors.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-3 py-4 sm:px-5 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                            No diamond colors defined yet.
                                        </td>
                                    </tr>
                                ) : (
                                    colors.data.map((color) => (
                                <tr key={color.id} className="hover:bg-slate-50">
                                            <td className="px-3 py-2 sm:px-5 sm:py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedColors.includes(color.id)}
                                            onChange={() => toggleSelection(color.id)}
                                                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select diamond color ${color.name}`}
                                        />
                                    </td>
                                            <td className="px-3 py-2 text-slate-700 hidden md:table-cell sm:px-5 sm:py-3">{color.type ? color.type.name : '-'}</td>
                                            <td className="px-3 py-2 text-slate-700 sm:px-5 sm:py-3">{color.code}</td>
                                            <td className="px-3 py-2 font-semibold text-slate-900 sm:px-5 sm:py-3">
                                        <div className="flex flex-col gap-1">
                                                    <span className="text-xs sm:text-sm">{color.name}</span>
                                                    {color.description && <span className="text-[10px] sm:text-xs text-slate-500">{color.description}</span>}
                                        </div>
                                    </td>
                                            <td className="px-3 py-2 text-slate-500 hidden lg:table-cell sm:px-5 sm:py-3">{color.display_order}</td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3">
                                        <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs font-semibold ${
                                                color.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {color.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                            <td className="px-3 py-2 text-right sm:px-5 sm:py-3">
                                                <div className="flex justify-end gap-1.5 sm:gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(color)}
                                                        className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                title="Edit color"
                                            >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleColor(color)}
                                                        className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                                title={color.is_active ? 'Pause color' : 'Activate color'}
                                            >
                                                {color.is_active ? (
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
                                                onClick={() => deleteColor(color)}
                                                        className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                title="Delete color"
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
                    meta={colors.meta} 
                    onPageChange={setCurrentPage} 
                />
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-4">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-sm sm:text-base lg:text-xl font-semibold text-slate-900 truncate">
                                {editingColor ? `Edit diamond color: ${editingColor.name}` : 'Create new diamond color'}
                            </h2>
                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="color-form"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingColor ? 'Update' : 'Create'}
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
                        <form onSubmit={submit} className="space-y-4 sm:space-y-6" id="color-form">
                            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="grid gap-3 sm:gap-4">
                                        <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                            <span>Type <span className="text-rose-500">*</span></span>
                                            <select
                                                value={formData.diamond_type_id === '' ? '' : String(formData.diamond_type_id)}
                                                onChange={(event) => setFormData({ ...formData, diamond_type_id: event.target.value === '' ? '' : Number(event.target.value) })}
                                                className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
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
                                        <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                            <span>Code <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={formData.code}
                                                onChange={(event) => setFormData({ ...formData, code: event.target.value })}
                                                className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                                placeholder="e.g., DEF, GH"
                                                required
                                            />
                                            {formErrors.code && <span className="text-xs text-rose-500">{formErrors.code}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                            <span>Name <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                                                className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                                required
                                            />
                                            {formErrors.name && <span className="text-xs text-rose-500">{formErrors.name}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                            <span>Display Order <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                value={formData.display_order === '' || formData.display_order === undefined || formData.display_order === 0 ? '' : formData.display_order}
                                                onChange={(event) => setFormData({ ...formData, display_order: event.target.value === '' ? 0 : Number(event.target.value) })}
                                                className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                                min={0}
                                                required
                                            />
                                            {formErrors.display_order && <span className="text-xs text-rose-500">{formErrors.display_order}</span>}
                                        </label>
                                    </div>

                                    <label className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Active for selection
                                    </label>
                                </div>

                                <div className="space-y-4 sm:space-y-6">
                                    <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={formData.description}
                                            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                                            className="min-h-[140px] sm:min-h-[160px] lg:min-h-[200px] rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
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
                title="Remove Diamond Color"
                message={deleteConfirm ? `Are you sure you want to remove diamond color ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Diamond Colors"
                message={`Are you sure you want to delete ${selectedColors.length} selected diamond color(s)?`}
                confirmText="Delete"
                variant="danger"
            />
        </>
    );
}
