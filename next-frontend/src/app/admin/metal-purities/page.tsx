'use client';

import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';
import { toastError } from '@/utils/toast';

type MetalPurityRow = {
    id: number;
    metal_id: number;
    metal: { id: number; name: string } | null;
    code: string;
    name: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
};

type MetalOption = {
    id: number;
    name: string;
};


export default function AdminMetalPuritiesIndex() {
    const [loading, setLoading] = useState(true);
    const [purities, setPurities] = useState<{ data: MetalPurityRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });
    const [metals, setMetals] = useState<MetalOption[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPurity, setEditingPurity] = useState<MetalPurityRow | null>(null);
    const [selectedPurities, setSelectedPurities] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<MetalPurityRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const [formData, setFormData] = useState({
        metal_id: '',
        code: '',
        name: '',
        description: '',
        is_active: true,
        display_order: 0,
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadPurities();
        loadMetals();
    }, [currentPage, perPage]);

    const loadMetals = async () => {
        try {
            const response = await adminService.getMetals(1, 1000);
            const items = response.data.items || response.data.data || [];
            setMetals(items.map((item: any) => ({
                id: Number(item.id),
                name: item.name,
            })));
        } catch (error: any) {
            console.error('Failed to load metals:', error);
        }
    };

    const loadPurities = async () => {
        setLoading(true);
        try {
            const response = await adminService.getMetalPurities(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setPurities({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    metal_id: Number(item.metal_id),
                    metal: item.metal ? { id: Number(item.metal.id), name: item.metal.name } : null,
                    code: item.code,
                    name: item.name,
                    description: item.description || null,
                    is_active: item.is_active,
                    display_order: item.display_order || 0,
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
            console.error('Failed to load metal purities:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetFormAndModal = () => {
        setEditingPurity(null);
        setModalOpen(false);
        setFormData({
            metal_id: '',
            code: '',
            name: '',
            description: '',
            is_active: true,
            display_order: 0,
        });
    };

    const openCreateModal = () => {
        resetFormAndModal();
        setModalOpen(true);
    };

    const openEditModal = (purity: MetalPurityRow) => {
        setEditingPurity(purity);
        setFormData({
            metal_id: String(purity.metal_id),
            code: purity.code,
            name: purity.name,
            description: purity.description || '',
            is_active: purity.is_active,
            display_order: purity.display_order,
        });
        setModalOpen(true);
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        try {
            const payload = {
                metal_id: Number(formData.metal_id),
                code: formData.code,
                name: formData.name,
                description: formData.description || null,
                is_active: formData.is_active,
                display_order: Number(formData.display_order) || 0,
            };

            if (editingPurity) {
                await adminService.updateMetalPurity(editingPurity.id, payload);
            } else {
                await adminService.createMetalPurity(payload);
            }
            resetFormAndModal();
            await loadPurities();
        } catch (error: any) {
            console.error('Failed to save metal purity:', error);
            toastError(error.response?.data?.message || 'Failed to save metal purity. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const togglePurity = async (purity: MetalPurityRow) => {
        try {
            await adminService.updateMetalPurity(purity.id, {
                metal_id: purity.metal_id,
                code: purity.code,
                name: purity.name,
                description: purity.description || null,
                is_active: !purity.is_active,
                display_order: purity.display_order,
            });
            await loadPurities();
        } catch (error: any) {
            console.error('Failed to toggle metal purity status:', error);
            toastError(error.response?.data?.message || 'Failed to update metal purity. Please try again.');
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedPurities((prev) =>
            prev.includes(id) ? prev.filter((purityId) => purityId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedPurities.length === purities.data.length) {
            setSelectedPurities([]);
        } else {
            setSelectedPurities(purities.data.map((purity) => purity.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedPurities.length === 0) {
            return;
        }
        try {
            await adminService.bulkDeleteMetalPurities(selectedPurities);
            setSelectedPurities([]);
            setBulkDeleteConfirm(false);
            await loadPurities();
        } catch (error: any) {
            console.error('Failed to delete metal purities:', error);
            toastError(error.response?.data?.message || 'Failed to delete metal purities. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteMetalPurity(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadPurities();
            } catch (error: any) {
                console.error('Failed to delete metal purity:', error);
                toastError(error.response?.data?.message || 'Failed to delete metal purity. Please try again.');
            }
        }
    };

    return (
        <>
            <Head title="Metal Purities" />
            <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Metal purities</h1>
                        <p className="mt-2 text-xs sm:text-sm text-slate-500">Manage metal purity grades for catalogue specifications.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New purity
                    </button>
                </div>
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 px-3 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm">
                        <div className="font-semibold text-slate-700">
                            Purities ({purities.meta.total})
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500">
                            <span>{selectedPurities.length} selected</span>
                            <button
                                type="button"
                                onClick={() => setBulkDeleteConfirm(true)}
                                disabled={selectedPurities.length === 0}
                                className="inline-flex items-center rounded-full border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
                            >
                                Bulk delete
                            </button>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs focus:ring-0 sm:px-3"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    {loading && purities.data.length === 0 ? (
                        <div className="flex items-center justify-center py-8 sm:py-12">
                            <p className="text-xs sm:text-sm text-slate-500">Loading metal purities...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500">
                                <tr>
                                        <th className="px-3 py-2 sm:px-5 sm:py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedPurities.length === purities.data.length && purities.data.length > 0}
                                            onChange={toggleSelectAll}
                                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label="Select all metal purities"
                                        />
                                    </th>
                                        <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Metal</th>
                                        <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Code</th>
                                        <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Purity name</th>
                                        <th className="px-3 py-2 text-left hidden lg:table-cell sm:px-5 sm:py-3">Order</th>
                                        <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Status</th>
                                        <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {purities.data.length === 0 ? (
                                    <tr>
                                            <td colSpan={7} className="px-3 py-4 sm:px-5 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                            No metal purities defined yet.
                                        </td>
                                    </tr>
                                ) : (
                                    purities.data.map((purity) => (
                                        <tr key={purity.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 sm:px-5 sm:py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPurities.includes(purity.id)}
                                                    onChange={() => toggleSelection(purity.id)}
                                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                    aria-label={`Select metal purity ${purity.name}`}
                                                />
                                            </td>
                                                <td className="px-3 py-2 font-medium text-slate-700 sm:px-5 sm:py-3">
                                                {purity.metal?.name ?? '—'}
                                            </td>
                                                <td className="px-3 py-2 text-slate-700 sm:px-5 sm:py-3">{purity.code || '-'}</td>
                                                <td className="px-3 py-2 font-semibold text-slate-900 sm:px-5 sm:py-3">
                                                <div className="flex flex-col gap-1">
                                                        <span className="text-xs sm:text-sm">{purity.name}</span>
                                                        {purity.description && <span className="text-[10px] sm:text-xs text-slate-500">{purity.description}</span>}
                                                </div>
                                            </td>
                                                <td className="px-3 py-2 text-slate-500 hidden lg:table-cell sm:px-5 sm:py-3">{purity.display_order}</td>
                                                <td className="px-3 py-2 sm:px-5 sm:py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs font-semibold ${
                                                    purity.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {purity.is_active ? 'Active' : 'Archived'}
                                                </span>
                                            </td>
                                                <td className="px-3 py-2 text-right sm:px-5 sm:py-3">
                                                    <div className="flex justify-end gap-1.5 sm:gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(purity)}
                                                            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                        title="Edit purity"
                                                    >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePurity(purity)}
                                                            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                                        title={purity.is_active ? 'Pause purity' : 'Activate purity'}
                                                    >
                                                        {purity.is_active ? (
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
                                                        onClick={() => setDeleteConfirm(purity)}
                                                            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                        title="Delete purity"
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
                    meta={purities.meta} 
                    onPageChange={setCurrentPage} 
                />

                <Modal show={modalOpen} onClose={resetFormAndModal} maxWidth="5xl">
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-3 py-2.5 sm:px-6 sm:py-4">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-sm sm:text-base lg:text-xl font-semibold text-slate-900 truncate">
                                    {editingPurity ? `Edit metal purity: ${editingPurity.name}` : 'Create new metal purity'}
                                </h2>
                                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={resetFormAndModal}
                                        className="rounded-full border border-slate-300 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="purity-form"
                                        disabled={processing}
                                        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {editingPurity ? 'Update' : 'Create'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetFormAndModal}
                                        className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                                        aria-label="Close modal"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4">
                            <form onSubmit={submit} className="space-y-4 sm:space-y-6" id="purity-form">
                                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="grid gap-3 sm:gap-4">
                                            <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                                <span>Metal <span className="text-rose-500">*</span></span>
                                                <select
                                                    value={formData.metal_id}
                                                    onChange={(e) => setFormData({ ...formData, metal_id: e.target.value })}
                                                    className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                                    required
                                                >
                                                    <option value="">Select a metal</option>
                                                    {metals.map((metal) => (
                                                        <option key={metal.id} value={metal.id}>
                                                            {metal.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                                <span>Code <span className="text-rose-500">*</span></span>
                                                <input
                                                    type="text"
                                                    value={formData.code}
                                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                    className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                                    placeholder="e.g., 18K, 22K, 925"
                                                    required
                                                />
                                            </label>
                                            <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                                <span>Purity name <span className="text-rose-500">*</span></span>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                                    placeholder="e.g. 18K, 22K, 925"
                                                    required
                                                />
                                            </label>
                                            <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                                <span>Display order <span className="text-rose-500">*</span></span>
                                                <input
                                                    type="number"
                                                    value={formData.display_order === 0 ? '' : formData.display_order}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setFormData({ ...formData, display_order: value === '' ? 0 : Number(value) });
                                                    }}
                                                    onBlur={(e) => {
                                                        if (e.target.value === '') {
                                                            setFormData({ ...formData, display_order: 0 });
                                                        }
                                                    }}
                                                    onFocus={(e) => {
                                                        if (e.target.value === '0') {
                                                            e.target.select();
                                                        }
                                                    }}
                                                    className="rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                                    min={0}
                                                    required
                                                />
                                            </label>
                                        </div>

                                        <label className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            />
                                            Active for selection
                                        </label>
                                    </div>

                                    <div className="space-y-4 sm:space-y-6">
                                        <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                                            <span>Description</span>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="min-h-[140px] sm:min-h-[160px] lg:min-h-[200px] rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                                placeholder="Optional notes for team (e.g. usage, category)."
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
                    title="Remove Metal Purity"
                    message={deleteConfirm ? `Are you sure you want to remove metal purity ${deleteConfirm.name}?` : ''}
                    confirmText="Remove"
                    variant="danger"
                />

                <ConfirmationModal
                    show={bulkDeleteConfirm}
                    onClose={() => setBulkDeleteConfirm(false)}
                    onConfirm={handleBulkDelete}
                    title="Delete Metal Purities"
                    message={`Are you sure you want to delete ${selectedPurities.length} selected metal purity(ies)?`}
                    confirmText="Delete"
                    variant="danger"
                />
            </div>
        </>
    );
}
