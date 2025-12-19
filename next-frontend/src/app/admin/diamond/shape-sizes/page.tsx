'use client';

import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useMemo, useState } from 'react';

type DiamondShapeSizeRow = {
    id: number;
    name: string;
    diamond_shape: { id: number; name: string } | null;
    diamond_type: { id: number; name: string } | null;
    created_at?: string | null;
    updated_at?: string | null;
};

// Mock data
const mockDiamondShapeSizes: DiamondShapeSizeRow[] = [
    { id: 1, name: '0.10 ct', diamond_shape: { id: 1, name: 'Round' }, diamond_type: { id: 1, name: 'Natural' }, created_at: '2023-01-15T10:00:00Z', updated_at: '2023-01-15T10:00:00Z' },
    { id: 2, name: '0.20 ct', diamond_shape: { id: 1, name: 'Round' }, diamond_type: { id: 1, name: 'Natural' }, created_at: '2023-01-15T10:00:00Z', updated_at: '2023-01-15T10:00:00Z' },
];

const mockDiamondShapes = [
    { id: 1, name: 'Round' },
    { id: 2, name: 'Princess' },
];

const mockDiamondTypes = [
    { id: 1, name: 'Natural' },
    { id: 2, name: 'Lab Grown' },
];

export default function AdminDiamondShapeSizesIndex() {
    const [allSizes, setAllSizes] = useState<DiamondShapeSizeRow[]>(mockDiamondShapeSizes);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSize, setEditingSize] = useState<DiamondShapeSizeRow | null>(null);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<DiamondShapeSizeRow | null>(null);

    const [formData, setFormData] = useState({
        diamond_shape_id: '',
        name: '',
    });
    const [processing, setProcessing] = useState(false);

    const paginatedSizes = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return allSizes.slice(start, start + perPage);
    }, [allSizes, currentPage, perPage]);

    const totalPages = Math.ceil(allSizes.length / perPage);

    const resetFormAndModal = () => {
        setEditingSize(null);
        setModalOpen(false);
        setFormData({ diamond_shape_id: '', name: '' });
    };

    const openEditModal = (size: DiamondShapeSizeRow) => {
        setEditingSize(size);
        setFormData({
            diamond_shape_id: size.diamond_shape?.id.toString() ?? '',
            name: size.name,
        });
        setModalOpen(true);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setTimeout(() => {
            const selectedShape = mockDiamondShapes.find(s => s.id === Number(formData.diamond_shape_id));
            if (editingSize) {
                setAllSizes(allSizes.map(s => s.id === editingSize.id ? { ...s, ...formData, diamond_shape: selectedShape ?? null } : s));
            } else {
                setAllSizes([...allSizes, { id: Date.now(), ...formData, diamond_shape: selectedShape ?? null, diamond_type: null }]);
            }
            setProcessing(false);
            resetFormAndModal();
        }, 500);
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setAllSizes(allSizes.filter(s => s.id !== deleteConfirm.id));
            setDeleteConfirm(null);
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
                        <div className="font-semibold text-slate-700">Sizes ({allSizes.length})</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(Number(e.target.value))}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                            </select>
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Shape</th>
                                <th className="px-5 py-3 text-left">Type</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {paginatedSizes.map((size) => (
                                <tr key={size.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{size.name}</td>
                                    <td className="px-5 py-3 text-slate-500">{size.diamond_shape?.name ?? '—'}</td>
                                    <td className="px-5 py-3 text-slate-500">{size.diamond_type?.name ?? '—'}</td>
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
                </div>
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
                                {mockDiamondShapes.map(shape => <option key={shape.id} value={shape.id}>{shape.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Name (e.g. 0.10 ct)</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                required
                                placeholder="0.10 ct"
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
                message={deleteConfirm ? `Are you sure you want to remove size ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />
        </>
    );
}
