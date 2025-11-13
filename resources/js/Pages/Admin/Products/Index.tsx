import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type BrandList = Record<string, string>;
type CategoryList = Record<string, string>;

type Product = {
    id: number;
    name: string;
    sku: string;
    is_active: boolean;
    brand?: { name: string } | null;
    category?: { name: string } | null;
    variants_count: number;
};

type AdminProductsPageProps = AppPageProps<{
    products: {
        data: Product[];
        meta: {
            current_page: number;
            last_page: number;
            from: number | null;
            to: number | null;
            total: number;
            per_page: number;
        };
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    brands: BrandList;
    categories: CategoryList;
    filters: {
        search?: string | null;
        brand?: string | null;
        category?: string | null;
        status?: string | null;
    };
    perPageOptions: number[];
    perPage: number;
}>;

export default function AdminProductsIndex() {
    const { props } = usePage<AdminProductsPageProps>();
    const { products, brands, categories, filters, perPageOptions, perPage: initialPerPage } = props;

    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [filterState, setFilterState] = useState({
        search: filters.search ?? '',
        brand: filters.brand ?? 'all',
        category: filters.category ?? 'all',
        status: filters.status ?? 'all',
    });
    const [perPage, setPerPage] = useState(initialPerPage ?? products.meta?.per_page ?? 20);
    const [bulkBrand, setBulkBrand] = useState('');
    const [bulkCategory, setBulkCategory] = useState('');

    useEffect(() => {
        const existingIds = new Set(products.data.map((product) => product.id));
        setSelectedProducts((prev) => prev.filter((id) => existingIds.has(id)));
    }, [products.data]);

    useEffect(() => {
        setPerPage(initialPerPage ?? products.meta?.per_page ?? 20);
    }, [initialPerPage, products.meta?.per_page]);

    const allSelected = useMemo(() => {
        if (products.data.length === 0) {
            return false;
        }

        return selectedProducts.length === products.data.length;
    }, [products.data, selectedProducts]);

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(products.data.map((product) => product.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedProducts((prev) =>
            prev.includes(id) ? prev.filter((productId) => productId !== id) : [...prev, id]
        );
    };

    const applyFilters = (next: Partial<typeof filterState>) => {
        const merged = { ...filterState, ...next };
        setFilterState(merged);

        router.get(
            route('admin.products.index'),
            {
                search: merged.search || undefined,
                brand: merged.brand !== 'all' ? merged.brand : undefined,
                category: merged.category !== 'all' ? merged.category : undefined,
                status: merged.status !== 'all' ? merged.status : undefined,
                per_page: perPage,
            },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            },
        );
    };

    const handlePerPageChange = (value: number) => {
        setPerPage(value);
        router.get(
            route('admin.products.index'),
            {
                search: filterState.search || undefined,
                brand: filterState.brand !== 'all' ? filterState.brand : undefined,
                category: filterState.category !== 'all' ? filterState.category : undefined,
                status: filterState.status !== 'all' ? filterState.status : undefined,
                per_page: value,
            },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            },
        );
    };

    const ensureSelection = (callback: () => void) => {
        if (selectedProducts.length === 0) {
            alert('Select at least one product first.');
            return;
        }

        callback();
    };

    const bulkDelete = () => {
        ensureSelection(() => {
            if (!window.confirm(`Delete ${selectedProducts.length} product(s)?`)) {
                return;
            }

            router.delete(route('admin.products.bulk-destroy'), {
                data: { ids: selectedProducts },
                preserveScroll: true,
                onSuccess: () => setSelectedProducts([]),
            });
        });
    };

    const bulkStatus = (action: 'activate' | 'deactivate') => {
        ensureSelection(() => {
            router.post(
                route('admin.products.bulk-status'),
                {
                    ids: selectedProducts,
                    action,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => setSelectedProducts([]),
                },
            );
        });
    };

    const bulkAssignBrand = () => {
        ensureSelection(() => {
            if (!bulkBrand) {
                alert('Select a brand to assign.');
                return;
            }

            router.post(
                route('admin.products.bulk-brand'),
                {
                    ids: selectedProducts,
                    brand_id: Number(bulkBrand),
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setSelectedProducts([]);
                        setBulkBrand('');
                    },
                },
            );
        });
    };

    const bulkAssignCategory = () => {
        ensureSelection(() => {
            if (!bulkCategory) {
                alert('Select a category to assign.');
                return;
            }

            router.post(
                route('admin.products.bulk-category'),
                {
                    ids: selectedProducts,
                    category_id: Number(bulkCategory),
                },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setSelectedProducts([]);
                        setBulkCategory('');
                    },
                },
            );
        });
    };

    const duplicateProduct = (id: number) => {
        router.post(route('admin.products.copy', id), {}, {
            preserveScroll: true,
        });
    };

    const deleteProduct = (id: number) => {
        if (!window.confirm('Delete this product? This cannot be undone.')) {
            return;
        }

        router.delete(route('admin.products.destroy', id), {
            preserveScroll: true,
        });
    };

    const iconButton = (label: string, onClick: () => void, icon: JSX.Element) => (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            title={label}
        >
            {icon}
        </button>
    );

    const changePage = (url: string | null) => {
        if (!url) {
            return;
        }

        router.get(
            url,
            {
                search: filterState.search || undefined,
                brand: filterState.brand !== 'all' ? filterState.brand : undefined,
                category: filterState.category !== 'all' ? filterState.category : undefined,
                status: filterState.status !== 'all' ? filterState.status : undefined,
                per_page: perPage,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <AdminLayout>
            <Head title="Product Catalogue" />

            <div className="space-y-8">
                <section className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
                           
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                            <input
                                type="search"
                                value={filterState.search}
                                onChange={(event) => applyFilters({ search: event.target.value })}
                                placeholder="Search SKU or name"
                                className="rounded-2xl border border-slate-200 px-4 py-2"
                            />
                            <select
                                value={filterState.brand}
                                onChange={(event) => applyFilters({ brand: event.target.value })}
                                className="rounded-2xl border border-slate-200 px-4 py-2"
                            >
                                <option value="all">All brands</option>
                                {Object.entries(brands).map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filterState.category}
                                onChange={(event) => applyFilters({ category: event.target.value })}
                                className="rounded-2xl border border-slate-200 px-4 py-2"
                            >
                                <option value="all">All categories</option>
                                {Object.entries(categories).map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filterState.status}
                                onChange={(event) => applyFilters({ status: event.target.value })}
                                className="rounded-2xl border border-slate-200 px-4 py-2"
                            >
                                <option value="all">All statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </section>

                <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        {selectedProducts.length} selected
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                        <button
                            type="button"
                            onClick={() => bulkStatus('activate')}
                            disabled={selectedProducts.length === 0}
                            className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Enable
                        </button>
                        <button
                            type="button"
                            onClick={() => bulkStatus('deactivate')}
                            disabled={selectedProducts.length === 0}
                            className="rounded-full border border-amber-200 px-3 py-1 text-amber-600 transition hover:border-amber-300 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Disable
                        </button>
                        <div className="flex items-center gap-2">
                            <select
                                value={bulkBrand}
                                onChange={(event) => setBulkBrand(event.target.value)}
                                className="rounded-2xl border border-slate-200 px-3 py-1"
                            >
                                <option value="">Assign brand…</option>
                                {Object.entries(brands).map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={bulkAssignBrand}
                                className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                            >
                                Apply
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={bulkCategory}
                                onChange={(event) => setBulkCategory(event.target.value)}
                                className="rounded-2xl border border-slate-200 px-3 py-1"
                            >
                                <option value="">Assign category…</option>
                                {Object.entries(categories).map(([id, name]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={bulkAssignCategory}
                                className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                            >
                                Apply
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={bulkDelete}
                            disabled={selectedProducts.length === 0}
                            className="rounded-full border border-rose-200 px-3 py-1 text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Delete
                        </button>
                        <Link
                            href={route('admin.products.create')}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                            </svg>
                            New product
                        </Link>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-6 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        aria-label="Select all products"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left">SKU</th>
                                <th className="px-6 py-3 text-left">Product</th>
                                <th className="px-6 py-3 text-left">Brand</th>
                                <th className="px-6 py-3 text-left">Category</th>
                                <th className="px-6 py-3 text-left">Variants</th>
                                <th className="px-6 py-3 text-left">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {products.data.map((product) => (
                                <tr key={product.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.includes(product.id)}
                                            onChange={() => toggleSelection(product.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select product ${product.sku}`}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-800">{product.sku}</td>
                                    <td className="px-6 py-4 text-slate-700">
                                        <Link
                                            href={route('admin.products.edit', product.id)}
                                            className="font-medium text-sky-600 hover:text-sky-500"
                                        >
                                            {product.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{product.brand?.name ?? '—'}</td>
                                    <td className="px-6 py-4 text-slate-500">{product.category?.name ?? '—'}</td>
                                    <td className="px-6 py-4 text-slate-500">{product.variants_count}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                product.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={route('admin.products.edit', product.id)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                title="Edit product"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </Link>
                                            {iconButton(
                                                'Duplicate product',
                                                () => duplicateProduct(product.id),
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16h8a2 2 0 002-2V6H8a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 16V18a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h2" />
                                                </svg>,
                                            )}
                                            {iconButton(
                                                'Delete product',
                                                () => deleteProduct(product.id),
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>,
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">
                                        No products found. Start by adding your hero collections.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                        Showing {products.meta?.from ?? 0} to {products.meta?.to ?? 0} of {products.meta?.total ?? 0} entries
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {products.links.map((link, index) => {
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
        </AdminLayout>
    );
}

