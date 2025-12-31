'use client';

import { useEffect, useMemo, useState } from 'react';
import { Head } from '@/components/Head';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { adminService } from '@/services/adminService';
import { toastSuccess, toastError } from '@/utils/toast';
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
    const [allAssignUsers, setAllAssignUsers] = useState<User[]>([]); // Store all users for client-side pagination
    const [assignSelectedIds, setAssignSelectedIds] = useState<number[]>([]);
    const [assignSearchTerm, setAssignSearchTerm] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignProcessing, setAssignProcessing] = useState(false);
    const [assignCurrentPage, setAssignCurrentPage] = useState(1);
    const [assignPerPage, setAssignPerPage] = useState(5);
    const [assignUsersMeta, setAssignUsersMeta] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
    });
    const [isClientSidePagination, setIsClientSidePagination] = useState(false);

    const [formState, setFormState] = useState({
        name: '',
        code: '',
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

    // Reload assign users when per page changes
    useEffect(() => {
        if (assignModalOpen && assigningGroup) {
            setAssignCurrentPage(1);
            if (isClientSidePagination && allAssignUsers.length > 0) {
                // Client-side pagination - recalculate
                handleAssignPageChange(1);
            } else {
                // Backend pagination - fetch new data
                loadAssignUsers(1, assignSearchTerm || undefined);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignPerPage]);

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
            code: '',
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
            code: group.code || '',
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
            // Auto-generate code from name if empty (for new groups)
            const code = formState.code || generateSlug(formState.name).toUpperCase();
            
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
                toastError(error.response?.data?.message || 'Failed to save user group. Please try again.');
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
            toastError(error.response?.data?.message || 'Failed to update group. Please try again.');
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
                toastError(error.response?.data?.message || 'Failed to delete user group. Please try again.');
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
            toastError(error.response?.data?.message || 'Failed to delete user groups. Please try again.');
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
        setAssignCurrentPage(1);
        setAssignLoading(true);
        setAssignModalOpen(true);
        try {
            const response = await adminService.getAssignUsers(group.id, undefined, 1, assignPerPage);
            const data = response.data;
            let newUsers = data.users || [];
            const selectedIds = data.selectedUserIds || [];
            
            // Sort users: selected users first
            newUsers = [...newUsers].sort((a, b) => {
                const aSelected = selectedIds.includes(a.id) || a.selected || false;
                const bSelected = selectedIds.includes(b.id) || b.selected || false;
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                return 0;
            });
            
            setAssignUsers(newUsers);
            setAssignSelectedIds(selectedIds);
            
            // Handle pagination metadata
            if (data.meta) {
                const currentPage = data.meta.current_page || data.meta.page || 1;
                const lastPage = data.meta.last_page || data.meta.lastPage || 1;
                const perPage = data.meta.per_page || data.meta.perPage || assignPerPage;
                const total = data.meta.total || 0;
                
                // Calculate from and to if not provided
                const from = data.meta.from ?? (total > 0 ? (currentPage - 1) * perPage + 1 : 0);
                const to = data.meta.to ?? Math.min(currentPage * perPage, total);
                
                setAssignUsersMeta({
                    current_page: currentPage,
                    last_page: lastPage,
                    per_page: perPage,
                    total: total,
                    from: from,
                    to: to,
                    links: data.meta.links || generatePaginationLinks(currentPage, lastPage),
                });
            } else {
                // Client-side pagination fallback - backend returned all users
                setIsClientSidePagination(true);
                setAllAssignUsers(newUsers);
                
                const total = newUsers.length;
                const lastPage = total > 0 ? Math.ceil(total / assignPerPage) : 1;
                const from = total > 0 ? 1 : 0;
                const to = Math.min(assignPerPage, total);
                
                // Slice users for page 1
                const paginatedUsers = newUsers.slice(0, assignPerPage);
                setAssignUsers(paginatedUsers);
                
                setAssignUsersMeta({
                    current_page: 1,
                    last_page: lastPage,
                    per_page: assignPerPage,
                    total: total,
                    from: from,
                    to: to,
                    links: generatePaginationLinks(1, lastPage),
                });
            }
        } catch (error: any) {
            console.error('Failed to load users:', error);
            toastError(error.response?.data?.message || 'Failed to load users. Please try again.');
            setAssignModalOpen(false);
        } finally {
            setAssignLoading(false);
        }
    };

    const closeAssignModal = () => {
        setAssignModalOpen(false);
        setAssigningGroup(null);
        setAssignUsers([]);
        setAllAssignUsers([]);
        setAssignSelectedIds([]);
        setAssignSearchTerm('');
        setAssignCurrentPage(1);
        setIsClientSidePagination(false);
        setAssignUsersMeta({
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
        });
    };

    // Load assign users with pagination
    const loadAssignUsers = async (page: number, search?: string) => {
        if (!assigningGroup) return;
        setAssignLoading(true);
        try {
            const response = await adminService.getAssignUsers(
                assigningGroup.id,
                search !== undefined ? search : (assignSearchTerm || undefined),
                page,
                assignPerPage
            );
            const data = response.data;
            let newUsers = data.users || [];
            
            // Sort users: selected users first
            const selectedIds = data.selectedUserIds || [];
            newUsers = [...newUsers].sort((a, b) => {
                const aSelected = selectedIds.includes(a.id) || a.selected || false;
                const bSelected = selectedIds.includes(b.id) || b.selected || false;
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                return 0;
            });
            
            setAssignUsers(newUsers);
            setAssignSelectedIds(selectedIds);
            
            // Handle pagination metadata
            if (data.meta) {
                const currentPage = data.meta.current_page || data.meta.page || page;
                const lastPage = data.meta.last_page || data.meta.lastPage || 1;
                const perPage = data.meta.per_page || data.meta.perPage || assignPerPage;
                const total = data.meta.total || 0;
                
                // Calculate from and to if not provided
                const from = data.meta.from ?? (total > 0 ? (currentPage - 1) * perPage + 1 : 0);
                const to = data.meta.to ?? Math.min(currentPage * perPage, total);
                
                setAssignUsersMeta({
                    current_page: currentPage,
                    last_page: lastPage,
                    per_page: perPage,
                    total: total,
                    from: from,
                    to: to,
                    links: data.meta.links || generatePaginationLinks(currentPage, lastPage),
                });
            } else {
                // Client-side pagination fallback - backend returned all users
                setIsClientSidePagination(true);
                setAllAssignUsers(newUsers);
                
                const total = newUsers.length;
                const lastPage = total > 0 ? Math.ceil(total / assignPerPage) : 1;
                const from = total > 0 ? (page - 1) * assignPerPage + 1 : 0;
                const to = Math.min(page * assignPerPage, total);
                
                // Slice users for current page
                const startIndex = (page - 1) * assignPerPage;
                const endIndex = startIndex + assignPerPage;
                const paginatedUsers = newUsers.slice(startIndex, endIndex);
                setAssignUsers(paginatedUsers);
                
                setAssignUsersMeta({
                    current_page: page,
                    last_page: lastPage,
                    per_page: assignPerPage,
                    total: total,
                    from: from,
                    to: to,
                    links: generatePaginationLinks(page, lastPage),
                });
            }
        } catch (error: any) {
            console.error('Failed to load users:', error);
            toastError(error.response?.data?.message || 'Failed to load users. Please try again.');
        } finally {
            setAssignLoading(false);
        }
    };

    // Use assignUsers directly (no client-side filtering when paginated)
    const filteredAssignUsers = assignUsers;

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
        setAssignCurrentPage(1);
        await loadAssignUsers(1, assignSearchTerm);
    };

    const handleAssignPageChange = (page: number) => {
        if (page === assignCurrentPage) return;
        setAssignCurrentPage(page);
        
        if (isClientSidePagination && allAssignUsers.length > 0) {
            // Client-side pagination - slice existing data
            const startIndex = (page - 1) * assignPerPage;
            const endIndex = startIndex + assignPerPage;
            const paginatedUsers = allAssignUsers.slice(startIndex, endIndex);
            setAssignUsers(paginatedUsers);
            
            const total = allAssignUsers.length;
            const lastPage = Math.ceil(total / assignPerPage) || 1;
            const from = total > 0 ? (page - 1) * assignPerPage + 1 : 0;
            const to = Math.min(page * assignPerPage, total);
            
            setAssignUsersMeta({
                current_page: page,
                last_page: lastPage,
                per_page: assignPerPage,
                total: total,
                from: from,
                to: to,
                links: generatePaginationLinks(page, lastPage),
            });
            
            // Scroll table to top
            const tableContainer = document.querySelector('[data-user-table-container]');
            if (tableContainer) {
                tableContainer.scrollTop = 0;
            }
        } else {
            // Backend pagination - fetch new data
        loadAssignUsers(page, assignSearchTerm || undefined);
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
            toastError(error.response?.data?.message || 'Failed to assign users. Please try again.');
        } finally {
            setAssignProcessing(false);
        }
    };

    return (
        <>
            <Head title="Customer groups" />

            <div className="space-y-6 sm:space-y-8 px-1 py-4 sm:px-6 sm:py-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Customer groups</h1>
                        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                            Organise customers by engagement plans (e.g. VIP, Dormant) to target messaging and benefits.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-slate-900 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 mt-3 sm:mt-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        New group
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-200 px-4 py-2.5 sm:py-3 text-xs sm:text-sm sm:px-5 sm:py-4">
                        <div className="font-semibold text-slate-700 text-xs sm:text-sm">
                            Groups ({groups.meta.total})
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500">
                            <span>{selectedGroups.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedGroups.length === 0}
                                className="inline-flex items-center rounded-full border border-rose-200 px-2.5 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 text-[10px] sm:text-xs"
                            >
                                Bulk delete
                            </button>
                            <select
                                value={perPage}
                                onChange={handlePerPageChange}
                                className="rounded-full border border-slate-200 px-2 py-1 text-[10px] sm:px-3 sm:text-xs"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                        <thead className="bg-slate-50 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-3 py-2 sm:px-5 sm:py-3">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        aria-label="Select all customer groups"
                                    />
                                </th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Name</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3 hidden sm:table-cell">Code</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3 hidden md:table-cell">Order</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Status</th>
                                <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading && groups.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-3 text-center text-xs sm:text-sm text-slate-500 sm:px-5 sm:py-6">
                                        Loading...
                                    </td>
                                </tr>
                            ) : groups.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-3 py-3 text-center text-xs sm:text-sm text-slate-500 sm:px-5 sm:py-6">
                                        No customer groups defined yet.
                                    </td>
                                </tr>
                            ) : (
                                groups.data.map((group) => (
                                    <tr key={group.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 py-2 sm:px-5 sm:py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedGroups.includes(group.id)}
                                                onChange={() => toggleSelection(group.id)}
                                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                aria-label={`Select customer group ${group.name}`}
                                            />
                                        </td>
                                        <td className="px-3 py-2 font-semibold text-slate-900 text-xs sm:text-sm sm:px-5 sm:py-3">
                                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                                <span>{group.name}</span>
                                                {group.description && <span className="text-[10px] sm:text-xs font-normal text-slate-500">{group.description}</span>}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-slate-500 font-mono text-[10px] sm:text-sm sm:px-5 sm:py-3 hidden sm:table-cell">{group.code}</td>
                                        <td className="px-3 py-2 text-slate-500 text-xs sm:text-sm sm:px-5 sm:py-3 hidden md:table-cell">{group.display_order}</td>
                                        <td className="px-3 py-2 sm:px-5 sm:py-3">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold ${
                                                    group.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {group.is_active ? 'Active' : 'Archived'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right sm:px-5 sm:py-3">
                                            <div className="flex justify-end gap-1 sm:gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openAssignModal(group)}
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-sky-200 hover:text-sky-600 sm:h-7 sm:w-7 md:h-8 md:w-8"
                                                    title="Assign users"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(group)}
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 sm:h-7 sm:w-7 md:h-8 md:w-8"
                                                    title="Edit group"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleGroup(group)}
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-amber-200 hover:text-amber-600 sm:h-7 sm:w-7 md:h-8 md:w-8"
                                                    title={group.is_active ? 'Pause group' : 'Activate group'}
                                                >
                                                    {group.is_active ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteGroup(group)}
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 sm:h-7 sm:w-7 md:h-8 md:w-8"
                                                    title="Delete group"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
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
                </div>

                {groups.meta.last_page > 1 && (
                    <Pagination
                        meta={groups.meta}
                        onPageChange={changePage}
                    />
                )}
            </div>

            <Modal show={modalOpen} onClose={resetForm} maxWidth="5xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-4 py-2.5 sm:py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">
                                {editingGroup ? `Edit customer group: ${editingGroup.name}` : 'Create new customer group'}
                            </h2>
                            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-3 sm:py-1.5 sm:text-sm md:px-4 md:py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="group-form"
                                    disabled={processing}
                                    className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:py-1.5 sm:text-sm md:px-4 md:py-2"
                                >
                                    {editingGroup ? 'Update customer group' : 'Create customer group'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600 sm:h-7 sm:w-7 md:h-8 md:w-8"
                                    aria-label="Close modal"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
                        <form onSubmit={submit} className="space-y-4 sm:space-y-6" id="group-form">
                            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                                <div className="space-y-4 sm:space-y-6">
                                    <div className="grid gap-3 sm:gap-4">
                                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                                            <span>Name</span>
                                            <input
                                                type="text"
                                                value={formState.name}
                                                onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                                required
                                            />
                                            {errors.name && <span className="text-[10px] sm:text-xs text-rose-500">{errors.name}</span>}
                                        </label>
                                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                                            <span>Code</span>
                                            <input
                                                type="text"
                                                value={formState.code}
                                                onChange={(event) => setFormState({ ...formState, code: event.target.value.toUpperCase() })}
                                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs font-mono sm:px-4 sm:py-2 sm:text-sm"
                                                placeholder="e.g., VIP, DORMANT"
                                            />
                                            {errors.code && <span className="text-[10px] sm:text-xs text-rose-500">{errors.code}</span>}
                                        </label>
                                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
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
                                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                                min={0}
                                            />
                                            {errors.display_order && <span className="text-[10px] sm:text-xs text-rose-500">{errors.display_order}</span>}
                                        </label>
                                    </div>

                                    <label className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-600 sm:px-4 sm:py-3">
                                        <input
                                            type="checkbox"
                                            checked={formState.is_active}
                                            onChange={(event) => setFormState({ ...formState, is_active: event.target.checked })}
                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Active for selection
                                    </label>
                                </div>

                                <div className="space-y-4 sm:space-y-6">
                                    <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={formState.description}
                                            onChange={(event) => setFormState({ ...formState, description: event.target.value })}
                                            className="min-h-[120px] sm:min-h-[200px] rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                            placeholder="Optional notes (e.g. perks, outreach cadence)."
                                        />
                                        {errors.description && <span className="text-[10px] sm:text-xs text-rose-500">{errors.description}</span>}
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
                    <div className="flex-shrink-0 border-b border-slate-200 px-4 py-2.5 sm:py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">
                                    Assign users to {assigningGroup?.name}!
                                </h2>
                                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                    Select one or more users. Use filters to narrow the list, then save to sync assignments.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeAssignModal}
                                className="inline-flex h-6 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:text-slate-600 sm:h-7 sm:w-7 md:h-8 md:w-8"
                                aria-label="Close modal"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleAssignSubmit} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
                            <div className="space-y-4">
                            {/* Search and Filters */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                <div className="flex-1 w-full">
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
                                        className="w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAssignSearch}
                                    disabled={assignLoading}
                                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
                                >
                                    {assignLoading ? 'Searching...' : 'Search'}
                                </button>
                            </div>

                            {/* Select All / Deselect All */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={selectAllVisible}
                                        className="rounded-full border border-slate-300 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-3 sm:py-1.5 sm:text-xs"
                                    >
                                        Select all visible
                                    </button>
                                    <button
                                        type="button"
                                        onClick={deselectAllVisible}
                                        className="rounded-full border border-slate-300 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-3 sm:py-1.5 sm:text-xs"
                                    >
                                        Deselect all visible
                                    </button>
                                </div>
                                <div className="text-xs sm:text-sm text-slate-600">
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
                                        <div className="overflow-x-auto" data-user-table-container>
                                    <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                                                <thead className="bg-slate-50 text-[10px] sm:text-xs text-slate-500 sticky top-0 z-10">
                                            <tr>
                                                        <th className="px-3 py-2 text-left bg-slate-50 sm:px-4 sm:py-3">
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
                                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                        aria-label="Select all visible users"
                                                    />
                                                </th>
                                                        <th className="px-3 py-2 text-left bg-slate-50 sm:px-4 sm:py-3">Name</th>
                                                        <th className="px-3 py-2 text-left bg-slate-50 sm:px-4 sm:py-3">Email</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {filteredAssignUsers.map((user) => {
                                                const isSelected = assignSelectedIds.includes(user.id);
                                                return (
                                                    <tr key={user.id} className="hover:bg-slate-50">
                                                        <td className="px-3 py-2 sm:px-4 sm:py-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleAssignUser(user.id)}
                                                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                aria-label={`Select ${user.name}`}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 font-medium text-slate-900 text-xs sm:text-sm sm:px-4 sm:py-3">
                                                            {user.name}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-600 text-xs sm:text-sm sm:px-4 sm:py-3">{user.email}</td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredAssignUsers.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-3 py-3 text-center text-xs sm:text-sm text-slate-500 sm:px-4 sm:py-6">
                                                        No users found matching your search.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                        {/* Pagination inside table container */}
                                        <div className="border-t border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-3">
                                <Pagination
                                    meta={assignUsersMeta}
                                    onPageChange={handleAssignPageChange}
                                />
                                        </div>
                                    </div>
                                )}
                            </div>
                            </div>

                        {/* Footer with Action Buttons */}
                        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-2.5 sm:py-3 sm:px-6 sm:py-4">
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2 md:gap-3">
                                <button
                                    type="button"
                                    onClick={closeAssignModal}
                                    className="rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-3 sm:py-1.5 sm:text-sm md:px-4 md:py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={assignProcessing}
                                    className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:py-1.5 sm:text-sm md:px-4 md:py-2"
                                >
                                    {assignProcessing ? 'Saving...' : 'Save assignments'}
                                </button>
                            </div>
                            </div>
                        </form>
                </div>
            </Modal>
        </>
    );
}

