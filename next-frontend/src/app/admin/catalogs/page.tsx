'use client';

import { Head } from '@/components/Head';
import { useEffect, useState, useMemo } from 'react';
import { adminService } from '@/services/adminService';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';
import { toastError } from '@/utils/toast';

type CatalogRow = {
    id: number;
    code: string | null;
    name: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
    products_count: number;
    product_ids?: number[];
};

type Product = {
    id: number;
    name: string;
    sku: string;
    selected: boolean;
};


export default function AdminCatalogsIndex() {
    const [loading, setLoading] = useState(true);
    const [catalogs, setCatalogs] = useState<{ data: CatalogRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCatalog, setEditingCatalog] = useState<CatalogRow | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<CatalogRow | null>(null);
    const [selectedCatalogs, setSelectedCatalogs] = useState<number[]>([]);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [formState, setFormState] = useState({
        code: '',
        name: '',
        description: '',
        is_active: true,
        display_order: 0 as number | '',
    });
    // Assign Products Modal state
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assigningCatalog, setAssigningCatalog] = useState<CatalogRow | null>(null);
    const [assignProducts, setAssignProducts] = useState<Product[]>([]);
    const [assignSelectedIds, setAssignSelectedIds] = useState<number[]>([]);
    const [assignSearchTerm, setAssignSearchTerm] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignProcessing, setAssignProcessing] = useState(false);

    useEffect(() => {
        loadCatalogs();
    }, [currentPage, perPage]);

    const loadCatalogs = async () => {
        setLoading(true);
        try {
            const response = await adminService.getCatalogs(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setCatalogs({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    code: item.code || null,
                    name: item.name,
                    description: item.description || null,
                    is_active: item.is_active,
                    display_order: item.display_order || 0,
                    products_count: item.products_count || 0,
                    product_ids: item.product_ids || [],
                })),
                meta: {
                    current_page: responseMeta.current_page || responseMeta.page || currentPage,
                    last_page: responseMeta.last_page || responseMeta.lastPage || 1,
                    total: responseMeta.total || 0,
                    per_page: responseMeta.per_page || responseMeta.perPage || perPage,
                    from: responseMeta.from,
                    to: responseMeta.to,
                    links: responseMeta.links || generatePaginationLinks(responseMeta.current_page || responseMeta.page || currentPage, responseMeta.last_page || responseMeta.lastPage || 1),
                },
            });
        } catch (error: any) {
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingCatalog(null);
        setModalOpen(false);
        setFormState({
            code: '',
            name: '',
            description: '',
            is_active: true,
            display_order: 0,
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (catalog: CatalogRow) => {
        setEditingCatalog(catalog);
        setFormState({
            code: catalog.code || '',
            name: catalog.name,
            description: catalog.description || '',
            is_active: catalog.is_active,
            display_order: catalog.display_order || 0,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                code: formState.code,
                name: formState.name,
                description: formState.description || null,
                is_active: formState.is_active,
                display_order: Number(formState.display_order) || 0,
            };

            if (editingCatalog) {
                await adminService.updateCatalog(editingCatalog.id, payload);
            } else {
                await adminService.createCatalog(payload);
            }
            resetForm();
            await loadCatalogs();
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to save catalog. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleCatalog = async (catalog: CatalogRow) => {
        try {
            await adminService.updateCatalog(catalog.id, {
                code: catalog.code || '',
                name: catalog.name,
                description: catalog.description || null,
                is_active: !catalog.is_active,
                display_order: catalog.display_order,
            });
            await loadCatalogs();
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to toggle catalog. Please try again.');
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedCatalogs((prev) =>
            prev.includes(id) ? prev.filter((catalogId) => catalogId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedCatalogs.length === catalogs.data.length) {
            setSelectedCatalogs([]);
        } else {
            setSelectedCatalogs(catalogs.data.map((catalog) => catalog.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedCatalogs.length === 0) {
            return;
        }
        try {
            await adminService.bulkDeleteCatalogs(selectedCatalogs);
            setSelectedCatalogs([]);
            setBulkDeleteConfirm(false);
            await loadCatalogs();
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to delete catalogs. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteCatalog(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadCatalogs();
            } catch (error: any) {
                toastError(error.response?.data?.message || 'Failed to delete catalog. Please try again.');
            }
        }
    };

    // Assign Products Modal functions
    const openAssignModal = async (catalog: CatalogRow) => {
        setAssigningCatalog(catalog);
        setAssignSearchTerm('');
        setAssignLoading(true);
        setAssignModalOpen(true);
        try {
            const response = await adminService.getAssignProducts(catalog.id);
            const data = response.data;
            setAssignProducts(data.products || []);
            setAssignSelectedIds(data.selectedProductIds || []);
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to load products. Please try again.');
            setAssignModalOpen(false);
        } finally {
            setAssignLoading(false);
        }
    };

    const closeAssignModal = () => {
        setAssignModalOpen(false);
        setAssigningCatalog(null);
        setAssignProducts([]);
        setAssignSelectedIds([]);
        setAssignSearchTerm('');
    };

    const filteredAssignProducts = useMemo(() => {
        if (!assignSearchTerm.trim()) {
            return assignProducts;
        }
        const search = assignSearchTerm.toLowerCase();
        return assignProducts.filter(
            (product) =>
                product.name.toLowerCase().includes(search) ||
                product.sku.toLowerCase().includes(search)
        );
    }, [assignProducts, assignSearchTerm]);

    const visibleSelectedCount = useMemo(() => {
        return filteredAssignProducts.filter((p) => assignSelectedIds.includes(p.id)).length;
    }, [filteredAssignProducts, assignSelectedIds]);

    const allVisibleSelected = useMemo(() => {
        if (filteredAssignProducts.length === 0) return false;
        return filteredAssignProducts.every((p) => assignSelectedIds.includes(p.id));
    }, [filteredAssignProducts, assignSelectedIds]);

    const toggleAssignProduct = (productId: number) => {
        setAssignSelectedIds((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    };

    const selectAllVisible = () => {
        const visibleIds = filteredAssignProducts.map((p) => p.id);
        setAssignSelectedIds((prev) => {
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
        const visibleIds = filteredAssignProducts.map((p) => p.id);
        setAssignSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    };

    const handleAssignSearch = async () => {
        if (!assigningCatalog) return;
        setAssignLoading(true);
        try {
            const response = await adminService.getAssignProducts(assigningCatalog.id, assignSearchTerm);
            const data = response.data;
            setAssignProducts(data.products || []);
            // Preserve selections
            setAssignSelectedIds((prev) => {
                const newIds = [...prev];
                data.selectedProductIds?.forEach((id: number) => {
                    if (!newIds.includes(id)) {
                        newIds.push(id);
                    }
                });
                return newIds;
            });
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to search products. Please try again.');
        } finally {
            setAssignLoading(false);
        }
    };

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assigningCatalog) return;
        
        setAssignProcessing(true);
        try {
            await adminService.assignProducts(assigningCatalog.id, assignSelectedIds);
            closeAssignModal();
            await loadCatalogs();
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to assign products. Please try again.');
        } finally {
            setAssignProcessing(false);
        }
    };

    return (
        <>
            <Head title="Catalogs" />
            <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Catalogs</h1>
                        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-500">Manage product catalogs for organizing products.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-slate-900 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New catalog
                    </button>
                </div>
                <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-3 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm">
                        <div className="font-semibold text-slate-700">
                            Catalogs ({catalogs.meta.total})
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500">
                            <span>{selectedCatalogs.length} selected</span>
                            <button
                                type="button"
                                onClick={() => setBulkDeleteConfirm(true)}
                                disabled={selectedCatalogs.length === 0}
                                className="inline-flex items-center rounded-full border border-rose-200 px-2.5 py-1 sm:px-3 sm:py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Bulk delete
                            </button>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <span>Per page:</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="rounded-full border border-slate-200 px-2 py-1 sm:px-3 sm:py-1 text-[10px] sm:text-xs"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 sm:py-16">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                        </div>
                    ) : catalogs.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-xs sm:text-sm text-slate-500">
                            <p>No catalogs found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                                <thead className="bg-slate-50 text-[10px] sm:text-xs text-slate-500">
                                    <tr>
                                        <th className="px-2 py-2 sm:px-5 sm:py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedCatalogs.length === catalogs.data.length && catalogs.data.length > 0}
                                                onChange={toggleSelectAll}
                                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                aria-label="Select all catalogs"
                                            />
                                        </th>
                                        <th className="px-2 py-2 sm:px-5 sm:py-3 text-left">Code</th>
                                        <th className="px-2 py-2 sm:px-5 sm:py-3 text-left">Name</th>
                                        <th className="px-2 py-2 sm:px-5 sm:py-3 text-left hidden md:table-cell">Products</th>
                                        <th className="px-2 py-2 sm:px-5 sm:py-3 text-left hidden lg:table-cell">Order</th>
                                        <th className="px-2 py-2 sm:px-5 sm:py-3 text-left">Status</th>
                                        <th className="px-2 py-2 sm:px-5 sm:py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {catalogs.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-2 py-4 sm:px-5 sm:py-6 text-center text-[10px] sm:text-xs lg:text-sm text-slate-500">
                                                No catalogs defined yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        catalogs.data.map((catalog) => (
                                            <tr key={catalog.id} className="hover:bg-slate-50">
                                                <td className="px-2 py-2 sm:px-5 sm:py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCatalogs.includes(catalog.id)}
                                                        onChange={() => toggleSelection(catalog.id)}
                                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                        aria-label={`Select catalog ${catalog.name}`}
                                                    />
                                                </td>
                                                <td className="px-2 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm text-slate-700">{catalog.code || '-'}</td>
                                                <td className="px-2 py-2 sm:px-5 sm:py-3 font-semibold text-xs sm:text-sm text-slate-900">
                                                    <div className="flex flex-col gap-0.5 sm:gap-1">
                                                        <span>{catalog.name}</span>
                                                        {catalog.description && <span className="text-[10px] sm:text-xs text-slate-500">{catalog.description}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm text-slate-500 hidden md:table-cell">{catalog.products_count}</td>
                                                <td className="px-2 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm text-slate-500 hidden lg:table-cell">{catalog.display_order}</td>
                                                <td className="px-2 py-2 sm:px-5 sm:py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold ${
                                                        catalog.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {catalog.is_active ? 'Active' : 'Archived'}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-2 sm:px-5 sm:py-3 text-right">
                                                    <div className="flex justify-end gap-1 sm:gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openAssignModal(catalog)}
                                                            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-sky-200 hover:text-sky-600"
                                                            title="Assign products"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(catalog)}
                                                            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                            title="Edit catalog"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCatalog(catalog)}
                                                            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                                            title={catalog.is_active ? 'Pause catalog' : 'Activate catalog'}
                                                        >
                                                            {catalog.is_active ? (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                                                </svg>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteConfirm(catalog)}
                                                            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                            title="Delete catalog"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <Pagination 
                    meta={catalogs.meta} 
                    onPageChange={setCurrentPage} 
                />

                <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-3 py-3 sm:px-6 sm:py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 truncate pr-2">
                                    {editingCatalog ? `Edit catalog: ${editingCatalog.name}` : 'Create new catalog'}
                                </h2>
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 sm:flex-none rounded-full border border-slate-300 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="catalog-form"
                                        disabled={loading}
                                        className="flex-1 sm:flex-none rounded-full bg-slate-900 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {editingCatalog ? 'Update' : 'Create'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600 flex-shrink-0"
                                        aria-label="Close modal"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" id="catalog-form">
                                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="grid gap-3 sm:gap-4">
                                            <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                                                <span>Code <span className="text-rose-500">*</span></span>
                                                <input
                                                    type="text"
                                                    value={formState.code}
                                                    onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                                                    className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 sm:py-2"
                                                    placeholder="e.g., CAT001"
                                                    required
                                                />
                                            </label>
                                            <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                                                <span>Name <span className="text-rose-500">*</span></span>
                                                <input
                                                    type="text"
                                                    value={formState.name}
                                                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                                    className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 sm:py-2"
                                                    required
                                                />
                                            </label>
                                            <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                                                <span>Display order <span className="text-rose-500">*</span></span>
                                                <input
                                                    type="number"
                                                    value={formState.display_order}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormState({ ...formState, display_order: value === '' ? '' : Number(value) });
                                                    }}
                                                    onBlur={(e) => {
                                                        if (e.target.value === '') {
                                                            setFormState({ ...formState, display_order: 0 });
                                                        }
                                                    }}
                                                    onFocus={(e) => {
                                                        if (e.target.value === '0') {
                                                            e.target.select();
                                                        }
                                                    }}
                                                    className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 sm:py-2"
                                                    min={0}
                                                    required
                                                />
                                            </label>
                                        </div>

                                        <label className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={formState.is_active}
                                                onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
                                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            />
                                            Active for selection
                                        </label>
                                    </div>

                                    <div className="space-y-4 sm:space-y-6">
                                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                                            <span>Description</span>
                                            <textarea
                                                value={formState.description}
                                                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                                                className="min-h-[140px] sm:min-h-[160px] lg:min-h-[200px] rounded-lg sm:rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 sm:py-2"
                                                placeholder="Optional description for this catalog."
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
                    title="Remove Catalog"
                    message={deleteConfirm ? `Are you sure you want to remove catalog ${deleteConfirm.name}?` : ''}
                    confirmText="Remove"
                    variant="danger"
                />

                <ConfirmationModal
                    show={bulkDeleteConfirm}
                    onClose={() => setBulkDeleteConfirm(false)}
                    onConfirm={handleBulkDelete}
                    title="Delete Catalogs"
                    message={`Are you sure you want to delete ${selectedCatalogs.length} selected catalog(s)?`}
                    confirmText="Delete"
                    variant="danger"
                />

                {/* Assign Products Modal */}
                <Modal show={assignModalOpen} onClose={closeAssignModal} maxWidth="6xl">
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-3 py-3 sm:px-6 sm:py-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 truncate">
                                        Assign products to {assigningCatalog?.name}!
                                    </h2>
                                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                        Select one or more SKUs. Use filters to narrow the list, then save to sync assignments.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeAssignModal}
                                    className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600 flex-shrink-0"
                                    aria-label="Close modal"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
                            <form onSubmit={handleAssignSubmit} className="space-y-3 sm:space-y-4">
                                {/* Search and Filters */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={assignSearchTerm}
                                            onChange={(e) => setAssignSearchTerm(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAssignSearch();
                                                }
                                            }}
                                            placeholder="Search name or SKU..."
                                            className="w-full rounded-lg sm:rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 sm:py-2"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAssignSearch}
                                        disabled={assignLoading}
                                        className="rounded-full bg-slate-900 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {assignLoading ? 'Searching...' : 'Search'}
                                    </button>
                                </div>

                                {/* Select All / Deselect All */}
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        <button
                                            type="button"
                                            onClick={selectAllVisible}
                                            className="rounded-full border border-slate-300 px-3 py-1.5 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                        >
                                            Select all visible
                                        </button>
                                        <button
                                            type="button"
                                            onClick={deselectAllVisible}
                                            className="rounded-full border border-slate-300 px-3 py-1.5 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                        >
                                            Deselect all visible
                                        </button>
                                    </div>
                                    <div className="text-xs sm:text-sm text-slate-600">
                                        <span className="font-semibold">{visibleSelectedCount}</span> selected /{' '}
                                        <span className="font-semibold">{filteredAssignProducts.length}</span> visible
                                    </div>
                                </div>

                                {/* Products Table */}
                                {assignLoading ? (
                                    <div className="flex items-center justify-center py-12 sm:py-16">
                                        <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200">
                                        <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                                            <thead className="bg-slate-50 text-[10px] sm:text-xs text-slate-500">
                                                <tr>
                                                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-left">
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
                                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                            aria-label="Select all visible products"
                                                        />
                                                    </th>
                                                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-left">Product</th>
                                                    <th className="px-2 py-2 sm:px-4 sm:py-3 text-left">SKU</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {filteredAssignProducts.map((product) => {
                                                    const isSelected = assignSelectedIds.includes(product.id);
                                                    return (
                                                        <tr key={product.id} className="hover:bg-slate-50">
                                                            <td className="px-2 py-2 sm:px-4 sm:py-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleAssignProduct(product.id)}
                                                                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                    aria-label={`Select ${product.name}`}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-slate-900">
                                                                {product.name}
                                                            </td>
                                                            <td className="px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">{product.sku}</td>
                                                        </tr>
                                                    );
                                                })}
                                                {filteredAssignProducts.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-2 py-4 sm:px-4 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                                            No products found matching your search.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t border-slate-200 pt-3 sm:pt-4">
                                    <button
                                        type="button"
                                        onClick={closeAssignModal}
                                        className="flex-1 sm:flex-none rounded-full border border-slate-300 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={assignProcessing}
                                        className="flex-1 sm:flex-none rounded-full bg-slate-900 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {assignProcessing ? 'Saving...' : 'Save assignments'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    );
}
