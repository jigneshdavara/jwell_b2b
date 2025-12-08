import Modal from '@/Components/Modal';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type Product = {
    id: number;
    name: string;
    sku: string;
    selected: boolean;
};

type AssignProductsPageProps = PageProps<{
    catalog: {
        id: number;
        name: string;
    };
    products: Product[];
    selectedProductIds: number[];
    filters: {
        search: string;
    };
}>;

export default function AssignProducts({ catalog, products, selectedProductIds: initialSelectedIds, filters: initialFilters }: AssignProductsPageProps) {
    const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>(initialSelectedIds);
    const [modalOpen, setModalOpen] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Filter products based on search
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) {
            return products;
        }
        const search = searchTerm.toLowerCase();
        return products.filter(
            (product) =>
                product.name.toLowerCase().includes(search) ||
                product.sku.toLowerCase().includes(search)
        );
    }, [products, searchTerm]);

    const visibleSelectedCount = useMemo(() => {
        return filteredProducts.filter((p) => selectedProductIds.includes(p.id)).length;
    }, [filteredProducts, selectedProductIds]);

    const allVisibleSelected = useMemo(() => {
        if (filteredProducts.length === 0) return false;
        return filteredProducts.every((p) => selectedProductIds.includes(p.id));
    }, [filteredProducts, selectedProductIds]);

    const toggleProduct = (productId: number) => {
        setSelectedProductIds((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    const selectAllVisible = () => {
        const visibleIds = filteredProducts.map((p) => p.id);
        setSelectedProductIds((prev) => {
            const newIds = [...prev];
            visibleIds.forEach((id) => {
                if (!newIds.includes(id)) {
                    newIds.push(id);
                }
            });
            return newIds;
        });
    };

    const deselectAllVisible = () => {
        const visibleIds = filteredProducts.map((p) => p.id);
        setSelectedProductIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    };

    const handleSearch = () => {
        router.get(
            route('admin.catalogs.assign-products', catalog.id),
            { search: searchTerm },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        setProcessing(true);
        setErrors({});
        
        // Debug: Log what we're sending
        console.log('Submitting product IDs:', selectedProductIds);
        
        // Submit directly using router.post with the current selections
        router.post(
            route('admin.catalogs.assign-products.store', catalog.id),
            { product_ids: selectedProductIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    router.visit(route('admin.catalogs.index'));
                },
                onError: (pageErrors) => {
                    setProcessing(false);
                    setErrors(pageErrors);
                    console.error('Form submission errors:', pageErrors);
                },
            }
        );
    };

    const handleClose = () => {
        setModalOpen(false);
        router.visit(route('admin.catalogs.index'));
    };

    return (
        <AdminLayout>
            <Head title={`Assign products to ${catalog.name}`} />

            <Modal show={modalOpen} onClose={handleClose} maxWidth="6xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Assign products to {catalog.name}!
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Select one or more SKUs. Use filters to narrow the list, then save to sync assignments.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                                aria-label="Close modal"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Search and Filters */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSearch();
                                            }
                                        }}
                                        placeholder="Search name or SKU..."
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                                >
                                    Search
                                </button>
                            </div>

                            {/* Select All / Deselect All */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={selectAllVisible}
                                        className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                    >
                                        Select all visible
                                    </button>
                                    <button
                                        type="button"
                                        onClick={deselectAllVisible}
                                        className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                    >
                                        Deselect all visible
                                    </button>
                                </div>
                                <div className="text-sm text-slate-600">
                                    <span className="font-semibold">{visibleSelectedCount}</span> selected /{' '}
                                    <span className="font-semibold">{filteredProducts.length}</span> visible
                                </div>
                            </div>

                            {/* Products Table */}
                            <div className="overflow-hidden rounded-2xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={allVisibleSelected}
                                                    onChange={() => {
                                                        if (allVisibleSelected) {
                                                            deselectAllVisible();
                                                        } else {
                                                            selectAllVisible();
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                    aria-label="Select all visible products"
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left">Product</th>
                                            <th className="px-4 py-3 text-left">SKU</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {filteredProducts.map((product) => {
                                            const isSelected = selectedProductIds.includes(product.id);
                                            return (
                                                <tr key={product.id} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleProduct(product.id)}
                                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                            aria-label={`Select ${product.name}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-slate-900">
                                                        {product.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                                                </tr>
                                            );
                                        })}
                                        {filteredProducts.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                                                    No products found matching your search.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Form Errors */}
                            {errors.product_ids && (
                                <div className="text-xs text-rose-500">{errors.product_ids}</div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? 'Saving...' : 'Save assignments'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}

