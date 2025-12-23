'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Head } from '@/components/Head';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { adminService } from '@/services/adminService';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';

type AdminUser = {
    id: number;
    name: string;
    email: string;
    type: string;
    type_label: string;
    admin_group: {
        id: number;
        name: string;
    } | null;
    joined_at?: string | null;
};


const availableTypes = [
    { value: 'admin', label: 'Admin' },
    { value: 'super-admin', label: 'Super Admin' },
    { value: 'production', label: 'Production' },
    { value: 'sales', label: 'Sales' },
];

export default function AdminAdminsIndex() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<{ data: AdminUser[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 }
    });
    const [adminGroups, setAdminGroups] = useState<Array<{ id: number; name: string }>>([]);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        admin_group_id: '',
        type: 'admin',
    });
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadUsers();
        loadAdminGroups();
    }, [currentPage]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await adminService.getAdmins(currentPage, 20);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { page: 1, lastPage: 1, total: 0, perPage: 20 };
            
            setUsers({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    name: item.name,
                    email: item.email,
                    type: item.type,
                    type_label: item.type_label || item.type.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                    admin_group: item.admin_group ? { id: Number(item.admin_group.id), name: item.admin_group.name } : null,
                    joined_at: item.joined_at || item.created_at,
                })),
                meta: {
                    current_page: responseMeta.page || responseMeta.current_page || currentPage,
                    last_page: responseMeta.lastPage || responseMeta.last_page || 1,
                    per_page: responseMeta.perPage || responseMeta.per_page || 20,
                    total: responseMeta.total || 0,
                    from: responseMeta.from,
                    to: responseMeta.to,
                    links: responseMeta.links || generatePaginationLinks(responseMeta.page || responseMeta.current_page || currentPage, responseMeta.lastPage || responseMeta.last_page || 1),
                },
            });
        } catch (error: any) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAdminGroups = async () => {
        try {
            const response = await adminService.getAdminGroups(1, 100);
            const items = response.data.items || response.data.data || [];
            setAdminGroups(items.map((item: any) => ({ id: Number(item.id), name: item.name })));
        } catch (error: any) {
            console.error('Failed to load admin groups:', error);
        }
    };

    const isProtected = (user: AdminUser) => user.type === 'super-admin';

    const selectableIds = useMemo(
        () => users.data.filter((user) => !isProtected(user)).map((user) => user.id),
        [users.data],
    );
    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

    useEffect(() => {
        setSelectedIds((current) => current.filter((id) => selectableIds.includes(id)));
    }, [selectableIds]);

    const toggleSelection = (user: AdminUser) => {
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

    const updateAdminGroup = async (user: AdminUser, groupId: string) => {
        if (isProtected(user)) {
            return;
        }
        try {
            const groupIdNum = groupId ? Number(groupId) : null;
            await adminService.updateAdminGroup(user.id, groupIdNum);
            await loadUsers();
        } catch (error: any) {
            console.error('Failed to update admin group:', error);
            alert(error.response?.data?.message || 'Failed to update admin group. Please try again.');
        }
    };

    const submitNewUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});
        
        try {
            const payload: any = {
                name: newUser.name,
                email: newUser.email,
                type: newUser.type,
                admin_group_id: newUser.admin_group_id ? Number(newUser.admin_group_id) : null,
            };

            if (editingUser) {
                if (newUser.password) {
                    payload.password = newUser.password;
                    payload.password_confirmation = newUser.password_confirmation;
                }
                await adminService.updateAdmin(editingUser.id, payload);
            } else {
                payload.password = newUser.password;
                payload.password_confirmation = newUser.password_confirmation;
                await adminService.createAdmin(payload);
            }

            // Reset form
            setNewUser({
                name: '',
                email: '',
                password: '',
                password_confirmation: '',
                admin_group_id: '',
                type: 'admin',
            });
            setEditingUser(null);
            await loadUsers();
        } catch (error: any) {
            console.error('Failed to save admin:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                alert(error.response?.data?.message || 'Failed to save admin. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };

    const editUser = (user: AdminUser) => {
        setEditingUser(user);
        setNewUser({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            admin_group_id: user.admin_group?.id ? String(user.admin_group.id) : '',
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
            admin_group_id: '',
            type: 'admin',
        });
        setErrors({});
    };

    const deleteUser = (user: AdminUser) => {
        if (isProtected(user)) {
            return;
        }
        setDeleteConfirm(user);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteAdmin(deleteConfirm.id);
                setSelectedIds((current) => current.filter((id) => id !== deleteConfirm.id));
                if (editingUser?.id === deleteConfirm.id) {
                    cancelEdit();
                }
                setDeleteConfirm(null);
                await loadUsers();
            } catch (error: any) {
            console.error('Failed to delete admin:', error);
            alert(error.response?.data?.message || 'Failed to delete admin. Please try again.');
            }
        }
    };

    const bulkDelete = () => {
        if (selectedIds.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        try {
            await adminService.bulkDeleteAdmins(selectedIds);
            setSelectedIds([]);
            setBulkDeleteConfirm(false);
            await loadUsers();
        } catch (error: any) {
            console.error('Failed to delete admins:', error);
            alert(error.response?.data?.message || 'Failed to delete admins. Please try again.');
        }
    };

    const formTitle = editingUser ? `Edit ${editingUser.name}` : 'Create admin';

    return (
        <>
            <Head title="Admins" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Admin directory</h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Create admin accounts and limit what they see by assigning admin groups.
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
                        New admin accounts default to admin-level access and can be restricted by assigning an admin group.
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
                                onChange={(event) =>
                                    setNewUser((prev) => ({
                                        ...prev,
                                        type: event.target.value,
                                        admin_group_id: event.target.value === 'super-admin' ? '' : prev.admin_group_id,
                                    }))
                                }
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
                            <span>Admin group (optional)</span>
                            {newUser.type === 'super-admin' || editingUser?.type === 'super-admin' ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-2 text-sm text-slate-400">
                                    Super administrators bypass group restrictions.
                                </div>
                            ) : (
                                <select
                                    value={newUser.admin_group_id}
                                    onChange={(event) =>
                                        setNewUser((prev) => ({ ...prev, admin_group_id: event.target.value }))
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                >
                                    <option value="">Admin (no restrictions)</option>
                                    {adminGroups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors?.admin_group_id && <span className="text-xs text-rose-500">{errors.admin_group_id}</span>}
                        </label>
                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:opacity-50"
                            >
                                {editingUser ? 'Save changes' : 'Create admin'}
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
                                <th className="px-5 py-3 text-left">Admin group</th>
                                <th className="px-5 py-3 text-left">Joined</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading && users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-6 text-center text-sm text-slate-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No admins found.
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
                                            {isProtected(user) ? (
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                    Super admin
                                                </span>
                                            ) : (
                                                <select
                                                    value={user.admin_group?.id ?? ''}
                                                    onChange={(event) => updateAdminGroup(user, event.target.value)}
                                                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                >
                                                    <option value="">No group assigned</option>
                                                    {adminGroups.map((groupOption) => (
                                                        <option key={groupOption.id} value={groupOption.id}>
                                                            {groupOption.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
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

                {users.meta.last_page > 1 && (
                    <div className="mt-6">
                        <Pagination meta={users.meta} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>

            <ConfirmationModal
                show={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Delete Admin Account"
                message="Are you sure you want to delete this admin account? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Admins"
                message={`Are you sure you want to delete ${selectedIds.length} selected admin(s)? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </>
    );
}
