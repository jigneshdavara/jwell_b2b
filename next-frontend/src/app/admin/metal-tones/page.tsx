'use client';

import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

type MetalToneRow = {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

export default function AdminMetalTonesIndex() {
    const [loading, setLoading] = useState(true);
    const [tones, setTones] = useState<{ data: MetalToneRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTone, setEditingTone] = useState<MetalToneRow | null>(null);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<MetalToneRow | null>(null);

    const [formData, setFormData] = useState({ name: '', code: '', is_active: true });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadTones();
    }, [currentPage, perPage]);

    const loadTones = async () => {
        setLoading(true);
        try {
            const response = await adminService.getMetalTones(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setTones({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    name: item.name,
                    code: item.code,
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
            console.error('Failed to load metal tones:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetFormAndModal = () => {
        setEditingTone(null);
        setModalOpen(false);
        setFormData({ name: '', code: '', is_active: true });
    };

    const openEditModal = (tone: MetalToneRow) => {
        setEditingTone(tone);
        setFormData({ name: tone.name, code: tone.code, is_active: tone.is_active });
        setModalOpen(true);
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        try {
            if (editingTone) {
                await adminService.updateMetalTone(editingTone.id, formData);
            } else {
                await adminService.createMetalTone(formData);
            }
            resetFormAndModal();
            await loadTones();
        } catch (error: any) {
            console.error('Failed to save metal tone:', error);
            alert(error.response?.data?.message || 'Failed to save metal tone. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const toggleStatus = async (tone: MetalToneRow) => {
        try {
            await adminService.updateMetalTone(tone.id, { ...tone, is_active: !tone.is_active });
            await loadTones();
        } catch (error: any) {
            console.error('Failed to toggle metal tone status:', error);
            alert(error.response?.data?.message || 'Failed to update metal tone. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteMetalTone(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadTones();
            } catch (error: any) {
                console.error('Failed to delete metal tone:', error);
                alert(error.response?.data?.message || 'Failed to delete metal tone. Please try again.');
            }
        }
    };

    return (
        <>
            <Head title="Metal Tones" />
            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Metal Tones</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage available tones for metals (e.g. Yellow, White, Rose).</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New tone
                    </button>
                </div>
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">Tones ({tones.meta.total})</div>
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
                    {loading && tones.data.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-slate-500">Loading metal tones...</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 text-left">Name</th>
                                    <th className="px-5 py-3 text-left">Code</th>
                                    <th className="px-5 py-3 text-left">Status</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {tones.data.map((tone) => (
                                    <tr key={tone.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-3 font-semibold text-slate-900">{tone.name}</td>
                                        <td className="px-5 py-3 text-slate-500">{tone.code}</td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                tone.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {tone.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button type="button" onClick={() => openEditModal(tone)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                    </svg>
                                                </button>
                                                <button type="button" onClick={() => toggleStatus(tone)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600">
                                                    {tone.is_active ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button type="button" onClick={() => setDeleteConfirm(tone)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600">
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

                {tones.meta.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                        <div>
                            Showing {tones.meta.total > 0 ? (tones.meta.current_page - 1) * tones.meta.per_page + 1 : 0} to {Math.min(tones.meta.current_page * tones.meta.per_page, tones.meta.total)} of {tones.meta.total} entries
                        </div>
                        <div className="flex gap-2">
                            {Array.from({ length: tones.meta.last_page }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                        page === tones.meta.current_page ? 'bg-sky-600 text-white shadow shadow-sky-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                        <h3 className="text-lg font-semibold text-slate-900">{editingTone ? 'Edit Metal Tone' : 'New Metal Tone'}</h3>
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
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                />
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
                    title="Remove Metal Tone"
                    message={deleteConfirm ? `Are you sure you want to remove metal tone ${deleteConfirm.name}?` : ''}
                    confirmText="Remove"
                    variant="danger"
                />
            </div>
        </>
    );
}
