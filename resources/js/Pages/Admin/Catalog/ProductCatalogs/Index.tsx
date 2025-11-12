import Modal from '@/Components/Modal';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

type ProductCatalogRow = {
    id: number;
    name: string;
    slug: string | null;
    description: string | null;
    is_active: boolean;
    products_count: number;
    product_ids: number[];
};

type Pagination<T> = {
    data: T[];
};

type AssignableProduct = {
    id: number;
    name: string;
    sku: string;
    brand?: string | null;
    category?: string | null;
};

type ProductCatalogPageProps = PageProps<{
    catalogs: Pagination<ProductCatalogRow>;
    availableProducts: AssignableProduct[];
}>;

export default function ProductCatalogsIndex() {
    const { catalogs, availableProducts } = usePage<ProductCatalogPageProps>().props;

    const [editingCatalog, setEditingCatalog] = useState<ProductCatalogRow | null>(null);
    const [selectedCatalogs, setSelectedCatalogs] = useState<number[]>([]);
    const [assigningCatalog, setAssigningCatalog] = useState<ProductCatalogRow | null>(null);
    const [assignSelection, setAssignSelection] = useState<number[]>([]);
    const [assignSearch, setAssignSearch] = useState('');
    const [assignBrand, setAssignBrand] = useState<string>('all');
    const [assignCategory, setAssignCategory] = useState<string>('all');

    const catalogForm = useForm({
        name: '',
        slug: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        const existingIds = new Set(catalogs.data.map((catalog) => catalog.id));
        setSelectedCatalogs((prev) => prev.filter((id) => existingIds.has(id)));
    }, [catalogs.data]);

    const allSelected = useMemo(() => {
        if (catalogs.data.length === 0) {
            return false;
        }

        return selectedCatalogs.length === catalogs.data.length;
    }, [catalogs.data, selectedCatalogs]);

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedCatalogs([]);
        } else {
            setSelectedCatalogs(catalogs.data.map((catalog) => catalog.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedCatalogs((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));
    };

    const resetForm = () => {
        setEditingCatalog(null);
        catalogForm.reset();
        catalogForm.setData('is_active', true);
    };

    const populateForm = (catalog: ProductCatalogRow) => {
        setEditingCatalog(catalog);
        catalogForm.setData({
            name: catalog.name,
            slug: catalog.slug ?? '',
            description: catalog.description ?? '',
            is_active: catalog.is_active,
        });
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingCatalog) {
            catalogForm.put(route('admin.catalog.product-catalogs.update', editingCatalog.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        } else {
            catalogForm.post(route('admin.catalog.product-catalogs.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        }
    };

    const toggleCatalog = (catalog: ProductCatalogRow) => {
        router.put(
            route('admin.catalog.product-catalogs.update', catalog.id),
            {
                name: catalog.name,
                slug: catalog.slug,
                description: catalog.description,
                is_active: !catalog.is_active,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const deleteCatalog = (catalog: ProductCatalogRow) => {
        if (!window.confirm(`Remove catalog "${catalog.name}"?`)) {
            return;
        }

        router.delete(route('admin.catalog.product-catalogs.destroy', catalog.id), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedCatalogs((prev) => prev.filter((id) => id !== catalog.id));
            },
        });
    };

    const bulkDelete = () => {
        if (selectedCatalogs.length === 0) {
            return;
        }

        if (!window.confirm(`Remove ${selectedCatalogs.length} selected catalog(s)?`)) {
            return;
        }

        router.delete(route('admin.catalog.product-catalogs.bulk-destroy'), {
            data: { ids: selectedCatalogs },
            preserveScroll: true,
            onSuccess: () => setSelectedCatalogs([]),
        });
    };

    const openAssignModal = (catalog: ProductCatalogRow) => {
        setAssigningCatalog(catalog);
        setAssignSelection(catalog.product_ids.map(Number));
        setAssignSearch('');
        setAssignBrand('all');
        setAssignCategory('all');
    };

    const closeAssignModal = () => {
        setAssigningCatalog(null);
        setAssignSelection([]);
    };

    const assignBrandOptions = useMemo(() => {
        const unique = new Set<string>();
        availableProducts.forEach((product) => {
            if (product.brand) {
                unique.add(product.brand);
            }
        });
        return Array.from(unique).sort();
    }, [availableProducts]);

    const assignCategoryOptions = useMemo(() => {
        const unique = new Set<string>();
        availableProducts.forEach((product) => {
            if (product.category) {
                unique.add(product.category);
            }
        });
        return Array.from(unique).sort();
    }, [availableProducts]);

    const filteredAssignableProducts = useMemo(() => {
        return availableProducts.filter((product) => {
            const haystack = `${product.name} ${product.sku}`.toLowerCase();
            const searchMatch = assignSearch.trim() === '' || haystack.includes(assignSearch.toLowerCase());
            const brandMatch = assignBrand === 'all' || (product.brand ?? '') === assignBrand;
            const categoryMatch = assignCategory === 'all' || (product.category ?? '') === assignCategory;

            return searchMatch && brandMatch && categoryMatch;
        });
    }, [availableProducts, assignBrand, assignCategory, assignSearch]);

    const toggleAssignSelection = (id: number) => {
        setAssignSelection((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));
    };

    const assignAllVisible = () => {
        const visibleIds = filteredAssignableProducts.map((product) => product.id);
        const next = new Set(assignSelection);
        let changed = false;
        visibleIds.forEach((id) => {
            if (!next.has(id)) {
                next.add(id);
                changed = true;
            }
        });
        if (changed) {
            setAssignSelection(Array.from(next));
        }
    };

    const unassignAllVisible = () => {
        const visibleIds = new Set(filteredAssignableProducts.map((product) => product.id));
        const next = assignSelection.filter((id) => !visibleIds.has(id));
        setAssignSelection(next);
    };

    const saveAssignments = () => {
        if (!assigningCatalog) {
            return;
        }

        router.post(
            route('admin.catalog.product-catalogs.assign-products', assigningCatalog.id),
            {
                product_ids: assignSelection,
            },
            {
                preserveScroll: true,
                onSuccess: () => closeAssignModal(),
            },
        );
    };

    const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        catalogForm.setData('description', event.target.value);
    };

    return (
        <AdminLayout>
            <Head title="Product catalogues" />

            <div className="space-y-8">
                <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Product catalogues</h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Curate thematic collections and assign multiple products in a single view.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={bulkDelete}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={selectedCatalogs.length === 0}
                                title="Bulk delete selected"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M10 11v6m4-6v6" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_minmax(0,1fr)]">
                        <div className="rounded-2xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500">
                                    <tr>
                                        <th className="w-12 px-4 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={toggleSelectAll}
                                                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left">Name</th>
                                        <th className="px-4 py-3 text-left">Slug</th>
                                        <th className="px-4 py-3 text-left">Products</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {catalogs.data.map((catalog) => (
                                        <tr key={catalog.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 align-middle">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCatalogs.includes(catalog.id)}
                                                    onChange={() => toggleSelection(catalog.id)}
                                                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <div className="font-medium text-slate-800">{catalog.name}</div>
                                                {catalog.description && (
                                                    <p className="text-xs text-slate-500 line-clamp-2">{catalog.description}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-middle text-slate-500">{catalog.slug ?? '—'}</td>
                                            <td className="px-4 py-3 align-middle text-slate-700">{catalog.products_count}</td>
                                            <td className="px-4 py-3 align-middle">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleCatalog(catalog)}
                                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-slate-500 transition hover:text-slate-900 ${catalog.is_active ? 'border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:text-emerald-700' : 'border-slate-200'}`}
                                                    title={catalog.is_active ? 'Deactivate catalogue' : 'Activate catalogue'}
                                                >
                                                    {catalog.is_active ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 align-middle text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openAssignModal(catalog)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                        title="Assign products"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 10-8 0v4M5 11h14l-1 9H6l-1-9z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 15h4" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => populateForm(catalog)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                        title="Edit catalogue"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2 2 0 112.828 2.828L8.828 17.177l-4 1.172 1.172-4 10.862-10.861z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteCatalog(catalog)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                                        title="Delete catalogue"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M10 11v6m4-6v6" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {catalogs.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-6 text-center text-xs uppercase tracking-[0.1em] text-slate-400"
                                            >
                                                No catalogues yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <aside className="rounded-2xl border border-slate-200 p-5">
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">
                                        {editingCatalog ? 'Update catalogue' : 'Create catalogue'}
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-400">
                                        Provide a descriptive name and optional slug. Toggle availability anytime.
                                    </p>
                                </div>

                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Name *</span>
                                    <input
                                        type="text"
                                        value={catalogForm.data.name}
                                        onChange={(event) => catalogForm.setData('name', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        required
                                    />
                                    {catalogForm.errors.name && (
                                        <span className="text-xs text-rose-500">{catalogForm.errors.name}</span>
                                    )}
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Slug</span>
                                    <input
                                        type="text"
                                        value={catalogForm.data.slug}
                                        onChange={(event) => catalogForm.setData('slug', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder="auto-generated if empty"
                                    />
                                    {catalogForm.errors.slug && (
                                        <span className="text-xs text-rose-500">{catalogForm.errors.slug}</span>
                                    )}
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Description</span>
                                    <textarea
                                        value={catalogForm.data.description}
                                        onChange={handleDescriptionChange}
                                        className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder="Optional notes about this collection…"
                                    />
                                    {catalogForm.errors.description && (
                                        <span className="text-xs text-rose-500">{catalogForm.errors.description}</span>
                                    )}
                                </label>

                                <label className="flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={catalogForm.data.is_active}
                                        onChange={(event) => catalogForm.setData('is_active', event.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                    <span>Active</span>
                                </label>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        disabled={catalogForm.processing}
                                    >
                                        {editingCatalog ? 'Update catalogue' : 'Add catalogue'}
                                    </button>
                                    {editingCatalog && (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </aside>
                    </div>
                </section>
            </div>

            <Modal show={Boolean(assigningCatalog)} onClose={closeAssignModal} maxWidth="2xl">
                <div className="space-y-6 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Assign products to {assigningCatalog?.name}
                            </h3>
                            <p className="text-sm text-slate-500">
                                Select one or more SKUs. Use filters to narrow the list, then save to sync assignments.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeAssignModal}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                            Close
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="search"
                            value={assignSearch}
                            onChange={(event) => setAssignSearch(event.target.value)}
                            className="flex-1 min-w-[160px] rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            placeholder="Search name or SKU…"
                        />
                        <select
                            value={assignBrand}
                            onChange={(event) => setAssignBrand(event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                            <option value="all">All brands</option>
                            {assignBrandOptions.map((brand) => (
                                <option key={brand} value={brand}>
                                    {brand}
                                </option>
                            ))}
                        </select>
                        <select
                            value={assignCategory}
                            onChange={(event) => setAssignCategory(event.target.value)}
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                            <option value="all">All categories</option>
                            {assignCategoryOptions.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={assignAllVisible}
                                className="rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-[0.1em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                            >
                                Select all visible
                            </button>
                            <button
                                type="button"
                                onClick={unassignAllVisible}
                                className="rounded-full border border-slate-200 px-3 py-1 font-semibold uppercase tracking-[0.1em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                            >
                                Deselect all visible
                            </button>
                        </div>
                        <span>
                            {assignSelection.length} selected / {filteredAssignableProducts.length} visible
                        </span>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto rounded-2xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-[0.1em] text-slate-500">
                                <tr>
                                    <th className="w-10 px-4 py-2 text-left">Select</th>
                                    <th className="px-4 py-2 text-left">Product</th>
                                    <th className="px-4 py-2 text-left">Brand</th>
                                    <th className="px-4 py-2 text-left">Category</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredAssignableProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-2 align-middle">
                                            <input
                                                type="checkbox"
                                                checked={assignSelection.includes(product.id)}
                                                onChange={() => toggleAssignSelection(product.id)}
                                                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            />
                                        </td>
                                        <td className="px-4 py-2 align-middle">
                                            <div className="font-medium text-slate-800">{product.name}</div>
                                            <div className="text-xs uppercase tracking-[0.1em] text-slate-400">{product.sku}</div>
                                        </td>
                                        <td className="px-4 py-2 align-middle text-slate-600">{product.brand ?? '—'}</td>
                                        <td className="px-4 py-2 align-middle text-slate-600">{product.category ?? '—'}</td>
                                    </tr>
                                ))}
                                {filteredAssignableProducts.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-6 text-center text-xs uppercase tracking-[0.1em] text-slate-400"
                                        >
                                            No products match the filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeAssignModal}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={saveAssignments}
                            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                        >
                            Save assignments
                        </button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}

