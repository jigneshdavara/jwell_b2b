'use client';

import { useEffect, useMemo, useState } from 'react';
import { Head } from '@/components/Head';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { adminService } from '@/services/adminService';
import Link from 'next/link';
import { route } from '@/utils/route';
import { toastError } from '@/utils/toast';
import { generatePaginationLinks } from '@/utils/pagination';

type AdminUserRow = {
    id: number;
    name: string;
    email: string;
    type: string;
    is_active: boolean;
    customer_group?: {
        id: number;
        name: string;
    } | null;
    kyc_status: string;
    kyc_notes?: string | null;
    kyc_document_count: number;
    joined_at?: string | null;
    kyc_profile?: {
        business_name?: string | null;
        city?: string | null;
        state?: string | null;
    } | null;
};

type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from?: number;
    to?: number;
    links?: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
};

type Option = {
    id: number;
    name: string;
};

const statusColours: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    review: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
};

const kycStatuses = ['pending', 'review', 'approved', 'rejected'];
const perPageOptions = [10, 25, 50, 100];

export default function AdminUsersIndex() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<{ data: AdminUserRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
    });
    const [customerGroups, setCustomerGroups] = useState<Option[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        review: 0,
        approved: 0,
        rejected: 0,
    });
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(20);
    const [groupFilter, setGroupFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    const statusOptions = useMemo(() => ['all', ...kycStatuses], []);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadUsers();
    }, [perPage, statusFilter, groupFilter]);

    const loadData = async () => {
        await Promise.all([loadUsers(), loadCustomerGroups()]);
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            const filters: any = {
                page: 1,
                per_page: perPage,
            };
            if (search) filters.search = search;
            if (statusFilter && statusFilter !== 'all') filters.status = statusFilter;
            if (groupFilter) filters.user_group_id = Number(groupFilter);

            const response = await adminService.getCustomers(filters);
            const data = response.data;

            const currentPage = data.meta?.page || 1;
            const lastPage = data.meta?.lastPage || data.meta?.last_page || 1;
            const total = data.meta?.total || 0;
            const perPageValue = data.meta?.perPage || data.meta?.per_page || perPage;
            
            setUsers({
                data: (data.items || []).map((item: any) => ({
                    id: Number(item.id),
                    name: item.name,
                    email: item.email,
                    type: item.type,
                    is_active: item.is_active,
                    kyc_status: item.kyc_status,
                    kyc_notes: item.kyc_notes,
                    kyc_document_count: item.kyc_document_count || 0,
                    customer_group: item.customer_group || null,
                    kyc_profile: item.kyc_profile || null,
                    joined_at: item.joined_at || item.created_at,
                })),
                meta: {
                    current_page: currentPage,
                    last_page: lastPage,
                    per_page: perPageValue,
                    total: total,
                    from: data.meta?.from || (total > 0 ? (currentPage - 1) * perPageValue + 1 : 0),
                    to: data.meta?.to || Math.min(currentPage * perPageValue, total),
                    links: generatePaginationLinks(currentPage, lastPage),
                },
            });

            if (data.stats) {
                setStats(data.stats);
            }
        } catch (error: any) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCustomerGroups = async () => {
        try {
            const response = await adminService.getUserGroups(1, 100);
            const items = response.data.items || response.data.data || [];
            setCustomerGroups(
                items
                    .filter((item: any) => item.is_active !== false)
                    .map((item: any) => ({ id: Number(item.id), name: item.name })),
            );
        } catch (error: any) {
            console.error('Failed to load customer groups:', error);
        }
    };

    const changeStatus = (status: string) => {
        setStatusFilter(status === 'all' ? '' : status);
    };

    const performFilter = () => {
        loadUsers();
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(users.data.map((user) => user.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id: number, checked: boolean) => {
        setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((value) => value !== id)));
    };

    const clearBulkSelection = () => setSelectedIds([]);

    const bulkDelete = () => {
        if (selectedIds.length === 0) return;
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        try {
            setProcessing(true);
            await adminService.bulkDeleteCustomers(selectedIds);
            clearBulkSelection();
            setBulkDeleteConfirm(false);
            await loadUsers();
        } catch (error: any) {
            console.error('Failed to delete customers:', error);
            toastError(error.response?.data?.message || 'Failed to delete customers. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const bulkAssignGroup = async (groupId: string) => {
        if (selectedIds.length === 0) return;
        try {
            setProcessing(true);
            const groupIdNum = groupId ? Number(groupId) : null;
            await adminService.bulkUpdateCustomerGroup(selectedIds, groupIdNum);
            clearBulkSelection();
            await loadUsers();
        } catch (error: any) {
            console.error('Failed to update customer group:', error);
            toastError(error.response?.data?.message || 'Failed to update customer group. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const deleteCustomer = (id: number) => {
        setDeleteConfirm(id);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                setProcessing(true);
                await adminService.deleteCustomer(deleteConfirm);
                setDeleteConfirm(null);
                await loadUsers();
            } catch (error: any) {
                console.error('Failed to delete customer:', error);
                toastError(error.response?.data?.message || 'Failed to delete customer. Please try again.');
            } finally {
                setProcessing(false);
            }
        }
    };

    const toggleActive = async (user: AdminUserRow) => {
        try {
            await adminService.toggleCustomerStatus(user.id);
            await loadUsers();
        } catch (error: any) {
            console.error('Failed to toggle status:', error);
            toastError(error.response?.data?.message || 'Failed to toggle status. Please try again.');
        }
    };

    const getKycStatusLabel = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const handlePageChange = async (page: number) => {
        const filters: any = {
            page,
            per_page: perPage,
        };
        if (search) filters.search = search;
        if (statusFilter && statusFilter !== 'all') filters.status = statusFilter;
        if (groupFilter) filters.user_group_id = Number(groupFilter);

        setLoading(true);
        try {
            const response = await adminService.getCustomers(filters);
            const data = response.data;
            const currentPage = data.meta?.page || page;
            const lastPage = data.meta?.lastPage || data.meta?.last_page || 1;
            const total = data.meta?.total || 0;
            const perPageValue = data.meta?.perPage || data.meta?.per_page || perPage;
            
            setUsers({
                data: (data.items || []).map((item: any) => ({
                    id: Number(item.id),
                    name: item.name,
                    email: item.email,
                    type: item.type,
                    is_active: item.is_active,
                    kyc_status: item.kyc_status,
                    kyc_notes: item.kyc_notes,
                    kyc_document_count: item.kyc_document_count || 0,
                    customer_group: item.customer_group || null,
                    kyc_profile: item.kyc_profile || null,
                    joined_at: item.joined_at || item.created_at,
                })),
                meta: {
                    current_page: currentPage,
                    last_page: lastPage,
                    per_page: perPageValue,
                    total: total,
                    from: data.meta?.from || (total > 0 ? (currentPage - 1) * perPageValue + 1 : 0),
                    to: data.meta?.to || Math.min(currentPage * perPageValue, total),
                    links: generatePaginationLinks(currentPage, lastPage),
                },
            });
        } catch (error: any) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Head title="Customers & KYC" />

            <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
                <section className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-xs font-semibold text-slate-500">Search name or email</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Jane Doe or jane@studio.com"
                                    className="w-full rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={performFilter}
                                    className="rounded-xl sm:rounded-2xl bg-slate-900 px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-xs font-semibold text-slate-500">Customer group</label>
                            <select
                                value={groupFilter}
                                onChange={(event) => setGroupFilter(event.target.value)}
                                className="w-full rounded-lg sm:rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 sm:px-4 text-xs sm:text-sm"
                            >
                                <option value="">All groups</option>
                                {customerGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 border-t border-slate-200 pt-3 sm:pt-4">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-semibold text-slate-600">
                            <span>Status:</span>
                            {statusOptions.map((status) => {
                                const active = (statusFilter || 'all') === status;
                                return (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => changeStatus(status)}
                                        className={`rounded-full px-2 py-0.5 sm:px-3 sm:py-1 transition text-[10px] sm:text-xs ${
                                            active
                                                ? 'bg-slate-900 text-white shadow shadow-slate-900/20'
                                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                    >
                                        {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={(event) => setPerPage(Number(event.target.value))}
                                className="rounded-lg sm:rounded-xl border border-slate-300 px-2 py-1 sm:px-3 text-xs sm:text-sm"
                            >
                                {perPageOptions.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <span>entries</span>
                        </div>
                    </div>
                    <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 text-[10px] sm:text-xs text-slate-500">
                        <button
                            type="button"
                            onClick={performFilter}
                            className="rounded-full border border-slate-200 px-3 py-1.5 sm:px-4 font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                        >
                            Apply filters
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setGroupFilter('');
                                setStatusFilter('');
                                setPerPage(20);
                                loadUsers();
                            }}
                            className="rounded-full border border-slate-200 px-3 py-1.5 sm:px-4 font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                        >
                            Reset
                        </button>
                    </div>
                </section>

                {selectedIds.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 rounded-2xl sm:rounded-3xl bg-slate-900 px-4 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-white shadow-lg shadow-slate-900/20">
                        <span className="text-xs sm:text-sm">{selectedIds.length} selected</span>
                        <button
                            type="button"
                            onClick={bulkDelete}
                            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-rose-500 px-3 py-1.5 sm:px-4 text-[10px] sm:text-xs font-semibold text-white shadow shadow-rose-500/20 transition hover:bg-rose-400"
                        >
                            Delete selected
                        </button>
                        <select
                            className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1.5 sm:px-3 text-[10px] sm:text-xs font-semibold text-white focus:border-white focus:outline-none"
                            value=""
                            onChange={(event) => {
                                bulkAssignGroup(event.target.value);
                            }}
                        >
                            <option value="">Assign to group…</option>
                            {customerGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={clearBulkSelection}
                            className="text-[10px] sm:text-xs text-white/80 transition hover:text-white text-left sm:text-center"
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                            <thead className="bg-slate-50 text-[10px] sm:text-xs font-semibold uppercase text-slate-500">
                                <tr>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length > 0 && selectedIds.length === users.data.length}
                                            onChange={(event) => toggleSelectAll(event.target.checked)}
                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                            aria-label="Select all customers"
                                        />
                                    </th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left">Name</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left hidden md:table-cell">Email</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left hidden lg:table-cell">Type</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left hidden md:table-cell">Customer group</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left">KYC Status</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left">Status</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left hidden lg:table-cell">Docs</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left hidden md:table-cell">Joined</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {loading && users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-3 py-4 sm:px-5 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-3 py-4 sm:px-5 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                            No customers found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => {
                                        const badgeClass = statusColours[user.kyc_status] ?? 'bg-slate-100 text-slate-600';
                                        const checked = selectedIds.includes(user.id);

                                        return (
                                            <tr key={user.id} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 sm:px-5 sm:py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(event) => toggleSelect(user.id, event.target.checked)}
                                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                        aria-label={`Select ${user.name}`}
                                                    />
                                                </td>
                                                <td className="px-3 py-2 sm:px-5 sm:py-3 font-medium text-slate-900 text-xs sm:text-sm">
                                                    {user.name}
                                                    <div className="mt-0.5 md:hidden">
                                                        <p className="text-[10px] text-slate-500">{user.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-600 text-xs sm:text-sm hidden md:table-cell">{user.email}</td>
                                                <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-500 text-xs sm:text-sm hidden lg:table-cell">{user.type}</td>
                                                <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-500 text-xs sm:text-sm hidden md:table-cell">{user.customer_group?.name ?? '—'}</td>
                                                <td className="px-3 py-2 sm:px-5 sm:py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold ${badgeClass}`}
                                                    >
                                                        {getKycStatusLabel(user.kyc_status)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 sm:px-5 sm:py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleActive(user)}
                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold transition ${
                                                            user.is_active
                                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        {user.is_active ? 'Enabled' : 'Disabled'}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-500 text-xs sm:text-sm hidden lg:table-cell">{user.kyc_document_count}</td>
                                                <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-500 text-xs sm:text-sm hidden md:table-cell">
                                                    {user.joined_at ? new Date(user.joined_at).toLocaleDateString('en-IN') : '—'}
                                                </td>
                                                <td className="px-3 py-2 sm:px-5 sm:py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                                        <Link
                                                            href={`/admin/users/${user.id}/kyc`}
                                                            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                            title="Review KYC"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth={1.5}
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M12 4.5l7.5 7.5-7.5 7.5m-7.5-7.5h15"
                                                                />
                                                            </svg>
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteCustomer(user.id)}
                                                            className="inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                            title="Delete customer"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth={1.5}
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {users.meta.last_page > 1 && (
                    <Pagination
                        meta={users.meta}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Customers"
                message={`Are you sure you want to delete ${selectedIds.length} selected customer(s)? This cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                processing={processing}
            />

            <ConfirmationModal
                show={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Delete Customer"
                message="Are you sure you want to delete this customer? This action is irreversible."
                confirmText="Delete"
                variant="danger"
                processing={processing}
            />
        </>
    );
}
