'use client';

import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';

type CustomerTypeRow = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    position: number;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

export default function AdminCustomerTypesIndex() {
    const [loading, setLoading] = useState(true);
    const [typesData, setTypesData] = useState<{ data: CustomerTypeRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 100 }
    });
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

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        setLoading(true);
        try {
            const response = await adminService.getCustomerTypes(1, 100);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: 100 };

            setTypesData({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    name: item.name,
                    slug: item.slug || item.name.toLowerCase().replace(/\s+/g, '-'),
                    description: item.description,
                    is_active: item.is_active,
                    position: Number(item.position || 0),
                })).sort((a: CustomerTypeRow, b: CustomerTypeRow) => a.position - b.position),
                meta: {
                    current_page: responseMeta.current_page || responseMeta.page || 1,
                    last_page: responseMeta.last_page || responseMeta.lastPage || 1,
                    total: responseMeta.total || 0,
                    per_page: responseMeta.per_page || responseMeta.perPage || 100,
                },
            });
        } catch (error: any) {
            console.error('Failed to load customer types:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) return;

        setProcessing(true);
        try {
            const payload: any = {
                name: formData.name,
                description: formData.description || null,
                is_active: formData.is_active,
                position: formData.position,
            };

            if (editingType) {
                await adminService.updateCustomerType(editingType.id, payload);
            } else {
                await adminService.createCustomerType(payload);
            }
            resetForm();
            await loadTypes();
        } catch (error: any) {
            console.error('Failed to save customer type:', error);
            alert(error.response?.data?.message || 'Failed to save customer type. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const toggleType = async (type: CustomerTypeRow) => {
        try {
            await adminService.updateCustomerType(type.id, { ...type, is_active: !type.is_active });
            await loadTypes();
        } catch (error: any) {
            console.error('Failed to toggle customer type status:', error);
            alert(error.response?.data?.message || 'Failed to update customer type. Please try again.');
        }
    };

    const deleteType = (type: CustomerTypeRow) => {
        setDeleteConfirm(type);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteCustomerType(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadTypes();
            } catch (error: any) {
                console.error('Failed to delete customer type:', error);
                alert(error.response?.data?.message || 'Failed to delete customer type. Please try again.');
            }
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

    const allSelected = typesData.data.length > 0 && selectedTypes.length === typesData.data.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedTypes([]);
            return;
        }
        setSelectedTypes(typesData.data.map((type) => type.id));
    };

    const bulkDelete = () => {
        if (selectedTypes.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        if (selectedTypes.length === 0) return;
        
        try {
            for (const id of selectedTypes) {
                await adminService.deleteCustomerType(id);
            }
            setSelectedTypes([]);
            setBulkDeleteConfirm(false);
            await loadTypes();
        } catch (error: any) {
            console.error('Failed to bulk delete customer types:', error);
            alert(error.response?.data?.message || 'Failed to delete customer types. Please try again.');
        }
    };

    useEffect(() => {
        setSelectedTypes((current) => current.filter((id) => typesData.data.some((type) => type.id === id)));
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
                        <div className="font-semibold text-slate-700">Results ({typesData.meta.total})</div>
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
                            {loading && typesData.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        Loading customer types...
                                    </td>
                                </tr>
                            ) : (
                                typesData.data.map((type) => (
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
                                ))
                            )}
                            {!loading && typesData.data.length === 0 && (
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

