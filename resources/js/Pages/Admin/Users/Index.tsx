import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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
    kyc_status_label: string;
    kyc_notes?: string | null;
    kyc_document_count: number;
    joined_at?: string | null;
    kyc_profile?: {
        business_name?: string | null;
        city?: string | null;
        state?: string | null;
    } | null;
};

type Pagination<T> = {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
};

type Option = {
    id: number;
    name: string;
};

type AdminUsersPageProps = AppPageProps<{
    users: Pagination<AdminUserRow>;
    kycStatuses: string[];
    filters: {
        status?: string | null;
        search?: string | null;
        customer_group_id?: number | null;
        type?: string | null;
    };
    stats: {
        total: number;
        pending: number;
        review: number;
        approved: number;
        rejected: number;
    };
    customerGroups: Option[];
    perPageOptions: number[];
}>;

const statusColours: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    review: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
};

export default function AdminUsersIndex() {
    const { users, kycStatuses, filters, stats, customerGroups, perPageOptions } = usePage<AdminUsersPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(users.meta?.per_page ?? 20);
    const [typeFilter, setTypeFilter] = useState(filters.type ?? '');
    const [groupFilter, setGroupFilter] = useState<string | ''>(filters.customer_group_id ? String(filters.customer_group_id) : '');

    const statusOptions = useMemo(() => ['all', ...kycStatuses], [kycStatuses]);

    const changeStatus = (status: string) => {
        const params = {
            search: search || undefined,
            per_page: perPage !== (users.meta?.per_page ?? 20) ? perPage : undefined,
            customer_group_id: groupFilter || undefined,
            type: typeFilter || undefined,
            status: status === 'all' ? undefined : status,
        };
        router.get(route('admin.customers.index'), params, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    const performFilter = () => {
        router.get(
            route('admin.customers.index'),
            {
                search: search || undefined,
                status: filters.status ?? undefined,
                per_page: perPage,
                customer_group_id: groupFilter || undefined,
                type: typeFilter || undefined,
            },
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            },
        );
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

        if (window.confirm('Delete selected customers? This cannot be undone.')) {
            router.delete(route('admin.customers.bulk-destroy'), {
                data: { ids: selectedIds },
                preserveScroll: true,
                onFinish: clearBulkSelection,
            });
        }
    };

    const bulkAssignGroup = (groupId: string) => {
        if (selectedIds.length === 0) return;
        router.post(
            route('admin.customers.bulk-group-update'),
            {
                ids: selectedIds,
                customer_group_id: groupId || null,
            },
            {
                preserveScroll: true,
                onFinish: clearBulkSelection,
            },
        );
    };

    const deleteCustomer = (id: number) => {
        if (window.confirm('Delete this customer? This action is irreversible.')) {
            router.delete(route('admin.customers.destroy', id), {
                preserveScroll: true,
            });
        }
    };

    const toggleActive = (user: AdminUserRow) => {
        router.post(route('admin.customers.toggle-status', user.id), {}, { preserveScroll: true });
    };

    const iconButton = (icon: JSX.Element, label: string, onClick: () => void) => (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            title={label}
        >
            {icon}
        </button>
    );

    return (
        <AdminLayout>
            <Head title="Customers & KYC" />

            <div className="space-y-8">
                <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Search name or email</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Jane Doe or jane@studio.com"
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                />
                                <button
                                    type="button"
                                    onClick={performFilter}
                                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Customer group</label>
                            <select
                                value={groupFilter}
                                onChange={(event) => setGroupFilter(event.target.value)}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                            >
                                <option value="">All groups</option>
                                {customerGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Customer type</label>
                            <select
                                value={typeFilter}
                                onChange={(event) => setTypeFilter(event.target.value)}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                            >
                                <option value="">All types</option>
                                <option value="retailer">Retailer</option>
                                <option value="wholesaler">Wholesaler</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                            <span>Status:</span>
                            {statusOptions.map((status) => {
                                const active = (filters.status ?? 'all') === status;
                                return (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => changeStatus(status)}
                                        className={`rounded-full px-3 py-1 transition ${
                                            active ? 'bg-slate-900 text-white shadow shadow-slate-900/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                    >
                                        {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={(event) => setPerPage(Number(event.target.value))}
                                className="rounded-xl border border-slate-300 px-3 py-1 text-sm"
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
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                        <button type="button" onClick={performFilter} className="rounded-full border border-slate-200 px-4 py-1.5 font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900">
                            Apply filters
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setGroupFilter('');
                                setTypeFilter('');
                                setPerPage(users.meta?.per_page ?? 20);
                                router.get(route('admin.customers.index'));
                            }}
                            className="rounded-full border border-slate-200 px-4 py-1.5 font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                        >
                            Reset
                        </button>
                    </div>
                </section>

                {selectedIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-slate-900 px-6 py-4 text-sm text-white shadow-lg shadow-slate-900/20">
                        <span>{selectedIds.length} selected</span>
                        <button
                            type="button"
                            onClick={bulkDelete}
                            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white shadow shadow-rose-500/20 transition hover:bg-rose-400"
                        >
                            Delete selected
                        </button>
                        <select
                            className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white focus:border-white focus:outline-none"
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
                        <button type="button" onClick={clearBulkSelection} className="text-xs text-white/80 hover:text-white transition">
                            Clear selection
                        </button>
                    </div>
                )}

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                            <tr>
                                <th className="px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length > 0 && selectedIds.length === users.data.length}
                                        onChange={(event) => toggleSelectAll(event.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                        aria-label="Select all customers"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Email</th>
                                <th className="px-5 py-3 text-left">Type</th>
                                <th className="px-5 py-3 text-left">Customer group</th>
                                <th className="px-5 py-3 text-left">KYC Status</th>
                                <th className="px-5 py-3 text-left">Status</th>
                                <th className="px-5 py-3 text-left">Docs</th>
                                <th className="px-5 py-3 text-left">Joined</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {users.data.map((user) => {
                                const badgeClass = statusColours[user.kyc_status] ?? 'bg-slate-100 text-slate-600';
                                const checked = selectedIds.includes(user.id);

                                return (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-3">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(event) => toggleSelect(user.id, event.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                aria-label={`Select ${user.name}`}
                                            />
                                        </td>
                                        <td className="px-5 py-3 font-medium text-slate-900">{user.name}</td>
                                        <td className="px-5 py-3 text-slate-600">{user.email}</td>
                                        <td className="px-5 py-3 text-slate-500">{user.type}</td>
                                        <td className="px-5 py-3 text-slate-500">{user.customer_group?.name ?? '—'}</td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                                                {user.kyc_status_label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleActive(user)}
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                    user.is_active
                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                {user.is_active ? 'Enabled' : 'Disabled'}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500">{user.kyc_document_count}</td>
                                        <td className="px-5 py-3 text-slate-500">{user.joined_at ? new Date(user.joined_at).toLocaleDateString('en-IN') : '—'}</td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={route('admin.customers.kyc.show', user.id)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                    title="Review KYC"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5l7.5 7.5-7.5 7.5m-7.5-7.5h15" />
                                                    </svg>
                                                </Link>
                                                {iconButton(
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    ,
                                                    'Delete customer',
                                                    () => deleteCustomer(user.id),
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No customers found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                        Showing {((users.meta?.current_page ?? 1) - 1) * (users.meta?.per_page ?? 20) + 1} to{' '}
                        {Math.min((users.meta?.current_page ?? 1) * (users.meta?.per_page ?? 20), users.meta?.total ?? 0)} of {users.meta?.total ?? 0} entries
                    </div>
                    <div className="flex gap-2">
                        {Array.from({ length: users.meta?.last_page ?? 1 }).map((_, index) => {
                            const page = index + 1;
                            const active = page === (users.meta?.current_page ?? 1);
                            return (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => {
                                        router.get(
                                            route('admin.customers.index'),
                                            {
                                                page,
                                                search: search || undefined,
                                                status: filters.status ?? undefined,
                                                customer_group_id: groupFilter || undefined,
                                                type: typeFilter || undefined,
                                                per_page: perPage,
                                            },
                                            { preserveState: true, preserveScroll: true },
                                        );
                                    }}
                                    className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                        active ? 'bg-elvee-blue text-white shadow shadow-elvee-blue/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

