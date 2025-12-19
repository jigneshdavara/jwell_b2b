"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

type MetalPurityRow = {
    id: number;
    metal_id: number;
    metal: { id: number; name: string } | null;
    code: string | null;
    name: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
};

const mockMetals = [
    { id: 1, name: 'Gold' },
    { id: 2, name: 'Silver' },
    { id: 3, name: 'Platinum' },
];

const mockPurities: MetalPurityRow[] = [
    { id: 1, metal_id: 1, metal: { id: 1, name: 'Gold' }, code: '24K', name: '24 Karat', description: 'Pure gold.', is_active: true, display_order: 1 },
    { id: 2, metal_id: 1, metal: { id: 1, name: 'Gold' }, code: '22K', name: '22 Karat', description: 'Standard jewelry gold.', is_active: true, display_order: 2 },
    { id: 3, metal_id: 2, metal: { id: 2, name: 'Silver' }, code: '925', name: 'Sterling Silver', description: '92.5% pure silver.', is_active: true, display_order: 1 },
];

export default function AdminMetalPuritiesPage() {
    const [loading, setLoading] = useState(true);
    const [purities, setPurities] = useState<MetalPurityRow[]>(mockPurities);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPurity, setEditingPurity] = useState<MetalPurityRow | null>(null);
    const [selectedPurities, setSelectedPurities] = useState<number[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<MetalPurityRow | null>(null);

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
        setLoading(false);
    }, []);

    const allSelected = useMemo(() => {
        if (purities.length === 0) return false;
        return selectedPurities.length === purities.length;
    }, [purities, selectedPurities]);

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedPurities([]);
        } else {
            setSelectedPurities(purities.map((p) => p.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedPurities((prev) =>
            prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
        );
    };

    const resetForm = () => {
        setEditingPurity(null);
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
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (purity: MetalPurityRow) => {
        setEditingPurity(purity);
        setFormData({
            metal_id: String(purity.metal_id),
            code: purity.code ?? '',
            name: purity.name,
            description: purity.description ?? '',
            is_active: purity.is_active,
            display_order: purity.display_order,
        });
        setModalOpen(true);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setTimeout(() => {
            const metal = mockMetals.find(m => String(m.id) === formData.metal_id) || null;
            if (editingPurity) {
                setPurities(purities.map(p => p.id === editingPurity.id ? { ...p, ...formData, metal_id: Number(formData.metal_id), metal } : p));
            } else {
                const newPurity: MetalPurityRow = {
                    id: Date.now(),
                    ...formData,
                    metal_id: Number(formData.metal_id),
                    metal
                };
                setPurities([...purities, newPurity]);
            }
            setProcessing(false);
            resetForm();
        }, 500);
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setPurities(purities.filter(p => p.id !== deleteConfirm.id));
            setDeleteConfirm(null);
        }
    };

    if (loading) return null;

    return (
        <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <header className="rounded-[3rem] bg-white p-12 shadow-2xl shadow-slate-200/60 border border-slate-100/50 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-[#AE8135] mb-4">Metallurgy</p>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Metal Purities</h1>
                    <p className="mt-4 text-lg text-slate-500 font-medium">Define specific purities for each base metal.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-3 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-black text-white shadow-2xl shadow-slate-900/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        <span className="uppercase tracking-widest">New Purity</span>
                    </button>
                </div>
            </header>

            <div className="overflow-hidden rounded-[3rem] bg-white shadow-2xl shadow-slate-200/60 border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50/50 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                        <tr>
                            <th className="px-10 py-6 text-left">
                                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-5 w-5 rounded-lg border-slate-200 text-slate-900 focus:ring-0" />
                            </th>
                            <th className="px-10 py-6 text-left">Purity Name</th>
                            <th className="px-10 py-6 text-left">Metal</th>
                            <th className="px-10 py-6 text-left">Order</th>
                            <th className="px-10 py-6 text-left">Status</th>
                            <th className="px-10 py-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {purities.map((purity) => (
                            <tr key={purity.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                <td className="px-10 py-8">
                                    <input type="checkbox" checked={selectedPurities.includes(purity.id)} onChange={() => toggleSelection(purity.id)} className="h-5 w-5 rounded-lg border-slate-200 text-slate-900 focus:ring-0" />
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{purity.code}</p>
                                        <span className="font-black text-slate-900 text-lg tracking-tight group-hover:text-sky-600 transition-colors">{purity.name}</span>
                                        {purity.description && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{purity.description}</span>}
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <span className="inline-block text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                        {purity.metal?.name ?? '—'}
                                    </span>
                                </td>
                                <td className="px-10 py-8 text-slate-500 font-bold tracking-tight">
                                    {purity.display_order}
                                </td>
                                <td className="px-10 py-8">
                                    <span className={`inline-flex rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest ${purity.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                        {purity.is_active ? 'Active' : 'Hidden'}
                                    </span>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <button onClick={() => openEditModal(purity)} className="p-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                        <button onClick={() => setDeleteConfirm(purity)} className="p-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all">
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">{editingPurity ? `Edit purity: ${editingPurity.name}` : 'Create new purity'}</h2>
                            <div className="flex items-center gap-3">
                                <button onClick={resetForm} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900">Cancel</button>
                                <button type="submit" form="purity-form" disabled={processing} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">{editingPurity ? 'Update purity' : 'Create purity'}</button>
                            </div>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={submit} className="space-y-6" id="purity-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Base Metal <span className="text-rose-500">*</span></span>
                                        <select value={formData.metal_id} onChange={e => setFormData(prev => ({ ...prev, metal_id: e.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20" required>
                                            <option value="">Select metal</option>
                                            {mockMetals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Code</span>
                                        <input type="text" value={formData.code} onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20" placeholder="e.g., 24K, 18K, 925" />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Name <span className="text-rose-500">*</span></span>
                                        <input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20" required />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Display order <span className="text-rose-500">*</span></span>
                                        <input type="number" value={formData.display_order} onChange={e => setFormData(prev => ({ ...prev, display_order: Number(e.target.value) }))} className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20" min={0} required />
                                    </label>
                                </div>
                                <div className="space-y-6">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} className="min-h-[200px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20" placeholder="Optional notes for internal team reference." />
                                    </label>
                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                        <input type="checkbox" checked={formData.is_active} onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold" />
                                        Active for selection
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal show={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete} title="Remove Purity" message={deleteConfirm ? `Are you sure you want to remove purity ${deleteConfirm.name}? This might affect existing configurations.` : ''} confirmText="Remove" variant="danger" />
        </div>
    );
}

