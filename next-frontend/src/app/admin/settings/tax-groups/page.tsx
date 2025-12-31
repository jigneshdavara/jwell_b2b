'use client';

import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { toastError } from '@/utils/toast';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';

type TaxGroupRow = {
    id: number;
    name: string;
    description?: string | null;
    is_active: boolean;
    taxes_count: number;
    created_at?: string | null;
    updated_at?: string | null;
};

export default function AdminTaxGroupsIndex() {
    const [loading, setLoading] = useState(true);
    const [allTaxGroups, setAllTaxGroups] = useState<TaxGroupRow[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({ 
        current_page: 1, 
        last_page: 1, 
        total: 0, 
        per_page: 20,
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<TaxGroupRow | null>(null);
    const [perPage, setPerPage] = useState(20);
    const [deleteConfirm, setDeleteConfirm] = useState<TaxGroupRow | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadTaxGroups(1, perPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadTaxGroups = async (page: number = 1, newPerPage: number = perPage) => {
        setLoading(true);
        try {
            const response = await adminService.getTaxGroups(page, newPerPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { 
                current_page: 1, 
                last_page: 1, 
                total: 0, 
                per_page: newPerPage,
            };
            
            setAllTaxGroups(items.map((item: any) => ({
                id: Number(item.id),
                name: item.name,
                description: item.description,
                is_active: item.is_active,
                taxes_count: item.taxes_count || item.taxes?.length || 0,
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
            console.error('Failed to load tax groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingGroup(null);
        setModalOpen(false);
        setFormData({ name: '', description: '', is_active: true });
        setErrors({});
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (group: TaxGroupRow) => {
        setEditingGroup(group);
        setFormData({
            name: group.name,
            description: group.description ?? '',
            is_active: group.is_active,
        });
        setModalOpen(true);
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});
        try {
            const payload = {
                name: formData.name,
                description: formData.description || null,
                is_active: formData.is_active,
            };

            if (editingGroup) {
                await adminService.updateTaxGroup(editingGroup.id, payload);
            } else {
                await adminService.createTaxGroup(payload);
            }
            resetForm();
            await loadTaxGroups(meta.current_page, perPage);
        } catch (error: any) {
            console.error('Failed to save tax group:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: error.response?.data?.message || 'Failed to save tax group. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    const toggleGroup = async (group: TaxGroupRow) => {
        try {
            await adminService.updateTaxGroup(group.id, {
                name: group.name,
                description: group.description,
                is_active: !group.is_active,
            });
            await loadTaxGroups(meta.current_page, perPage);
        } catch (error: any) {
            console.error('Failed to toggle tax group:', error);
            toastError(error.response?.data?.message || 'Failed to update tax group. Please try again.');
        }
    };

    const deleteGroup = (group: TaxGroupRow) => {
        setDeleteConfirm(group);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteTaxGroup(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadTaxGroups(meta.current_page, perPage);
            } catch (error: any) {
                console.error('Failed to delete tax group:', error);
                toastError(error.response?.data?.message || 'Failed to delete tax group. Please try again.');
            }
        }
    };

    const handlePageChange = (page: number) => {
        loadTaxGroups(page, perPage);
    };

    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        loadTaxGroups(1, newPerPage);
    };

    return (
        <>
            <Head title="Tax Groups" />

            <div className="space-y-6 px-1 py-4 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Tax Groups</h1>
                        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                            Organise taxes into groups for better management and reporting.
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
                        New group
                    </button>
                </div>

                <div className="overflow-x-auto rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-b border-slate-200 px-3 py-2.5 text-xs sm:px-5 sm:py-4 sm:text-sm">
                        <div className="font-semibold text-slate-700">
                            Groups ({meta.total})
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
                                <th className="hidden px-3 py-2 text-left sm:table-cell sm:px-5 sm:py-3">Description</th>
                                <th className="px-3 py-2 text-center sm:px-5 sm:py-3">Taxes</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Status</th>
                                <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {allTaxGroups.map((group) => (
                                <tr key={group.id} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 font-semibold text-slate-900 text-xs sm:px-5 sm:py-3 sm:text-sm">
                                        {group.name}
                                        {/* Mobile-only display for hidden columns */}
                                        <div className="mt-0.5 block sm:hidden text-[9px] text-slate-500">
                                            <span className="font-medium">Description:</span> {group.description || '—'}
                                        </div>
                                    </td>
                                    <td className="hidden px-3 py-2 text-slate-500 sm:table-cell sm:px-5 sm:py-3 text-xs sm:text-sm">{group.description || '—'}</td>
                                    <td className="px-3 py-2 text-center text-slate-500 text-xs sm:px-5 sm:py-3 sm:text-sm">{group.taxes_count}</td>
                                    <td className="px-3 py-2 sm:px-5 sm:py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${
                                                group.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {group.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right sm:px-5 sm:py-3">
                                        <div className="flex justify-end gap-1 sm:gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(group)}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 sm:h-8 sm:w-8"
                                                title="Edit group"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleGroup(group)}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600 sm:h-8 sm:w-8"
                                                title={group.is_active ? 'Deactivate group' : 'Activate group'}
                                            >
                                                {group.is_active ? (
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
                                                onClick={() => deleteGroup(group)}
                                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 sm:h-8 sm:w-8"
                                                title="Delete group"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {allTaxGroups.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-4 text-center text-xs text-slate-500 sm:px-5 sm:py-6 sm:text-sm">
                                        No tax groups defined yet.
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
                            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900">{editingGroup ? 'Edit Tax Group' : 'New Tax Group'}</h3>
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
                                    form="tax-group-form"
                                    disabled={processing}
                                    className="flex-1 sm:flex-none rounded-full bg-elvee-blue px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:text-sm"
                                >
                                    {processing ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                        <form id="tax-group-form" onSubmit={submit} className="space-y-3 sm:space-y-4 lg:space-y-6">
                            <div className="grid gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-2">
                                <div className="space-y-3 sm:space-y-4">
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
                                        <label className="mb-1.5 block text-xs sm:text-sm font-semibold text-slate-700">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-1.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
                                        />
                                        {errors.description && <p className="mt-1 text-[10px] sm:text-xs text-rose-500">{errors.description}</p>}
                                    </div>
                                </div>

                                <div className="space-y-3 sm:space-y-4">
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
                title="Remove Tax Group"
                message={deleteConfirm ? `Are you sure you want to remove tax group ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />
        </>
    );
}
