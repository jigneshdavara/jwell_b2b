import RichTextEditor from '@/Components/RichTextEditor';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

type BrandRow = {
    id: number;
    name: string;
    slug?: string | null;
    description?: string | null;
    cover_image_url?: string | null;
    is_active: boolean;
    products_count: number;
};

type Pagination<T> = {
    data: T[];
};

type BrandsPageProps = PageProps<{
    brands: Pagination<BrandRow>;
}>;

export default function AdminBrandsIndex() {
    const { brands } = usePage<BrandsPageProps>().props;
    const [editingBrand, setEditingBrand] = useState<BrandRow | null>(null);
    const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [coverObjectUrl, setCoverObjectUrl] = useState<string | null>(null);

    const brandForm = useForm({
        name: '',
        slug: '',
        description: '',
        cover_image: null as File | null,
        remove_cover_image: false,
        is_active: true,
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
        brandForm.reset();
        brandForm.setData('is_active', true);
        brandForm.setData('cover_image', null);
        brandForm.setData('remove_cover_image', false);
        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }
        setCoverPreview(null);
    };

    const populateForm = (brand: BrandRow) => {
        setEditingBrand(brand);
        brandForm.setData({
            name: brand.name,
            slug: brand.slug ?? '',
            description: brand.description ?? '',
            cover_image: null,
            remove_cover_image: false,
            is_active: brand.is_active,
        });
        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }
        setCoverPreview(brand.cover_image_url ?? null);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingBrand) {
            brandForm.post(route('admin.catalog.brands.update', editingBrand.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
                method: 'put',
                forceFormData: true,
            });
        } else {
            brandForm.post(route('admin.catalog.brands.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
                forceFormData: true,
            });
        }
    };

    const toggleBrand = (brand: BrandRow) => {
        router.put(route('admin.catalog.brands.update', brand.id), {
            name: brand.name,
            slug: brand.slug,
            description: brand.description,
            is_active: !brand.is_active,
            remove_cover_image: false,
        }, {
            preserveScroll: true,
        });
    };

    const deleteBrand = (brand: BrandRow) => {
        if (!window.confirm(`Remove brand ${brand.name}?`)) {
            return;
        }

        router.delete(route('admin.catalog.brands.destroy', brand.id), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedBrands((prev) => prev.filter((id) => id !== brand.id));
            },
        });
    };

    const bulkDelete = () => {
        if (selectedBrands.length === 0) {
            return;
        }

        if (!window.confirm(`Remove ${selectedBrands.length} selected brand(s)?`)) {
            return;
        }

        router.delete(route('admin.catalog.brands.bulk-destroy'), {
            data: { ids: selectedBrands },
            preserveScroll: true,
            onSuccess: () => setSelectedBrands([]),
        });
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
        brandForm.setData('cover_image', file);
        brandForm.setData('remove_cover_image', false);

        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }

        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setCoverPreview(objectUrl);
            setCoverObjectUrl(objectUrl);
        } else {
            setCoverPreview(editingBrand?.cover_image_url ?? null);
        }
    };

    const removeCoverImage = () => {
        brandForm.setData('cover_image', null);
        brandForm.setData('remove_cover_image', true);

        if (coverObjectUrl) {
            URL.revokeObjectURL(coverObjectUrl);
            setCoverObjectUrl(null);
        }

        setCoverPreview(null);
    };

    return (
        <AdminLayout>
            <Head title="Brands" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Brands</h1>
                    <p className="mt-2 text-sm text-slate-500">Create collections for your catalogue and toggle availability instantly.</p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingBrand ? `Edit brand ${editingBrand.name}` : 'Create new brand'}
                        </h2>
                        {editingBrand && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Name</span>
                            <input
                                type="text"
                                value={brandForm.data.name}
                                onChange={(event) => brandForm.setData('name', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                required
                            />
                            {brandForm.errors.name && <span className="text-xs text-rose-500">{brandForm.errors.name}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Slug</span>
                            <input
                                type="text"
                                value={brandForm.data.slug}
                                onChange={(event) => brandForm.setData('slug', event.target.value.toLowerCase())}
                                className="rounded-2xl border border-slate-300 px-4 py-2 lowercase focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="Optional – auto generated from name"
                            />
                            {brandForm.errors.slug && <span className="text-xs text-rose-500">{brandForm.errors.slug}</span>}
                        </label>
                    </div>

                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                        <span>Description</span>
                        <RichTextEditor
                            value={brandForm.data.description ?? ''}
                            onChange={(value) => brandForm.setData('description', value)}
                            placeholder="Share brand story, merchandising notes, or specific positioning details."
                        />
                        {brandForm.errors.description && (
                            <span className="text-xs text-rose-500">{brandForm.errors.description}</span>
                        )}
                    </label>

                    <label className="flex flex-col gap-3 text-sm text-slate-600">
                        <span>Brand image</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                        />
                        {brandForm.errors.cover_image && (
                            <span className="text-xs text-rose-500">{brandForm.errors.cover_image}</span>
                        )}
                        {coverPreview && (
                            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                                <img
                                    src={coverPreview}
                                    alt="Brand cover preview"
                                    className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200"
                                />
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs text-slate-500">
                                        {editingBrand ? 'This preview will replace the existing image after you save.' : 'This image will represent the brand across the catalogue.'}
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
                        {!coverPreview && editingBrand?.cover_image_url && (
                            <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-xs text-slate-500">
                                <span>No replacement uploaded. Existing image will be kept.</span>
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
                            checked={brandForm.data.is_active}
                            onChange={(event) => brandForm.setData('is_active', event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        Active in catalogue
                    </label>

                    <div className="flex justify-end gap-3">
                        {editingBrand && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                Cancel edit
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={brandForm.processing}
                            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {editingBrand ? 'Update brand' : 'Create brand'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">
                            Brands ({brands.data.length})
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
                                        aria-label="Select all brands"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Cover</th>
                                <th className="px-5 py-3 text-left">Slug</th>
                                <th className="px-5 py-3 text-left">Products</th>
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
                                    <td className="px-5 py-3 font-semibold text-slate-900">{brand.name}</td>
                                    <td className="px-5 py-3">
                                        {brand.cover_image_url ? (
                                            <img
                                                src={brand.cover_image_url}
                                                alt={`${brand.name} cover`}
                                                className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200"
                                            />
                                        ) : (
                                            <span className="text-xs text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{brand.slug ?? '—'}</td>
                                    <td className="px-5 py-3 text-slate-500">{brand.products_count}</td>
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
                                                onClick={() => populateForm(brand)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleBrand(brand)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                {brand.is_active ? 'Pause' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteBrand(brand)}
                                                className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {brands.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No brands available yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
