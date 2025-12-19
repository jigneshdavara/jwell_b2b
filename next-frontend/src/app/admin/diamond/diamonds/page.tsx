"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { adminService } from "@/services/adminService";

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

type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

export default function AdminDiamondsPage() {
    const [loading, setLoading] = useState(true);
    const [diamonds, setDiamonds] = useState<{ data: DiamondRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [types, setTypes] = useState<DiamondType[]>([]);
    const [clarities, setClarities] = useState<DiamondClarity[]>([]);
    const [colors, setColors] = useState<DiamondColor[]>([]);
    const [shapes, setShapes] = useState<DiamondShape[]>([]);
    const [shapeSizes, setShapeSizes] = useState<DiamondShapeSize[]>([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingDiamond, setEditingDiamond] = useState<DiamondRow | null>(null);
    const [selectedDiamonds, setSelectedDiamonds] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [deleteConfirm, setDeleteConfirm] = useState<DiamondRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const [formState, setFormState] = useState({
        name: '',
        diamond_type_id: null as number | null,
        diamond_clarity_id: null as number | null,
        diamond_color_id: null as number | null,
        diamond_shape_id: null as number | null,
        diamond_shape_size_id: null as number | null,
        price: 0,
        weight: 0,
        description: '',
        is_active: true,
    });

    useEffect(() => {
        loadDiamonds();
        loadTypes();
    }, [currentPage, perPage]);

    useEffect(() => {
        if (formState.diamond_type_id) {
            loadFilteredAttributes(formState.diamond_type_id);
            // Reset dependent fields when type changes
            setFormState(prev => ({
                ...prev,
                diamond_clarity_id: null,
                diamond_color_id: null,
                diamond_shape_id: null,
                diamond_shape_size_id: null,
            }));
            setClarities([]);
            setColors([]);
            setShapes([]);
            setShapeSizes([]);
        }
    }, [formState.diamond_type_id]);

    useEffect(() => {
        if (formState.diamond_shape_id) {
            loadShapeSizes(formState.diamond_shape_id);
            setFormState(prev => ({ ...prev, diamond_shape_size_id: null }));
        } else {
            setShapeSizes([]);
        }
    }, [formState.diamond_shape_id]);

    const loadDiamonds = async () => {
        setLoading(true);
        try {
            const response = await adminService.getDiamonds(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setDiamonds({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    name: item.name,
                    type: item.type ? { id: Number(item.type.id), name: item.type.name, code: item.type.code } : null,
                    clarity: item.clarity ? { id: Number(item.clarity.id), name: item.clarity.name, code: item.clarity.code } : null,
                    color: item.color ? { id: Number(item.color.id), name: item.color.name, code: item.color.code } : null,
                    shape: item.shape ? { id: Number(item.shape.id), name: item.shape.name, code: item.shape.code } : null,
                    shape_size: item.shape_size ? {
                        id: Number(item.shape_size.id),
                        size: item.shape_size.size,
                        secondary_size: item.shape_size.secondary_size,
                        ctw: Number(item.shape_size.ctw || 0),
                        label: item.shape_size.label || `${item.shape_size.size} (${item.shape_size.ctw}ct)`
                    } : null,
                    price: Number(item.price || 0),
                    weight: Number(item.weight || 0),
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
        try {
            const [claritiesRes, colorsRes, shapesRes] = await Promise.all([
                adminService.getDiamondClaritiesByType(typeId),
                adminService.getDiamondColorsByType(typeId),
                adminService.getDiamondShapesByType(typeId),
            ]);

            setClarities((claritiesRes.data.items || claritiesRes.data.data || []).map((item: any) => ({ id: Number(item.id), name: item.name, code: item.code })));
            setColors((colorsRes.data.items || colorsRes.data.data || []).map((item: any) => ({ id: Number(item.id), name: item.name, code: item.code })));
            setShapes((shapesRes.data.items || shapesRes.data.data || []).map((item: any) => ({ id: Number(item.id), name: item.name, code: item.code })));
        } catch (error: any) {
            console.error('Failed to load filtered attributes:', error);
        }
    };

    const loadShapeSizes = async (shapeId: number) => {
        try {
            const response = await adminService.getDiamondShapeSizes(shapeId);
            const items = response.data.items || response.data.data || [];
            setShapeSizes(items.map((item: any) => ({
                id: Number(item.id),
                size: item.size,
                secondary_size: item.secondary_size,
                ctw: Number(item.ctw || 0),
                label: item.label || `${item.size} (${item.ctw}ct)`
            })));
        } catch (error: any) {
            console.error('Failed to load shape sizes:', error);
        }
    };

    const allSelected = useMemo(() => {
        if (diamonds.data.length === 0) return false;
        return selectedDiamonds.length === diamonds.data.length;
    }, [diamonds.data, selectedDiamonds]);

    const toggleSelectAll = () => {
        setSelectedDiamonds(allSelected ? [] : diamonds.data.map(d => d.id));
    };

    const toggleSelection = (id: number) => {
        setSelectedDiamonds(prev => prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]);
    };

    const resetForm = () => {
        setEditingDiamond(null);
        setModalOpen(false);
        setFormState({
            name: '',
            diamond_type_id: null,
            diamond_clarity_id: null,
            diamond_color_id: null,
            diamond_shape_id: null,
            diamond_shape_size_id: null,
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
        setFormState({
            name: diamond.name,
            diamond_type_id: diamond.type?.id ?? null,
            diamond_clarity_id: diamond.clarity?.id ?? null,
            diamond_color_id: diamond.color?.id ?? null,
            diamond_shape_id: diamond.shape?.id ?? null,
            diamond_shape_size_id: diamond.shape_size?.id ?? null,
            price: diamond.price,
            weight: diamond.weight,
            description: diamond.description ?? '',
            is_active: diamond.is_active,
        });
        if (diamond.type?.id) {
            await loadFilteredAttributes(diamond.type.id);
        }
        if (diamond.shape?.id) {
            await loadShapeSizes(diamond.shape.id);
        }
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: any = {
                name: formState.name,
                diamond_type_id: formState.diamond_type_id,
                diamond_clarity_id: formState.diamond_clarity_id,
                diamond_color_id: formState.diamond_color_id,
                diamond_shape_id: formState.diamond_shape_id,
                diamond_shape_size_id: formState.diamond_shape_size_id,
                price: formState.price,
                weight: formState.weight,
                description: formState.description || null,
                is_active: formState.is_active,
            };

            if (editingDiamond) {
                await adminService.updateDiamond(editingDiamond.id, payload);
            } else {
                await adminService.createDiamond(payload);
            }
            resetForm();
            await loadDiamonds();
        } catch (error: any) {
            console.error('Failed to save diamond:', error);
            alert(error.response?.data?.message || 'Failed to save diamond. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteDiamond(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadDiamonds();
            } catch (error: any) {
                console.error('Failed to delete diamond:', error);
                alert(error.response?.data?.message || 'Failed to delete diamond. Please try again.');
            }
        }
    };

    const handleBulkDelete = async () => {
        try {
            await adminService.bulkDeleteDiamonds(selectedDiamonds);
            setSelectedDiamonds([]);
            setBulkDeleteConfirm(false);
            await loadDiamonds();
        } catch (error: any) {
            console.error('Failed to delete diamonds:', error);
            alert(error.response?.data?.message || 'Failed to delete diamonds. Please try again.');
        }
    };

    const getDiamondLabel = (diamond: DiamondRow): string => {
        const parts: string[] = [];
        if (diamond.type) parts.push(diamond.type.name);
        if (diamond.clarity) parts.push(diamond.clarity.name);
        if (diamond.color) parts.push(diamond.color.name);
        if (diamond.shape) parts.push(diamond.shape.name);
        if (diamond.shape_size?.label) parts.push(diamond.shape_size.label);
        return parts.join(' - ') || 'Diamond';
    };

    if (loading && !diamonds.data.length) return null;

    return (
        <div className="space-y-8">
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
                            onClick={() => setBulkDeleteConfirm(true)}
                            disabled={selectedDiamonds.length === 0}
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
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                        <tr>
                            <th className="px-5 py-3">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleSelectAll}
                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
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
                            <tr key={diamond.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedDiamonds.includes(diamond.id)}
                                        onChange={() => toggleSelection(diamond.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                </td>
                                <td className="px-5 py-3 font-semibold text-slate-900">{diamond.name}</td>
                                <td className="px-5 py-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-slate-700">{getDiamondLabel(diamond)}</span>
                                        {diamond.description && <span className="text-xs font-normal text-slate-500">{diamond.description}</span>}
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-slate-700">{diamond.weight.toFixed(3)} ct</td>
                                <td className="px-5 py-3 font-semibold text-slate-900">₹{diamond.price.toLocaleString('en-IN')}</td>
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
                                            onClick={() => setDeleteConfirm(diamond)}
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
                    </tbody>
                </table>
            </div>

            {diamonds.meta.last_page > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                        Showing {diamonds.meta.total > 0 ? (diamonds.meta.current_page - 1) * diamonds.meta.per_page + 1 : 0} to {Math.min(diamonds.meta.current_page * diamonds.meta.per_page, diamonds.meta.total)} of {diamonds.meta.total} entries
                    </div>
                    <div className="flex gap-2">
                        {Array.from({ length: diamonds.meta.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                    page === diamonds.meta.current_page ? 'bg-sky-600 text-white shadow shadow-sky-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingDiamond ? 'Edit diamond' : 'Create new diamond'}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={resetForm} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900">
                                    Cancel
                                </button>
                                <button type="submit" form="diamond-form" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700">
                                    {editingDiamond ? 'Update diamond' : 'Create diamond'}
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
                                            <span>Name <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={formState.name}
                                                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Type <span className="text-rose-500">*</span></span>
                                            <select
                                                value={formState.diamond_type_id || ''}
                                                onChange={(e) => setFormState(prev => ({ ...prev, diamond_type_id: e.target.value ? Number(e.target.value) : null }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            >
                                                <option value="">Select type</option>
                                                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Weight (Carats) <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={formState.weight}
                                                onChange={(e) => setFormState(prev => ({ ...prev, weight: Number(e.target.value) }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Price <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                value={formState.price}
                                                onChange={(e) => setFormState(prev => ({ ...prev, price: Number(e.target.value) }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
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
