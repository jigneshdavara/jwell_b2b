import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type UserGroupRow = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    position: number;
    features: string[];
};

type FeatureOption = {
    value: string;
    label: string;
};

type Pagination<T> = {
    data: T[];
};

type UserGroupsPageProps = PageProps<{
    groups: Pagination<UserGroupRow>;
    featureOptions: FeatureOption[];
}>;

export default function AdminUserGroupsIndex() {
    const { groups, featureOptions } = usePage<UserGroupsPageProps>().props;

    const [editingGroup, setEditingGroup] = useState<UserGroupRow | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

    const featureLabels = useMemo(
        () =>
            featureOptions.reduce<Record<string, string>>((carry, option) => {
                carry[option.value] = option.label;
                return carry;
            }, {}),
        [featureOptions],
    );

    const form = useForm({
        name: '',
        description: '',
        features: [] as string[],
        is_active: true,
        position: 0,
    });

    const resetForm = () => {
        setEditingGroup(null);
        form.reset();
        form.setData('is_active', true);
        form.setData('position', 0);
        form.setData('features', []);
    };

    const populateForm = (group: UserGroupRow) => {
        setEditingGroup(group);
        form.setData({
            name: group.name,
            description: group.description ?? '',
            is_active: group.is_active,
            position: group.position,
            features: group.features ?? [],
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payload = {
            name: form.data.name,
            description: form.data.description || null,
            features: form.data.features,
            is_active: form.data.is_active,
            position: form.data.position ?? 0,
        };

        form.transform(() => payload);

        const options = {
            preserveScroll: true,
            onSuccess: () => resetForm(),
            onFinish: () => form.transform((original) => original),
        } as const;

        if (editingGroup) {
            form.post(route('admin.users.groups.update', editingGroup.id), {
                ...options,
                method: 'put',
            });
        } else {
            form.post(route('admin.users.groups.store'), options);
        }
    };

    const toggleActivation = (group: UserGroupRow) => {
        router.put(
            route('admin.users.groups.update', group.id),
            {
                name: group.name,
                description: group.description,
                features: group.features ?? [],
                is_active: !group.is_active,
                position: group.position,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const deleteGroup = (group: UserGroupRow) => {
        if (!window.confirm(`Remove user group ${group.name}?`)) {
            return;
        }

        router.delete(route('admin.users.groups.destroy', group.id), {
            preserveScroll: true,
        });
    };

    const toggleSelection = (id: number) => {
        setSelectedGroups((current) => {
            if (current.includes(id)) {
                return current.filter((value) => value !== id);
            }

            return [...current, id];
        });
    };

    const allSelected = groups.data.length > 0 && selectedGroups.length === groups.data.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedGroups([]);
            return;
        }

        setSelectedGroups(groups.data.map((group) => group.id));
    };

    const bulkDelete = () => {
        if (selectedGroups.length === 0) {
            return;
        }

        if (!window.confirm(`Delete ${selectedGroups.length} selected user group(s)?`)) {
            return;
        }

        router.delete(route('admin.users.groups.bulk-destroy'), {
            data: { ids: selectedGroups },
            preserveScroll: true,
            onSuccess: () => setSelectedGroups([]),
        });
    };

    const toggleFeature = (value: string, checked: boolean) => {
        form.setData(
            'features',
            checked ? [...form.data.features, value] : form.data.features.filter((item) => item !== value),
        );
    };

    useEffect(() => {
        setSelectedGroups((current) => current.filter((id) => groups.data.some((group) => group.id === id)));
    }, [groups.data]);

    return (
        <AdminLayout>
            <Head title="User groups" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">User groups</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Bundle panel permissions into reusable groups and assign them to internal or external users.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingGroup ? `Edit user group ${editingGroup.name}` : 'Create new user group'}
                        </h2>
                        {editingGroup && (
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
                            placeholder="Optional notes for internal reference."
                        />
                        {form.errors.description && <span className="text-xs text-rose-500">{form.errors.description}</span>}
                    </label>

                    <fieldset className="rounded-2xl border border-slate-200 px-4 py-4">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                            Feature access
                        </legend>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {featureOptions.map((feature) => {
                                const checked = form.data.features.includes(feature.value);
                                return (
                                    <label key={feature.value} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(event) => toggleFeature(feature.value, event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        {feature.label}
                                    </label>
                                );
                            })}
                        </div>
                        {form.errors.features && <p className="mt-2 text-xs text-rose-500">{form.errors.features as string}</p>}
                    </fieldset>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) => form.setData('is_active', event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        Active for assignment
                    </label>

                    <div className="flex justify-end gap-3">
                        {editingGroup && (
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
                            {editingGroup ? 'Update user group' : 'Create user group'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
                        <div className="font-semibold text-slate-700">Results ({groups.data.length})</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedGroups.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedGroups.length === 0}
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
                                        aria-label="Select all user groups"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Features</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {groups.data.map((group) => (
                                <tr key={group.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 align-top">
                                        <input
                                            type="checkbox"
                                            checked={selectedGroups.includes(group.id)}
                                            onChange={() => toggleSelection(group.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select user group ${group.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 align-top font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{group.name}</span>
                                            {group.description && <span className="text-xs text-slate-500">{group.description}</span>}
                                            <span className="text-xs uppercase tracking-[0.35em] text-slate-400">Slug {group.slug}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 align-top text-slate-600">
                                        {group.features.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {group.features.map((feature) => (
                                                    <span
                                                        key={feature}
                                                        className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500"
                                                    >
                                                        {featureLabels[feature] ?? feature}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">All features</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 align-top">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                group.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {group.is_active ? 'Active' : 'Paused'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 align-top text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => populateForm(group)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleActivation(group)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                {group.is_active ? 'Pause' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteGroup(group)}
                                                className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {groups.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No user groups defined yet.
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

