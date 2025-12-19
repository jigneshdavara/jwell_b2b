'use client';

import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { adminService } from '@/services/adminService';

type CategoryRow = {
    id: number;
    name: string;
    slug?: string | null;
    description?: string | null;
    cover_image_url?: string | null;
    is_active: boolean;
    products_count: number;
    parent_id?: number | null;
    parent_name?: string | null;
    depth: number;
    children_count: number;
    styles?: Array<{ id: number; name: string }>;
    sizes?: Array<{ id: number; name: string }>;
};

type CategoryResponse = {
    items: CategoryRow[];
    parentCategories: Array<{ id: number; name: string }>;
    styles: Array<{ id: number; name: string }>;
    sizes: Array<{ id: number; name: string }>;
    meta: {
        total: number;
        page: number;
        perPage: number;
        lastPage: number;
    };
};

export default function AdminCatalogCategoriesIndex() {
    const [loading, setLoading] = useState(true);
    const [categoriesData, setCategoriesData] = useState<CategoryResponse | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [coverObjectUrl, setCoverObjectUrl] = useState<string | null>(null);
    const [perPage, setPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<CategoryRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const [filterState, setFilterState] = useState({
        search: '',
        status: 'all',
        parent_id: 'all',
    });

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        is_active: true,
        parent_id: 'none' as string,
        cover_image: null as File | null,
        remove_cover_image: false,
        style_ids: [] as number[],
        size_ids: [] as number[],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    // Load data from API
    useEffect(() => {
        loadCategories();
    }, [currentPage, perPage]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await adminService.getCategories(currentPage, perPage);
            if (response.data) {
                setCategoriesData(response.data);
            }
        } catch (error: any) {
            console.error('Failed to load categories:', error);
            setErrors({ general: error.response?.data?.message || 'Failed to load categories' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (categoriesData) {
            const existingIds = new Set(categoriesData.items.map((category) => category.id));
            setSelectedCategories((prev) => prev.filter((id) => existingIds.has(id)));
        }
    }, [categoriesData]);

    const allSelected = useMemo(() => {
        if (!categoriesData || categoriesData.items.length === 0) {
            return false;
        }
        return selectedCategories.length === categoriesData.items.length;
    }, [categoriesData, selectedCategories]);

    const toggleSelectAll = () => {
        if (!categoriesData) return;
        if (allSelected) {
            setSelectedCategories([]);
        } else {
            setSelectedCategories(categoriesData.items.map((category) => category.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedCategories((prev) =>
            prev.includes(id) ? prev.filter((categoryId) => categoryId !== id) : [...prev, id]
        );
    };

    const resetForm = () => {
        setEditingCategory(null);
        setModalOpen(false);
        setFormData({
            name: '',
            slug: '',
            description: '',
            is_active: true,
            parent_id: 'none',
            cover_image: null,
            remove_cover_image: false,
            style_ids: [],
            size_ids: [],
        });
        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }
        setCoverPreview(null);
        setErrors({});
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (category: CategoryRow) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug ?? '',
            description: category.description ?? '',
            is_active: category.is_active,
            parent_id: category.parent_id ? String(category.parent_id) : 'none',
            cover_image: null,
            remove_cover_image: false,
            style_ids: category.styles?.map((s) => s.id) ?? [],
            size_ids: category.sizes?.map((s) => s.id) ?? [],
        });
        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }
        setCoverPreview(category.cover_image_url ?? null);
        setModalOpen(true);
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedName = formData.name?.trim() || '';
        if (!trimmedName) {
            setErrors({ name: 'The name field is required.' });
            return;
        }

        setProcessing(true);
        setErrors({});

        try {
            const submitData = new FormData();
            submitData.append('name', trimmedName);
            if (formData.slug) submitData.append('code', formData.slug);
            if (formData.description) submitData.append('description', formData.description);
            submitData.append('is_active', formData.is_active ? 'true' : 'false');
            if (formData.parent_id !== 'none') submitData.append('parent_id', formData.parent_id);
            if (formData.cover_image) submitData.append('cover_image', formData.cover_image);
            if (formData.remove_cover_image) submitData.append('remove_cover_image', 'true');
            formData.style_ids.forEach(id => submitData.append('style_ids[]', String(id)));
            formData.size_ids.forEach(id => submitData.append('size_ids[]', String(id)));

            if (editingCategory) {
                await adminService.updateCategory(editingCategory.id, submitData);
            } else {
                await adminService.createCategory(submitData);
            }
            resetForm();
            await loadCategories();
        } catch (error: any) {
            console.error('Failed to save category:', error);
            const errorData = error.response?.data;
            if (errorData?.message) {
                setErrors({ general: errorData.message });
            } else if (errorData) {
                setErrors(errorData);
            } else {
                setErrors({ general: 'Failed to save category' });
            }
        } finally {
            setProcessing(false);
        }
    };

    const toggleCategory = async (category: CategoryRow) => {
        try {
            const submitData = new FormData();
            submitData.append('name', category.name);
            if (category.slug) submitData.append('code', category.slug);
            if (category.description) submitData.append('description', category.description);
            submitData.append('is_active', (!category.is_active).toString());
            if (category.parent_id) submitData.append('parent_id', String(category.parent_id));
            await adminService.updateCategory(category.id, submitData);
            await loadCategories();
        } catch (error: any) {
            console.error('Failed to toggle category:', error);
            alert(error.response?.data?.message || 'Failed to update category');
        }
    };

    const deleteCategory = (category: CategoryRow) => {
        setDeleteConfirm(category);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteCategory(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadCategories();
            } catch (error: any) {
                console.error('Failed to delete category:', error);
                alert(error.response?.data?.message || 'Failed to delete category');
            }
        }
    };

    const bulkDelete = () => {
        if (selectedCategories.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        try {
            await adminService.bulkDeleteCategories(selectedCategories);
            setSelectedCategories([]);
            setBulkDeleteConfirm(false);
            await loadCategories();
        } catch (error: any) {
            console.error('Failed to delete categories:', error);
            alert(error.response?.data?.message || 'Failed to delete categories');
        }
    };

    const changePage = (page: number) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    useEffect(() => {
        return () => {
            if (coverObjectUrl) {
                URL.revokeObjectURL(coverObjectUrl);
            }
        };
    }, [coverObjectUrl]);

    const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        setFormData({ ...formData, cover_image: file, remove_cover_image: false });

        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }

        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setCoverPreview(objectUrl);
            setCoverObjectUrl(objectUrl);
        } else {
            setCoverPreview(editingCategory?.cover_image_url ?? null);
        }
    };

    const removeCoverImage = () => {
        setFormData({ ...formData, cover_image: null, remove_cover_image: true });

        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }

        setCoverPreview(null);
    };

    const applyFilters = (nextFilters: Partial<typeof filterState>) => {
        setFilterState({ ...filterState, ...nextFilters });
        setCurrentPage(1);
        // Note: API filtering would be implemented here
    };

    if (loading && !categoriesData) {
        return (
            <>
                <Head title="Categories" />
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-slate-500">Loading...</p>
                </div>
            </>
        );
    }

    const categories = categoriesData?.items || [];
    const parents = categoriesData?.parentCategories || [];
    const styles = categoriesData?.styles || [];
    const sizes = categoriesData?.sizes || [];
    const meta = categoriesData?.meta || { total: 0, page: 1, perPage: 20, lastPage: 1 };

    return (
        <>
            <Head title="Categories" />

            <div className="space-y-8">
                {errors.general && (
                    <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                        {errors.general}
                    </div>
                )}
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:flex-1">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Categories</h1>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                            <input
                                type="search"
                                value={filterState.search}
                                onChange={(event) => applyFilters({ search: event.target.value })}
                                placeholder="Search name or slug"
                                className="rounded-2xl border border-slate-200 px-4 py-2"
                            />
                            <select
                                value={filterState.status}
                                onChange={(event) => applyFilters({ status: event.target.value })}
                                className="rounded-2xl border border-slate-200 px-4 py-2"
                            >
                                <option value="all">All statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <select
                                value={filterState.parent_id}
                                onChange={(event) => applyFilters({ parent_id: event.target.value })}
                                className="rounded-2xl border border-slate-200 px-4 py-2"
                            >
                                <option value="all">All parents</option>
                                <option value="root">Top level only</option>
                                {parents.map((parent) => (
                                    <option key={parent.id} value={parent.id}>
                                        {parent.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="ml-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New category
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">
                            Categories ({meta.total})
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedCategories.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedCategories.length === 0}
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
                                        aria-label="Select all categories"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Cover</th>
                                <th className="px-5 py-3 text-left">Slug</th>
                                <th className="px-5 py-3 text-left">Products</th>
                                <th className="px-5 py-3 text-left">Parent</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {categories.map((category) => (
                                <tr key={category.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category.id)}
                                            onChange={() => toggleSelection(category.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select category ${category.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex items-center gap-2" style={{ paddingLeft: `${category.depth * 16}px` }}>
                                            {category.children_count > 0 && (
                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600">
                                                    {category.children_count}
                                                </span>
                                            )}
                                            <span>{category.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        {category.cover_image_url ? (
                                            <img
                                                src={category.cover_image_url}
                                                alt={`${category.name} cover`}
                                                className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200"
                                            />
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{category.slug ?? '—'}</td>
                                    <td className="px-5 py-3 text-slate-500">{category.products_count}</td>
                                    <td className="px-5 py-3 text-slate-500">{category.parent_name ?? '—'}</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                category.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {category.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(category)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                title="Edit category"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleCategory(category)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                                title={category.is_active ? 'Pause category' : 'Activate category'}
                                            >
                                                {category.is_active ? (
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
                                                onClick={() => deleteCategory(category)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                title="Delete category"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No categories available yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {meta.lastPage > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                        <div>
                            Showing {(meta.page - 1) * meta.perPage + 1} to {Math.min(meta.page * meta.perPage, meta.total)} of {meta.total} entries
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: meta.lastPage }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => changePage(page)}
                                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                        page === meta.page ? 'bg-sky-600 text-white shadow shadow-sky-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="6xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingCategory ? `Edit category: ${editingCategory.name}` : 'Create new category'}
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
                                    form="category-form"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingCategory ? 'Update category' : 'Create category'}
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
                        <form onSubmit={submit} className="space-y-6" id="category-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Name</span>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                            {errors.name && <span className="text-xs text-rose-500">{errors.name}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Slug</span>
                                            <input
                                                type="text"
                                                value={formData.slug}
                                                onChange={(event) => setFormData({ ...formData, slug: event.target.value.toLowerCase() })}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 lowercase focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                placeholder="Optional – auto generated from name"
                                            />
                                            {errors.slug && <span className="text-xs text-rose-500">{errors.slug}</span>}
                                        </label>
                                    </div>

                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Parent category</span>
                                        <select
                                            value={formData.parent_id}
                                            onChange={(event) => setFormData({ ...formData, parent_id: event.target.value })}
                                            className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        >
                                            <option value="none">No parent (top level)</option>
                                            {parents.map((parent) => (
                                                <option key={parent.id} value={String(parent.id)}>
                                                    {parent.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.parent_id && (
                                            <span className="text-xs text-rose-500">{errors.parent_id}</span>
                                        )}
                                    </label>

                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Styles</span>
                                        {styles && styles.length > 0 ? (
                                            <>
                                                <select
                                                    multiple
                                                    value={formData.style_ids.map(String)}
                                                    onChange={(event) => {
                                                        const selectedIds = Array.from(event.target.selectedOptions, (option) => Number(option.value));
                                                        setFormData({ ...formData, style_ids: selectedIds });
                                                    }}
                                                    className="min-h-[120px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    size={Math.min(Math.max(styles.length, 3), 5)}
                                                >
                                                    {styles.map((style) => (
                                                        <option key={style.id} value={String(style.id)}>
                                                            {style.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="text-xs text-slate-500">Hold Ctrl/Cmd to select multiple styles</span>
                                            </>
                                        ) : (
                                            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-400">
                                                No styles available. Create styles first in the Styles section.
                                            </div>
                                        )}
                                        {errors.style_ids && (
                                            <span className="text-xs text-rose-500">{errors.style_ids}</span>
                                        )}
                                    </label>

                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Sizes</span>
                                        {sizes && sizes.length > 0 ? (
                                            <>
                                                <select
                                                    multiple
                                                    value={formData.size_ids.map(String)}
                                                    onChange={(event) => {
                                                        const selectedIds = Array.from(event.target.selectedOptions, (option) => Number(option.value));
                                                        setFormData({ ...formData, size_ids: selectedIds });
                                                    }}
                                                    className="min-h-[120px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    size={Math.min(Math.max(sizes.length, 3), 5)}
                                                >
                                                    {sizes.map((size) => (
                                                        <option key={size.id} value={String(size.id)}>
                                                            {size.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className="text-xs text-slate-500">Hold Ctrl/Cmd to select multiple sizes</span>
                                            </>
                                        ) : (
                                            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-400">
                                                No sizes available. Create sizes first in the Sizes section.
                                            </div>
                                        )}
                                        {errors.size_ids && (
                                            <span className="text-xs text-rose-500">{errors.size_ids}</span>
                                        )}
                                    </label>

                                    <label className="flex flex-col gap-3 text-sm text-slate-600">
                                        <span>Category visual</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCoverChange}
                                            className="w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                                        />
                                        {errors.cover_image && (
                                            <span className="text-xs text-rose-500">{errors.cover_image}</span>
                                        )}
                                        {coverPreview && (
                                            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                                                <img
                                                    src={coverPreview}
                                                    alt="Category cover preview"
                                                    className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
                                                />
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-xs text-slate-500">
                                                        {editingCategory ? 'This preview will replace the existing category image once saved.' : 'This image will be used in admin and catalogue highlights.'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={removeCoverImage}
                                                        className="self-start rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                                    >
                                                        Remove image
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {!coverPreview && editingCategory?.cover_image_url && (
                                            <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-xs text-slate-500">
                                                <span>No replacement chosen. Existing visual will remain.</span>
                                                <button
                                                    type="button"
                                                    onClick={removeCoverImage}
                                                    className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                                >
                                                    Remove current image
                                                </button>
                                            </div>
                                        )}
                                    </label>

                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Active in catalogue
                                    </label>
                                </div>

                                <div className="space-y-6">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={formData.description}
                                            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                                            className="min-h-[300px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Describe assortment strategy, merchandising notes, or design direction for this category."
                                        />
                                        {errors.description && (
                                            <span className="text-xs text-rose-500">{errors.description}</span>
                                        )}
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
                title="Remove Category"
                message={deleteConfirm ? `Are you sure you want to remove category ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Remove Categories"
                message={`Are you sure you want to remove ${selectedCategories.length} selected category(ies)?`}
                confirmText="Remove"
                variant="danger"
            />
        </>
    );
}

