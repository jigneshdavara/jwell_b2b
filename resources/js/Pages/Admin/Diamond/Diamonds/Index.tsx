import Modal from '@/Components/Modal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

type DiamondClarity = {
    id: number;
    name: string;
    code: string | null;
};

type DiamondColor = {
    id: number;
    name: string;
    code: string | null;
};

type DiamondShape = {
    id: number;
    name: string;
    code: string | null;
};

type DiamondShapeSize = {
    id: number;
    size: string | null;
    secondary_size: string | null;
    ctw: number;
    label: string;
};

type DiamondRow = {
    id: number;
    name: string;
    clarity: DiamondClarity | null;
    color: DiamondColor | null;
    shape: DiamondShape | null;
    shape_size: DiamondShapeSize | null;
    price: number;
    description?: string | null;
    is_active: boolean;
};

type Pagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type DiamondsPageProps = PageProps<{
    diamonds: Pagination<DiamondRow>;
    clarities: DiamondClarity[];
    colors: DiamondColor[];
    shapes: DiamondShape[];
}>;

export default function AdminDiamondsIndex() {
    const { diamonds, clarities, colors, shapes } = usePage<DiamondsPageProps>().props;
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDiamond, setEditingDiamond] = useState<DiamondRow | null>(null);
    const [selectedDiamonds, setSelectedDiamonds] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(diamonds.per_page ?? 10);
    const [deleteConfirm, setDeleteConfirm] = useState<DiamondRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [shapeSizes, setShapeSizes] = useState<DiamondShapeSize[]>([]);
    const [loadingShapeSizes, setLoadingShapeSizes] = useState(false);

    const form = useForm({
        name: '',
        diamond_clarity_id: null as number | null,
        diamond_color_id: null as number | null,
        diamond_shape_id: null as number | null,
        diamond_shape_size_id: null as number | null,
        price: 0,
        description: '',
        is_active: true,
    });

    useEffect(() => {
        const existingIds = new Set(diamonds.data.map((diamond) => diamond.id));
        setSelectedDiamonds((prev) => prev.filter((id) => existingIds.has(id)));
    }, [diamonds.data]);

    const allSelected = useMemo(() => {
        if (diamonds.data.length === 0) {
            return false;
        }
        return selectedDiamonds.length === diamonds.data.length;
    }, [diamonds.data, selectedDiamonds]);

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedDiamonds([]);
        } else {
            setSelectedDiamonds(diamonds.data.map((diamond) => diamond.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedDiamonds((prev) =>
            prev.includes(id) ? prev.filter((diamondId) => diamondId !== id) : [...prev, id]
        );
    };

    const resetForm = () => {
        setEditingDiamond(null);
        setModalOpen(false);
        setShapeSizes([]);
        form.reset();
        form.setData('price', 0);
        form.setData('is_active', true);
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (diamond: DiamondRow) => {
        setEditingDiamond(diamond);
        form.setData({
            name: diamond.name,
            diamond_clarity_id: diamond.clarity?.id ?? null,
            diamond_color_id: diamond.color?.id ?? null,
            diamond_shape_id: diamond.shape?.id ?? null,
            diamond_shape_size_id: diamond.shape_size?.id ?? null,
            price: diamond.price,
            description: diamond.description ?? '',
            is_active: diamond.is_active,
        });
        
        // Load shape sizes if shape is selected
        if (diamond.shape?.id) {
            loadShapeSizes(diamond.shape.id);
        }
        
        setModalOpen(true);
    };

    const loadShapeSizes = async (shapeId: number | null) => {
        if (!shapeId) {
            setShapeSizes([]);
            form.setData('diamond_shape_size_id', null);
            return;
        }

        setLoadingShapeSizes(true);
        try {
            const response = await axios.get(route('admin.diamond.diamonds.shape-sizes', shapeId));
            setShapeSizes(response.data);
        } catch (error) {
            console.error('Failed to load shape sizes:', error);
            setShapeSizes([]);
        } finally {
            setLoadingShapeSizes(false);
        }
    };

    const handleShapeChange = (shapeId: number | null) => {
        form.setData('diamond_shape_id', shapeId);
        form.setData('diamond_shape_size_id', null);
        loadShapeSizes(shapeId);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingDiamond) {
            form.put(route('admin.diamond.diamonds.update', editingDiamond.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        } else {
            form.post(route('admin.diamond.diamonds.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        }
    };

    const deleteDiamond = (diamond: DiamondRow) => {
        setDeleteConfirm(diamond);
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            router.delete(route('admin.diamond.diamonds.destroy', deleteConfirm.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteConfirm(null);
                },
            });
        }
    };

    const bulkDelete = () => {
        if (selectedDiamonds.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = () => {
        router.delete(route('admin.diamond.diamonds.bulk-destroy'), {
            data: { ids: selectedDiamonds },
            preserveScroll: true,
            onSuccess: () => {
                setSelectedDiamonds([]);
                setBulkDeleteConfirm(false);
            },
        });
    };

    const changePage = (url: string | null) => {
        if (!url) {
            return;
        }

        router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        router.get(route('admin.diamond.diamonds.index'), { per_page: newPerPage }, { preserveState: true, preserveScroll: true });
    };

    const getDiamondLabel = (diamond: DiamondRow): string => {
        const parts: string[] = [];
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

    return (
        <AdminLayout>
            <Head title="Diamonds" />

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
                            Diamonds ({diamonds.total})
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
                                    <td colSpan={5} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No diamonds defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                        Showing {diamonds.from ?? 0} to {diamonds.to ?? 0} of {diamonds.total} entries
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {diamonds.links.map((link, index) => {
                            const cleanLabel = link.label
                                .replace('&laquo;', '«')
                                .replace('&raquo;', '»')
                                .replace(/&nbsp;/g, ' ')
                                .trim();

                            if (!link.url) {
                                return (
                                    <span key={`${link.label}-${index}`} className="rounded-full px-3 py-1 text-sm text-slate-400">
                                        {cleanLabel}
                                    </span>
                                );
                            }

                            return (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    onClick={() => changePage(link.url)}
                                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                        link.active ? 'bg-sky-600 text-white shadow shadow-sky-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {cleanLabel}
                                </button>
                            );
                        })}
                    </div>
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
                                    disabled={form.processing}
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
                        <form onSubmit={submit} className="space-y-6" id="diamond-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Name *</span>
                                            <input
                                                type="text"
                                                value={form.data.name}
                                                onChange={(event) => form.setData('name', event.target.value)}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                                placeholder="e.g., Premium Round Diamond"
                                            />
                                            {form.errors.name && <span className="text-xs text-rose-500">{form.errors.name}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Clarity</span>
                                            <select
                                                value={form.data.diamond_clarity_id || ''}
                                                onChange={(event) => form.setData('diamond_clarity_id', event.target.value ? Number(event.target.value) : null)}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            >
                                                <option value="">Select clarity</option>
                                                {clarities.map((clarity) => (
                                                    <option key={clarity.id} value={clarity.id}>
                                                        {clarity.name} {clarity.code ? `(${clarity.code})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {form.errors.diamond_clarity_id && <span className="text-xs text-rose-500">{form.errors.diamond_clarity_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Color</span>
                                            <select
                                                value={form.data.diamond_color_id || ''}
                                                onChange={(event) => form.setData('diamond_color_id', event.target.value ? Number(event.target.value) : null)}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            >
                                                <option value="">Select color</option>
                                                {colors.map((color) => (
                                                    <option key={color.id} value={color.id}>
                                                        {color.name} {color.code ? `(${color.code})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {form.errors.diamond_color_id && <span className="text-xs text-rose-500">{form.errors.diamond_color_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Shape</span>
                                            <select
                                                value={form.data.diamond_shape_id || ''}
                                                onChange={(event) => handleShapeChange(event.target.value ? Number(event.target.value) : null)}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            >
                                                <option value="">Select shape</option>
                                                {shapes.map((shape) => (
                                                    <option key={shape.id} value={shape.id}>
                                                        {shape.name} {shape.code ? `(${shape.code})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {form.errors.diamond_shape_id && <span className="text-xs text-rose-500">{form.errors.diamond_shape_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Shape Size</span>
                                            <select
                                                value={form.data.diamond_shape_size_id || ''}
                                                onChange={(event) => form.setData('diamond_shape_size_id', event.target.value ? Number(event.target.value) : null)}
                                                disabled={!form.data.diamond_shape_id || loadingShapeSizes}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">{loadingShapeSizes ? 'Loading...' : form.data.diamond_shape_id ? 'Select size' : 'Select shape first'}</option>
                                                {shapeSizes.map((size) => (
                                                    <option key={size.id} value={size.id}>
                                                        {size.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {form.errors.diamond_shape_size_id && <span className="text-xs text-rose-500">{form.errors.diamond_shape_size_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Price *</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={form.data.price}
                                                onChange={(event) => form.setData('price', Number(event.target.value))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                min={0}
                                                required
                                            />
                                            {form.errors.price && <span className="text-xs text-rose-500">{form.errors.price}</span>}
                                        </label>
                                    </div>

                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={form.data.is_active}
                                            onChange={(event) => form.setData('is_active', event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Active for selection
                                    </label>
                                </div>

                                <div className="space-y-6">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={form.data.description}
                                            onChange={(event) => form.setData('description', event.target.value)}
                                            className="min-h-[200px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Optional notes for team."
                                        />
                                        {form.errors.description && <span className="text-xs text-rose-500">{form.errors.description}</span>}
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
        </AdminLayout>
    );
}

