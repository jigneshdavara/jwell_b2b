'use client';

import { Head } from '@/components/Head';
import { useEffect, useMemo, useState } from 'react';
import { adminService } from '@/services/adminService';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import TextInput from '@/components/ui/TextInput';
import InputLabel from '@/components/ui/InputLabel';
import InputError from '@/components/ui/InputError';
import Select from '@/components/ui/Select';
import { toastSuccess, toastError, toastInfo } from '@/utils/toast';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { diamondShapeSizeSchema, DiamondShapeSizeFormData } from '@/lib/validation/admin.schema';

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
    const [filteredShapes, setFilteredShapes] = useState<DiamondShape[]>([]);
    const [types, setTypes] = useState<DiamondType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    const [selectedShapeId, setSelectedShapeId] = useState<number | null>(null);
    const [loadingShapes, setLoadingShapes] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSize, setEditingSize] = useState<DiamondShapeSizeRow | null>(null);
    const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<DiamondShapeSizeRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    // React Hook Form setup
    const {
        control,
        handleSubmit: handleFormSubmit,
        formState: { errors },
        reset,
        setError,
        trigger,
        watch,
        setValue,
    } = useForm<DiamondShapeSizeFormData>({
        resolver: zodResolver(diamondShapeSizeSchema),
        mode: "onSubmit",
        reValidateMode: "onBlur",
        shouldFocusError: true,
        defaultValues: {
            diamond_type_id: 0,
            diamond_shape_id: 0,
            size: '',
            secondary_size: '',
            description: '',
            display_order: 0,
            ctw: 0,
        },
    });
    const [processing, setProcessing] = useState(false);
    
    // Watch diamond_type_id to load shapes when it changes
    const watchedTypeId = watch('diamond_type_id');

    useEffect(() => {
        loadTypes();
        loadShapes();
    }, []);

    useEffect(() => {
        loadSizes();
    }, [currentPage, perPage, selectedTypeId, selectedShapeId]);

    // Filter shapes when type changes (for table filter)
    useEffect(() => {
        if (selectedTypeId) {
            loadShapesByType(selectedTypeId);
        } else {
            // If no type selected, show all active shapes
            if (shapes.length > 0) {
                setFilteredShapes(shapes.filter(s => s.is_active !== false));
            }
        }
    }, [selectedTypeId, shapes]);

    // Load shapes when diamond_type_id changes in form (for form dropdown)
    useEffect(() => {
        if (watchedTypeId && watchedTypeId !== 0) {
            // Reset diamond_shape_id when type changes
            setValue('diamond_shape_id', 0);
            loadShapesByType(Number(watchedTypeId));
        } else {
            // If no type selected, show all active shapes
            if (shapes.length > 0) {
                setFilteredShapes(shapes.filter(s => s.is_active !== false));
            }
        }
    }, [watchedTypeId, shapes, setValue]);

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
            const response = await adminService.getDiamondTypes(1, 100);
            const items = response.data.items || response.data.data || [];
            // Filter only active types for dropdown
            setTypes(items
                .filter((item: any) => item.is_active === true)
                .map((item: any) => ({
                    id: Number(item.id),
                    name: item.name || '',
                    code: item.code || null,
                })));
        } catch (error: any) {
            console.error('Failed to load diamond types:', error);
        }
    };

    const loadShapes = async () => {
        try {
            const response = await adminService.getDiamondShapes(1, 100);
            const items = response.data.items || response.data.data || [];
            // Filter only active shapes for dropdown
            const activeShapes = items
                .filter((item: any) => item.is_active !== false)
                .map((item: any) => ({
                    id: Number(item.id),
                    name: item.name || '',
                    code: item.code || null,
                    is_active: item.is_active ?? true,
                }));
            setShapes(activeShapes);
            // Initially show all active shapes
            setFilteredShapes(activeShapes);
        } catch (error: any) {
            console.error('Failed to load diamond shapes:', error);
        }
    };

    const loadShapesByType = async (typeId: number | string | null) => {
        if (!typeId || typeId === '') {
            // If no type selected, show all shapes
            setFilteredShapes(shapes);
            return;
        }

        setLoadingShapes(true);
        try {
            const response = await adminService.getDiamondShapesByType(Number(typeId));
            const items = response.data || [];
            setFilteredShapes(items.map((item: any) => ({
                id: Number(item.id),
                name: item.name || '',
                code: item.code || null,
                is_active: item.is_active ?? true,
            })));
        } catch (error: any) {
            console.error('Failed to load diamond shapes by type:', error);
            setFilteredShapes([]);
        } finally {
            setLoadingShapes(false);
        }
    };

    const loadSizes = async () => {
        setLoading(true);
        try {
            const response = await adminService.getDiamondShapeSizes(
                currentPage, 
                perPage, 
                selectedShapeId || undefined,
                selectedTypeId || undefined
            );
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setSizes({
                data: items
                    .filter((item: any) => {
                        const type = item.diamond_types || item.type;
                        // Only show shape sizes from active types
                        return type?.is_active !== false;
                    })
                    .map((item: any) => {
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
        reset({
            diamond_type_id: 0,
            diamond_shape_id: 0,
            size: '',
            secondary_size: '',
            description: '',
            display_order: 0,
            ctw: 0,
        });
        // Reset filtered shapes to show all when form is reset
        setFilteredShapes(shapes);
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = async (size: DiamondShapeSizeRow) => {
        setEditingSize(size);
        // Load shapes for the selected type when editing
        await loadShapesByType(size.diamond_type_id);
        reset({
            diamond_type_id: size.diamond_type_id,
            diamond_shape_id: 0, // Set to 0 initially, will be set after shapes load
            size: size.size,
            secondary_size: size.secondary_size ?? '',
            description: size.description ?? '',
            display_order: size.display_order,
            ctw: size.ctw,
        });
        // Set the shape_id after reset to ensure it's not overridden by useEffect
        // Use setTimeout to ensure it runs after the useEffect that watches watchedTypeId
        setTimeout(() => {
            setValue('diamond_shape_id', size.diamond_shape_id);
        }, 0);
        setModalOpen(true);
    };

    const onSubmit = async (data: DiamondShapeSizeFormData) => {
        setProcessing(true);
        
        try {
            const payload: any = {
                diamond_type_id: data.diamond_type_id,
                diamond_shape_id: data.diamond_shape_id,
                size: data.size,
                secondary_size: data.secondary_size || null,
                description: data.description || null,
                display_order: data.display_order,
                ctw: data.ctw,
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
            // Handle field-level errors
            if (error.response?.data?.errors) {
                const fieldErrors = error.response.data.errors;
                Object.keys(fieldErrors).forEach((key) => {
                    const errorMessage = Array.isArray(fieldErrors[key]) 
                        ? fieldErrors[key][0] 
                        : fieldErrors[key];
                    setError(key as keyof DiamondShapeSizeFormData, {
                        type: 'server',
                        message: errorMessage,
                    });
                });
            }
            
            // Show error message in toast (prioritize message field)
            const errorMessage = error.response?.data?.message 
                ? (Array.isArray(error.response.data.message) 
                    ? error.response.data.message.join(', ') 
                    : error.response.data.message)
                : 'Failed to save diamond shape size. Please try again.';
            toastError(errorMessage);
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
                toastSuccess('Diamond shape size deleted successfully.');
                await loadSizes();
            } catch (error: any) {
                console.error('Failed to delete diamond shape size:', error);
                toastError(error.response?.data?.message || 'Failed to delete diamond shape size. Please try again.');
            } finally {
                setDeleteConfirm(null);
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
            const message = response.data?.message || `${selectedSizes.length} diamond shape size(s) deleted successfully.`;
            toastSuccess(message);
            await loadSizes();
        } catch (error: any) {
            console.error('Failed to bulk delete diamond shape sizes:', error);
            toastError(error.response?.data?.message || 'Failed to delete diamond shape sizes. Please try again.');
        } finally {
            setBulkDeleteConfirm(false);
        }
    };


    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const handleTypeFilter = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const typeId = event.target.value ? Number(event.target.value) : null;
        setSelectedTypeId(typeId);
        // Reset shape selection when type changes
        setSelectedShapeId(null);
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
            <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Diamond shape sizes</h1>
                        <p className="mt-2 text-xs sm:text-sm text-slate-500">Manage diamond shape sizes and carat weights for catalogue specifications.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New size
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-3 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="font-semibold text-slate-700 whitespace-nowrap">
                                Sizes ({sizes.meta.total})
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedTypeId || ''}
                                    onChange={handleTypeFilter}
                                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs focus:ring-2 focus:ring-slate-400 focus:border-slate-400 sm:px-3 min-w-[120px]"
                                >
                                    <option value="">All types</option>
                                    {types.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedShapeId || ''}
                                    onChange={handleShapeFilter}
                                    disabled={!selectedTypeId}
                                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs focus:ring-2 focus:ring-slate-400 focus:border-slate-400 sm:px-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 min-w-[120px]"
                                >
                                    <option value="">All shapes</option>
                                    {filteredShapes.map((shape) => (
                                        <option key={shape.id} value={shape.id}>
                                            {shape.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500">
                            <span>{selectedSizes.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedSizes.length === 0}
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
                                        aria-label="Select all diamond shape sizes"
                                    />
                                </th>
                                    <th className="px-3 py-2 text-left hidden md:table-cell sm:px-5 sm:py-3">Type</th>
                                    <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Shape</th>
                                    <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Size</th>
                                    <th className="px-3 py-2 text-left hidden md:table-cell sm:px-5 sm:py-3">Secondary Size</th>
                                    <th className="px-3 py-2 text-left sm:px-5 sm:py-3">CTW</th>
                                    <th className="px-3 py-2 text-left hidden lg:table-cell sm:px-5 sm:py-3">Order</th>
                                    <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                                {sizes.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-3 py-4 sm:px-5 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                            No diamond shape sizes defined yet.
                                        </td>
                                    </tr>
                                ) : (
                                    sizes.data.map((size) => (
                                <tr key={size.id} className="hover:bg-slate-50">
                                            <td className="px-3 py-2 sm:px-5 sm:py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedSizes.includes(size.id)}
                                            onChange={() => toggleSelection(size.id)}
                                                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select diamond shape size ${size.size}`}
                                        />
                                    </td>
                                            <td className="px-3 py-2 text-slate-700 hidden md:table-cell sm:px-5 sm:py-3">{size.type ? size.type.name : '-'}</td>
                                            <td className="px-3 py-2 font-semibold text-slate-900 sm:px-5 sm:py-3">
                                                <span className="text-xs sm:text-sm">{size.shape?.name || '-'}</span>
                                            </td>
                                            <td className="px-3 py-2 text-slate-700 sm:px-5 sm:py-3">
                                                <span className="text-xs sm:text-sm">{size.size}</span>
                                            </td>
                                            <td className="px-3 py-2 text-slate-500 hidden md:table-cell sm:px-5 sm:py-3">
                                                <span className="text-xs sm:text-sm">{size.secondary_size || '-'}</span>
                                            </td>
                                            <td className="px-3 py-2 text-slate-500 sm:px-5 sm:py-3">
                                                <span className="text-xs sm:text-sm">{typeof size.ctw === 'number' ? size.ctw.toFixed(3) : (parseFloat(String(size.ctw)) || 0).toFixed(3)}</span>
                                    </td>
                                            <td className="px-3 py-2 text-slate-500 hidden lg:table-cell sm:px-5 sm:py-3">{size.display_order}</td>
                                            <td className="px-3 py-2 text-right sm:px-5 sm:py-3">
                                                <div className="flex justify-end gap-1.5 sm:gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(size)}
                                                        className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                title="Edit size"
                                            >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteSize(size)}
                                                        className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                title="Delete size"
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
                    meta={sizes.meta} 
                    onPageChange={setCurrentPage} 
                />
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-4">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-sm sm:text-base lg:text-xl font-semibold text-slate-900 truncate">
                                {editingSize ? `Edit diamond shape size` : 'Create new diamond shape size'}
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
                                    form="size-form"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingSize ? 'Update' : 'Create'}
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
                        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4 sm:space-y-6" id="size-form">
                            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="grid gap-3 sm:gap-4">
                                        {/* Type */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="diamond_type_id">
                                                Type <span className="text-rose-500">*</span>
                                            </InputLabel>
                                            <Controller
                                                name="diamond_type_id"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <Select
                                                            id="diamond_type_id"
                                                            value={field.value && field.value !== 0 ? field.value.toString() : ''}
                                                            onChange={async (e) => {
                                                                const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                field.onChange(value);
                                                                // Reset shape when type changes
                                                                setValue('diamond_shape_id', 0);
                                                                // Load shapes for selected type
                                                                if (value !== 0) {
                                                                    await loadShapesByType(value);
                                                                }
                                                                trigger('diamond_type_id');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('diamond_type_id');
                                                            }}
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        >
                                                            <option value="">Select type</option>
                                                            {types.map((type) => (
                                                                <option key={type.id} value={type.id}>
                                                                    {type.name} {type.code ? `(${type.code})` : ''}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>

                                        {/* Diamond Shape */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="diamond_shape_id">
                                                Diamond Shape <span className="text-rose-500">*</span>
                                            </InputLabel>
                                            <Controller
                                                name="diamond_shape_id"
                                                control={control}
                                                render={({ field, fieldState }) => {
                                                    const typeId = watch('diamond_type_id');
                                                    const isDisabled = loadingShapes || !typeId || typeId === 0;
                                                    
                                                    return (
                                                        <>
                                                            <Select
                                                                id="diamond_shape_id"
                                                                value={field.value && field.value !== 0 ? field.value.toString() : ''}
                                                                onChange={(e) => {
                                                                    const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                    field.onChange(value);
                                                                    trigger('diamond_shape_id');
                                                                }}
                                                                onBlur={async () => {
                                                                    field.onBlur();
                                                                    await trigger('diamond_shape_id');
                                                                }}
                                                                disabled={isDisabled}
                                                                className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                            >
                                                                <option value="">
                                                                    {loadingShapes 
                                                                        ? 'Loading shapes...' 
                                                                        : !typeId || typeId === 0
                                                                        ? 'Select type first'
                                                                        : 'Select a shape'}
                                                                </option>
                                                                {filteredShapes.map((shape) => (
                                                                    <option key={shape.id} value={shape.id}>
                                                                        {shape.name}
                                                                    </option>
                                                                ))}
                                                            </Select>
                                                            {fieldState.error && <InputError message={fieldState.error.message} />}
                                                        </>
                                                    );
                                                }}
                                            />
                                        </div>

                                        {/* Size */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="size">
                                                Size <span className="text-rose-500">*</span>
                                            </InputLabel>
                                            <Controller
                                                name="size"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <TextInput
                                                            id="size"
                                                            type="text"
                                                            value={field.value || ''}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                trigger('size');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('size');
                                                            }}
                                                            placeholder="e.g., 1.00, 2.00x3.00"
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        />
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>

                                        {/* Secondary Size */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="secondary_size">Secondary Size</InputLabel>
                                            <Controller
                                                name="secondary_size"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <TextInput
                                                            id="secondary_size"
                                                            type="text"
                                                            value={field.value || ''}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                trigger('secondary_size');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('secondary_size');
                                                            }}
                                                            placeholder="e.g., (S), (T)"
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        />
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>

                                        {/* CTW */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="ctw">
                                                CTW (Carat Total Weight) <span className="text-rose-500">*</span>
                                            </InputLabel>
                                            <Controller
                                                name="ctw"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <TextInput
                                                            id="ctw"
                                                            type="number"
                                                            step="0.001"
                                                            value={field.value?.toString() || '0'}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                field.onChange(value);
                                                                trigger('ctw');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('ctw');
                                                            }}
                                                            min={0}
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        />
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>

                                        {/* Display Order */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="display_order">
                                                Display Order <span className="text-rose-500">*</span>
                                            </InputLabel>
                                            <Controller
                                                name="display_order"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <TextInput
                                                            id="display_order"
                                                            type="number"
                                                            value={field.value?.toString() || '0'}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                field.onChange(value);
                                                                trigger('display_order');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('display_order');
                                                            }}
                                                            onFocus={(e) => {
                                                                if (e.target.value === '0') {
                                                                    e.target.select();
                                                                }
                                                            }}
                                                            min={0}
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        />
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 sm:space-y-6">
                                    {/* Description */}
                                    <div className="flex flex-col gap-1.5 sm:gap-2">
                                        <InputLabel htmlFor="description">Description</InputLabel>
                                        <Controller
                                            name="description"
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <>
                                                    <textarea
                                                        id="description"
                                                        value={field.value || ''}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            trigger('description');
                                                        }}
                                                        onBlur={async () => {
                                                            field.onBlur();
                                                            await trigger('description');
                                                        }}
                                                        placeholder="Optional notes for team."
                                                        className={`min-h-[140px] sm:min-h-[160px] lg:min-h-[200px] mt-1 rounded-lg sm:rounded-xl border ${fieldState.error ? 'border-red-300' : 'border-slate-300'} bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm ${fieldState.error ? 'focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                    />
                                                    {fieldState.error && <InputError message={fieldState.error.message} />}
                                                </>
                                            )}
                                        />
                                    </div>
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
