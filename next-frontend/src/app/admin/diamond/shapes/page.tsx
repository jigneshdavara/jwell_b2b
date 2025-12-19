'use client';

import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useMemo, useState } from 'react';

type DiamondShapeRow = {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    diamond_type: { id: number; name: string } | null;
    created_at?: string | null;
    updated_at?: string | null;
};

// Mock data for diamond shapes
const mockDiamondShapes: DiamondShapeRow[] = [
    { id: 1, name: 'Round', slug: 'round', is_active: true, diamond_type: { id: 1, name: 'Natural' }, created_at: '2023-01-15T10:00:00Z', updated_at: '2023-01-15T10:00:00Z' },
    { id: 2, name: 'Princess', slug: 'princess', is_active: true, diamond_type: { id: 1, name: 'Natural' }, created_at: '2023-01-15T10:00:00Z', updated_at: '2023-01-15T10:00:00Z' },
    { id: 3, name: 'Oval', slug: 'oval', is_active: true, diamond_type: { id: 1, name: 'Natural' }, created_at: '2023-02-20T11:30:00Z', updated_at: '2023-02-20T11:30:00Z' },
];

const mockDiamondTypes = [
    { id: 1, name: 'Natural' },
    { id: 2, name: 'Lab Grown' },
];

export default function AdminDiamondShapesIndex() {
    const [allShapes, setAllShapes] = useState<DiamondShapeRow[]>(mockDiamondShapes);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingShape, setEditingShape] = useState<DiamondShapeRow | null>(null);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<DiamondShapeRow | null>(null);

    const [formData, setFormData] = useState({
        diamond_type_id: '',
        name: '',
        is_active: true,
    });
    const [processing, setProcessing] = useState(false);

    const paginatedShapes = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return allShapes.slice(start, start + perPage);
    }, [allShapes, currentPage, perPage]);

    const totalPages = Math.ceil(allShapes.length / perPage);

    const resetFormAndModal = () => {
        setEditingShape(null);
        setModalOpen(false);
        setFormData({ diamond_type_id: '', name: '', is_active: true });
    };

    const openEditModal = (shape: DiamondShapeRow) => {
        setEditingShape(shape);
        setFormData({
            diamond_type_id: shape.diamond_type?.id.toString() ?? '',
            name: shape.name,
            is_active: shape.is_active,
        });
        setModalOpen(true);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setTimeout(() => {
            const selectedType = mockDiamondTypes.find(t => t.id === Number(formData.diamond_type_id));
            if (editingShape) {
                setAllShapes(allShapes.map(s => s.id === editingShape.id ? { ...s, ...formData, diamond_type: selectedType ?? null, slug: formData.name.toLowerCase().replace(/\s+/g, '-') } : s));
            } else {
                setAllShapes([...allShapes, { id: Date.now(), ...formData, diamond_type: selectedType ?? null, slug: formData.name.toLowerCase().replace(/\s+/g, '-') }]);
            }
            setProcessing(false);
            resetFormAndModal();
        }, 500);
    };

    const toggleStatus = (shape: DiamondShapeRow) => {
        setAllShapes(allShapes.map(s => s.id === shape.id ? { ...s, is_active: !s.is_active } : s));
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setAllShapes(allShapes.filter(s => s.id !== deleteConfirm.id));
            setDeleteConfirm(null);
        }
    };

    return (
        <>
            <Head title="Diamond Shapes" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Diamond Shapes</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage common diamond shapes for different stone types.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New shape
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">Shapes ({allShapes.length})</div>
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
                                <th className="px-5 py-3 text-left">Slug</th>
                                <th className="px-5 py-3 text-left">Type</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {paginatedShapes.map((shape) => (
                                <tr key={shape.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{shape.name}</td>
                                    <td className="px-5 py-3 text-slate-500">{shape.slug}</td>
                                    <td className="px-5 py-3 text-slate-500">{shape.diamond_type?.name ?? '—'}</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            shape.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {shape.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => openEditModal(shape)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button type="button" onClick={() => toggleStatus(shape)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600">
                                                {shape.is_active ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button type="button" onClick={() => setDeleteConfirm(shape)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600">
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
                    <h3 className="text-lg font-semibold text-slate-900">{editingShape ? 'Edit Diamond Shape' : 'New Diamond Shape'}</h3>
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Diamond Type</label>
                            <select
                                value={formData.diamond_type_id}
                                onChange={(e) => setFormData({ ...formData, diamond_type_id: e.target.value })}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                required
                            >
                                <option value="">Select a diamond type</option>
                                {mockDiamondTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
                            </select>
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
                title="Remove Diamond Shape"
                message={deleteConfirm ? `Are you sure you want to remove shape ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />
        </>
    );
}
