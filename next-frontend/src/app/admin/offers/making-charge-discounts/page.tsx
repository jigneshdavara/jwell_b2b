'use client';

import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';

type DiscountRow = {
    id: number;
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
    is_active: boolean;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

export default function AdminMakingChargeDiscountsIndex() {
    const [loading, setLoading] = useState(true);
    const [discounts, setDiscounts] = useState<{ data: DiscountRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<DiscountRow | null>(null);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<DiscountRow | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'percentage' as 'fixed' | 'percentage',
        value: 0,
        is_active: true,
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadDiscounts();
    }, [currentPage, perPage]);

    const loadDiscounts = async () => {
        setLoading(true);
        try {
            const response = await adminService.getMakingChargeDiscounts(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setDiscounts({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    name: item.name,
                    type: item.type || item.discount_type || 'percentage',
                    value: Number(item.value || item.discount_value || 0),
                    is_active: item.is_active,
                })),
                meta: {
                    current_page: responseMeta.current_page || responseMeta.page || 1,
                    last_page: responseMeta.last_page || responseMeta.lastPage || 1,
                    total: responseMeta.total || 0,
                    per_page: responseMeta.per_page || responseMeta.perPage || perPage,
                },
            });
        } catch (error: any) {
            console.error('Failed to load making charge discounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetFormAndModal = () => {
        setEditingDiscount(null);
        setModalOpen(false);
        setFormData({ name: '', type: 'percentage', value: 0, is_active: true });
    };

    const openEditModal = (discount: DiscountRow) => {
        setEditingDiscount(discount);
        setFormData({
            name: discount.name,
            type: discount.type,
            value: discount.value,
            is_active: discount.is_active,
        });
        setModalOpen(true);
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        try {
            const payload: any = {
                name: formData.name,
                type: formData.type,
                value: formData.value,
                is_active: formData.is_active,
            };

            if (editingDiscount) {
                await adminService.updateMakingChargeDiscount(editingDiscount.id, payload);
            } else {
                await adminService.createMakingChargeDiscount(payload);
            }
            resetFormAndModal();
            await loadDiscounts();
        } catch (error: any) {
            console.error('Failed to save making charge discount:', error);
            alert(error.response?.data?.message || 'Failed to save discount. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const toggleStatus = async (discount: DiscountRow) => {
        try {
            await adminService.updateMakingChargeDiscount(discount.id, { ...discount, is_active: !discount.is_active });
            await loadDiscounts();
        } catch (error: any) {
            console.error('Failed to toggle discount status:', error);
            alert(error.response?.data?.message || 'Failed to update discount. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteMakingChargeDiscount(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadDiscounts();
            } catch (error: any) {
                console.error('Failed to delete making charge discount:', error);
                alert(error.response?.data?.message || 'Failed to delete discount. Please try again.');
            }
        }
    };

    return (
        <>
            <Head title="Making Charge Discounts" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Making Charge Discounts</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage automatic discounts on product making charges.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New discount
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">Discounts ({discounts.meta.total})</div>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:ring-0"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    {loading && discounts.data.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-slate-500">Loading discounts...</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 text-left">Name</th>
                                    <th className="px-5 py-3 text-left">Type</th>
                                    <th className="px-5 py-3 text-right">Value</th>
                                    <th className="px-5 py-3 text-left">Status</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {discounts.data.map((discount) => (
                                    <tr key={discount.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-3 font-semibold text-slate-900">{discount.name}</td>
                                        <td className="px-5 py-3 text-slate-500 capitalize">{discount.type}</td>
                                        <td className="px-5 py-3 text-right font-semibold text-slate-900">
                                            {discount.type === 'fixed' ? '₹' : ''}{discount.value}{discount.type === 'percentage' ? '%' : ''}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                discount.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {discount.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => openEditModal(discount)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                    </svg>
                                                </button>
                                                <button type="button" onClick={() => toggleStatus(discount)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600">
                                                    {discount.is_active ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button type="button" onClick={() => setDeleteConfirm(discount)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {discounts.meta.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                        <div>
                            Showing {discounts.meta.total > 0 ? (discounts.meta.current_page - 1) * discounts.meta.per_page + 1 : 0} to {Math.min(discounts.meta.current_page * discounts.meta.per_page, discounts.meta.total)} of {discounts.meta.total} entries
                        </div>
                        <div className="flex gap-2">
                            {Array.from({ length: discounts.meta.last_page }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                        page === discounts.meta.current_page ? 'bg-sky-600 text-white shadow shadow-sky-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <Modal show={modalOpen} onClose={resetFormAndModal} maxWidth="xl">
                    <form onSubmit={submit} className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900">{editingDiscount ? 'Edit Discount' : 'New Discount'}</h3>
                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'fixed' | 'percentage' })}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        required
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed">Fixed Amount</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Value</label>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        required
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                />
                                <span className="text-sm text-slate-700">Active</span>
                            </label>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button type="button" onClick={resetFormAndModal} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                            <button type="submit" disabled={processing} className="rounded-full bg-elvee-blue px-5 py-2 text-sm font-semibold text-white">Save</button>
                        </div>
                    </form>
                </Modal>

                <ConfirmationModal
                    show={deleteConfirm !== null}
                    onClose={() => setDeleteConfirm(null)}
                    onConfirm={handleDelete}
                    title="Remove Discount"
                    message={deleteConfirm ? `Are you sure you want to remove discount ${deleteConfirm.name}?` : ''}
                    confirmText="Remove"
                    variant="danger"
                />
            </div>
        </>
    );
}
