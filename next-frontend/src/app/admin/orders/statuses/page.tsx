'use client';

import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useEffect, useMemo, useState } from 'react';

type OrderStatusRow = {
    id: number;
    name: string;
    slug: string;
    color: string;
    is_default: boolean;
    is_active: boolean;
    position: number;
};

// Mock data for order statuses
const mockOrderStatuses: OrderStatusRow[] = [
    { id: 1, name: 'Pending', slug: 'pending', color: '#f59e0b', is_default: true, is_active: true, position: 1 },
    { id: 2, name: 'Processing', slug: 'processing', color: '#3b82f6', is_default: false, is_active: true, position: 2 },
    { id: 3, name: 'Shipped', slug: 'shipped', color: '#22c55e', is_default: false, is_active: true, position: 3 },
    { id: 4, name: 'Delivered', slug: 'delivered', color: '#10b981', is_default: false, is_active: true, position: 4 },
    { id: 5, name: 'Cancelled', slug: 'cancelled', color: '#ef4444', is_default: false, is_active: true, position: 5 },
    { id: 6, name: 'Refunded', slug: 'refunded', color: '#6b7280', is_default: false, is_active: false, position: 6 },
];

let nextId = mockOrderStatuses.length > 0 ? Math.max(...mockOrderStatuses.map(s => s.id)) + 1 : 1;

export default function AdminOrderStatusesIndex() {
    // Replace usePage with local state for mock data
    const [statusesData, setStatusesData] = useState<OrderStatusRow[]>(mockOrderStatuses);
    const [editingStatus, setEditingStatus] = useState<OrderStatusRow | null>(null);
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<OrderStatusRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        color: '#64748b',
        is_default: false,
        is_active: true,
        position: 0,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const resetForm = () => {
        setEditingStatus(null);
        setFormData({
            name: '',
            color: '#64748b',
            is_default: false,
            is_active: true,
            position: 0,
        });
        setErrors({});
    };

    const populateForm = (status: OrderStatusRow) => {
        setEditingStatus(status);
        setFormData({
            name: status.name,
            color: status.color ?? '#64748b',
            is_default: status.is_default,
            is_active: status.is_active,
            position: status.position,
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);

        // Simulate API call
        setTimeout(() => {
            if (editingStatus) {
                // Update existing status
                setStatusesData((prev) =>
                    prev.map((s) =>
                        s.id === editingStatus.id
                            ? {
                                  ...s,
                                  name: formData.name,
                                  slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
                                  color: formData.color,
                                  is_default: formData.is_default,
                                  is_active: formData.is_active,
                                  position: formData.position,
                              }
                            : (formData.is_default && s.is_default) // If new status is default, unset old default
                              ? { ...s, is_default: false }
                              : s,
                    ),
                );
            } else {
                // Create new status
                const newStatus: OrderStatusRow = {
                    id: nextId++,
                    name: formData.name,
                    slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
                    color: formData.color,
                    is_default: formData.is_default,
                    is_active: formData.is_active,
                    position: formData.position,
                };
                setStatusesData((prev) =>
                    [
                        ...prev.map((s) =>
                            formData.is_default && s.is_default ? { ...s, is_default: false } : s,
                        ),
                        newStatus,
                    ].sort((a, b) => a.position - b.position),
                );
            }
            setProcessing(false);
            resetForm();
        }, 500);
    };

    const toggleStatus = (status: OrderStatusRow) => {
        setTimeout(() => {
            setStatusesData((prev) =>
                prev.map((s) =>
                    s.id === status.id ? { ...s, is_active: !s.is_active } : s,
                ),
            );
        }, 300);
    };

    const setDefaultStatus = (status: OrderStatusRow) => {
        setTimeout(() => {
            setStatusesData((prev) =>
                prev.map((s) => ({
                    ...s,
                    is_default: s.id === status.id,
                })),
            );
        }, 300);
    };

    const deleteStatus = (status: OrderStatusRow) => {
        setDeleteConfirm(status);
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setTimeout(() => {
                setStatusesData((prev) => prev.filter((s) => s.id !== deleteConfirm.id));
                setDeleteConfirm(null);
            }, 300);
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedStatuses((current) => {
            if (current.includes(id)) {
                return current.filter((selectedId) => selectedId !== id);
            }

            return [...current, id];
        });
    };

    const allSelected = statusesData.length > 0 && selectedStatuses.length === statusesData.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedStatuses([]);
            return;
        }

        setSelectedStatuses(statusesData.map((status) => status.id));
    };

    const bulkDelete = () => {
        if (selectedStatuses.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = () => {
        setTimeout(() => {
            setStatusesData((prev) => prev.filter((s) => !selectedStatuses.includes(s.id)));
            setSelectedStatuses([]);
            setBulkDeleteConfirm(false);
        }, 300);
    };

    useEffect(() => {
        setSelectedStatuses((current) => current.filter((id) => statusesData.some((status) => status.id === id)));
    }, [statusesData]);

    const statuses = {
        data: statusesData,
    };

    return (
        <>
            <Head title="Order statuses" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Order statuses</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Configure the lifecycle stages that orders move through. One status must be marked as the default for new orders.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingStatus ? `Edit status ${editingStatus.name}` : 'Create new order status'}
                        </h2>
                        {editingStatus && (
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
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                required
                            />
                            {errors.name && <span className="text-xs text-rose-500">{errors.name}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Position</span>
                            <input
                                type="number"
                                value={formData.position}
                                onChange={(event) => setFormData({ ...formData, position: Number(event.target.value) })}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                min={0}
                            />
                            {errors.position && <span className="text-xs text-rose-500">{errors.position}</span>}
                        </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Color (hex)</span>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={formData.color || '#64748b'}
                                    onChange={(event) => setFormData({ ...formData, color: event.target.value })}
                                    className="h-10 w-16 rounded-md border border-slate-300 bg-white"
                                />
                                <input
                                    type="text"
                                    value={formData.color}
                                    onChange={(event) => setFormData({ ...formData, color: event.target.value })}
                                    className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    placeholder="#64748b"
                                    maxLength={7}
                                />
                            </div>
                            {errors.color && <span className="text-xs text-rose-500">{errors.color}</span>}
                        </label>
                        <div className="flex flex-col gap-3 text-sm text-slate-600">
                            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                Active status
                            </label>
                            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={formData.is_default}
                                    onChange={(event) => setFormData({ ...formData, is_default: event.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                Default for new orders
                            </label>
                            {errors.is_default && <span className="text-xs text-rose-500">{errors.is_default}</span>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        {editingStatus && (
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
                            {editingStatus ? 'Save changes' : 'Create status'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
                        <div className="font-semibold text-slate-700">Results ({statuses.data.length})</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedStatuses.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedStatuses.length === 0}
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
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        aria-label="Select all order statuses"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Slug</th>
                                <th className="px-5 py-3 text-left">Color</th>
                                <th className="px-5 py-3 text-left">Order</th>
                                <th className="px-5 py-3 text-left">Default</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {statuses.data.map((status) => (
                                <tr key={status.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedStatuses.includes(status.id)}
                                            onChange={() => toggleSelection(status.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select order status ${status.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">{status.name}</td>
                                    <td className="px-5 py-3 text-slate-400">{status.slug}</td>
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                                            <span
                                                className="h-3 w-3 rounded-full border border-slate-200"
                                                style={{ backgroundColor: status.color }}
                                            />
                                            {status.color}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{status.position}</td>
                                    <td className="px-5 py-3">
                                        {status.is_default ? (
                                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                Default
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setDefaultStatus(status)}
                                                className="text-xs font-semibold text-sky-600 hover:text-sky-800"
                                            >
                                                Set default
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                status.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {status.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => populateForm(status)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleStatus(status)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                {status.is_active ? 'Pause' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteStatus(status)}
                                                className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {statuses.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No order statuses defined yet.
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
                title="Remove Order Status"
                message={deleteConfirm ? `Are you sure you want to remove order status ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Order Statuses"
                message={`Are you sure you want to delete ${selectedStatuses.length} selected order status(es)?`}
                confirmText="Delete"
                variant="danger"
            />
        </>
    );
}
