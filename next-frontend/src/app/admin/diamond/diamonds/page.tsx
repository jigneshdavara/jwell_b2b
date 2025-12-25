"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import FlashMessage from "@/components/shared/FlashMessage";
import { adminService } from "@/services/adminService";
import { PaginationMeta, generatePaginationLinks } from "@/utils/pagination";

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
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    const [formState, setFormState] = useState({
        code: '',
        diamond_type_id: null as number | null,
        diamond_clarity_id: null as number | null,
        diamond_color_id: null as number | null,
        diamond_shape_id: null as number | null,
        diamond_shape_size_id: null as number | null,
        price: '' as string | number,
        weight: '' as string | number,
        description: '',
        is_active: true,
    });


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
                data: items.map((item: any) => {
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
                            code: type.code || null 
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
            const response = await adminService.getDiamondTypes(1, 100);
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
            setFormState(prev => ({ ...prev, diamond_shape_size_id: null }));
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
        setFormErrors({});
        setFormState({
            code: '',
            diamond_type_id: null,
            diamond_clarity_id: null,
            diamond_color_id: null,
            diamond_shape_id: null,
            diamond_shape_size_id: null,
            price: '',
            weight: '',
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
        setFormErrors({});
        setFormState({
            code: diamond.name || '', // Use name as code for now, or get from API
            diamond_type_id: diamond.type?.id ?? null,
            diamond_clarity_id: diamond.clarity?.id ?? null,
            diamond_color_id: diamond.color?.id ?? null,
            diamond_shape_id: diamond.shape?.id ?? null,
            diamond_shape_size_id: diamond.shape_size?.id ?? null,
            price: diamond.price,
            weight: diamond.weight !== undefined && diamond.weight !== null ? Number(diamond.weight) : '',
            description: diamond.description ?? '',
            is_active: diamond.is_active,
        });
        
        // Load filtered data based on type
        if (diamond.type?.id) {
            await loadFilteredAttributes(diamond.type.id);
        }
        
        // Load shape sizes if shape is selected
        if (diamond.shape?.id && diamond.type?.id) {
            await loadShapeSizes(diamond.shape.id, diamond.type.id);
        }
        
        setModalOpen(true);
    };

    const handleTypeChange = (typeId: number | null) => {
        setFormState(prev => ({
            ...prev,
            diamond_type_id: typeId,
            diamond_clarity_id: null,
            diamond_color_id: null,
            diamond_shape_id: null,
            diamond_shape_size_id: null,
        }));
        setShapeSizes([]);
        
        if (typeId) {
            loadFilteredAttributes(typeId);
        } else {
            setFilteredClarities([]);
            setFilteredColors([]);
            setFilteredShapes([]);
        }
    };

    const handleShapeChange = (shapeId: number | null) => {
        setFormState(prev => ({
            ...prev,
            diamond_shape_id: shapeId,
            diamond_shape_size_id: null,
        }));
        loadShapeSizes(shapeId, formState.diamond_type_id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setFormErrors({});

        try {
            const payload: any = {
                code: formState.code,
                diamond_type_id: formState.diamond_type_id,
                diamond_clarity_id: formState.diamond_clarity_id,
                diamond_color_id: formState.diamond_color_id,
                diamond_shape_id: formState.diamond_shape_id,
                diamond_shape_size_id: formState.diamond_shape_size_id,
                price: formState.price === '' ? 0 : Number(formState.price),
                weight: formState.weight === '' ? 0 : Number(formState.weight),
                description: formState.description || null,
                is_active: formState.is_active,
            };

            if (editingDiamond) {
                await adminService.updateDiamond(editingDiamond.id, payload);
                setFlashMessage({ type: 'success', message: 'Diamond updated successfully.' });
            } else {
                await adminService.createDiamond(payload);
                setFlashMessage({ type: 'success', message: 'Diamond created successfully.' });
            }
            resetForm();
            await loadDiamonds();
        } catch (error: any) {
            console.error('Failed to save diamond:', error);
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                setFlashMessage({ type: 'error', message: error.response?.data?.message || 'Failed to save diamond. Please try again.' });
            }
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
                setFlashMessage({ type: 'success', message: 'Diamond deleted successfully.' });
                await loadDiamonds();
            } catch (error: any) {
                console.error('Failed to delete diamond:', error);
                setDeleteConfirm(null);
                setFlashMessage({ type: 'error', message: error.response?.data?.message || 'Failed to delete diamond. Please try again.' });
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
            setFlashMessage({ type: 'success', message });
            await loadDiamonds();
        } catch (error: any) {
            console.error('Failed to delete diamonds:', error);
            setBulkDeleteConfirm(false);
            setFlashMessage({ type: 'error', message: error.response?.data?.message || 'Failed to delete diamonds. Please try again.' });
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
                    <h1 className="text-2xl font-semibold text-slate-900">Diamonds</h1>
                    <p className="mt-2 text-sm text-slate-500">Manage diamond configurations with pricing.</p>
                </div>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    New diamond
                </button>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                    <div className="font-semibold text-slate-700">
                        Diamonds ({diamonds.meta.total})
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{selectedDiamonds.length} selected</span>
                        <button
                            type="button"
                            onClick={bulkDelete}
                            disabled={selectedDiamonds.length === 0}
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
                                    aria-label="Select all diamonds"
                                />
                            </th>
                            <th className="px-5 py-3 text-left">Name</th>
                            <th className="px-5 py-3 text-left">Configuration</th>
                            <th className="px-5 py-3 text-left">Weight</th>
                            <th className="px-5 py-3 text-left">Price</th>
                            <th className="px-5 py-3 text-left">Status</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {diamonds.data.map((diamond) => (
                            <tr key={diamond.id} className="hover:bg-slate-50">
                                <td className="px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedDiamonds.includes(diamond.id)}
                                        onChange={() => toggleSelection(diamond.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        aria-label={`Select diamond ${diamond.id}`}
                                    />
                                </td>
                                <td className="px-5 py-3 font-semibold text-slate-900">
                                    {diamond.name}
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-700">{getDiamondLabel(diamond)}</span>
                                        {diamond.description && (
                                            <span className="text-xs text-slate-500">{diamond.description}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-slate-700">
                                    {diamond.weight.toFixed(3)} ct
                                </td>
                                <td className="px-5 py-3 font-semibold text-slate-900">
                                    ₹{typeof diamond.price === 'number' ? diamond.price.toFixed(2) : (parseFloat(String(diamond.price)) || 0).toFixed(2)}
                                </td>
                                <td className="px-5 py-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            diamond.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {diamond.is_active ? 'Active' : 'Archived'}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(diamond)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                            title="Edit diamond"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteDiamond(diamond)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                            title="Delete diamond"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {diamonds.data.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-5 py-6 text-center text-sm text-slate-500">
                                    No diamonds defined yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination 
                meta={diamonds.meta} 
                onPageChange={setCurrentPage} 
            />

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingDiamond ? 'Edit diamond' : 'Create new diamond'}
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
                                    form="diamond-form"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingDiamond ? 'Update diamond' : 'Create diamond'}
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
                        <form onSubmit={handleSubmit} className="space-y-6" id="diamond-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Code <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={formState.code}
                                                onChange={(e) => setFormState(prev => ({ ...prev, code: e.target.value }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                                maxLength={191}
                                                placeholder="e.g., DIAMOND-001"
                                            />
                                            {formErrors.code && <span className="text-xs text-rose-500">{formErrors.code}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Type <span className="text-rose-500">*</span></span>
                                            <select
                                                value={formState.diamond_type_id || ''}
                                                onChange={(e) => handleTypeChange(e.target.value ? Number(e.target.value) : null)}
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
                                            <span>Clarity <span className="text-rose-500">*</span></span>
                                            <select
                                                value={formState.diamond_clarity_id || ''}
                                                onChange={(e) => setFormState(prev => ({ ...prev, diamond_clarity_id: e.target.value ? Number(e.target.value) : null }))}
                                                disabled={!formState.diamond_type_id || loadingFilters}
                                                required
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">{loadingFilters ? 'Loading...' : formState.diamond_type_id ? 'Select clarity' : 'Select type first'}</option>
                                                {filteredClarities.map((clarity) => (
                                                    <option key={clarity.id} value={clarity.id}>
                                                        {clarity.name} {clarity.code ? `(${clarity.code})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.diamond_clarity_id && <span className="text-xs text-rose-500">{formErrors.diamond_clarity_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Color <span className="text-rose-500">*</span></span>
                                            <select
                                                value={formState.diamond_color_id || ''}
                                                onChange={(e) => setFormState(prev => ({ ...prev, diamond_color_id: e.target.value ? Number(e.target.value) : null }))}
                                                disabled={!formState.diamond_type_id || loadingFilters}
                                                required
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">{loadingFilters ? 'Loading...' : formState.diamond_type_id ? 'Select color' : 'Select type first'}</option>
                                                {filteredColors.map((color) => (
                                                    <option key={color.id} value={color.id}>
                                                        {color.name} {color.code ? `(${color.code})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.diamond_color_id && <span className="text-xs text-rose-500">{formErrors.diamond_color_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Shape <span className="text-rose-500">*</span></span>
                                            <select
                                                value={formState.diamond_shape_id || ''}
                                                onChange={(e) => handleShapeChange(e.target.value ? Number(e.target.value) : null)}
                                                disabled={!formState.diamond_type_id || loadingFilters}
                                                required
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">{loadingFilters ? 'Loading...' : formState.diamond_type_id ? 'Select shape' : 'Select type first'}</option>
                                                {filteredShapes.map((shape) => (
                                                    <option key={shape.id} value={shape.id}>
                                                        {shape.name} {shape.code ? `(${shape.code})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.diamond_shape_id && <span className="text-xs text-rose-500">{formErrors.diamond_shape_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Shape Size <span className="text-rose-500">*</span></span>
                                            <select
                                                value={formState.diamond_shape_size_id || ''}
                                                onChange={(e) => setFormState(prev => ({ ...prev, diamond_shape_size_id: e.target.value ? Number(e.target.value) : null }))}
                                                disabled={!formState.diamond_shape_id || loadingShapeSizes}
                                                required
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">{loadingShapeSizes ? 'Loading...' : formState.diamond_shape_id ? 'Select size' : 'Select shape first'}</option>
                                                {shapeSizes.map((size) => (
                                                    <option key={size.id} value={size.id}>
                                                        {size.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {formErrors.diamond_shape_size_id && <span className="text-xs text-rose-500">{formErrors.diamond_shape_size_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Price <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formState.price === '' ? '' : formState.price}
                                                onChange={(e) => setFormState(prev => ({ ...prev, price: e.target.value === '' ? '' : Number(e.target.value) }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                min={0}
                                                required
                                            />
                                            {formErrors.price && <span className="text-xs text-rose-500">{formErrors.price}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Weight (Carats) <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={formState.weight === '' || formState.weight === null || formState.weight === undefined ? '' : String(formState.weight)}
                                                onChange={(e) => setFormState(prev => ({ ...prev, weight: e.target.value === '' ? '' : Number(e.target.value) }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                min={0}
                                                required
                                                placeholder="e.g., 1.500"
                                            />
                                            {formErrors.weight && <span className="text-xs text-rose-500">{formErrors.weight}</span>}
                                        </label>
                                    </div>
                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={formState.is_active}
                                            onChange={(e) => setFormState(prev => ({ ...prev, is_active: e.target.checked }))}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Active for selection
                                    </label>
                                </div>

                                <div className="space-y-6">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={formState.description}
                                            onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
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
