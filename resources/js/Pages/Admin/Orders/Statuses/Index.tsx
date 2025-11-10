import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
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

type Pagination<T> = {
    data: T[];
};

type OrderStatusPageProps = PageProps<{
    statuses: Pagination<OrderStatusRow>;
}>;

export default function AdminOrderStatusesIndex() {
    const { statuses } = usePage<OrderStatusPageProps>().props;
    const [editingStatus, setEditingStatus] = useState<OrderStatusRow | null>(null);
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([]);

    const form = useForm({
        name: '',
        color: '#64748b',
        is_default: false,
        is_active: true,
        position: 0,
    });

    const resetForm = () => {
        setEditingStatus(null);
        form.reset();
        form.setData({
            name: '',
            color: '#64748b',
            is_default: false,
            is_active: true,
            position: 0,
        });
    };

    const populateForm = (status: OrderStatusRow) => {
        setEditingStatus(status);
        form.setData({
            name: status.name,
            color: status.color ?? '#64748b',
            is_default: status.is_default,
            is_active: status.is_active,
            position: status.position,
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingStatus) {
            form.post(route('admin.orders.statuses.update', editingStatus.id), {
                preserveScroll: true,
                method: 'put',
                onSuccess: () => resetForm(),
            });
        } else {
            form.post(route('admin.orders.statuses.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        }
    };

    const toggleStatus = (status: OrderStatusRow) => {
        router.put(
            route('admin.orders.statuses.update', status.id),
            {
                name: status.name,
                color: status.color,
                is_default: status.is_default,
                is_active: !status.is_active,
                position: status.position,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const setDefaultStatus = (status: OrderStatusRow) => {
        router.put(
            route('admin.orders.statuses.update', status.id),
            {
                name: status.name,
                color: status.color,
                is_default: true,
                is_active: status.is_active,
                position: status.position,
            },
            { preserveScroll: true },
        );
    };

    const deleteStatus = (status: OrderStatusRow) => {
        if (!window.confirm(`Remove order status ${status.name}?`)) {
            return;
        }

        router.delete(route('admin.orders.statuses.destroy', status.id), {
            preserveScroll: true,
        });
    };

    const toggleSelection = (id: number) => {
        setSelectedStatuses((current) => {
            if (current.includes(id)) {
                return current.filter((selectedId) => selectedId !== id);
            }

            return [...current, id];
        });
    };

    const allSelected = statuses.data.length > 0 && selectedStatuses.length === statuses.data.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedStatuses([]);

            return;
        }

        setSelectedStatuses(statuses.data.map((status) => status.id));
    };

    const bulkDelete = () => {
        if (selectedStatuses.length === 0) {
            return;
        }

        if (!window.confirm(`Delete ${selectedStatuses.length} selected order status(es)?`)) {
            return;
        }

        router.delete(route('admin.orders.statuses.bulk-destroy'), {
            data: { ids: selectedStatuses },
            preserveScroll: true,
            onSuccess: () => setSelectedStatuses([]),
        });
    };

    useEffect(() => {
        setSelectedStatuses((current) => current.filter((id) => statuses.data.some((status) => status.id === id)));
    }, [statuses.data]);

    const defaultStatusId = useMemo(
        () => statuses.data.find((status) => status.is_default)?.id ?? null,
        [statuses.data],
    );

    return (
        <AdminLayout>
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
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                required
                            />
                            {form.errors.name && <span className="text-xs text-rose-500">{form.errors.name}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Position</span>
                            <input
                                type="number"
                                value={form.data.position}
                                onChange={(event) => form.setData('position', Number(event.target.value))}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                min={0}
                            />
                            {form.errors.position && <span className="text-xs text-rose-500">{form.errors.position}</span>}
                        </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Color (hex)</span>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={form.data.color || '#64748b'}
                                    onChange={(event) => form.setData('color', event.target.value)}
                                    className="h-10 w-16 rounded-md border border-slate-300 bg-white"
                                />
                                <input
                                    type="text"
                                    value={form.data.color}
                                    onChange={(event) => form.setData('color', event.target.value)}
                                    className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    placeholder="#64748b"
                                    maxLength={7}
                                />
                            </div>
                            {form.errors.color && <span className="text-xs text-rose-500">{form.errors.color}</span>}
                        </label>
                        <div className="flex flex-col gap-3 text-sm text-slate-600">
                            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(event) => form.setData('is_active', event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                Active status
                            </label>
                            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_default}
                                    onChange={(event) => form.setData('is_default', event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                Default for new orders
                            </label>
                            {form.errors.is_default && <span className="text-xs text-rose-500">{form.errors.is_default}</span>}
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
                            disabled={form.processing}
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
        </AdminLayout>
    );
}

