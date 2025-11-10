import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type DiamondClarityRow = {
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

type DiamondClaritiesPageProps = PageProps<{
    clarities: Pagination<DiamondClarityRow>;
}>;

export default function AdminDiamondClaritiesIndex() {
    const { clarities } = usePage<DiamondClaritiesPageProps>().props;
    const [editingClarity, setEditingClarity] = useState<DiamondClarityRow | null>(null);
    const [selectedClarities, setSelectedClarities] = useState<number[]>([]);

    const form = useForm({
        name: '',
        description: '',
        is_active: true,
        position: 0,
    });

    const resetForm = () => {
        setEditingClarity(null);
        form.reset();
        form.setData('is_active', true);
        form.setData('position', 0);
    };

    const populateForm = (clarity: DiamondClarityRow) => {
        setEditingClarity(clarity);
        form.setData({
            name: clarity.name,
            description: clarity.description ?? '',
            is_active: clarity.is_active,
            position: clarity.position,
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingClarity) {
            form.post(route('admin.diamond.clarities.update', editingClarity.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
                method: 'put',
            });
        } else {
            form.post(route('admin.diamond.clarities.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        }
    };

    const toggleClarity = (clarity: DiamondClarityRow) => {
        router.put(route('admin.diamond.clarities.update', clarity.id), {
            name: clarity.name,
            description: clarity.description,
            is_active: !clarity.is_active,
            position: clarity.position,
        }, {
            preserveScroll: true,
        });
    };

    const deleteClarity = (clarity: DiamondClarityRow) => {
        if (!window.confirm(`Remove diamond clarity ${clarity.name}?`)) {
            return;
        }

        router.delete(route('admin.diamond.clarities.destroy', clarity.id), {
            preserveScroll: true,
        });
    };

    const toggleSelection = (id: number) => {
        setSelectedClarities((current) => {
            if (current.includes(id)) {
                return current.filter((clarityId) => clarityId !== id);
            }

            return [...current, id];
        });
    };

    const allSelected = clarities.data.length > 0 && selectedClarities.length === clarities.data.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedClarities([]);

            return;
        }

        setSelectedClarities(clarities.data.map((clarity) => clarity.id));
    };

    const bulkDelete = () => {
        if (selectedClarities.length === 0) {
            return;
        }

        if (!window.confirm(`Delete ${selectedClarities.length} selected diamond clarity grade(s)?`)) {
            return;
        }

        router.delete(route('admin.diamond.clarities.bulk-destroy'), {
            data: { ids: selectedClarities },
            preserveScroll: true,
            onSuccess: () => setSelectedClarities([]),
        });
    };

    useEffect(() => {
        setSelectedClarities((current) => current.filter((id) => clarities.data.some((clarity) => clarity.id === id)));
    }, [clarities.data]);

    return (
        <AdminLayout>
            <Head title="Diamond clarity grades" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Diamond clarity grades</h1>
                    <p className="mt-2 text-sm text-slate-500">Define clarity scales (e.g. IF, VVS1) for quoting and catalogue metadata.</p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingClarity ? `Edit clarity grade ${editingClarity.name}` : 'Create new clarity grade'}
                        </h2>
                        {editingClarity && (
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
                            placeholder="Optional notes (e.g. GIA inclusions guidance)."
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
                        {editingClarity && (
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
                            {editingClarity ? 'Update clarity grade' : 'Create clarity grade'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
                        <div className="font-semibold text-slate-700">Results ({clarities.data.length})</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedClarities.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedClarities.length === 0}
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
                                        aria-label="Select all clarity grades"
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
                            {clarities.data.map((clarity) => (
                                <tr key={clarity.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedClarities.includes(clarity.id)}
                                            onChange={() => toggleSelection(clarity.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select clarity grade ${clarity.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{clarity.name}</span>
                                            {clarity.description && <span className="text-xs text-slate-500">{clarity.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{clarity.slug}</td>
                                    <td className="px-5 py-3 text-slate-500">{clarity.position}</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                clarity.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {clarity.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => populateForm(clarity)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleClarity(clarity)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                {clarity.is_active ? 'Pause' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteClarity(clarity)}
                                                className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {clarities.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No clarity grades defined yet.
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

