"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

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

type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

const statusColours: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    review: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
};

const mockCustomerGroups = [
    { id: 1, name: "Premium Retailers" },
    { id: 2, name: "Bulk Buyers" }
];

const mockCustomers: AdminUserRow[] = [
    { 
        id: 1, 
        name: 'Retail Partner A', 
        email: 'retailer@example.com', 
        type: 'retailer', 
        customer_group: { id: 1, name: 'Premium Retailers' }, 
        kyc_status: 'approved', 
        kyc_status_label: 'Approved',
        kyc_document_count: 3,
        is_active: true, 
        joined_at: '2023-03-01T10:00:00Z' 
    },
    { 
        id: 2, 
        name: 'Wholesale Corp', 
        email: 'wholesale@example.com', 
        type: 'wholesaler', 
        customer_group: { id: 2, name: 'Bulk Buyers' }, 
        kyc_status: 'review', 
        kyc_status_label: 'Under Review',
        kyc_document_count: 1,
        is_active: true, 
        joined_at: '2023-03-05T11:30:00Z' 
    },
    { 
        id: 3, 
        name: 'Independent Seller', 
        email: 'seller@example.com', 
        type: 'retailer', 
        customer_group: null, 
        kyc_status: 'pending', 
        kyc_status_label: 'Pending',
        kyc_document_count: 0,
        is_active: false, 
        joined_at: '2023-03-10T09:15:00Z' 
    },
];

export default function AdminCustomersPage() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<{ data: AdminUserRow[]; meta: PaginationMeta }>({
        data: mockCustomers,
        meta: { current_page: 1, last_page: 1, total: mockCustomers.length, per_page: 20 }
    });

    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(20);
    const [typeFilter, setTypeFilter] = useState('');
    const [groupFilter, setGroupFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const statusOptions = ['all', 'pending', 'review', 'approved', 'rejected'];

    useEffect(() => {
        setLoading(false);
    }, []);

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

    const toggleActive = (user: AdminUserRow) => {
        setUsers(prev => ({
            ...prev,
            data: prev.data.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u)
        }));
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setUsers(prev => ({
                ...prev,
                data: prev.data.filter(u => u.id !== deleteConfirm),
                meta: { ...prev.meta, total: prev.meta.total - 1 }
            }));
            setDeleteConfirm(null);
        }
    };

    const handleBulkDelete = () => {
        setUsers(prev => ({
            ...prev,
            data: prev.data.filter(u => !selectedIds.includes(u.id)),
            meta: { ...prev.meta, total: prev.meta.total - selectedIds.length }
        }));
        setSelectedIds([]);
        setBulkDeleteConfirm(false);
    };

    const bulkAssignGroup = (groupId: string) => {
        if (selectedIds.length === 0) return;
        const group = mockCustomerGroups.find(g => String(g.id) === groupId);
        setUsers(prev => ({
            ...prev,
            data: prev.data.map(u => selectedIds.includes(u.id) ? { ...u, customer_group: group || null } : u)
        }));
        clearBulkSelection();
    };

    if (loading && !users.data.length) return null;

    return (
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
                            {mockCustomerGroups.map((group) => (
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
                            const active = statusFilter === status;
                            return (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setStatusFilter(status)}
                                    className={`rounded-full px-3 py-1 transition ${
                                        active ? 'bg-slate-900 text-white shadow shadow-slate-900/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                >
                                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
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
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>entries</span>
                    </div>
                </div>
            </section>

            {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-slate-900 px-6 py-4 text-sm text-white shadow-lg shadow-slate-900/20">
                    <span>{selectedIds.length} selected</span>
                    <button
                        type="button"
                        onClick={() => setBulkDeleteConfirm(true)}
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
                        {mockCustomerGroups.map((group) => (
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
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
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
                                    <td className="px-5 py-3 text-slate-500 capitalize">{user.type}</td>
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
                                                href={`/admin/users/${user.id}/kyc`}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                                title="Review KYC"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5l7.5 7.5-7.5 7.5m-7.5-7.5h15" />
                                                </svg>
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteConfirm(user.id)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                                title="Delete customer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <div>
                    Showing {users.data.length} of {users.meta.total} entries
                </div>
                <div className="flex gap-2">
                    <button className="rounded-full px-3 py-1 text-sm font-semibold bg-elvee-blue text-white shadow shadow-elvee-blue/20">1</button>
                </div>
            </div>

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Customers"
                message={`Are you sure you want to delete ${selectedIds.length} selected customer(s)? This cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />

            <ConfirmationModal
                show={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Delete Customer"
                message="Are you sure you want to delete this customer? This action is irreversible."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
