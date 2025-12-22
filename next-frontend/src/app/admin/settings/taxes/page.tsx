'use client';

import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';

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

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export default function AdminTaxesIndex() {
    const [loading, setLoading] = useState(true);
    const [allTaxes, setAllTaxes] = useState<TaxRow[]>([]);
    const [taxGroups, setTaxGroups] = useState<TaxOption[]>([]);
    const [meta, setMeta] = useState({ 
        current_page: 1, 
        last_page: 1, 
        total: 0, 
        per_page: 20,
        from: null as number | null,
        to: null as number | null,
    });
    const [links, setLinks] = useState<PaginationLink[]>([]);
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
                from: null,
                to: null,
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
            const from = total > 0 ? (currentPageNum - 1) * perPageNum + 1 : null;
            const to = total > 0 ? Math.min(currentPageNum * perPageNum, total) : null;

            setMeta({
                current_page: currentPageNum,
                last_page: totalPages,
                total: total,
                per_page: perPageNum,
                from: from,
                to: to,
            });

            // Generate pagination links matching Laravel format
            const generatedLinks: PaginationLink[] = [];

            // Previous link
            if (currentPageNum > 1) {
                generatedLinks.push({
                    url: `?page=${currentPageNum - 1}&per_page=${newPerPage}`,
                    label: '« Previous',
                    active: false,
                });
            }

            // Page number links (show up to 7 pages around current)
            const maxPages = 7;
            let startPage = Math.max(1, currentPageNum - Math.floor(maxPages / 2));
            let endPage = Math.min(totalPages, startPage + maxPages - 1);
            
            if (endPage - startPage < maxPages - 1) {
                startPage = Math.max(1, endPage - maxPages + 1);
            }

            for (let i = startPage; i <= endPage; i++) {
                generatedLinks.push({
                    url: `?page=${i}&per_page=${newPerPage}`,
                    label: i.toString(),
                    active: i === currentPageNum,
                });
            }

            // Next link
            if (currentPageNum < totalPages) {
                generatedLinks.push({
                    url: `?page=${currentPageNum + 1}&per_page=${newPerPage}`,
                    label: 'Next »',
                    active: false,
                });
            }

            setLinks(generatedLinks);
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
                alert(error.response?.data?.message || 'Failed to delete tax. Please try again.');
            }
        }
    };

    const changePage = (url: string | null) => {
        if (!url) return;
        // Extract page and per_page from query string
        const match = url.match(/[?&]page=(\d+)/);
        const perPageMatch = url.match(/[?&]per_page=(\d+)/);
        const page = match ? parseInt(match[1], 10) : 1;
        const perPageParam = perPageMatch ? parseInt(perPageMatch[1], 10) : perPage;
        loadTaxes(page, perPageParam);
    };

    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        loadTaxes(1, newPerPage);
    };

    return (
        <>
            <Head title="Taxes" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Taxes</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Manage tax rates and assign them to tax groups.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New tax
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">
                            Taxes ({meta.total})
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={handlePerPageChange}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
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
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Code</th>
                                <th className="px-5 py-3 text-left">Tax Group</th>
                                <th className="px-5 py-3 text-right">Rate</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {allTaxes.map((tax) => (
                                <tr key={tax.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{tax.name}</td>
                                    <td className="px-5 py-3 text-slate-500">{tax.code}</td>
                                    <td className="px-5 py-3 text-slate-500">{tax.tax_group?.name ?? '—'}</td>
                                    <td className="px-5 py-3 text-right font-semibold text-slate-900">{tax.rate}%</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                tax.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {tax.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(tax)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                title="Edit tax"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteTax(tax)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                title="Delete tax"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {allTaxes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No taxes defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                        Showing {meta.from ?? 0} to {meta.to ?? 0} of {meta.total} entries
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {links.map((link, index) => {
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
                                        link.active ? 'bg-elvee-blue text-white shadow shadow-elvee-blue/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {cleanLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">{editingTax ? 'Edit Tax' : 'New Tax'}</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="tax-form"
                                    disabled={processing}
                                    className="rounded-full bg-elvee-blue px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {processing ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form id="tax-form" onSubmit={submit} className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Tax Group <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={formData.tax_group_id}
                                            onChange={(e) => setFormData({ ...formData, tax_group_id: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                            required
                                        >
                                            <option value="">Select a tax group</option>
                                            {taxGroups.map((group) => (
                                                <option key={group.id} value={group.id}>
                                                    {group.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.tax_group_id && <p className="mt-1 text-xs text-rose-500">{errors.tax_group_id}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Name <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                            required
                                        />
                                        {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Code <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                            required
                                        />
                                        {errors.code && <p className="mt-1 text-xs text-rose-500">{errors.code}</p>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Rate (%) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={formData.rate}
                                            onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                            required
                                        />
                                        {errors.rate && <p className="mt-1 text-xs text-rose-500">{errors.rate}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        />
                                        {errors.description && <p className="mt-1 text-xs text-rose-500">{errors.description}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
                                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                            />
                                            <span className="text-sm text-slate-700">Active</span>
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
