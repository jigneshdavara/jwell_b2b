import Modal from '@/Components/Modal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type DiamondType = {
    id: number;
    name: string;
    code: string | null;
};

type DiamondShape = {
    id: number;
    name: string;
    code: string | null;
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

type DiamondShapeSizesPageProps = PageProps<{
    sizes: Pagination<DiamondShapeSizeRow>;
    shapes: DiamondShape[];
    types: DiamondType[];
    selectedShapeId?: number;
}>;

export default function AdminDiamondShapeSizesIndex() {
    const { sizes, shapes, types, selectedShapeId } = usePage<DiamondShapeSizesPageProps>().props;
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSize, setEditingSize] = useState<DiamondShapeSizeRow | null>(null);
    const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(sizes.per_page ?? 10);
    const [deleteConfirm, setDeleteConfirm] = useState<DiamondShapeSizeRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const form = useForm({
        diamond_type_id: '',
        diamond_shape_id: selectedShapeId ? String(selectedShapeId) : (shapes.length > 0 ? String(shapes[0].id) : ''),
        size: '',
        secondary_size: '',
        description: '',
        display_order: '' as string | number,
        ctw: '' as string | number,
    });

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
        form.reset();
        form.clearErrors();
        form.setData('diamond_type_id', '');
        form.setData('diamond_shape_id', selectedShapeId ? String(selectedShapeId) : (shapes.length > 0 ? String(shapes[0].id) : ''));
        form.setData('size', '');
        form.setData('secondary_size', '');
        form.setData('description', '');
        form.setData('display_order', '');
        form.setData('ctw', '');
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (size: DiamondShapeSizeRow) => {
        setEditingSize(size);
        form.clearErrors();
        form.setData({
            diamond_type_id: String(size.diamond_type_id),
            diamond_shape_id: String(size.diamond_shape_id),
            size: size.size,
            secondary_size: size.secondary_size ?? '',
            description: size.description ?? '',
            display_order: size.display_order,
            ctw: size.ctw,
        });
        setModalOpen(true);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Convert form data to proper types before submission
        form.transform((data) => ({
            ...data,
            diamond_type_id: Number(data.diamond_type_id),
            diamond_shape_id: Number(data.diamond_shape_id),
            display_order: data.display_order === '' ? 0 : Number(data.display_order),
            ctw: data.ctw === '' ? 0 : Number(data.ctw),
        }));

        if (editingSize) {
            form.put(route('admin.diamond.shape-sizes.update', editingSize.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        } else {
            form.post(route('admin.diamond.shape-sizes.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        }
    };

    const deleteSize = (size: DiamondShapeSizeRow) => {
        setDeleteConfirm(size);
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            router.delete(route('admin.diamond.shape-sizes.destroy', deleteConfirm.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteConfirm(null);
                },
            });
        }
    };

    const bulkDelete = () => {
        if (selectedSizes.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = () => {
        router.delete(route('admin.diamond.shape-sizes.bulk-destroy'), {
            data: { ids: selectedSizes },
            preserveScroll: true,
            onSuccess: () => {
                setSelectedSizes([]);
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
        router.get(route('admin.diamond.shape-sizes.index'), { per_page: newPerPage, shape_id: selectedShapeId }, { preserveState: true, preserveScroll: true });
    };

    const handleShapeFilter = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const shapeId = event.target.value ? Number(event.target.value) : null;
        router.get(route('admin.diamond.shape-sizes.index'), { shape_id: shapeId }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
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
                                Sizes ({sizes.total})
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
                                    <td className="px-5 py-3 text-slate-500">{typeof size.ctw === 'number' ? size.ctw.toFixed(3) : (parseFloat(size.ctw) || 0).toFixed(3)}</td>
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

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                        Showing {sizes.from ?? 0} to {sizes.to ?? 0} of {sizes.total} entries
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {sizes.links.map((link, index) => {
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
                                    disabled={form.processing}
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
                                                value={form.data.diamond_type_id}
                                                onChange={(event) => form.setData('diamond_type_id', event.target.value)}
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
                                            {form.errors.diamond_type_id && <span className="text-xs text-rose-500">{form.errors.diamond_type_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Diamond Shape <span className="text-rose-500">*</span></span>
                                            <select
                                                value={form.data.diamond_shape_id}
                                                onChange={(event) => form.setData('diamond_shape_id', event.target.value)}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            >
                                                <option value="">Select a shape</option>
                                                {shapes.map((shape) => (
                                                    <option key={shape.id} value={shape.id}>
                                                        {shape.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {form.errors.diamond_shape_id && <span className="text-xs text-rose-500">{form.errors.diamond_shape_id}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Size <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={form.data.size}
                                                onChange={(event) => form.setData('size', event.target.value)}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                placeholder="e.g., 1.00, 2.00x3.00"
                                                required
                                            />
                                            {form.errors.size && <span className="text-xs text-rose-500">{form.errors.size}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Secondary Size</span>
                                            <input
                                                type="text"
                                                value={form.data.secondary_size}
                                                onChange={(event) => form.setData('secondary_size', event.target.value)}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                placeholder="e.g., (S), (T)"
                                            />
                                            {form.errors.secondary_size && <span className="text-xs text-rose-500">{form.errors.secondary_size}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>CTW (Carat Total Weight) <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={form.data.ctw === '' ? '' : form.data.ctw}
                                                onChange={(event) => form.setData('ctw', event.target.value === '' ? '' : Number(event.target.value))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                min={0}
                                                required
                                            />
                                            {form.errors.ctw && <span className="text-xs text-rose-500">{form.errors.ctw}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Display Order <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                value={form.data.display_order === '' ? '' : form.data.display_order}
                                                onChange={(event) => form.setData('display_order', event.target.value === '' ? '' : Number(event.target.value))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                min={0}
                                                required
                                            />
                                            {form.errors.display_order && <span className="text-xs text-rose-500">{form.errors.display_order}</span>}
                                        </label>
                                    </div>
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
        </AdminLayout>
    );
}
