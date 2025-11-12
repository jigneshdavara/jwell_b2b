import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { FormDataConvertible } from '@inertiajs/core';

type TeamUser = {
    id: number;
    name: string;
    email: string;
    type: string;
    type_label: string;
    user_group: {
        id: number;
        name: string;
    } | null;
    joined_at?: string | null;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type TeamPageProps = PageProps<{
    users: {
        data: TeamUser[];
        meta: PaginationMeta;
    };
    userGroups: Array<{ id: number; name: string }>;
    availableTypes: Array<{ value: string; label: string }>;
}>;

export default function AdminTeamUsersIndex() {
    const { users, userGroups, availableTypes, errors } = usePage<TeamPageProps>().props;
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        user_group_id: '',
        type: availableTypes[0]?.value ?? 'admin',
    });
    const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const updateUserGroup = (user: TeamUser, groupId: string) => {
        router.patch(
            route('admin.users.group.update', user.id),
            { user_group_id: groupId || null },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const submitNewUser = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payload: Record<string, FormDataConvertible> = {
            name: newUser.name,
            email: newUser.email,
            user_group_id: newUser.user_group_id || null,
            type: newUser.type,
        };

        if (newUser.password) {
            payload.password = newUser.password;
            payload.password_confirmation = newUser.password_confirmation;
        }

        const resetForm = () => {
            setNewUser({
                name: '',
                email: '',
                password: '',
                password_confirmation: '',
                user_group_id: '',
                type: availableTypes[0]?.value ?? 'admin',
            });
            setEditingUser(null);
        };

        if (editingUser) {
            router.patch(route('admin.users.update', editingUser.id), payload, {
                preserveScroll: true,
                onSuccess: () => resetForm(),
            });
        } else {
            router.post(
                route('admin.users.store'),
                {
                    ...newUser,
                    user_group_id: newUser.user_group_id || null,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => resetForm(),
                },
            );
        }
    };

    const editUser = (user: TeamUser) => {
        setEditingUser(user);
        setNewUser({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            user_group_id: user.user_group?.id ? String(user.user_group.id) : '',
            type: user.type,
        });
    };

    const cancelEdit = () => {
        setEditingUser(null);
        setNewUser({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            user_group_id: '',
            type: availableTypes[0]?.value ?? 'admin',
        });
    };

    const isProtected = (user: TeamUser) => user.type === 'super-admin';

    const selectableIds = useMemo(
        () => users.data.filter((user) => !isProtected(user)).map((user) => user.id),
        [users.data],
    );
    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

    useEffect(() => {
        setSelectedIds((current) => current.filter((id) => selectableIds.includes(id)));
    }, [selectableIds]);

    const toggleSelection = (user: TeamUser) => {
        if (isProtected(user)) {
            return;
        }

        setSelectedIds((current) =>
            current.includes(user.id) ? current.filter((id) => id !== user.id) : [...current, user.id],
        );
    };

    const toggleSelectAll = () => {
        setSelectedIds(allSelected ? [] : selectableIds);
    };

    const deleteUser = (user: TeamUser) => {
        if (isProtected(user)) {
            return;
        }

        if (!window.confirm('Delete this user account? This action cannot be undone.')) {
            return;
        }

        router.delete(route('admin.users.destroy', user.id), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds((current) => current.filter((id) => id !== user.id));
                if (editingUser?.id === user.id) {
                    cancelEdit();
                }
            },
        });
    };

    const bulkDelete = () => {
        if (selectedIds.length === 0) {
            return;
        }

        if (!window.confirm(`Delete ${selectedIds.length} selected user(s)? This action cannot be undone.`)) {
            return;
        }

        router.delete(route('admin.users.bulk-destroy'), {
            data: { ids: selectedIds },
            preserveScroll: true,
            onSuccess: () => setSelectedIds([]),
        });
    };

    const formTitle = editingUser ? `Edit ${editingUser.name}` : 'Create user';

    return (
        <AdminLayout>
            <Head title="Users" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">User directory</h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Create admin accounts and limit what they see by assigning user groups.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedIds.length === 0}
                                className="rounded-full border border-rose-200 px-4 py-2 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Bulk delete ({selectedIds.length})
                            </button>
                            {editingUser && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    Cancel edit
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        Only accounts with admin access should live here. Keep at least one Super Admin active at all times.
                    </p>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h2 className="text-lg font-semibold text-slate-900">{formTitle}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        New team accounts default to admin-level access and can be restricted by assigning a user group.
                    </p>

                    <form onSubmit={submitNewUser} className="mt-6 grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Name</span>
                            <input
                                type="text"
                                value={newUser.name}
                                onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
                                required
                                className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            />
                            {errors?.name && <span className="text-xs text-rose-500">{errors.name}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Email</span>
                            <input
                                type="email"
                                value={newUser.email}
                                onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
                                required
                                className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            />
                            {errors?.email && <span className="text-xs text-rose-500">{errors.email}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Password</span>
                            <input
                                type="password"
                                value={newUser.password}
                                onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))}
                                required={!editingUser}
                                className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                minLength={8}
                            />
                            {errors?.password && <span className="text-xs text-rose-500">{errors.password}</span>}
                            {editingUser && (
                                <span className="text-xs text-slate-400">Leave blank to keep the existing password.</span>
                            )}
                            {errors?.password_confirmation && (
                                <span className="text-xs text-rose-500">{errors.password_confirmation}</span>
                            )}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Confirm password</span>
                            <input
                                type="password"
                                value={newUser.password_confirmation}
                                onChange={(event) =>
                                    setNewUser((prev) => ({ ...prev, password_confirmation: event.target.value }))
                                }
                                required={!editingUser}
                                className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                minLength={8}
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>User role</span>
                            <select
                                value={newUser.type}
                                onChange={(event) => setNewUser((prev) => ({ ...prev, type: event.target.value }))}
                                className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                disabled={editingUser?.type === 'super-admin'}
                            >
                                {availableTypes.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors?.type && <span className="text-xs text-rose-500">{errors.type}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600 md:col-span-2 md:max-w-xs">
                            <span>User group (optional)</span>
                            <select
                                value={newUser.user_group_id}
                                onChange={(event) =>
                                    setNewUser((prev) => ({ ...prev, user_group_id: event.target.value }))
                                }
                                className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                                <option value="">Admin (no restrictions)</option>
                                {userGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                            {errors?.user_group_id && <span className="text-xs text-rose-500">{errors.user_group_id}</span>}
                        </label>
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700"
                            >
                                {editingUser ? 'Save changes' : 'Create user'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        aria-label="Select all users"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Email</th>
                                <th className="px-5 py-3 text-left">Role</th>
                                <th className="px-5 py-3 text-left">User group</th>
                                <th className="px-5 py-3 text-left">Joined</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No team users found.
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(user.id)}
                                                onChange={() => toggleSelection(user)}
                                                disabled={isProtected(user)}
                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label={`Select ${user.name}`}
                                            />
                                        </td>
                                        <td className="px-5 py-3 font-medium text-slate-900">{user.name}</td>
                                        <td className="px-5 py-3 text-slate-600">{user.email}</td>
                                        <td className="px-5 py-3 text-slate-500">{user.type_label || 'Admin'}</td>
                                        <td className="px-5 py-3 text-slate-600">
                                            <select
                                                value={user.user_group?.id ?? ''}
                                                onChange={(event) => updateUserGroup(user, event.target.value)}
                                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            >
                                                <option value="">No group assigned</option>
                                                {userGroups.map((groupOption) => (
                                                    <option key={groupOption.id} value={groupOption.id}>
                                                        {groupOption.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500">
                                            {user.joined_at ? new Date(user.joined_at).toLocaleDateString('en-IN') : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => editUser(user)}
                                                    className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteUser(user)}
                                                    disabled={isProtected(user)}
                                                    className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

