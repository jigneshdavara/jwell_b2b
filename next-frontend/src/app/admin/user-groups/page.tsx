'use client';

import { useEffect, useMemo, useState } from 'react';
import { Head } from '@/components/Head';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { adminService } from '@/services/adminService';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';

type UserGroupRow = {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
};

type User = {
    id: number;
    name: string;
    email: string;
    selected: boolean;
};

export default function AdminUserGroupsIndex() {
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<{ data: UserGroupRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
    });
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<UserGroupRow | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(20);
    const [deleteConfirm, setDeleteConfirm] = useState<UserGroupRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    // Assign Users Modal state
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assigningGroup, setAssigningGroup] = useState<UserGroupRow | null>(null);
    const [assignUsers, setAssignUsers] = useState<User[]>([]);
    const [assignSelectedIds, setAssignSelectedIds] = useState<number[]>([]);
    const [assignSearchTerm, setAssignSearchTerm] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignProcessing, setAssignProcessing] = useState(false);

    const [formState, setFormState] = useState({
        name: '',
        description: '',
        is_active: true,
        display_order: 0 as number | '',
    });

    useEffect(() => {
        loadGroups();
    }, [currentPage, perPage]);

    useEffect(() => {
        const existingIds = new Set(groups.data.map((group) => group.id));
        setSelectedGroups((prev) => prev.filter((id) => existingIds.has(id)));
    }, [groups.data]);

    const loadGroups = async () => {
        setLoading(true);
        try {
            const response = await adminService.getUserGroups(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { page: 1, lastPage: 1, total: 0, perPage: perPage };

            setGroups({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    name: item.name,
                    code: item.code || '',
                    description: item.description,
                    is_active: item.is_active,
                    display_order: item.display_order || 0,
                })),
                meta: {
                    current_page: responseMeta.current_page || responseMeta.page || currentPage,
                    last_page: responseMeta.last_page || responseMeta.lastPage || 1,
                    per_page: responseMeta.per_page || responseMeta.perPage || perPage,
                    total: responseMeta.total || 0,
                    from: responseMeta.from,
                    to: responseMeta.to,
                    links: responseMeta.links || generatePaginationLinks(responseMeta.current_page || responseMeta.page || currentPage, responseMeta.last_page || responseMeta.lastPage || 1),
                },
            });
        } catch (error: any) {
            console.error('Failed to load user groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const allSelected = useMemo(() => {
        if (groups.data.length === 0) {
            return false;
        }
        return selectedGroups.length === groups.data.length;
    }, [groups.data, selectedGroups]);

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedGroups([]);
        } else {
            setSelectedGroups(groups.data.map((group) => group.id));
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedGroups((prev) =>
            prev.includes(id) ? prev.filter((groupId) => groupId !== id) : [...prev, id]
        );
    };

    const resetForm = () => {
        setEditingGroup(null);
        setModalOpen(false);
        setFormState({
            name: '',
            description: '',
            is_active: true,
            display_order: 0 as number | '',
        });
        setErrors({});
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (group: UserGroupRow) => {
        setEditingGroup(group);
        setFormState({
            name: group.name,
            description: group.description ?? '',
            is_active: group.is_active,
            display_order: group.display_order || 0,
        });
        setModalOpen(true);
    };

    // Generate slug from name (similar to Laravel's uniqueSlug)
    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            // Generate code from name if creating new, or use existing code if editing
            const code = editingGroup ? editingGroup.code : generateSlug(formState.name).toUpperCase();
            
            const payload: any = {
                name: formState.name,
                code: code,
                description: formState.description || null,
                is_active: formState.is_active,
                display_order: Number(formState.display_order) || 0,
            };

            if (editingGroup) {
                await adminService.updateUserGroup(editingGroup.id, payload);
            } else {
                await adminService.createUserGroup(payload);
            }
            resetForm();
            await loadGroups();
        } catch (error: any) {
            console.error('Failed to save user group:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                alert(error.response?.data?.message || 'Failed to save user group. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };

    const toggleGroup = async (group: UserGroupRow) => {
        try {
            await adminService.updateUserGroup(group.id, {
                name: group.name,
                code: group.code,
                description: group.description || null,
                is_active: !group.is_active,
                display_order: group.display_order,
            });
            await loadGroups();
        } catch (error: any) {
            console.error('Failed to toggle group:', error);
            alert(error.response?.data?.message || 'Failed to update group. Please try again.');
        }
    };

    const deleteGroup = (group: UserGroupRow) => {
        setDeleteConfirm(group);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                setProcessing(true);
                await adminService.deleteUserGroup(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadGroups();
            } catch (error: any) {
                console.error('Failed to delete user group:', error);
                alert(error.response?.data?.message || 'Failed to delete user group. Please try again.');
            } finally {
                setProcessing(false);
            }
        }
    };

    const bulkDelete = () => {
        if (selectedGroups.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        try {
            setProcessing(true);
            await adminService.bulkDeleteUserGroups(selectedGroups);
            setSelectedGroups([]);
            setBulkDeleteConfirm(false);
            await loadGroups();
        } catch (error: any) {
            console.error('Failed to delete user groups:', error);
            alert(error.response?.data?.message || 'Failed to delete user groups. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const changePage = (page: number) => {
        setCurrentPage(page);
    };

    const handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = Number(event.target.value);
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    // Assign Users Modal functions
    const openAssignModal = async (group: UserGroupRow) => {
        setAssigningGroup(group);
        setAssignSearchTerm('');
        setAssignLoading(true);
        setAssignModalOpen(true);
        try {
            const response = await adminService.getAssignUsers(group.id);
            const data = response.data;
            setAssignUsers(data.users || []);
            setAssignSelectedIds(data.selectedUserIds || []);
        } catch (error: any) {
            console.error('Failed to load users:', error);
            alert(error.response?.data?.message || 'Failed to load users. Please try again.');
            setAssignModalOpen(false);
        } finally {
            setAssignLoading(false);
        }
    };

    const closeAssignModal = () => {
        setAssignModalOpen(false);
        setAssigningGroup(null);
        setAssignUsers([]);
        setAssignSelectedIds([]);
        setAssignSearchTerm('');
    };

    const filteredAssignUsers = useMemo(() => {
        if (!assignSearchTerm.trim()) {
            return assignUsers;
        }
        const search = assignSearchTerm.toLowerCase();
        return assignUsers.filter(
            (user) =>
                user.name.toLowerCase().includes(search) ||
                user.email.toLowerCase().includes(search)
        );
    }, [assignUsers, assignSearchTerm]);

    const visibleSelectedCount = useMemo(() => {
        return filteredAssignUsers.filter((u) => assignSelectedIds.includes(u.id)).length;
    }, [filteredAssignUsers, assignSelectedIds]);

    const allVisibleSelected = useMemo(() => {
        if (filteredAssignUsers.length === 0) return false;
        return filteredAssignUsers.every((u) => assignSelectedIds.includes(u.id));
    }, [filteredAssignUsers, assignSelectedIds]);

    const toggleAssignUser = (userId: number) => {
        setAssignSelectedIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const selectAllVisible = () => {
        const visibleIds = filteredAssignUsers.map((u) => u.id);
        setAssignSelectedIds((prev) => {
            const newIds = [...prev];
            visibleIds.forEach((id) => {
                if (!newIds.includes(id)) {
                    newIds.push(id);
                }
            });
            return newIds;
        });
    };

    const deselectAllVisible = () => {
        const visibleIds = filteredAssignUsers.map((u) => u.id);
        setAssignSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    };

    const handleAssignSearch = async () => {
        if (!assigningGroup) return;
        setAssignLoading(true);
        try {
            const response = await adminService.getAssignUsers(assigningGroup.id, assignSearchTerm);
            const data = response.data;
            setAssignUsers(data.users || []);
            // Preserve selections
            setAssignSelectedIds((prev) => {
                const newIds = [...prev];
                data.selectedUserIds?.forEach((id: number) => {
                    if (!newIds.includes(id)) {
                        newIds.push(id);
                    }
                });
                return newIds;
            });
        } catch (error: any) {
            console.error('Failed to search users:', error);
            alert(error.response?.data?.message || 'Failed to search users. Please try again.');
        } finally {
            setAssignLoading(false);
        }
    };

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assigningGroup) return;
        
        setAssignProcessing(true);
        try {
            await adminService.assignUsers(assigningGroup.id, assignSelectedIds);
            closeAssignModal();
            await loadGroups();
        } catch (error: any) {
            console.error('Failed to assign users:', error);
            alert(error.response?.data?.message || 'Failed to assign users. Please try again.');
        } finally {
            setAssignProcessing(false);
        }
    };

    return (
        <>
            <Head title="Customer groups" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Customer groups</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Organise customers by engagement plans (e.g. VIP, Dormant) to target messaging and benefits.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New group
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">
                            Groups ({groups.meta.total})
                        </div>
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
                            <select
                                value={perPage}
                                onChange={handlePerPageChange}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                <th className="px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        aria-label="Select all customer groups"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Code</th>
                                <th className="px-5 py-3 text-left">Order</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading && groups.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : groups.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No customer groups defined yet.
                                    </td>
                                </tr>
                            ) : (
                                groups.data.map((group) => (
                                    <tr key={group.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedGroups.includes(group.id)}
                                                onChange={() => toggleSelection(group.id)}
                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                aria-label={`Select customer group ${group.name}`}
                                            />
                                        </td>
                                        <td className="px-5 py-3 font-semibold text-slate-900">
                                            <div className="flex flex-col gap-1">
                                                <span>{group.name}</span>
                                                {group.description && <span className="text-xs text-slate-500">{group.description}</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500">{group.code}</td>
                                        <td className="px-5 py-3 text-slate-500">{group.display_order}</td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                    group.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {group.is_active ? 'Active' : 'Archived'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openAssignModal(group)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-sky-200 hover:text-sky-600"
                                                    title="Assign users"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(group)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                    title="Edit group"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleGroup(group)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600"
                                                    title={group.is_active ? 'Pause group' : 'Activate group'}
                                                >
                                                    {group.is_active ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteGroup(group)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                    title="Delete group"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {groups.meta.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                        <div>
                            Showing {groups.meta.from ?? 0} to {groups.meta.to ?? 0} of {groups.meta.total} entries
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: groups.meta.last_page }).map((_, index) => {
                                const page = index + 1;
                                const active = page === groups.meta.current_page;
                                return (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => changePage(page)}
                                        className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                            active ? 'bg-sky-600 text-white shadow shadow-sky-600/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingGroup ? `Edit customer group: ${editingGroup.name}` : 'Create new customer group'}
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="group-form"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingGroup ? 'Update customer group' : 'Create customer group'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                                    aria-label="Close modal"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={submit} className="space-y-6" id="group-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Name</span>
                                            <input
                                                type="text"
                                                value={formState.name}
                                                onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                            {errors.name && <span className="text-xs text-rose-500">{errors.name}</span>}
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Display order</span>
                                            <input
                                                type="number"
                                                value={formState.display_order}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    setFormState({ 
                                                        ...formState, 
                                                        display_order: value === '' ? '' : Number(value) 
                                                    });
                                                }}
                                                onBlur={(e) => {
                                                    if (e.target.value === '') {
                                                        setFormState({ 
                                                            ...formState, 
                                                            display_order: 0 
                                                        });
                                                    }
                                                }}
                                                onFocus={(e) => {
                                                    if (e.target.value === '0') {
                                                        e.target.select();
                                                    }
                                                }}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                min={0}
                                            />
                                            {errors.display_order && <span className="text-xs text-rose-500">{errors.display_order}</span>}
                                        </label>
                                    </div>

                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={formState.is_active}
                                            onChange={(event) => setFormState({ ...formState, is_active: event.target.checked })}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Active for selection
                                    </label>
                                </div>

                                <div className="space-y-6">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={formState.description}
                                            onChange={(event) => setFormState({ ...formState, description: event.target.value })}
                                            className="min-h-[200px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Optional notes (e.g. perks, outreach cadence)."
                                        />
                                        {errors.description && <span className="text-xs text-rose-500">{errors.description}</span>}
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                show={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Remove Customer Group"
                message={deleteConfirm ? `Are you sure you want to remove customer group ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
                processing={processing}
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Customer Groups"
                message={`Are you sure you want to delete ${selectedGroups.length} selected customer group(s)?`}
                confirmText="Delete"
                variant="danger"
                processing={processing}
            />

            {/* Assign Users Modal */}
            <Modal show={assignModalOpen} onClose={closeAssignModal} maxWidth="6xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Assign users to {assigningGroup?.name}!
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Select one or more users. Use filters to narrow the list, then save to sync assignments.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeAssignModal}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
                                aria-label="Close modal"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={handleAssignSubmit} className="space-y-4">
                            {/* Search and Filters */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={assignSearchTerm}
                                        onChange={(e) => setAssignSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAssignSearch();
                                            }
                                        }}
                                        placeholder="Search name or email..."
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAssignSearch}
                                    disabled={assignLoading}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {assignLoading ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            {/* Select All / Deselect All */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={selectAllVisible}
                                        className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                    >
                                        Select all visible
                                    </button>
                                    <button
                                        type="button"
                                        onClick={deselectAllVisible}
                                        className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                    >
                                        Deselect all visible
                                    </button>
                                </div>
                                <div className="text-sm text-slate-600">
                                    <span className="font-semibold">{visibleSelectedCount}</span> selected /{' '}
                                    <span className="font-semibold">{filteredAssignUsers.length}</span> visible
                                </div>
                            </div>

                            {/* Users Table */}
                            {assignLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-slate-200">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="bg-slate-50 text-xs text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3 text-left">
                                                    <input
                                                        type="checkbox"
                                                        checked={allVisibleSelected}
                                                        onChange={() => {
                                                            if (allVisibleSelected) {
                                                                deselectAllVisible();
                                                            } else {
                                                                selectAllVisible();
                                                            }
                                                        }}
                                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                        aria-label="Select all visible users"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left">Name</th>
                                                <th className="px-4 py-3 text-left">Email</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {filteredAssignUsers.map((user) => {
                                                const isSelected = assignSelectedIds.includes(user.id);
                                                return (
                                                    <tr key={user.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleAssignUser(user.id)}
                                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                aria-label={`Select ${user.name}`}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-slate-900">
                                                            {user.name}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600">{user.email}</td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredAssignUsers.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                                                        No users found matching your search.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                                <button
                                    type="button"
                                    onClick={closeAssignModal}
                                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={assignProcessing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {assignProcessing ? 'Saving...' : 'Save assignments'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
        </>
    );
}

