import Modal from '@/Components/Modal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

type BrandRow = {
    id: number;
    code: string | null;
    name: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
    cover_image?: string | null;
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

type BrandsPageProps = PageProps<{
    brands: Pagination<BrandRow>;
}>;

export default function AdminBrandsIndex() {
    const { brands } = usePage<BrandsPageProps>().props;
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<BrandRow | null>(null);
    const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(brands.per_page ?? 10);
    const [deleteConfirm, setDeleteConfirm] = useState<BrandRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [coverObjectUrl, setCoverObjectUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        code: '',
        name: '',
        description: '',
        is_active: true,
        display_order: 0,
        cover_image: null as File | null,
        remove_cover_image: false,
    });

    useEffect(() => {
        const existingIds = new Set(brands.data.map((brand) => brand.id));
        setSelectedBrands((prev) => prev.filter((id) => existingIds.has(id)));
    }, [brands.data]);

    const allSelected = useMemo(() => {
        if (brands.data.length === 0) {
            return false;
        }
        return selectedBrands.length === brands.data.length;
    }, [brands.data, selectedBrands]);

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedBrands([]);
        } else {
            setSelectedBrands(brands.data.map((brand) => brand.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedBrands((prev) =>
            prev.includes(id) ? prev.filter((brandId) => brandId !== id) : [...prev, id]
        );
    };

    const resetForm = () => {
        setEditingBrand(null);
        setModalOpen(false);
        form.reset();
        form.setData('code', '');
        form.setData('is_active', true);
        form.setData('display_order', 0);
        form.setData('cover_image', null);
        form.setData('remove_cover_image', false);
        setCoverPreview(null);
        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (brand: BrandRow) => {
        setEditingBrand(brand);
        form.setData({
            code: brand.code ?? '',
            name: brand.name,
            description: brand.description ?? '',
            is_active: brand.is_active,
            display_order: brand.display_order,
            cover_image: null,
            remove_cover_image: false,
        });
        setCoverPreview(brand.cover_image ?? null);
        setModalOpen(true);
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
        form.setData('cover_image', file);
        form.setData('remove_cover_image', false);

        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }

        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setCoverPreview(objectUrl);
            setCoverObjectUrl(objectUrl);
        } else {
            setCoverPreview(editingBrand?.cover_image ?? null);
        }
    };

    const removeCoverImage = () => {
        form.setData('cover_image', null);
        form.setData('remove_cover_image', true);
        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }
        setCoverPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const hasFile = form.data.cover_image instanceof File;
        const coverImage = form.data.cover_image;
        const removeCoverImage = form.data.remove_cover_image;

        form.transform((data) => {
            const transformed: any = {
                ...data,
                remove_cover_image: removeCoverImage,
                ...(editingBrand ? { _method: 'PUT' } : {}),
            };

            if (hasFile) {
                transformed.cover_image = coverImage;
            } else {
                delete transformed.cover_image;
            }

            return transformed;
        });

        const submitOptions = {
            preserveScroll: true,
            forceFormData: hasFile,
            onSuccess: () => {
                resetForm();
            },
            onError: (errors: any) => {
                console.error('Form submission errors:', errors);
            },
            onFinish: () => {
                form.transform((data) => data);
            },
        };

        if (editingBrand) {
            form.post(route('admin.brands.update', editingBrand.id), submitOptions);
        } else {
            form.post(route('admin.brands.store'), submitOptions);
        }
    };

    const toggleBrand = (brand: BrandRow) => {
        router.put(route('admin.brands.update', brand.id), {
            code: brand.code,
            name: brand.name,
            description: brand.description,
            is_active: !brand.is_active,
            display_order: brand.display_order,
        }, {
            preserveScroll: true,
        });
    };

    const deleteBrand = (brand: BrandRow) => {
        setDeleteConfirm(brand);
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            router.delete(route('admin.brands.destroy', deleteConfirm.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteConfirm(null);
                },
            });
        }
    };

    const bulkDelete = () => {
        if (selectedBrands.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = () => {
        router.delete(route('admin.brands.bulk-destroy'), {
            data: { ids: selectedBrands },
            preserveScroll: true,
            onSuccess: () => {
                setSelectedBrands([]);
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
        router.get(route('admin.brands.index'), { per_page: newPerPage }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Brands" />

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
                        <div className="font-semibold text-slate-700">
                            Brands ({brands.total})
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedBrands.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedBrands.length === 0}
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
                                        aria-label="Select all brands"
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
                                <tr key={brand.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedBrands.includes(brand.id)}
                                            onChange={() => toggleSelection(brand.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select brand ${brand.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 text-slate-700">{brand.code || '-'}</td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{brand.name}</span>
                                            {brand.description && <span className="text-xs text-slate-500">{brand.description}</span>}
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
                                                onClick={() => deleteBrand(brand)}
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
                            {brands.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No brands defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                        Showing {brands.from ?? 0} to {brands.to ?? 0} of {brands.total} entries
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {brands.links.map((link, index) => {
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
                                {editingBrand ? `Edit brand: ${editingBrand.name}` : 'Create new brand'}
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
                                    form="brand-form"
                                    disabled={form.processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingBrand ? 'Update brand' : 'Create brand'}
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
                        <form onSubmit={submit} className="space-y-6" id="brand-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Code <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={form.data.code}
                                                onChange={(event) => form.setData('code', event.target.value)}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                placeholder="e.g., BRD001"
                                                required
                                            />
                                            {form.errors.code && <span className="text-xs text-rose-500">{form.errors.code}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Name <span className="text-rose-500">*</span></span>
                                            <input
                                                type="text"
                                                value={form.data.name}
                                                onChange={(event) => form.setData('name', event.target.value)}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                            {form.errors.name && <span className="text-xs text-rose-500">{form.errors.name}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Display order <span className="text-rose-500">*</span></span>
                                            <input
                                                type="number"
                                                value={form.data.display_order}
                                                onChange={(event) => form.setData('display_order', Number(event.target.value))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                min={0}
                                                required
                                            />
                                            {form.errors.display_order && <span className="text-xs text-rose-500">{form.errors.display_order}</span>}
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
                                            {form.errors.cover_image && (
                                                <span className="text-xs text-rose-500">{form.errors.cover_image}</span>
                                            )}
                                            {coverPreview && (
                                                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                                                    <img
                                                        src={coverPreview}
                                                        alt="Cover preview"
                                                        className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
                                                    />
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-xs text-slate-500">
                                                            {coverObjectUrl && editingBrand
                                                                ? 'This preview will replace the existing brand image once saved.'
                                                                : coverObjectUrl
                                                                ? 'This image will be used as the brand cover image.'
                                                                : 'Current brand image. Upload a new file to replace it.'}
                                                        </span>
                                                        {coverObjectUrl && (
                                                            <button
                                                                type="button"
                                                                onClick={removeCoverImage}
                                                                className="self-start rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                                            >
                                                                Remove selected image
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {!coverPreview && editingBrand?.cover_image && (
                                                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                                                    <img
                                                        src={editingBrand.cover_image}
                                                        alt="Current cover"
                                                        className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
                                                    />
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-xs text-slate-500">
                                                            Current brand image. Upload a new file to replace it.
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
                                            placeholder="Optional notes for team (e.g. usage, brand)."
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
        </AdminLayout>
    );
}
