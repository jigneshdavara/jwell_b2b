"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import TextInput from "@/components/ui/TextInput";
import InputLabel from "@/components/ui/InputLabel";
import InputError from "@/components/ui/InputError";
import Checkbox from "@/components/ui/Checkbox";
import Select from "@/components/ui/Select";
import { toastSuccess, toastError, toastInfo } from "@/utils/toast";
import { adminService } from "@/services/adminService";
import { PaginationMeta, generatePaginationLinks } from "@/utils/pagination";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { diamondSchema, DiamondFormData } from "@/lib/validation/admin.schema";

type DiamondType = { id: number; name: string; code: string | null };
type DiamondClarity = { id: number; name: string; code: string | null };
type DiamondColor = { id: number; name: string; code: string | null };
type DiamondShape = { id: number; name: string; code: string | null };
type DiamondShapeSize = { id: number; size: string | null; secondary_size: string | null; ctw: number; label: string };

type DiamondRow = {
    id: number;
    name: string;
    type: DiamondType | null;
    clarity: DiamondClarity | null;
    color: DiamondColor | null;
    shape: DiamondShape | null;
    shape_size: DiamondShapeSize | null;
    price: number;
    weight: number;
    description?: string | null;
    is_active: boolean;
};


export default function AdminDiamondsPage() {
    const [loading, setLoading] = useState(true);
    const [diamonds, setDiamonds] = useState<{ data: DiamondRow[]; meta: PaginationMeta }>({
        data: [],
        meta: {
            current_page: 1,
            last_page: 1,
            total: 0,
            per_page: 10,
            from: undefined,
            to: undefined,
            links: []
        }
    });
    const [types, setTypes] = useState<DiamondType[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDiamond, setEditingDiamond] = useState<DiamondRow | null>(null);
    const [selectedDiamonds, setSelectedDiamonds] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<DiamondRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [shapeSizes, setShapeSizes] = useState<DiamondShapeSize[]>([]);
    const [loadingShapeSizes, setLoadingShapeSizes] = useState(false);
    const [filteredClarities, setFilteredClarities] = useState<DiamondClarity[]>([]);
    const [filteredColors, setFilteredColors] = useState<DiamondColor[]>([]);
    const [filteredShapes, setFilteredShapes] = useState<DiamondShape[]>([]);
    const [loadingFilters, setLoadingFilters] = useState(false);
    // React Hook Form setup
    const {
        control,
        handleSubmit: handleFormSubmit,
        formState: { errors },
        reset,
        setError,
        setValue,
        trigger,
        watch,
    } = useForm<DiamondFormData>({
        resolver: zodResolver(diamondSchema),
        mode: "onSubmit",
        reValidateMode: "onBlur",
        shouldFocusError: true,
        defaultValues: {
            code: '',
            diamond_type_id: 0,
            diamond_clarity_id: 0,
            diamond_color_id: 0,
            diamond_shape_id: 0,
            diamond_shape_size_id: 0,
            price: 0,
            weight: 0,
            description: '',
            is_active: true,
        },
    });

    const watchedShapeId = watch('diamond_shape_id');
    const watchedTypeId = watch('diamond_type_id');
    const [processing, setProcessing] = useState(false);
    // Toast notifications are handled via RTK


    useEffect(() => {
        loadDiamonds();
        loadTypes();
    }, [currentPage, perPage]);

    useEffect(() => {
        const existingIds = new Set(diamonds.data.map((diamond: DiamondRow) => diamond.id));
        setSelectedDiamonds((prev) => prev.filter((id) => existingIds.has(id)));
    }, [diamonds.data]);

    const loadDiamonds = async () => {
        setLoading(true);
        try {
            const response = await adminService.getDiamonds(currentPage, perPage);
            const responseData = response.data;
            const items = responseData.items || responseData.data || [];
            const meta = responseData.meta || {};
            setDiamonds({
                data: items
                    .filter((item: any) => {
                        const type = item.diamond_types || item.type;
                        // Only show diamonds from active types
                        return type?.is_active !== false;
                    })
                    .map((item: any) => {
                        // NestJS uses different relationship names: diamond_types, diamond_shapes, etc.
                        const type = item.diamond_types || item.type;
                        const clarity = item.diamond_clarities || item.clarity;
                        const color = item.diamond_colors || item.color;
                        const shape = item.diamond_shapes || item.shape;
                        const shapeSize = item.diamond_shape_sizes || item.shape_size;
                        
                        return {
                            id: Number(item.id),
                            name: item.name || item.code || '', 
                            type: type ? { 
                                id: Number(type.id), 
                                name: type.name, 
                                code: type.code || null,
                                is_active: type.is_active !== false
                            } : null,
                        clarity: clarity ? { 
                            id: Number(clarity.id), 
                            name: clarity.name, 
                            code: clarity.code || null 
                        } : null,
                        color: color ? { 
                            id: Number(color.id), 
                            name: color.name, 
                            code: color.code || null 
                        } : null,
                        shape: shape ? { 
                            id: Number(shape.id), 
                            name: shape.name, 
                            code: shape.code || null 
                        } : null,
                        shape_size: shapeSize ? {
                            id: Number(shapeSize.id),
                            size: shapeSize.size,
                            secondary_size: shapeSize.secondary_size || null,
                            ctw: Number(shapeSize.ctw || 0),
                            label: shapeSize.label || `${shapeSize.size || ''} ${shapeSize.secondary_size || ''} (CTW: ${Number(shapeSize.ctw || 0).toFixed(3)})`.trim()
                        } : null,
                        price: Number(item.price || 0),
                        weight: Number(item.weight || 0), 
                        description: item.description || null,
                        is_active: item.is_active ?? true,
                    };
                }),
                meta: {
                    current_page: meta.page || meta.current_page || currentPage,
                    last_page: meta.lastPage || meta.last_page || 1,
                    total: meta.total || 0,
                    per_page: meta.perPage || meta.per_page || perPage,
                    from: meta.from ?? ((meta.page || currentPage) - 1) * (meta.perPage || perPage) + 1,
                    to: meta.to ?? Math.min((meta.page || currentPage) * (meta.perPage || perPage), meta.total || 0),
                    links: meta.links || generatePaginationLinks(meta.page || meta.current_page || currentPage, meta.lastPage || meta.last_page || 1), 
                }
            });
        } catch (error: any) {
            console.error('Failed to load diamonds:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTypes = async () => {
        try {
            const response = await adminService.getDiamondTypes(1, 100, true); // Only active types for dropdown
            const items = response.data.items || response.data.data || [];
            setTypes(items.map((item: any) => ({ id: Number(item.id), name: item.name, code: item.code })));
        } catch (error: any) {
            console.error('Failed to load diamond types:', error);
        }
    };

    const loadFilteredAttributes = async (typeId: number) => {
        if (!typeId) {
            setFilteredClarities([]);
            setFilteredColors([]);
            setFilteredShapes([]);
            return;
        }

        setLoadingFilters(true);
        try {
            const [claritiesRes, colorsRes, shapesRes] = await Promise.all([
                adminService.getDiamondClaritiesByType(typeId),
                adminService.getDiamondColorsByType(typeId),
                adminService.getDiamondShapesByType(typeId),
            ]);

            setFilteredClarities((claritiesRes.data || []).map((item: any) => ({ id: Number(item.id), name: item.name, code: item.code })));
            setFilteredColors((colorsRes.data || []).map((item: any) => ({ id: Number(item.id), name: item.name, code: item.code })));
            setFilteredShapes((shapesRes.data || []).map((item: any) => ({ id: Number(item.id), name: item.name, code: item.code })));
        } catch (error: any) {
            console.error('Failed to load filtered data:', error);
            setFilteredClarities([]);
            setFilteredColors([]);
            setFilteredShapes([]);
        } finally {
            setLoadingFilters(false);
        }
    };

    const loadShapeSizes = async (shapeId: number | null, typeId: number | null = null) => {
        if (!shapeId) {
            setShapeSizes([]);
            return;
        }

        setLoadingShapeSizes(true);
        try {
            const response = await adminService.getDiamondShapeSizesByShape(shapeId, typeId || undefined);
            // Laravel returns JSON array directly, axios wraps it in response.data
            let items: any[] = [];
            
            if (Array.isArray(response.data)) {
                items = response.data;
            } else if (response.data && Array.isArray(response.data.data)) {
                items = response.data.data;
            } else if (response.data && Array.isArray(response.data.items)) {
                items = response.data.items;
            } else {
                console.warn('Unexpected shape sizes response structure:', response);
                items = [];
            }
            
            if (!Array.isArray(items)) {
                console.error('Shape sizes response is not an array:', items);
                items = [];
            }
            
            setShapeSizes(items.map((item: any) => ({
                id: Number(item.id),
                size: item.size,
                secondary_size: item.secondary_size,
                ctw: Number(item.ctw || 0),
                label: item.label || `${item.size || ''} ${item.secondary_size || ''} (CTW: ${Number(item.ctw || 0).toFixed(3)})`.trim()
            })));
        } catch (error: any) {
            console.error('Failed to load shape sizes:', error);
            setShapeSizes([]);
        } finally {
            setLoadingShapeSizes(false);
        }
    };

    const allSelected = useMemo(() => {
        if (diamonds.data.length === 0) return false;
        return selectedDiamonds.length === diamonds.data.length;
    }, [diamonds.data, selectedDiamonds]);

    const toggleSelectAll = () => {
        setSelectedDiamonds(allSelected ? [] : diamonds.data.map((d: DiamondRow) => d.id));
    };

    const toggleSelection = (id: number) => {
        setSelectedDiamonds(prev => prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]);
    };

    const resetForm = () => {
        setEditingDiamond(null);
        setModalOpen(false);
        setShapeSizes([]);
        setFilteredClarities([]);
        setFilteredColors([]);
        setFilteredShapes([]);
        reset({
            code: '',
            diamond_type_id: 0,
            diamond_clarity_id: 0,
            diamond_color_id: 0,
            diamond_shape_id: 0,
            diamond_shape_size_id: 0,
            price: 0,
            weight: 0,
            description: '',
            is_active: true,
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = async (diamond: DiamondRow) => {
        setEditingDiamond(diamond);
        
        // Load filtered data based on type
        if (diamond.type?.id) {
            await loadFilteredAttributes(diamond.type.id);
        }
        
        // Load shape sizes if shape is selected
        if (diamond.shape?.id && diamond.type?.id) {
            await loadShapeSizes(diamond.shape.id, diamond.type.id);
        }
        
        reset({
            code: diamond.name || '',
            diamond_type_id: diamond.type?.id ?? 0,
            diamond_clarity_id: diamond.clarity?.id ?? 0,
            diamond_color_id: diamond.color?.id ?? 0,
            diamond_shape_id: diamond.shape?.id ?? 0,
            diamond_shape_size_id: diamond.shape_size?.id ?? 0,
            price: diamond.price ?? 0,
            weight: diamond.weight ?? 0,
            description: diamond.description ?? '',
            is_active: diamond.is_active,
        });
        
        setModalOpen(true);
    };

    const handleTypeChange = async (typeId: number | null) => {
        const value = typeId ?? 0;
        setValue('diamond_type_id', value);
        setValue('diamond_clarity_id', 0);
        setValue('diamond_color_id', 0);
        setValue('diamond_shape_id', 0);
        setValue('diamond_shape_size_id', 0);
        setShapeSizes([]);
        
        if (typeId) {
            await loadFilteredAttributes(typeId);
        } else {
            setFilteredClarities([]);
            setFilteredColors([]);
            setFilteredShapes([]);
        }
    };

    const handleShapeChange = (shapeId: number | null) => {
        const value = shapeId ?? 0;
        setValue('diamond_shape_id', value);
        setValue('diamond_shape_size_id', 0);
        // Shape sizes will be loaded by useEffect when watchedShapeId changes
    };

    // Watch for shape/type changes to load shape sizes
    useEffect(() => {
        const shapeId = watchedShapeId && watchedShapeId !== 0 ? watchedShapeId : null;
        const typeId = watchedTypeId && watchedTypeId !== 0 ? watchedTypeId : null;
        
        if (shapeId) {
            loadShapeSizes(shapeId, typeId);
        } else {
            setShapeSizes([]);
        }
    }, [watchedShapeId, watchedTypeId]);

    const onSubmit = async (data: DiamondFormData) => {
        setProcessing(true);

        try {
            const payload: any = {
                code: data.code,
                diamond_type_id: data.diamond_type_id,
                diamond_clarity_id: data.diamond_clarity_id,
                diamond_color_id: data.diamond_color_id,
                diamond_shape_id: data.diamond_shape_id,
                diamond_shape_size_id: data.diamond_shape_size_id,
                price: data.price,
                weight: data.weight,
                description: data.description || null,
                is_active: data.is_active,
            };

            if (editingDiamond) {
                await adminService.updateDiamond(editingDiamond.id, payload);
                toastSuccess('Diamond updated successfully.');
            } else {
                await adminService.createDiamond(payload);
                toastSuccess('Diamond created successfully.');
            }
            resetForm();
            await loadDiamonds();
        } catch (error: any) {
            // Handle field-level errors
            if (error.response?.data?.errors) {
                const fieldErrors = error.response.data.errors;
                Object.keys(fieldErrors).forEach((key) => {
                    const errorMessage = Array.isArray(fieldErrors[key]) 
                        ? fieldErrors[key][0] 
                        : fieldErrors[key];
                    setError(key as keyof DiamondFormData, {
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
                : 'Failed to save diamond. Please try again.';
            toastError(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const deleteDiamond = (diamond: DiamondRow) => {
        setDeleteConfirm(diamond);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteDiamond(deleteConfirm.id);
                setDeleteConfirm(null);
                toastSuccess('Diamond deleted successfully.');
                await loadDiamonds();
            } catch (error: any) {
                console.error('Failed to delete diamond:', error);
                setDeleteConfirm(null);
                toastError(error.response?.data?.message || 'Failed to delete diamond. Please try again.');
            }
        }
    };

    const bulkDelete = () => {
        if (selectedDiamonds.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        try {
            const response = await adminService.bulkDeleteDiamonds(selectedDiamonds);
            setSelectedDiamonds([]);
            setBulkDeleteConfirm(false);
            const message = response.data?.message || `${selectedDiamonds.length} diamond(s) deleted successfully.`;
            toastSuccess(message);
            await loadDiamonds();
        } catch (error: any) {
            console.error('Failed to delete diamonds:', error);
            setBulkDeleteConfirm(false);
            toastError(error.response?.data?.message || 'Failed to delete diamonds. Please try again.');
        }
    };

    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const getDiamondLabel = (diamond: DiamondRow): string => {
        const parts: string[] = [];
        if (diamond.type) parts.push(diamond.type.name);
        if (diamond.clarity) parts.push(diamond.clarity.name);
        if (diamond.color) parts.push(diamond.color.name);
        if (diamond.shape) parts.push(diamond.shape.name);
        if (diamond.shape_size?.size) {
            parts.push(diamond.shape_size.size);
            if (diamond.shape_size.secondary_size) {
                parts.push(`(${diamond.shape_size.secondary_size})`);
            }
        }
        return parts.join(' - ') || 'Diamond';
    };

    if (loading && !diamonds.data.length) return null;

    return (
        <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Diamonds</h1>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500">Manage diamond configurations with pricing.</p>
                </div>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    New diamond
                </button>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-3 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm">
                    <div className="font-semibold text-slate-700">
                        Diamonds ({diamonds.meta.total})
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500">
                        <span>{selectedDiamonds.length} selected</span>
                        <button
                            type="button"
                            onClick={bulkDelete}
                            disabled={selectedDiamonds.length === 0}
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
                                    aria-label="Select all diamonds"
                                />
                            </th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Name</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Configuration</th>
                                <th className="px-3 py-2 text-left hidden md:table-cell sm:px-5 sm:py-3">Weight</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Price</th>
                                <th className="px-3 py-2 text-left hidden lg:table-cell sm:px-5 sm:py-3">Status</th>
                                <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                            {diamonds.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-3 py-4 sm:px-5 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                        No diamonds defined yet.
                                    </td>
                                </tr>
                            ) : (
                                diamonds.data.map((diamond) => (
                            <tr key={diamond.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 sm:px-5 sm:py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedDiamonds.includes(diamond.id)}
                                        onChange={() => toggleSelection(diamond.id)}
                                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        aria-label={`Select diamond ${diamond.id}`}
                                    />
                                </td>
                                        <td className="px-3 py-2 font-semibold text-slate-900 sm:px-5 sm:py-3">
                                            <span className="text-xs sm:text-sm">{diamond.name}</span>
                                </td>
                                        <td className="px-3 py-2 sm:px-5 sm:py-3">
                                    <div className="flex flex-col gap-1">
                                                <span className="text-xs sm:text-sm text-slate-700">{getDiamondLabel(diamond)}</span>
                                        {diamond.description && (
                                                    <span className="text-[10px] sm:text-xs text-slate-500">{diamond.description}</span>
                                        )}
                                    </div>
                                </td>
                                        <td className="px-3 py-2 text-slate-700 hidden md:table-cell sm:px-5 sm:py-3">
                                            <span className="text-xs sm:text-sm">{diamond.weight.toFixed(3)} ct</span>
                                </td>
                                        <td className="px-3 py-2 font-semibold text-slate-900 sm:px-5 sm:py-3">
                                            <span className="text-xs sm:text-sm">₹{typeof diamond.price === 'number' ? diamond.price.toFixed(2) : (parseFloat(String(diamond.price)) || 0).toFixed(2)}</span>
                                </td>
                                        <td className="px-3 py-2 hidden lg:table-cell sm:px-5 sm:py-3">
                                    <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs font-semibold ${
                                            diamond.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {diamond.is_active ? 'Active' : 'Archived'}
                                    </span>
                                </td>
                                        <td className="px-3 py-2 text-right sm:px-5 sm:py-3">
                                            <div className="flex justify-end gap-1.5 sm:gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(diamond)}
                                                    className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                            title="Edit diamond"
                                        >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteDiamond(diamond)}
                                                    className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                            title="Delete diamond"
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
                meta={diamonds.meta} 
                onPageChange={setCurrentPage} 
            />

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-4">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-sm sm:text-base lg:text-xl font-semibold text-slate-900 truncate">
                                {editingDiamond ? 'Edit diamond' : 'Create new diamond'}
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
                                    form="diamond-form"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingDiamond ? 'Update' : 'Create'}
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
                        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4 sm:space-y-6" id="diamond-form">
                            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="grid gap-3 sm:gap-4">
                                        {/* Code */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="code">
                                                Code <span className="text-rose-500">*</span>
                                            </InputLabel>
                                            <Controller
                                                name="code"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <TextInput
                                                            id="code"
                                                            type="text"
                                                            value={field.value || ''}
                                                            onChange={(e) => {
                                                                field.onChange(e);
                                                                trigger('code');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('code');
                                                            }}
                                                            placeholder="e.g., DIAMOND-001"
                                                            maxLength={191}
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        />
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>
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
                                                                await handleTypeChange(value === 0 ? null : value);
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
                                        {/* Clarity */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="diamond_clarity_id">
                                                Clarity <span className="text-rose-500">*</span>
                                            </InputLabel>
                                            <Controller
                                                name="diamond_clarity_id"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <Select
                                                            id="diamond_clarity_id"
                                                            value={field.value && field.value !== 0 ? field.value.toString() : ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                field.onChange(value);
                                                                trigger('diamond_clarity_id');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('diamond_clarity_id');
                                                            }}
                                                            disabled={!watchedTypeId || watchedTypeId === 0 || loadingFilters}
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        >
                                                            <option value="">{loadingFilters ? 'Loading...' : watchedTypeId && watchedTypeId !== 0 ? 'Select clarity' : 'Select type first'}</option>
                                                            {filteredClarities.map((clarity) => (
                                                                <option key={clarity.id} value={clarity.id}>
                                                                    {clarity.name} {clarity.code ? `(${clarity.code})` : ''}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>
                                        {/* Color */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="diamond_color_id">
                                                Color <span className="text-rose-500">*</span>
                                            </InputLabel>
                                            <Controller
                                                name="diamond_color_id"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <Select
                                                            id="diamond_color_id"
                                                            value={field.value && field.value !== 0 ? field.value.toString() : ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                field.onChange(value);
                                                                trigger('diamond_color_id');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('diamond_color_id');
                                                            }}
                                                            disabled={!watchedTypeId || watchedTypeId === 0 || loadingFilters}
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        >
                                                            <option value="">{loadingFilters ? 'Loading...' : watchedTypeId && watchedTypeId !== 0 ? 'Select color' : 'Select type first'}</option>
                                                            {filteredColors.map((color) => (
                                                                <option key={color.id} value={color.id}>
                                                                    {color.name} {color.code ? `(${color.code})` : ''}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>
                                        {/* Shape */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="diamond_shape_id">
                                                Shape <span className="text-rose-500">*</span>
                                            </InputLabel>
                                            <Controller
                                                name="diamond_shape_id"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <Select
                                                            id="diamond_shape_id"
                                                            value={field.value && field.value !== 0 ? field.value.toString() : ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                field.onChange(value);
                                                                handleShapeChange(value === 0 ? null : value);
                                                                trigger('diamond_shape_id');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('diamond_shape_id');
                                                            }}
                                                            disabled={!watchedTypeId || watchedTypeId === 0 || loadingFilters}
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        >
                                                            <option value="">{loadingFilters ? 'Loading...' : watchedTypeId && watchedTypeId !== 0 ? 'Select shape' : 'Select type first'}</option>
                                                            {filteredShapes.map((shape) => (
                                                                <option key={shape.id} value={shape.id}>
                                                                    {shape.name} {shape.code ? `(${shape.code})` : ''}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>
                                        {/* Shape Size */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="diamond_shape_size_id">
                                                Shape Size <span className="text-rose-500">*</span>
                                            </InputLabel>
                                            <Controller
                                                name="diamond_shape_size_id"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <Select
                                                            id="diamond_shape_size_id"
                                                            value={field.value && field.value !== 0 ? field.value.toString() : ''}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : Number(e.target.value);
                                                                field.onChange(value);
                                                                trigger('diamond_shape_size_id');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('diamond_shape_size_id');
                                                            }}
                                                            disabled={!watchedShapeId || watchedShapeId === 0 || loadingShapeSizes}
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        >
                                                            <option value="">{loadingShapeSizes ? 'Loading...' : watchedShapeId && watchedShapeId !== 0 ? 'Select size' : 'Select shape first'}</option>
                                                            {shapeSizes.map((size) => (
                                                                <option key={size.id} value={size.id}>
                                                                    {size.label}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>
                                        {/* Price */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="price">
                                                Price <span className="text-rose-500">*</span>
                                            </InputLabel>
                                            <Controller
                                                name="price"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <TextInput
                                                            id="price"
                                                            type="number"
                                                            step="0.01"
                                                            value={field.value?.toString() || '0'}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                                field.onChange(value);
                                                                trigger('price');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('price');
                                                            }}
                                                            min={0}
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        />
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>

                                        {/* Weight */}
                                        <div className="flex flex-col gap-1.5 sm:gap-2">
                                            <InputLabel htmlFor="weight">
                                                Weight (Carats) <span className="text-rose-500">*</span>
                                            </InputLabel>
                                            <Controller
                                                name="weight"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <>
                                                        <TextInput
                                                            id="weight"
                                                            type="number"
                                                            step="0.001"
                                                            value={field.value?.toString() || '0'}
                                                            onChange={(e) => {
                                                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                                                field.onChange(value);
                                                                trigger('weight');
                                                            }}
                                                            onBlur={async () => {
                                                                field.onBlur();
                                                                await trigger('weight');
                                                            }}
                                                            min={0}
                                                            placeholder="e.g., 1.500"
                                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                        />
                                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                                    </>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Is Active */}
                                    <div className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3">
                                        <Controller
                                            name="is_active"
                                            control={control}
                                            render={({ field }) => (
                                                <Checkbox
                                                    checked={field.value}
                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                />
                                            )}
                                        />
                                        <InputLabel htmlFor="is_active" className="mb-0 cursor-pointer">
                                            Active for selection
                                        </InputLabel>
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
                title="Remove Diamond"
                message={deleteConfirm ? `Are you sure you want to remove this diamond?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Diamonds"
                message={`Are you sure you want to delete ${selectedDiamonds.length} selected diamond(s)?`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
