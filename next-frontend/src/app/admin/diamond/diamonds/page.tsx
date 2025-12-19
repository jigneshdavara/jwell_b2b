"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

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

const mockTypes: DiamondType[] = [
    { id: 1, name: 'Natural', code: 'NAT' },
    { id: 2, name: 'Lab Grown', code: 'LAB' }
];

const mockDiamonds: DiamondRow[] = [
    { 
        id: 1, 
        name: 'Round Brilliant', 
        type: { id: 1, name: 'Natural', code: 'NAT' },
        clarity: { id: 1, name: 'VVS1', code: 'VVS1' },
        color: { id: 1, name: 'D', code: 'D' },
        shape: { id: 1, name: 'Round', code: 'RD' },
        shape_size: { id: 1, size: '6.5mm', secondary_size: null, ctw: 1.0, label: '6.5mm (1.0ct)' },
        price: 850000,
        weight: 1.0,
        is_active: true 
    },
    { 
        id: 2, 
        name: 'Oval Cut', 
        type: { id: 2, name: 'Lab Grown', code: 'LAB' },
        clarity: { id: 2, name: 'VS2', code: 'VS2' },
        color: { id: 2, name: 'G', code: 'G' },
        shape: { id: 2, name: 'Oval', code: 'OV' },
        shape_size: { id: 2, size: '8x6mm', secondary_size: null, ctw: 1.2, label: '8x6mm (1.2ct)' },
        price: 120000,
        weight: 1.2,
        is_active: true 
    },
];

export default function AdminDiamondsPage() {
    const [loading, setLoading] = useState(true);
    const [diamonds, setDiamonds] = useState<{ data: DiamondRow[]; meta: PaginationMeta }>({
        data: mockDiamonds,
        meta: { current_page: 1, last_page: 1, total: mockDiamonds.length, per_page: 10 }
    });

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
        setLoading(false);
    }, []);

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

    const openEditModal = (diamond: DiamondRow) => {
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
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            if (editingDiamond) {
                setDiamonds(prev => ({
                    ...prev,
                    data: prev.data.map(d => d.id === editingDiamond.id ? { 
                        ...d, 
                        ...formState,
                        type: mockTypes.find(t => t.id === formState.diamond_type_id) || null
                    } : d)
                }));
            } else {
                const newDiamond: DiamondRow = {
                    id: Date.now(),
                    ...formState,
                    type: mockTypes.find(t => t.id === formState.diamond_type_id) || null,
                    clarity: null, color: null, shape: null, shape_size: null
                };
                setDiamonds(prev => ({
                    ...prev,
                    data: [...prev.data, newDiamond],
                    meta: { ...prev.meta, total: prev.meta.total + 1 }
                }));
            }
            resetForm();
            setLoading(false);
        }, 500);
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setDiamonds(prev => ({
                ...prev,
                data: prev.data.filter(d => d.id !== deleteConfirm.id),
                meta: { ...prev.meta, total: prev.meta.total - 1 }
            }));
            setDeleteConfirm(null);
        }
    };

    const handleBulkDelete = () => {
        setDiamonds(prev => ({
            ...prev,
            data: prev.data.filter(d => !selectedDiamonds.includes(d.id)),
            meta: { ...prev.meta, total: prev.meta.total - selectedDiamonds.length }
        }));
        setSelectedDiamonds([]);
        setBulkDeleteConfirm(false);
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
                            onChange={(e) => setPerPage(Number(e.target.value))}
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

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <div>Showing 1 to {diamonds.data.length} of {diamonds.meta.total} entries</div>
                <div className="flex gap-2">
                    <button className="rounded-full px-3 py-1 text-sm font-semibold bg-sky-600 text-white shadow shadow-sky-600/20">1</button>
                </div>
            </div>

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
                                                {mockTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
