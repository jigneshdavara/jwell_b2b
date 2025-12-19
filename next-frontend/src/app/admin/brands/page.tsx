"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type BrandRow = {
    id: number;
    code: string | null;
    name: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
    cover_image?: string | null;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

const mockBrands: BrandRow[] = [
    { id: 1, code: 'ELV001', name: 'Elvee Atelier', description: 'Our signature collection of handcrafted jewelry.', is_active: true, display_order: 1 },
    { id: 2, code: 'SIG002', name: 'Signature', description: 'Timeless designs for every occasion.', is_active: true, display_order: 2 },
    { id: 3, code: 'LGD003', name: 'Legacy', description: 'Vintage-inspired pieces with a modern twist.', is_active: false, display_order: 3 },
];

export default function AdminBrandsPage() {
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState<{ data: BrandRow[]; meta: PaginationMeta }>({
        data: mockBrands,
        meta: { current_page: 1, last_page: 1, total: mockBrands.length, per_page: 10 }
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<BrandRow | null>(null);
    const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [deleteConfirm, setDeleteConfirm] = useState<BrandRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formState, setFormState] = useState({
        code: '',
        name: '',
        description: '',
        is_active: true,
        display_order: 0,
    });

    useEffect(() => {
        setLoading(false);
    }, []);

    const allSelected = useMemo(() => {
        if (brands.data.length === 0) return false;
        return selectedBrands.length === brands.data.length;
    }, [brands.data, selectedBrands]);

    const toggleSelectAll = () => {
        setSelectedBrands(allSelected ? [] : brands.data.map(b => b.id));
    };

    const toggleSelection = (id: number) => {
        setSelectedBrands(prev => prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]);
    };

    const resetForm = () => {
        setEditingBrand(null);
        setModalOpen(false);
        setFormState({
            code: '',
            name: '',
            description: '',
            is_active: true,
            display_order: 0,
        });
        setCoverPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (brand: BrandRow) => {
        setEditingBrand(brand);
        setFormState({
            code: brand.code ?? '',
            name: brand.name,
            description: brand.description ?? '',
            is_active: brand.is_active,
            display_order: brand.display_order,
        });
        setCoverPreview(brand.cover_image ?? null);
        setModalOpen(true);
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setCoverPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            if (editingBrand) {
                setBrands(prev => ({
                    ...prev,
                    data: prev.data.map(b => b.id === editingBrand.id ? { ...b, ...formState, cover_image: coverPreview } : b)
                }));
            } else {
                const newBrand: BrandRow = {
                    id: Date.now(),
                    ...formState,
                    cover_image: coverPreview
                };
                setBrands(prev => ({
                    ...prev,
                    data: [...prev.data, newBrand],
                    meta: { ...prev.meta, total: prev.meta.total + 1 }
                }));
            }
            resetForm();
            setLoading(false);
        }, 500);
    };

    const toggleBrand = (brand: BrandRow) => {
        setBrands(prev => ({
            ...prev,
            data: prev.data.map(b => b.id === brand.id ? { ...b, is_active: !b.is_active } : b)
        }));
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setBrands(prev => ({
                ...prev,
                data: prev.data.filter(b => b.id !== deleteConfirm.id),
                meta: { ...prev.meta, total: prev.meta.total - 1 }
            }));
            setDeleteConfirm(null);
        }
    };

    const handleBulkDelete = () => {
        setBrands(prev => ({
            ...prev,
            data: prev.data.filter(b => !selectedBrands.includes(b.id)),
            meta: { ...prev.meta, total: prev.meta.total - selectedBrands.length }
        }));
        setSelectedBrands([]);
        setBulkDeleteConfirm(false);
    };

    if (loading && !brands.data.length) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Brands</h1>
                    <p className="mt-2 text-sm text-slate-500">Manage product brands for your catalog.</p>
                </div>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                    </svg>
                    New brand
                </button>
            </div>

            <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                    <div className="font-semibold text-slate-700">Brands ({brands.meta.total})</div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{selectedBrands.length} selected</span>
                        <button
                            type="button"
                            onClick={() => setBulkDeleteConfirm(true)}
                            disabled={selectedBrands.length === 0}
                            className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Bulk delete
                        </button>
                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:ring-0"
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
                            <th className="px-5 py-3 text-left">Code</th>
                            <th className="px-5 py-3 text-left">Name</th>
                            <th className="px-5 py-3 text-left">Order</th>
                            <th className="px-5 py-3 text-left">Status</th>
                            <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {brands.data.map((brand) => (
                            <tr key={brand.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedBrands.includes(brand.id)}
                                        onChange={() => toggleSelection(brand.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                </td>
                                <td className="px-5 py-3 text-slate-700">{brand.code || '-'}</td>
                                <td className="px-5 py-3 font-semibold text-slate-900">
                                    <div className="flex flex-col gap-1">
                                        <span>{brand.name}</span>
                                        {brand.description && <span className="text-xs font-normal text-slate-500">{brand.description}</span>}
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-slate-500">{brand.display_order}</td>
                                <td className="px-5 py-3">
                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            brand.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {brand.is_active ? 'Active' : 'Archived'}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(brand)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                            title="Edit brand"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleBrand(brand)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                            title={brand.is_active ? 'Pause brand' : 'Activate brand'}
                                        >
                                            {brand.is_active ? (
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
                                            onClick={() => setDeleteConfirm(brand)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                            title="Delete brand"
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
                <div>Showing 1 to {brands.data.length} of {brands.meta.total} entries</div>
                <div className="flex gap-2">
                    <button className="rounded-full px-3 py-1 text-sm font-semibold bg-sky-600 text-white shadow shadow-sky-600/20">1</button>
                </div>
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingBrand ? `Edit brand: ${editingBrand.name}` : 'Create new brand'}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={resetForm} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900">
                                    Cancel
                                </button>
                                <button type="submit" form="brand-form" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700">
                                    {editingBrand ? 'Update brand' : 'Create brand'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={handleSubmit} className="space-y-6" id="brand-form">
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
                                                placeholder="e.g., BRD001"
                                                required
                                            />
                                        </label>
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
                                            <span>Display order <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                value={formState.display_order}
                                                onChange={(e) => setFormState(prev => ({ ...prev, display_order: Number(e.target.value) }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                        </label>
                                        <label className="flex flex-col gap-3 text-sm text-slate-600">
                                            <span>Cover Image</span>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleCoverChange}
                                                className="w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                                            />
                                            {coverPreview && (
                                                <div className="mt-2">
                                                    <img src={coverPreview} alt="Preview" className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200" />
                                                </div>
                                            )}
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
                title="Remove Brand"
                message={deleteConfirm ? `Are you sure you want to remove brand ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Brands"
                message={`Are you sure you want to delete ${selectedBrands.length} selected brand(s)?`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
