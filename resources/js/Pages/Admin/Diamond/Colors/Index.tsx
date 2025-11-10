import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type DiamondColorRow = {
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

type DiamondColorsPageProps = PageProps<{
    colors: Pagination<DiamondColorRow>;
}>;

export default function AdminDiamondColorsIndex() {
    const { colors } = usePage<DiamondColorsPageProps>().props;
    const [editingColor, setEditingColor] = useState<DiamondColorRow | null>(null);
    const [selectedColors, setSelectedColors] = useState<number[]>([]);

    const form = useForm({
        name: '',
        description: '',
        is_active: true,
        position: 0,
    });

    const resetForm = () => {
        setEditingColor(null);
        form.reset();
        form.setData('is_active', true);
        form.setData('position', 0);
    };

    const populateForm = (color: DiamondColorRow) => {
        setEditingColor(color);
        form.setData({
            name: color.name,
            description: color.description ?? '',
            is_active: color.is_active,
            position: color.position,
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingColor) {
            form.post(route('admin.diamond.colors.update', editingColor.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
                method: 'put',
            });
        } else {
            form.post(route('admin.diamond.colors.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        }
    };

    const toggleColor = (color: DiamondColorRow) => {
        router.put(route('admin.diamond.colors.update', color.id), {
            name: color.name,
            description: color.description,
            is_active: !color.is_active,
            position: color.position,
        }, {
            preserveScroll: true,
        });
    };

    const deleteColor = (color: DiamondColorRow) => {
        if (!window.confirm(`Remove diamond color ${color.name}?`)) {
            return;
        }

        router.delete(route('admin.diamond.colors.destroy', color.id), {
            preserveScroll: true,
        });
    };

    const toggleSelection = (id: number) => {
        setSelectedColors((current) => {
            if (current.includes(id)) {
                return current.filter((colorId) => colorId !== id);
            }

            return [...current, id];
        });
    };

    const allSelected = colors.data.length > 0 && selectedColors.length === colors.data.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedColors([]);

            return;
        }

        setSelectedColors(colors.data.map((color) => color.id));
    };

    const bulkDelete = () => {
        if (selectedColors.length === 0) {
            return;
        }

        if (!window.confirm(`Delete ${selectedColors.length} selected diamond color(s)?`)) {
            return;
        }

        router.delete(route('admin.diamond.colors.bulk-destroy'), {
            data: { ids: selectedColors },
            preserveScroll: true,
            onSuccess: () => setSelectedColors([]),
        });
    };

    useEffect(() => {
        setSelectedColors((current) => current.filter((id) => colors.data.some((color) => color.id === id)));
    }, [colors.data]);

    return (
        <AdminLayout>
            <Head title="Diamond colors" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Diamond colors</h1>
                    <p className="mt-2 text-sm text-slate-500">Maintain color grading options (e.g. D, E, F) for your inventory.</p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingColor ? `Edit diamond color ${editingColor.name}` : 'Create new diamond color'}
                        </h2>
                        {editingColor && (
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
                            placeholder="Optional notes (e.g. GIA scale reference)."
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
                        {editingColor && (
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
                            {editingColor ? 'Update diamond color' : 'Create diamond color'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
                        <div className="font-semibold text-slate-700">Results ({colors.data.length})</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedColors.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedColors.length === 0}
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
                                        aria-label="Select all diamond colors"
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
                            {colors.data.map((color) => (
                                <tr key={color.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedColors.includes(color.id)}
                                            onChange={() => toggleSelection(color.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select diamond color ${color.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{color.name}</span>
                                            {color.description && <span className="text-xs text-slate-500">{color.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{color.slug}</td>
                                    <td className="px-5 py-3 text-slate-500">{color.position}</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                color.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {color.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => populateForm(color)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleColor(color)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                {color.is_active ? 'Pause' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteColor(color)}
                                                className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {colors.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No diamond colors defined yet.
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

