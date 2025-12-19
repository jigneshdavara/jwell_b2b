'use client';

import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';

type CustomerTypeRow = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    position: number;
};

// Mock data for customer types
const mockCustomerTypes: CustomerTypeRow[] = [
    { id: 1, name: 'Retailer', slug: 'retailer', description: 'Individual retail customers', is_active: true, position: 1 },
    { id: 2, name: 'Wholesaler', slug: 'wholesaler', description: 'Bulk purchase customers', is_active: true, position: 2 },
    { id: 3, name: 'Sales', slug: 'sales', description: 'Sales representatives', is_active: true, position: 3 },
];

let nextId = mockCustomerTypes.length > 0 ? Math.max(...mockCustomerTypes.map(t => t.id)) + 1 : 1;

export default function AdminCustomerTypesIndex() {
    const [typesData, setTypesData] = useState<CustomerTypeRow[]>(mockCustomerTypes);
    const [editingType, setEditingType] = useState<CustomerTypeRow | null>(null);
    const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<CustomerTypeRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true,
        position: 0,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const resetForm = () => {
        setEditingType(null);
        setFormData({
            name: '',
            description: '',
            is_active: true,
            position: 0,
        });
        setErrors({});
    };

    const populateForm = (type: CustomerTypeRow) => {
        setEditingType(type);
        setFormData({
            name: type.name,
            description: type.description ?? '',
            is_active: type.is_active,
            position: type.position,
        });
        setErrors({});
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = 'Name is required.';
        if (formData.position < 0) newErrors.position = 'Position cannot be negative.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) return;

        setProcessing(true);
        setTimeout(() => {
            if (editingType) {
                setTypesData((prev) =>
                    prev.map((t) =>
                        t.id === editingType.id
                            ? {
                                  ...t,
                                  name: formData.name,
                                  slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
                                  description: formData.description,
                                  is_active: formData.is_active,
                                  position: formData.position,
                              }
                            : t,
                    ),
                );
            } else {
                const newType: CustomerTypeRow = {
                    id: nextId++,
                    name: formData.name,
                    slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
                    description: formData.description,
                    is_active: formData.is_active,
                    position: formData.position,
                };
                setTypesData((prev) => [...prev, newType].sort((a, b) => a.position - b.position));
            }
            resetForm();
            setProcessing(false);
        }, 500);
    };

    const toggleType = (type: CustomerTypeRow) => {
        setTimeout(() => {
            setTypesData((prev) =>
                prev.map((t) =>
                    t.id === type.id ? { ...t, is_active: !t.is_active } : t,
                ),
            );
        }, 300);
    };

    const deleteType = (type: CustomerTypeRow) => {
        setDeleteConfirm(type);
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setTimeout(() => {
                setTypesData((prev) => prev.filter((t) => t.id !== deleteConfirm.id));
                setDeleteConfirm(null);
            }, 300);
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedTypes((current) => {
            if (current.includes(id)) {
                return current.filter((typeId) => typeId !== id);
            }
            return [...current, id];
        });
    };

    const allSelected = typesData.length > 0 && selectedTypes.length === typesData.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedTypes([]);
            return;
        }
        setSelectedTypes(typesData.map((type) => type.id));
    };

    const bulkDelete = () => {
        if (selectedTypes.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = () => {
        setTimeout(() => {
            setTypesData((prev) => prev.filter((t) => !selectedTypes.includes(t.id)));
            setSelectedTypes([]);
            setBulkDeleteConfirm(false);
        }, 300);
    };

    useEffect(() => {
        setSelectedTypes((current) => current.filter((id) => typesData.some((type) => type.id === id)));
    }, [typesData]);

    return (
        <>
            <Head title="Customer types" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Customer types</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Define high-level classifications (e.g. Retail, Wholesale) to personalise onboarding, pricing, or campaigns.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingType ? `Edit customer type ${editingType.name}` : 'Create new customer type'}
                        </h2>
                        {editingType && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Name</span>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                required
                            />
                            {errors.name && <span className="text-xs text-rose-500">{errors.name}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Display order</span>
                            <input
                                type="number"
                                value={formData.position}
                                onChange={(event) => setFormData({ ...formData, position: Number(event.target.value) })}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                min={0}
                            />
                            {errors.position && <span className="text-xs text-rose-500">{errors.position}</span>}
                        </label>
                    </div>

                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                        <span>Description</span>
                        <textarea
                            value={formData.description}
                            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                            className="min-h-[120px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                            placeholder="Optional internal notes (e.g. pricing rules, sales reps)."
                        />
                        {errors.description && <span className="text-xs text-rose-500">{errors.description}</span>}
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                        />
                        Active for selection
                    </label>

                    <div className="flex justify-end gap-3">
                        {editingType && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                Cancel edit
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {editingType ? 'Update customer type' : 'Create customer type'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
                        <div className="font-semibold text-slate-700">Results ({typesData.length})</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedTypes.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedTypes.length === 0}
                                className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Bulk delete
                            </button>
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                        aria-label="Select all customer types"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Slug</th>
                                <th className="px-5 py-3 text-left">Order</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {typesData.map((type) => (
                                <tr key={type.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedTypes.includes(type.id)}
                                            onChange={() => toggleSelection(type.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                            aria-label={`Select customer type ${type.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{type.name}</span>
                                            {type.description && <span className="text-xs text-slate-500">{type.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{type.slug}</td>
                                    <td className="px-5 py-3 text-slate-500">{type.position}</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                type.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {type.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => populateForm(type)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleType(type)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                {type.is_active ? 'Pause' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteType(type)}
                                                className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {typesData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No customer types defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                show={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Remove Customer Type"
                message={deleteConfirm ? `Are you sure you want to remove customer type ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Customer Types"
                message={`Are you sure you want to delete ${selectedTypes.length} selected customer type(s)?`}
                confirmText="Delete"
                variant="danger"
            />
        </>
    );
}

