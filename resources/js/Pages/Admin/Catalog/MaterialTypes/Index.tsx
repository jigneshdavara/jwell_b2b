import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type MaterialTypeRow = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    materials_count: number;
};

type Pagination<T> = {
    data: T[];
};

type MaterialTypesPageProps = PageProps<{
    materialTypes: Pagination<MaterialTypeRow>;
}>;

export default function AdminMaterialTypesIndex() {
    const { materialTypes } = usePage<MaterialTypesPageProps>().props;
    const [editingType, setEditingType] = useState<MaterialTypeRow | null>(null);
    const [selectedTypes, setSelectedTypes] = useState<number[]>([]);

    const form = useForm({
        name: '',
        description: '',
        is_active: true,
    });

    const resetForm = () => {
        setEditingType(null);
        form.reset();
        form.setData('is_active', true);
    };

    const populateForm = (type: MaterialTypeRow) => {
        setEditingType(type);
        form.setData({
            name: type.name,
            description: type.description ?? '',
            is_active: type.is_active,
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingType) {
            form.post(route('admin.catalog.material-types.update', editingType.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
                method: 'put',
            });
        } else {
            form.post(route('admin.catalog.material-types.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        }
    };

    const toggleType = (type: MaterialTypeRow) => {
        router.put(route('admin.catalog.material-types.update', type.id), {
            name: type.name,
            description: type.description,
            is_active: !type.is_active,
        }, {
            preserveScroll: true,
        });
    };

    const deleteType = (type: MaterialTypeRow) => {
        if (!window.confirm(`Remove material type ${type.name}?`)) {
            return;
        }

        router.delete(route('admin.catalog.material-types.destroy', type.id), {
            preserveScroll: true,
        });
    };

    const toggleSelection = (id: number) => {
        setSelectedTypes((current) => {
            if (current.includes(id)) {
                return current.filter((typeId) => typeId !== id);
            }

            return [...current, id];
        });
    };

    const allSelected = materialTypes.data.length > 0 && selectedTypes.length === materialTypes.data.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedTypes([]);

            return;
        }

        setSelectedTypes(materialTypes.data.map((type) => type.id));
    };

    const bulkDelete = () => {
        if (selectedTypes.length === 0) {
            return;
        }

        if (!window.confirm(`Delete ${selectedTypes.length} selected material type(s)? This will unassign them from materials.`)) {
            return;
        }

        router.delete(route('admin.catalog.material-types.bulk-destroy'), {
            data: { ids: selectedTypes },
            preserveScroll: true,
            onSuccess: () => setSelectedTypes([]),
        });
    };

    useEffect(() => {
        setSelectedTypes((current) => current.filter((id) => materialTypes.data.some((type) => type.id === id)));
    }, [materialTypes.data]);

    return (
        <AdminLayout>
            <Head title="Material types" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Material types</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Centralize alloy and gemstone categories to keep your material catalogue consistent.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingType ? `Edit material type ${editingType.name}` : 'Create new material type'}
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
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                required
                            />
                            {form.errors.name && <span className="text-xs text-rose-500">{form.errors.name}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Status</span>
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(event) => form.setData('is_active', event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                                    Active for materials
                                </span>
                            </div>
                            {form.errors.is_active && <span className="text-xs text-rose-500">{form.errors.is_active}</span>}
                        </label>
                    </div>

                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                        <span>Description</span>
                        <textarea
                            value={form.data.description}
                            onChange={(event) => form.setData('description', event.target.value)}
                            className="min-h-[120px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            placeholder="Optional notes for ateliers, e.g. alloy composition."
                        />
                        {form.errors.description && <span className="text-xs text-rose-500">{form.errors.description}</span>}
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
                            disabled={form.processing}
                            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {editingType ? 'Update material type' : 'Create material type'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
                        <div className="font-semibold text-slate-700">Results ({materialTypes.data.length})</div>
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
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        aria-label="Select all material types"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Slug</th>
                                <th className="px-5 py-3 text-left">Materials</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {materialTypes.data.map((type) => (
                                <tr key={type.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedTypes.includes(type.id)}
                                            onChange={() => toggleSelection(type.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select material type ${type.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{type.name}</span>
                                            {type.description && <span className="text-xs text-slate-500">{type.description}</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{type.slug}</td>
                                    <td className="px-5 py-3 text-slate-500">{type.materials_count}</td>
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
                            {materialTypes.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No material types available yet.
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

