import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type MaterialRow = {
    id: number;
    name: string;
    type?: string | null;
    purity?: string | null;
    unit?: string | null;
    is_active: boolean;
    products_count: number;
};

type Pagination<T> = {
    data: T[];
};

type MaterialsPageProps = PageProps<{
    materials: Pagination<MaterialRow>;
    units: string[];
    types: string[];
}>;

export default function AdminMaterialsIndex() {
    const { materials, units, types } = usePage<MaterialsPageProps>().props;
    const [editingMaterial, setEditingMaterial] = useState<MaterialRow | null>(null);

    const materialForm = useForm({
        name: '',
        type: '',
        purity: '',
        unit: '',
        is_active: true,
    });

    const unitOptions = useMemo(() => Array.from(new Set(units.filter(Boolean))), [units]);
    const typeOptions = useMemo(() => Array.from(new Set(types.filter(Boolean))), [types]);

    const resetForm = () => {
        setEditingMaterial(null);
        materialForm.reset();
        materialForm.setData('is_active', true);
    };

    const populateForm = (material: MaterialRow) => {
        setEditingMaterial(material);
        materialForm.setData({
            name: material.name,
            type: material.type ?? '',
            purity: material.purity ?? '',
            unit: material.unit ?? '',
            is_active: material.is_active,
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingMaterial) {
            materialForm.post(route('admin.catalog.materials.update', editingMaterial.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
                method: 'put',
            });
        } else {
            materialForm.post(route('admin.catalog.materials.store'), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        }
    };

    const toggleMaterial = (material: MaterialRow) => {
        router.put(route('admin.catalog.materials.update', material.id), {
            name: material.name,
            type: material.type,
            purity: material.purity,
            unit: material.unit,
            is_active: !material.is_active,
        }, {
            preserveScroll: true,
        });
    };

    const deleteMaterial = (material: MaterialRow) => {
        if (!window.confirm(`Remove material ${material.name}?`)) {
            return;
        }

        router.delete(route('admin.catalog.materials.destroy', material.id), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Materials" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Materials</h1>
                    <p className="mt-2 text-sm text-slate-500">Maintain available alloys and units for pricing and catalogue metadata.</p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingMaterial ? `Edit material ${editingMaterial.name}` : 'Create new material'}
                        </h2>
                        {editingMaterial && (
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
                                value={materialForm.data.name}
                                onChange={(event) => materialForm.setData('name', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                required
                            />
                            {materialForm.errors.name && <span className="text-xs text-rose-500">{materialForm.errors.name}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Type</span>
                            <input
                                list="material-type-library"
                                value={materialForm.data.type}
                                onChange={(event) => materialForm.setData('type', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="Gold / Diamond / Alloy"
                            />
                            {materialForm.errors.type && <span className="text-xs text-rose-500">{materialForm.errors.type}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Purity</span>
                            <input
                                type="text"
                                value={materialForm.data.purity}
                                onChange={(event) => materialForm.setData('purity', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="18K / 22K / VVS / etc"
                            />
                            {materialForm.errors.purity && <span className="text-xs text-rose-500">{materialForm.errors.purity}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Unit</span>
                            <input
                                list="material-unit-library"
                                value={materialForm.data.unit}
                                onChange={(event) => materialForm.setData('unit', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="g / ct / pcs"
                            />
                            {materialForm.errors.unit && <span className="text-xs text-rose-500">{materialForm.errors.unit}</span>}
                        </label>
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={materialForm.data.is_active}
                            onChange={(event) => materialForm.setData('is_active', event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        Active for product selection
                    </label>

                    <div className="flex justify-end gap-3">
                        {editingMaterial && (
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
                            disabled={materialForm.processing}
                            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {editingMaterial ? 'Update material' : 'Create material'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Type</th>
                                <th className="px-5 py-3 text-left">Purity</th>
                                <th className="px-5 py-3 text-left">Unit</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {materials.data.map((material) => (
                                <tr key={material.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{material.name}</td>
                                    <td className="px-5 py-3 text-slate-500">{material.type ?? '—'}</td>
                                    <td className="px-5 py-3 text-slate-500">{material.purity ?? '—'}</td>
                                    <td className="px-5 py-3 text-slate-500">{material.unit ?? '—'}</td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                material.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {material.is_active ? 'Active' : 'Archived'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => populateForm(material)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleMaterial(material)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                {material.is_active ? 'Pause' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteMaterial(material)}
                                                className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {materials.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No materials available yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <datalist id="material-type-library">
                {typeOptions.map((option) => (
                    <option key={option} value={option} />
                ))}
            </datalist>
            <datalist id="material-unit-library">
                {unitOptions.map((option) => (
                    <option key={option} value={option} />
                ))}
            </datalist>
        </AdminLayout>
    );
}
