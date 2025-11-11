import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

type AdminUserRow = {
    id: number;
    name: string;
    email: string;
    type: string;
    user_group?: {
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
    };
    stats: {
        total: number;
        pending: number;
        review: number;
        approved: number;
        rejected: number;
    };
    userGroups: Option[];
}>;

const statusColours: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    review: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
};

export default function AdminUsersIndex() {
    const { users, kycStatuses, filters, stats, userGroups } = usePage<AdminUsersPageProps>().props;

    const statusOptions = useMemo(() => ['all', ...kycStatuses], [kycStatuses]);

    const changeStatus = (status: string) => {
        const params = status === 'all' ? {} : { status };
        router.get(route('admin.users.index'), params, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    const updateUserGroup = (user: AdminUserRow, groupId: string) => {
        router.patch(
            route('admin.users.group.update', user.id),
            { user_group_id: groupId || null },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <AdminLayout>
            <Head title="Customers & KYC" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Customer directory</h1>
                            <p className="text-sm text-slate-500">Monitor onboarding status, review documents, and unlock ordering access.</p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                            {statusOptions.map((status) => {
                                const active = (filters.status ?? 'all') === status;
                                return (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => changeStatus(status)}
                                        className={`rounded-full px-3 py-1 transition ${
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
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                    <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-lg shadow-slate-900/30">
                        <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Total</p>
                        <p className="mt-3 text-3xl font-semibold">{stats.total}</p>
                    </div>
                    <div className="rounded-3xl bg-amber-50 p-5 shadow-lg shadow-amber-500/10">
                        <p className="text-xs uppercase tracking-[0.35em] text-amber-500">Pending</p>
                        <p className="mt-3 text-3xl font-semibold text-amber-600">{stats.pending}</p>
                    </div>
                    <div className="rounded-3xl bg-amber-100 p-5 shadow-lg shadow-amber-500/10">
                        <p className="text-xs uppercase tracking-[0.35em] text-amber-600">Review</p>
                        <p className="mt-3 text-3xl font-semibold text-amber-700">{stats.review}</p>
                    </div>
                    <div className="rounded-3xl bg-emerald-50 p-5 shadow-lg shadow-emerald-500/10">
                        <p className="text-xs uppercase tracking-[0.35em] text-emerald-500">Approved</p>
                        <p className="mt-3 text-3xl font-semibold text-emerald-600">{stats.approved}</p>
                    </div>
                    <div className="rounded-3xl bg-rose-50 p-5 shadow-lg shadow-rose-500/10">
                        <p className="text-xs uppercase tracking-[0.35em] text-rose-500">Rejected</p>
                        <p className="mt-3 text-3xl font-semibold text-rose-600">{stats.rejected}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Email</th>
                                <th className="px-5 py-3 text-left">Type</th>
                                <th className="px-5 py-3 text-left">User group</th>
                                <th className="px-5 py-3 text-left">KYC Status</th>
                                <th className="px-5 py-3 text-left">Docs</th>
                                <th className="px-5 py-3 text-left">Joined</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {users.data.map((user) => {
                                const badgeClass = statusColours[user.kyc_status] ?? 'bg-slate-100 text-slate-600';

                                return (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-3 font-medium text-slate-900">
                                            <div>
                                                {user.name}
                                                {user.kyc_profile?.business_name && (
                                                    <p className="text-xs font-normal uppercase tracking-[0.3em] text-slate-400">
                                                        {user.kyc_profile.business_name}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-slate-600">{user.email}</td>
                                        <td className="px-5 py-3 text-slate-500 uppercase tracking-wide">{user.type}</td>
                                    <td className="px-5 py-3 text-slate-600">
                                        <select
                                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            value={user.user_group?.id ?? ''}
                                            onChange={(event) => updateUserGroup(user, event.target.value)}
                                        >
                                            <option value="">No group</option>
                                            {userGroups.map((group) => (
                                                <option key={group.id} value={group.id}>
                                                    {group.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                                                {user.kyc_status_label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-slate-500">{user.kyc_document_count}</td>
                                        <td className="px-5 py-3 text-slate-500">{user.joined_at ? new Date(user.joined_at).toLocaleDateString('en-IN') : '—'}</td>
                                        <td className="px-5 py-3 text-right">
                                            <Link
                                                href={route('admin.users.kyc.show', user.id)}
                                                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700"
                                            >
                                                Review KYC
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {users.data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No customers found.
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

