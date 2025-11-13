import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type MaterialRow = {
    id: number;
    name: string;
    material_type_id: number | null;
    material_type_name?: string | null;
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
    materialTypes: Array<{
        id: number;
        name: string;
        is_active: boolean;
    }>;
}>;

export default function AdminMaterialsIndex() {
    const { materials, units, materialTypes } = usePage<MaterialsPageProps>().props;
    const [editingMaterial, setEditingMaterial] = useState<MaterialRow | null>(null);
    const [selectedMaterials, setSelectedMaterials] = useState<number[]>([]);

    const materialForm = useForm({
        name: '',
        material_type_id: '',
        purity: '',
        unit: '',
        is_active: true,
    });

    useEffect(() => {
        materialForm.transform((data) => ({
            ...data,
            material_type_id: data.material_type_id ? Number(data.material_type_id) : null,
        }));
    }, [materialForm]);

    const unitOptions = useMemo(() => Array.from(new Set(units.filter(Boolean))), [units]);
    const materialTypeOptions = useMemo(() => materialTypes, [materialTypes]);

    const resetForm = () => {
        setEditingMaterial(null);
        materialForm.reset();
        materialForm.setData('is_active', true);
        materialForm.setData('material_type_id', '');
    };

    const populateForm = (material: MaterialRow) => {
        setEditingMaterial(material);
        materialForm.setData({
            name: material.name,
            material_type_id: material.material_type_id ? String(material.material_type_id) : '',
            purity: material.purity ?? '',
            unit: material.unit ?? '',
            is_active: material.is_active,
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingMaterial) {
            materialForm.put(route('admin.catalog.materials.update', editingMaterial.id), {
                preserveScroll: true,
                onSuccess: () => resetForm(),
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
            material_type_id: material.material_type_id,
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

    const toggleSelection = (id: number) => {
        setSelectedMaterials((current) => {
            if (current.includes(id)) {
                return current.filter((materialId) => materialId !== id);
            }

            return [...current, id];
        });
    };

    const allSelected = materials.data.length > 0 && selectedMaterials.length === materials.data.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedMaterials([]);

            return;
        }

        setSelectedMaterials(materials.data.map((material) => material.id));
    };

    const bulkDelete = () => {
        if (selectedMaterials.length === 0) {
            return;
        }

        if (!window.confirm(`Delete ${selectedMaterials.length} selected material(s)? This action cannot be undone.`)) {
            return;
        }

        router.delete(route('admin.catalog.materials.bulk-destroy'), {
            data: { ids: selectedMaterials },
            preserveScroll: true,
            onSuccess: () => setSelectedMaterials([]),
        });
    };

    useEffect(() => {
        setSelectedMaterials((current) => current.filter((id) => materials.data.some((material) => material.id === id)));
    }, [materials.data]);

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
                            <span className="flex items-center justify-between">
                                Material type
                                <Link
                                    href={route('admin.catalog.material-types.index')}
                                    className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600"
                                >
                                    Manage
                                </Link>
                            </span>
                            <select
                                value={materialForm.data.material_type_id}
                                onChange={(event) => materialForm.setData('material_type_id', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                                <option value="">Select type</option>
                                {materialTypeOptions.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                        {type.is_active ? '' : ' (inactive)'}
                                    </option>
                                ))}
                            </select>
                            {materialForm.errors.material_type_id && (
                                <span className="text-xs text-rose-500">{materialForm.errors.material_type_id}</span>
                            )}
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
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
                        <div className="font-semibold text-slate-700">Results ({materials.data.length})</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedMaterials.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedMaterials.length === 0}
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
                                        aria-label="Select all materials"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Type</th>
                                <th className="px-5 py-3 text-left">Purity</th>
                                <th className="px-5 py-3 text-left">Unit</th>
                                <th className="px-5 py-3 text-left">Products</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {materials.data.map((material) => (
                                <tr key={material.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedMaterials.includes(material.id)}
                                            onChange={() => toggleSelection(material.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select material ${material.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">{material.name}</td>
                                    <td className="px-5 py-3 text-slate-500">{material.material_type_name ?? '—'}</td>
                                    <td className="px-5 py-3 text-slate-500">{material.purity ?? '—'}</td>
                                    <td className="px-5 py-3 text-slate-500">{material.unit ?? '—'}</td>
                                    <td className="px-5 py-3 text-slate-500">{material.products_count}</td>
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

            <datalist id="material-unit-library">
                {unitOptions.map((option) => (
                    <option key={option} value={option} />
                ))}
            </datalist>
        </AdminLayout>
    );
}
