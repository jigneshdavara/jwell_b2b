'use client';

import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { toastError } from '@/utils/toast';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';

type TaxRow = {
    id: number;
    name: string;
    code: string;
    rate: number;
    description?: string | null;
    is_active: boolean;
    tax_group: {
        id: number;
        name: string;
    } | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type TaxOption = {
    id: number;
    name: string;
};

export default function AdminTaxesIndex() {
    const [loading, setLoading] = useState(true);
    const [allTaxes, setAllTaxes] = useState<TaxRow[]>([]);
    const [taxGroups, setTaxGroups] = useState<TaxOption[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({ 
        current_page: 1, 
        last_page: 1, 
        total: 0, 
        per_page: 20,
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<TaxRow | null>(null);
    const [perPage, setPerPage] = useState(20);
    const [deleteConfirm, setDeleteConfirm] = useState<TaxRow | null>(null);

    const [formData, setFormData] = useState({
        tax_group_id: '',
        name: '',
        code: '',
        rate: 0,
        description: '',
        is_active: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadTaxes(1, perPage);
        loadTaxGroups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadTaxes = async (page: number = 1, newPerPage: number = perPage) => {
        setLoading(true);
        try {
            const response = await adminService.getTaxes(page, newPerPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { 
                current_page: 1, 
                last_page: 1, 
                total: 0, 
                per_page: newPerPage,
            };
            
            setAllTaxes(items.map((item: any) => ({
                id: Number(item.id),
                name: item.name,
                code: item.code,
                rate: Number(item.rate),
                description: item.description,
                is_active: item.is_active,
                tax_group: item.tax_group ? { id: Number(item.tax_group.id), name: item.tax_group.name } : null,
                created_at: item.created_at,
                updated_at: item.updated_at,
            })));
            const currentPageNum = responseMeta.current_page || responseMeta.page || 1;
            const totalPages = responseMeta.last_page || responseMeta.lastPage || 1;
            const total = responseMeta.total || 0;
            const perPageNum = responseMeta.per_page || responseMeta.perPage || newPerPage;
            
            // Calculate from and to
            const from = total > 0 ? (currentPageNum - 1) * perPageNum + 1 : undefined;
            const to = total > 0 ? Math.min(currentPageNum * perPageNum, total) : undefined;

            const paginationMeta: PaginationMeta = {
                current_page: currentPageNum,
                last_page: totalPages,
                total: total,
                per_page: perPageNum,
                from: from,
                to: to,
            };

            // Generate pagination links
            const generatedLinks = generatePaginationLinks(currentPageNum, totalPages);
            paginationMeta.links = generatedLinks;

            setMeta(paginationMeta);
        } catch (error: any) {
            console.error('Failed to load taxes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTaxGroups = async () => {
        try {
            const response = await adminService.getTaxGroups(1, 100);
            const items = response.data.items || response.data.data || [];
            setTaxGroups(items.map((item: any) => ({ id: Number(item.id), name: item.name })));
        } catch (error: any) {
            console.error('Failed to load tax groups:', error);
        }
    };

    const resetForm = () => {
        setEditingTax(null);
        setModalOpen(false);
        setFormData({ 
            tax_group_id: '', 
            name: '', 
            code: '', 
            rate: 0, 
            description: '', 
            is_active: true 
        });
        setErrors({});
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (tax: TaxRow) => {
        setEditingTax(tax);
        setFormData({
            tax_group_id: tax.tax_group?.id.toString() ?? '',
            name: tax.name,
            code: tax.code,
            rate: tax.rate,
            description: tax.description ?? '',
            is_active: tax.is_active,
        });
        setModalOpen(true);
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});
        try {
            const payload = {
                tax_group_id: formData.tax_group_id ? Number(formData.tax_group_id) : null,
                name: formData.name,
                code: formData.code,
                rate: formData.rate,
                description: formData.description || null,
                is_active: formData.is_active,
            };

            if (editingTax) {
                await adminService.updateTax(editingTax.id, payload);
            } else {
                await adminService.createTax(payload);
            }
            resetForm();
            await loadTaxes(meta.current_page, perPage);
        } catch (error: any) {
            console.error('Failed to save tax:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: error.response?.data?.message || 'Failed to save tax. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    const deleteTax = (tax: TaxRow) => {
        setDeleteConfirm(tax);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteTax(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadTaxes(meta.current_page, perPage);
            } catch (error: any) {
                console.error('Failed to delete tax:', error);
                toastError(error.response?.data?.message || 'Failed to delete tax. Please try again.');
            }
        }
    };

    const handlePageChange = (page: number) => {
        loadTaxes(page, perPage);
    };

    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        loadTaxes(1, newPerPage);
    };

    return (
        <>
            <Head title="Taxes" />

            <div className="space-y-6 px-1 py-4 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Taxes</h1>
                        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                            Manage tax rates and assign them to tax groups.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-elvee-blue px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy w-full sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New tax
                    </button>
                </div>

                <div className="overflow-x-auto rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-b border-slate-200 px-3 py-2.5 text-xs sm:px-5 sm:py-4 sm:text-sm">
                        <div className="font-semibold text-slate-700">
                            Taxes ({meta.total})
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={handlePerPageChange}
                                className="rounded-full border border-slate-200 px-2 py-1 text-[10px] focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 sm:px-3 sm:text-xs"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                        <thead className="bg-slate-50 text-[10px] sm:text-xs text-slate-500">
                            <tr>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Name</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Code</th>
                                <th className="hidden px-3 py-2 text-left sm:table-cell sm:px-5 sm:py-3">Tax Group</th>
                                <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Rate</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Status</th>
                                <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {allTaxes.map((tax) => (
                                <tr key={tax.id} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 font-semibold text-slate-900 text-xs sm:px-5 sm:py-3 sm:text-sm">
                                        {tax.name}
                                        {/* Mobile-only display for hidden columns */}
                                        <div className="mt-0.5 block sm:hidden text-[9px] text-slate-500">
                                            <span className="font-medium">Group:</span> {tax.tax_group?.name ?? '—'}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-slate-500 text-xs sm:px-5 sm:py-3 sm:text-sm">{tax.code}</td>
                                    <td className="hidden px-3 py-2 text-slate-500 sm:table-cell sm:px-5 sm:py-3 text-xs sm:text-sm">{tax.tax_group?.name ?? '—'}</td>
                                    <td className="px-3 py-2 text-right font-semibold text-slate-900 text-xs sm:px-5 sm:py-3 sm:text-sm">{tax.rate}%</td>
                                    <td className="px-3 py-2 sm:px-5 sm:py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${
                                                tax.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {tax.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right sm:px-5 sm:py-3">
                                        <div className="flex justify-end gap-1 sm:gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(tax)}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 sm:h-8 sm:w-8"
                                                title="Edit tax"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteTax(tax)}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 sm:h-8 sm:w-8"
                                                title="Delete tax"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {allTaxes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-4 text-center text-xs text-slate-500 sm:px-5 sm:py-6 sm:text-sm">
                                        No taxes defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {meta.last_page > 1 && (
                    <Pagination
                        meta={meta}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal show={modalOpen} onClose={resetForm} maxWidth="xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900">{editingTax ? 'Edit Tax' : 'New Tax'}</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 sm:flex-none rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:px-4 sm:text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="tax-form"
                                    disabled={processing}
                                    className="flex-1 sm:flex-none rounded-full bg-elvee-blue px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:text-sm"
                                >
                                    {processing ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                        <form id="tax-form" onSubmit={submit} className="space-y-3 sm:space-y-4 lg:space-y-6">
                            <div className="grid gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-2">
                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">
                                            Tax Group <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={formData.tax_group_id}
                                            onChange={(e) => setFormData({ ...formData, tax_group_id: e.target.value })}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-1.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                                            required
                                        >
                                            <option value="">Select a tax group</option>
                                            {taxGroups.map((group) => (
                                                <option key={group.id} value={group.id}>
                                                    {group.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.tax_group_id && <p className="mt-1 text-[10px] sm:text-xs text-rose-500">{errors.tax_group_id}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">
                                            Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-1.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                                            required
                                        />
                                        {errors.name && <p className="mt-1 text-[10px] sm:text-xs text-rose-500">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">
                                            Code <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-1.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                                            required
                                        />
                                        {errors.code && <p className="mt-1 text-[10px] sm:text-xs text-rose-500">{errors.code}</p>}
                                    </div>
                                </div>

                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">
                                            Rate (%) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={formData.rate}
                                            onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-1.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                                            required
                                        />
                                        {errors.rate && <p className="mt-1 text-[10px] sm:text-xs text-rose-500">{errors.rate}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-1.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                                        />
                                        {errors.description && <p className="mt-1 text-[10px] sm:text-xs text-rose-500">{errors.description}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Status</label>
                                        <label className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs sm:p-4 sm:text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="h-3.5 w-3.5 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold sm:h-4 sm:w-4"
                                            />
                                            <span>Active</span>
                                        </label>
                                    </div>
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
                title="Remove Tax"
                message={deleteConfirm ? `Are you sure you want to remove tax ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />
        </>
    );
}
