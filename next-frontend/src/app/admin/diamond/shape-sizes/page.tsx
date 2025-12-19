'use client';

import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';

type DiamondShapeSizeRow = {
    id: number;
    size: string | null;
    secondary_size: string | null;
    ctw: number;
    label: string;
    diamond_shape: { id: number; name: string } | null;
    created_at?: string | null;
    updated_at?: string | null;
};

type DiamondShape = {
    id: number;
    name: string;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

export default function AdminDiamondShapeSizesIndex() {
    const [loading, setLoading] = useState(true);
    const [sizes, setSizes] = useState<{ data: DiamondShapeSizeRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 }
    });
    const [diamondShapes, setDiamondShapes] = useState<DiamondShape[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSize, setEditingSize] = useState<DiamondShapeSizeRow | null>(null);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<DiamondShapeSizeRow | null>(null);

    const [formData, setFormData] = useState({
        diamond_shape_id: '',
        size: '',
        secondary_size: '',
        ctw: 0,
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadSizes();
        loadDiamondShapes();
    }, [currentPage, perPage]);

    const loadSizes = async () => {
        setLoading(true);
        try {
            // Use the paginated version (page, perPage) not the shapeId version
            const response = await adminService.getDiamondShapeSizes(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setSizes({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    size: item.size,
                    secondary_size: item.secondary_size,
                    ctw: Number(item.ctw || 0),
                    label: item.label || `${item.size || ''} (${item.ctw}ct)`,
                    diamond_shape: item.diamond_shape ? { id: Number(item.diamond_shape.id), name: item.diamond_shape.name } : null,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                })),
                meta: {
                    current_page: responseMeta.current_page || responseMeta.page || 1,
                    last_page: responseMeta.last_page || responseMeta.lastPage || 1,
                    total: responseMeta.total || 0,
                    per_page: responseMeta.per_page || responseMeta.perPage || perPage,
                },
            });
        } catch (error: any) {
            console.error('Failed to load diamond shape sizes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDiamondShapes = async () => {
        try {
            const response = await adminService.getDiamondShapes(1, 100);
            const items = response.data.items || response.data.data || [];
            setDiamondShapes(items.map((item: any) => ({ id: Number(item.id), name: item.name })));
        } catch (error: any) {
            console.error('Failed to load diamond shapes:', error);
        }
    };

    const resetFormAndModal = () => {
        setEditingSize(null);
        setModalOpen(false);
        setFormData({ diamond_shape_id: '', size: '', secondary_size: '', ctw: 0 });
    };

    const openEditModal = (size: DiamondShapeSizeRow) => {
        setEditingSize(size);
        setFormData({
            diamond_shape_id: size.diamond_shape?.id.toString() ?? '',
            size: size.size || '',
            secondary_size: size.secondary_size || '',
            ctw: size.ctw,
        });
        setModalOpen(true);
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        try {
            const payload: any = {
                diamond_shape_id: formData.diamond_shape_id ? Number(formData.diamond_shape_id) : null,
                size: formData.size || null,
                secondary_size: formData.secondary_size || null,
                ctw: Number(formData.ctw),
            };

            if (editingSize) {
                await adminService.updateDiamondShapeSize(editingSize.id, payload);
            } else {
                await adminService.createDiamondShapeSize(payload);
            }
            resetFormAndModal();
            await loadSizes();
        } catch (error: any) {
            console.error('Failed to save diamond shape size:', error);
            alert(error.response?.data?.message || 'Failed to save diamond shape size. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteDiamondShapeSize(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadSizes();
            } catch (error: any) {
                console.error('Failed to delete diamond shape size:', error);
                alert(error.response?.data?.message || 'Failed to delete diamond shape size. Please try again.');
            }
        }
    };

    return (
        <>
            <Head title="Diamond Shape Sizes" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Diamond Shape Sizes</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage standard size denominations for different diamond shapes.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New size
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">Sizes ({sizes.meta.total})</div>
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
                    {loading && sizes.data.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <p className="text-slate-500">Loading diamond shape sizes...</p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-500">
                                <tr>
                                    <th className="px-5 py-3 text-left">Label</th>
                                    <th className="px-5 py-3 text-left">Size</th>
                                    <th className="px-5 py-3 text-left">CTW</th>
                                    <th className="px-5 py-3 text-left">Shape</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {sizes.data.map((size) => (
                                    <tr key={size.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-3 font-semibold text-slate-900">{size.label}</td>
                                        <td className="px-5 py-3 text-slate-500">{size.size || '—'}</td>
                                        <td className="px-5 py-3 text-slate-500">{size.ctw} ct</td>
                                        <td className="px-5 py-3 text-slate-500">{size.diamond_shape?.name ?? '—'}</td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => openEditModal(size)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button type="button" onClick={() => setDeleteConfirm(size)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600">
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

                {sizes.meta.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                        <div>
                            Showing {sizes.meta.total > 0 ? (sizes.meta.current_page - 1) * sizes.meta.per_page + 1 : 0} to {Math.min(sizes.meta.current_page * sizes.meta.per_page, sizes.meta.total)} of {sizes.meta.total} entries
                        </div>
                        <div className="flex gap-2">
                            {Array.from({ length: sizes.meta.last_page }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                        page === sizes.meta.current_page ? 'bg-sky-600 text-white shadow shadow-sky-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Modal show={modalOpen} onClose={resetFormAndModal} maxWidth="xl">
                <form onSubmit={submit} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900">{editingSize ? 'Edit Shape Size' : 'New Shape Size'}</h3>
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Diamond Shape</label>
                            <select
                                value={formData.diamond_shape_id}
                                onChange={(e) => setFormData({ ...formData, diamond_shape_id: e.target.value })}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                required
                            >
                                <option value="">Select a diamond shape</option>
                                {diamondShapes.map(shape => <option key={shape.id} value={shape.id}>{shape.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Size (e.g. 6.5mm)</label>
                            <input
                                type="text"
                                value={formData.size}
                                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                required
                                placeholder="6.5mm"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Secondary Size (Optional, e.g. 8x6mm)</label>
                            <input
                                type="text"
                                value={formData.secondary_size}
                                onChange={(e) => setFormData({ ...formData, secondary_size: e.target.value })}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                placeholder="8x6mm"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">CTW (Carat Total Weight)</label>
                            <input
                                type="number"
                                step="0.001"
                                value={formData.ctw}
                                onChange={(e) => setFormData({ ...formData, ctw: Number(e.target.value) })}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                required
                                placeholder="1.0"
                            />
                        </div>
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
                title="Remove Shape Size"
                message={deleteConfirm ? `Are you sure you want to remove size ${deleteConfirm.label}?` : ''}
                confirmText="Remove"
                variant="danger"
            />
        </>
    );
}
