'use client';

import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useMemo, useState } from 'react';

type OfferRow = {
    id: number;
    code: string;
    name: string;
    type: 'fixed' | 'percentage';
    value: number;
    description?: string | null;
    is_active: boolean;
};

// Mock data
const mockOffers: OfferRow[] = [
    { id: 1, code: 'WELCOME10', name: 'Welcome Offer', type: 'percentage', value: 10, is_active: true },
    { id: 2, code: 'SAVE500', name: 'Fixed Discount', type: 'fixed', value: 500, is_active: true },
];

export default function AdminOffersIndex() {
    const [allOffers, setAllOffers] = useState<OfferRow[]>(mockOffers);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<OfferRow | null>(null);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<OfferRow | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 'percentage' as 'fixed' | 'percentage',
        value: 0,
        description: '',
        is_active: true,
    });
    const [processing, setProcessing] = useState(false);

    const paginatedOffers = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return allOffers.slice(start, start + perPage);
    }, [allOffers, currentPage, perPage]);

    const totalPages = Math.ceil(allOffers.length / perPage);

    const resetFormAndModal = () => {
        setEditingOffer(null);
        setModalOpen(false);
        setFormData({ code: '', name: '', type: 'percentage', value: 0, description: '', is_active: true });
    };

    const openEditModal = (offer: OfferRow) => {
        setEditingOffer(offer);
        setFormData({
            code: offer.code,
            name: offer.name,
            type: offer.type,
            value: offer.value,
            description: offer.description ?? '',
            is_active: offer.is_active,
        });
        setModalOpen(true);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setTimeout(() => {
            if (editingOffer) {
                setAllOffers(allOffers.map(o => o.id === editingOffer.id ? { ...o, ...formData } : o));
            } else {
                setAllOffers([...allOffers, { id: Date.now(), ...formData }]);
            }
            setProcessing(false);
            resetFormAndModal();
        }, 500);
    };

    const toggleStatus = (offer: OfferRow) => {
        setAllOffers(allOffers.map(o => o.id === offer.id ? { ...o, is_active: !o.is_active } : o));
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setAllOffers(allOffers.filter(o => o.id !== deleteConfirm.id));
            setDeleteConfirm(null);
        }
    };

    return (
        <>
            <Head title="Promotional Offers" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Promotional Offers</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage promo codes and discounts.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New offer
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">Offers ({allOffers.length})</div>
                    </div>
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Code</th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Type</th>
                                <th className="px-5 py-3 text-right">Value</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {paginatedOffers.map((offer) => (
                                <tr key={offer.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{offer.code}</td>
                                    <td className="px-5 py-3 text-slate-500">{offer.name}</td>
                                    <td className="px-5 py-3 text-slate-500 capitalize">{offer.type}</td>
                                    <td className="px-5 py-3 text-right font-semibold text-slate-900">
                                        {offer.type === 'fixed' ? '₹' : ''}{offer.value}{offer.type === 'percentage' ? '%' : ''}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            offer.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {offer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => openEditModal(offer)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button type="button" onClick={() => toggleStatus(offer)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600">
                                                {offer.is_active ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button type="button" onClick={() => setDeleteConfirm(offer)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600">
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
                </div>
            </div>

            <Modal show={modalOpen} onClose={resetFormAndModal} maxWidth="xl">
                <form onSubmit={submit} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900">{editingOffer ? 'Edit Offer' : 'New Offer'}</h3>
                    <div className="mt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                />
                            </div>
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
                title="Remove Offer"
                message={deleteConfirm ? `Are you sure you want to remove offer ${deleteConfirm.code}?` : ''}
                confirmText="Remove"
                variant="danger"
            />
        </>
    );
}
