'use client';

import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';

type MetalToneRow = {
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


export default function AdminMetalTonesIndex() {
    const [loading, setLoading] = useState(true);
    const [tones, setTones] = useState<{ data: MetalToneRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });
    const [metals, setMetals] = useState<MetalOption[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTone, setEditingTone] = useState<MetalToneRow | null>(null);
    const [selectedTones, setSelectedTones] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<MetalToneRow | null>(null);
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
        loadTones();
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

    const loadTones = async () => {
        setLoading(true);
        try {
            const response = await adminService.getMetalTones(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setTones({
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
            console.error('Failed to load metal tones:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetFormAndModal = () => {
        setEditingTone(null);
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

    const openEditModal = (tone: MetalToneRow) => {
        setEditingTone(tone);
        setFormData({
            metal_id: String(tone.metal_id),
            code: tone.code,
            name: tone.name,
            description: tone.description || '',
            is_active: tone.is_active,
            display_order: tone.display_order,
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

            if (editingTone) {
                await adminService.updateMetalTone(editingTone.id, payload);
            } else {
                await adminService.createMetalTone(payload);
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

    const toggleTone = async (tone: MetalToneRow) => {
        try {
            await adminService.updateMetalTone(tone.id, {
                metal_id: tone.metal_id,
                code: tone.code,
                name: tone.name,
                description: tone.description || null,
                is_active: !tone.is_active,
                display_order: tone.display_order,
            });
            await loadTones();
        } catch (error: any) {
            console.error('Failed to toggle metal tone status:', error);
            alert(error.response?.data?.message || 'Failed to update metal tone. Please try again.');
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedTones((prev) =>
            prev.includes(id) ? prev.filter((toneId) => toneId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedTones.length === tones.data.length) {
            setSelectedTones([]);
        } else {
            setSelectedTones(tones.data.map((tone) => tone.id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedTones.length === 0) {
            return;
        }
        try {
            await adminService.bulkDeleteMetalTones(selectedTones);
            setSelectedTones([]);
            setBulkDeleteConfirm(false);
            await loadTones();
        } catch (error: any) {
            console.error('Failed to delete metal tones:', error);
            alert(error.response?.data?.message || 'Failed to delete metal tones. Please try again.');
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
                        <h1 className="text-2xl font-semibold text-slate-900">Metal tones</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage metal tone variations for catalogue specifications.</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New tone
                    </button>
                </div>
                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">
                            Tones ({tones.meta.total})
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedTones.length} selected</span>
                            <button
                                type="button"
                                onClick={() => setBulkDeleteConfirm(true)}
                                disabled={selectedTones.length === 0}
                                className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Bulk delete
                            </button>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    {loading && tones.data.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-slate-500">Loading metal tones...</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedTones.length === tones.data.length && tones.data.length > 0}
                                            onChange={toggleSelectAll}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label="Select all metal tones"
                                        />
                                    </th>
                                    <th className="px-5 py-3 text-left">Metal</th>
                                    <th className="px-5 py-3 text-left">Code</th>
                                    <th className="px-5 py-3 text-left">Tone name</th>
                                    <th className="px-5 py-3 text-left">Order</th>
                                    <th className="px-5 py-3 text-left">Status</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {tones.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-6 text-center text-sm text-slate-500">
                                            No metal tones defined yet.
                                        </td>
                                    </tr>
                                ) : (
                                    tones.data.map((tone) => (
                                        <tr key={tone.id} className="hover:bg-slate-50">
                                            <td className="px-5 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTones.includes(tone.id)}
                                                    onChange={() => toggleSelection(tone.id)}
                                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                    aria-label={`Select metal tone ${tone.name}`}
                                                />
                                            </td>
                                            <td className="px-5 py-3 font-medium text-slate-700">
                                                {tone.metal?.name ?? '—'}
                                            </td>
                                            <td className="px-5 py-3 text-slate-700">{tone.code}</td>
                                            <td className="px-5 py-3 font-semibold text-slate-900">
                                                <div className="flex flex-col gap-1">
                                                    <span>{tone.name}</span>
                                                    {tone.description && <span className="text-xs text-slate-500">{tone.description}</span>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-slate-500">{tone.display_order}</td>
                                            <td className="px-5 py-3">
                                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                    tone.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {tone.is_active ? 'Active' : 'Archived'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(tone)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                        title="Edit tone"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleTone(tone)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                                        title={tone.is_active ? 'Pause tone' : 'Activate tone'}
                                                    >
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
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteConfirm(tone)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                        title="Delete tone"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
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
                    )}
                </div>

                <Pagination 
                    meta={tones.meta} 
                    onPageChange={setCurrentPage} 
                />

                <Modal show={modalOpen} onClose={resetFormAndModal} maxWidth="5xl">
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {editingTone ? `Edit metal tone: ${editingTone.name}` : 'Create new metal tone'}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={resetFormAndModal}
                                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="tone-form"
                                        disabled={processing}
                                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {editingTone ? 'Update metal tone' : 'Create metal tone'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetFormAndModal}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                                        aria-label="Close modal"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                            <form onSubmit={submit} className="space-y-6" id="tone-form">
                                <div className="grid gap-6 lg:grid-cols-2">
                                    <div className="space-y-6">
                                        <div className="grid gap-4">
                                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                                <span>Metal <span className="text-rose-500">*</span></span>
                                                <select
                                                    value={formData.metal_id}
                                                    onChange={(e) => setFormData({ ...formData, metal_id: e.target.value })}
                                                    className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
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
                                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                                <span>Code <span className="text-rose-500">*</span></span>
                                                <input
                                                    type="text"
                                                    value={formData.code}
                                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                    className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    placeholder="e.g., YLW, RSE"
                                                    required
                                                />
                                            </label>
                                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                                <span>Tone name <span className="text-rose-500">*</span></span>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    required
                                                />
                                            </label>
                                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                                <span>Display order <span className="text-rose-500">*</span></span>
                                                <input
                                                    type="number"
                                                    value={formData.display_order}
                                                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value === '' ? 0 : Number(e.target.value) })}
                                                    className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    min={0}
                                                    required
                                                />
                                            </label>
                                        </div>

                                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            />
                                            Active for selection
                                        </label>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Description</span>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="min-h-[200px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
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
                    title="Remove Metal Tone"
                    message={deleteConfirm ? `Are you sure you want to remove metal tone ${deleteConfirm.name}?` : ''}
                    confirmText="Remove"
                    variant="danger"
                />

                <ConfirmationModal
                    show={bulkDeleteConfirm}
                    onClose={() => setBulkDeleteConfirm(false)}
                    onConfirm={handleBulkDelete}
                    title="Delete Metal Tones"
                    message={`Are you sure you want to delete ${selectedTones.length} selected metal tone(s)?`}
                    confirmText="Delete"
                    variant="danger"
                />
            </div>
        </>
    );
}
