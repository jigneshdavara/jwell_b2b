import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type DiamondCutRow = {
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

type DiamondCutsPageProps = PageProps<{
    cuts: Pagination<DiamondCutRow>;
}>;

export default function AdminDiamondCutsIndex() {
    const { cuts } = usePage<DiamondCutsPageProps>().props;
    const [editingCut, setEditingCut] = useState<DiamondCutRow | null>(null);
    const [selectedCuts, setSelectedCuts] = useState<number[]>([]);

    const form = useForm({
        name: '',
        description: '',
        is_active: true,
        position: 0,
    });

    const resetForm = () => {
        setEditingCut(null);
        form.reset();
        form.setData('is_active', true);
        form.setData('position', 0);
    };

    const populateForm = (cut: DiamondCutRow) => {
        setEditingCut(cut);
        form.setData({
            name: cut.name,
            description: cut.description ?? '',
            is_active: cut.is_active,
            position: cut.position,
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingCut) {
            form.post(route('admin.diamond.cuts.update', editingCut.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
                method: 'put',
            });
        } else {
            form.post(route('admin.diamond.cuts.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        }
    };

    const toggleCut = (cut: DiamondCutRow) => {
        router.put(route('admin.diamond.cuts.update', cut.id), {
            name: cut.name,
            description: cut.description,
            is_active: !cut.is_active,
            position: cut.position,
        }, {
            preserveScroll: true,
        });
    };

    const deleteCut = (cut: DiamondCutRow) => {
        if (!window.confirm(`Remove diamond cut ${cut.name}?`)) {
            return;
        }

        router.delete(route('admin.diamond.cuts.destroy', cut.id), {
            preserveScroll: true,
        });
    };

    const toggleSelection = (id: number) => {
        setSelectedCuts((current) => {
            if (current.includes(id)) {
                return current.filter((cutId) => cutId !== id);
            }

            return [...current, id];
        });
    };

    const allSelected = cuts.data.length > 0 && selectedCuts.length === cuts.data.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedCuts([]);

            return;
        }

        setSelectedCuts(cuts.data.map((cut) => cut.id));
    };

    const bulkDelete = () => {
        if (selectedCuts.length === 0) {
            return;
        }

        if (!window.confirm(`Delete ${selectedCuts.length} selected diamond cut grade(s)?`)) {
            return;
        }

        router.delete(route('admin.diamond.cuts.bulk-destroy'), {
            data: { ids: selectedCuts },
            preserveScroll: true,
            onSuccess: () => setSelectedCuts([]),
        });
    };

    useEffect(() => {
        setSelectedCuts((current) => current.filter((id) => cuts.data.some((cut) => cut.id === id)));
    }, [cuts.data]);

    return (
        <AdminLayout>
            <Head title="Diamond cut grades" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Diamond cut grades</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Configure cut quality references (e.g. Excellent, Very Good) for product workflows.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingCut ? `Edit cut grade ${editingCut.name}` : 'Create new cut grade'}
                        </h2>
                        {editingCut && (
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
                            placeholder="Optional notes (e.g. facet proportions guidance)."
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
                        {editingCut && (
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
                            {editingCut ? 'Update cut grade' : 'Create cut grade'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
                        <div className="font-semibold text-slate-700">Results ({cuts.data.length})</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedCuts.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedCuts.length === 0}
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
                                        aria-label="Select all cut grades"
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
                            {cuts.data.map((cut) => (
                                <tr key={cut.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedCuts.includes(cut.id)}
                                            onChange={() => toggleSelection(cut.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select cut grade ${cut.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{cut.name}</span>
                                            {cut.description && <span className="text-xs text-slate-500">{cut.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{cut.slug}</td>
                                    <td className="px-5 py-3 text-slate-500">{cut.position}</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                cut.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {cut.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => populateForm(cut)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleCut(cut)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                {cut.is_active ? 'Pause' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteCut(cut)}
                                                className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {cuts.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No cut grades defined yet.
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

