import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type GoldPurityRow = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    position: number;
};

type Pagination<T> = {
    data: T[];
};

type GoldPuritiesPageProps = PageProps<{
    purities: Pagination<GoldPurityRow>;
}>;

export default function AdminGoldPuritiesIndex() {
    const { purities } = usePage<GoldPuritiesPageProps>().props;
    const [editingPurity, setEditingPurity] = useState<GoldPurityRow | null>(null);
    const [selectedPurities, setSelectedPurities] = useState<number[]>([]);

    const form = useForm({
        name: '',
        description: '',
        is_active: true,
        position: 0,
    });

    const resetForm = () => {
        setEditingPurity(null);
        form.reset();
        form.setData('is_active', true);
        form.setData('position', 0);
    };

    const populateForm = (purity: GoldPurityRow) => {
        setEditingPurity(purity);
        form.setData({
            name: purity.name,
            description: purity.description ?? '',
            is_active: purity.is_active,
            position: purity.position,
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingPurity) {
            form.post(route('admin.gold.purities.update', editingPurity.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
                method: 'put',
            });
        } else {
            form.post(route('admin.gold.purities.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        }
    };

    const togglePurity = (purity: GoldPurityRow) => {
        router.put(route('admin.gold.purities.update', purity.id), {
            name: purity.name,
            description: purity.description,
            is_active: !purity.is_active,
            position: purity.position,
        }, {
            preserveScroll: true,
        });
    };

    const deletePurity = (purity: GoldPurityRow) => {
        if (!window.confirm(`Remove gold purity ${purity.name}?`)) {
            return;
        }

        router.delete(route('admin.gold.purities.destroy', purity.id), {
            preserveScroll: true,
        });
    };

    const toggleSelection = (id: number) => {
        setSelectedPurities((current) => {
            if (current.includes(id)) {
                return current.filter((purityId) => purityId !== id);
            }

            return [...current, id];
        });
    };

    const allSelected = purities.data.length > 0 && selectedPurities.length === purities.data.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedPurities([]);

            return;
        }

        setSelectedPurities(purities.data.map((purity) => purity.id));
    };

    const bulkDelete = () => {
        if (selectedPurities.length === 0) {
            return;
        }

        if (!window.confirm(`Delete ${selectedPurities.length} selected gold purity value(s)?`)) {
            return;
        }

        router.delete(route('admin.gold.purities.bulk-destroy'), {
            data: { ids: selectedPurities },
            preserveScroll: true,
            onSuccess: () => setSelectedPurities([]),
        });
    };

    useEffect(() => {
        setSelectedPurities((current) => current.filter((id) => purities.data.some((purity) => purity.id === id)));
    }, [purities.data]);

    return (
        <AdminLayout>
            <Head title="Gold purities" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Gold purities</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Capture the fineness values your team uses (e.g. 22K, 18K), so product setup stays consistent.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingPurity ? `Edit gold purity ${editingPurity.name}` : 'Create new gold purity'}
                        </h2>
                        {editingPurity && (
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
                            <span>Display order</span>
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

                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                        <span>Description</span>
                        <textarea
                            value={form.data.description}
                            onChange={(event) => form.setData('description', event.target.value)}
                            className="min-h-[120px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            placeholder="Optional additional notes (e.g. BIS hallmark reference)."
                        />
                        {form.errors.description && <span className="text-xs text-rose-500">{form.errors.description}</span>}
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) => form.setData('is_active', event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        Active for selection
                    </label>

                    <div className="flex justify-end gap-3">
                        {editingPurity && (
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
                            {editingPurity ? 'Update gold purity' : 'Create gold purity'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
                        <div className="font-semibold text-slate-700">Results ({purities.data.length})</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedPurities.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedPurities.length === 0}
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
                                        aria-label="Select all gold purities"
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
                            {purities.data.map((purity) => (
                                <tr key={purity.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedPurities.includes(purity.id)}
                                            onChange={() => toggleSelection(purity.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select gold purity ${purity.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{purity.name}</span>
                                            {purity.description && <span className="text-xs text-slate-500">{purity.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{purity.slug}</td>
                                    <td className="px-5 py-3 text-slate-500">{purity.position}</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                purity.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {purity.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => populateForm(purity)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => togglePurity(purity)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                {purity.is_active ? 'Pause' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deletePurity(purity)}
                                                className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {purities.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No gold purities defined yet.
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
