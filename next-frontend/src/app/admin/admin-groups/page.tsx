"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import Pagination from "@/components/ui/Pagination";
import { adminService } from "@/services/adminService";
import { PaginationMeta, generatePaginationLinks } from "@/utils/pagination";

type AdminGroupRow = {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
    features?: string[];
};

type Admin = {
    id: number;
    name: string;
    email: string;
    selected: boolean;
};


export default function AdminAdminGroupsPage() {
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<{ data: AdminGroupRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 20 }
    });
    const [currentPage, setCurrentPage] = useState(1);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<AdminGroupRow | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
    const [perPage, setPerPage] = useState(20);
    const [deleteConfirm, setDeleteConfirm] = useState<AdminGroupRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    // Assign Admins Modal state
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assigningGroup, setAssigningGroup] = useState<AdminGroupRow | null>(null);
    const [assignAdmins, setAssignAdmins] = useState<Admin[]>([]);
    const [assignSelectedIds, setAssignSelectedIds] = useState<number[]>([]);
    const [assignSearchTerm, setAssignSearchTerm] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignProcessing, setAssignProcessing] = useState(false);

    const featureOptions = [
        { value: 'dashboard.view', label: 'Dashboard access' },
        { value: 'catalog.manage', label: 'Manage catalog' },
        { value: 'orders.manage', label: 'Manage orders' },
        { value: 'quotations.manage', label: 'Manage quotations' },
        { value: 'jobwork.manage', label: 'Manage jobwork' },
        { value: 'offers.manage', label: 'Manage offers & discounts' },
        { value: 'customers.manage', label: 'Manage customers' },
        { value: 'reports.view', label: 'View reports' },
        { value: 'settings.manage', label: 'Configure settings' },
    ];

    const [formState, setFormState] = useState({
        name: '',
        description: '',
        is_active: true,
        display_order: 0 as number | '',
        features: [] as string[],
    });

    useEffect(() => {
        loadGroups();
    }, [currentPage, perPage]);

    const loadGroups = async () => {
        setLoading(true);
        try {
            const response = await adminService.getAdminGroups(currentPage, perPage);
            const items = response.data.items || response.data.data || [];
            const responseMeta = response.data.meta || { current_page: 1, last_page: 1, total: 0, per_page: perPage };

            setGroups({
                data: items.map((item: any) => ({
                    id: Number(item.id),
                    name: item.name,
                    code: item.code || '',
                    description: item.description,
                    is_active: item.is_active,
                    display_order: item.display_order || 0,
                    features: item.features || [],
                })),
                meta: {
                    current_page: responseMeta.current_page || responseMeta.page || currentPage,
                    last_page: responseMeta.last_page || responseMeta.lastPage || 1,
                    total: responseMeta.total || 0,
                    per_page: responseMeta.per_page || responseMeta.perPage || perPage,
                    from: responseMeta.from,
                    to: responseMeta.to,
                    links: responseMeta.links || generatePaginationLinks(responseMeta.current_page || responseMeta.page || currentPage, responseMeta.last_page || responseMeta.lastPage || 1),
                },
            });
        } catch (error: any) {
            console.error('Failed to load admin groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const allSelected = useMemo(() => {
        if (groups.data.length === 0) return false;
        return selectedGroups.length === groups.data.length;
    }, [groups.data, selectedGroups]);

    const toggleSelectAll = () => {
        setSelectedGroups(allSelected ? [] : groups.data.map(g => g.id));
    };

    const toggleSelection = (id: number) => {
        setSelectedGroups(prev => prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]);
    };

    const resetForm = () => {
        setEditingGroup(null);
        setModalOpen(false);
        setFormState({
            name: '',
            description: '',
            is_active: true,
            display_order: 0 as number | '',
            features: [],
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (group: AdminGroupRow) => {
        setEditingGroup(group);
        setFormState({
            name: group.name,
            description: group.description ?? '',
            is_active: group.is_active,
            display_order: group.display_order || 0,
            features: (group as any).features || [],
        });
        setModalOpen(true);
    };

    const toggleFeature = (value: string, checked: boolean) => {
        setFormState(prev => ({
            ...prev,
            features: checked
                ? [...prev.features, value]
                : prev.features.filter(f => f !== value),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Auto-generate code from name (slugified and uppercased)
            const generateCode = (name: string) => {
                return name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '_')
                    .replace(/^_+|_+$/g, '')
                    .toUpperCase();
            };

            const payload = {
                name: formState.name,
                code: generateCode(formState.name),
                description: formState.description || null,
                is_active: formState.is_active,
                display_order: Number(formState.display_order) || 0,
                features: formState.features,
            };

            if (editingGroup) {
                await adminService.updateAdminGroup(editingGroup.id, payload);
            } else {
                await adminService.createAdminGroup(payload);
            }
            resetForm();
            await loadGroups();
        } catch (error: any) {
            console.error('Failed to save admin group:', error);
            alert(error.response?.data?.message || 'Failed to save admin group. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleActivation = async (group: AdminGroupRow) => {
        try {
            await adminService.updateAdminGroup(group.id, {
                name: group.name,
                code: group.code,
                description: group.description || null,
                is_active: !group.is_active,
                display_order: group.display_order,
            });
            await loadGroups();
        } catch (error: any) {
            console.error('Failed to toggle admin group:', error);
            alert(error.response?.data?.message || 'Failed to update admin group. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteAdminGroup(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadGroups();
            } catch (error: any) {
                console.error('Failed to delete admin group:', error);
                alert(error.response?.data?.message || 'Failed to delete admin group. Please try again.');
            }
        }
    };

    const handleBulkDelete = async () => {
        try {
            await adminService.bulkDeleteAdminGroups(selectedGroups);
            setSelectedGroups([]);
            setBulkDeleteConfirm(false);
            await loadGroups();
        } catch (error: any) {
            console.error('Failed to delete admin groups:', error);
            alert(error.response?.data?.message || 'Failed to delete admin groups. Please try again.');
        }
    };

    // Assign Admins Modal functions
    const openAssignModal = async (group: AdminGroupRow) => {
        setAssigningGroup(group);
        setAssignSearchTerm('');
        setAssignLoading(true);
        setAssignModalOpen(true);
        try {
            const response = await adminService.getAssignAdmins(group.id);
            const data = response.data;
            setAssignAdmins(data.admins || []);
            setAssignSelectedIds(data.selectedAdminIds || []);
        } catch (error: any) {
            console.error('Failed to load admins:', error);
            alert(error.response?.data?.message || 'Failed to load admins. Please try again.');
            setAssignModalOpen(false);
        } finally {
            setAssignLoading(false);
        }
    };

    const closeAssignModal = () => {
        setAssignModalOpen(false);
        setAssigningGroup(null);
        setAssignAdmins([]);
        setAssignSelectedIds([]);
        setAssignSearchTerm('');
    };

    const filteredAssignAdmins = useMemo(() => {
        if (!assignSearchTerm.trim()) {
            return assignAdmins;
        }
        const search = assignSearchTerm.toLowerCase();
        return assignAdmins.filter(
            (admin) =>
                admin.name.toLowerCase().includes(search) ||
                admin.email.toLowerCase().includes(search)
        );
    }, [assignAdmins, assignSearchTerm]);

    const visibleSelectedCount = useMemo(() => {
        return filteredAssignAdmins.filter((a) => assignSelectedIds.includes(a.id)).length;
    }, [filteredAssignAdmins, assignSelectedIds]);

    const allVisibleSelected = useMemo(() => {
        if (filteredAssignAdmins.length === 0) return false;
        return filteredAssignAdmins.every((a) => assignSelectedIds.includes(a.id));
    }, [filteredAssignAdmins, assignSelectedIds]);

    const toggleAssignAdmin = (adminId: number) => {
        setAssignSelectedIds((prev) =>
            prev.includes(adminId)
                ? prev.filter((id) => id !== adminId)
                : [...prev, adminId]
        );
    };

    const selectAllVisible = () => {
        const visibleIds = filteredAssignAdmins.map((a) => a.id);
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
        const visibleIds = filteredAssignAdmins.map((a) => a.id);
        setAssignSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    };

    const handleAssignSearch = async () => {
        if (!assigningGroup) return;
        setAssignLoading(true);
        try {
            const response = await adminService.getAssignAdmins(assigningGroup.id, assignSearchTerm);
            const data = response.data;
            setAssignAdmins(data.admins || []);
            // Preserve selections
            setAssignSelectedIds((prev) => {
                const newIds = [...prev];
                data.selectedAdminIds?.forEach((id: number) => {
                    if (!newIds.includes(id)) {
                        newIds.push(id);
                    }
                });
                return newIds;
            });
        } catch (error: any) {
            console.error('Failed to search admins:', error);
            alert(error.response?.data?.message || 'Failed to search admins. Please try again.');
        } finally {
            setAssignLoading(false);
        }
    };

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assigningGroup) return;
        
        setAssignProcessing(true);
        try {
            await adminService.assignAdmins(assigningGroup.id, assignSelectedIds);
            closeAssignModal();
            await loadGroups();
        } catch (error: any) {
            console.error('Failed to assign admins:', error);
            alert(error.response?.data?.message || 'Failed to assign admins. Please try again.');
        } finally {
            setAssignProcessing(false);
        }
    };

    if (loading && !groups.data.length) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">admin groups</h1>
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
                            onClick={() => setBulkDeleteConfirm(true)}
                            disabled={selectedGroups.length === 0}
                            className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Bulk delete
                        </button>
                        <select
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:ring-0"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
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
                        {groups.data.map((group) => (
                            <tr key={group.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedGroups.includes(group.id)}
                                        onChange={() => toggleSelection(group.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                    />
                                </td>
                                <td className="px-5 py-3 font-semibold text-slate-900">
                                    <div className="flex flex-col gap-1">
                                        <span>{group.name}</span>
                                        {group.description && <span className="text-xs font-normal text-slate-500">{group.description}</span>}
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-slate-500 font-mono text-sm">{group.code}</td>
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
                                            title="Assign admins"
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
                                            onClick={() => toggleActivation(group)}
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
                                            onClick={() => setDeleteConfirm(group)}
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
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination 
                meta={groups.meta} 
                onPageChange={setCurrentPage} 
            />

            <Modal show={modalOpen} onClose={resetForm} maxWidth="6xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingGroup ? `Edit user group: ${editingGroup.name}` : 'Create new admin group'}
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
                                    disabled={loading}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editingGroup ? 'Update admin group' : 'Create admin group'}
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
                        <form onSubmit={handleSubmit} className="space-y-6" id="group-form">
                            <div className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-6">
                                    <div className="grid gap-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Name</span>
                                            <input
                                                type="text"
                                                value={formState.name}
                                                onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                required
                                            />
                                        </label>
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Display order</span>
                                            <input
                                                type="number"
                                                value={formState.display_order}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormState(prev => ({ 
                                                        ...prev, 
                                                        display_order: value === '' ? '' : Number(value) 
                                                    }));
                                                }}
                                                onBlur={(e) => {
                                                    if (e.target.value === '') {
                                                        setFormState(prev => ({ 
                                                            ...prev, 
                                                            display_order: 0 
                                                        }));
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
                                        </label>
                                    </div>
                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={formState.is_active}
                                            onChange={(e) => setFormState(prev => ({ ...prev, is_active: e.target.checked }))}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Active for assignment
                                    </label>
                                </div>
                                <div className="space-y-6">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Description</span>
                                        <textarea
                                            value={formState.description}
                                            onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                                            className="min-h-[120px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Optional notes for internal reference."
                                        />
                                    </label>
                                </div>
                            </div>

                            <fieldset className="rounded-2xl border border-slate-200 px-4 py-4">
                                <legend className="px-2 text-xs font-semibold text-slate-400">
                                    Feature access
                                </legend>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    {featureOptions.map((feature) => {
                                        const checked = formState.features.includes(feature.value);
                                        return (
                                            <label key={feature.value} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => toggleFeature(feature.value, e.target.checked)}
                                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                />
                                                {feature.label}
                                            </label>
                                        );
                                    })}
                                </div>
                            </fieldset>
                        </form>
                    </div>
                </div>
            </Modal>

            <ConfirmationModal
                show={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Remove Group"
                message={deleteConfirm ? `Are you sure you want to remove admin group ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Groups"
                message={`Are you sure you want to delete ${selectedGroups.length} selected admin group(s)?`}
                confirmText="Delete"
                variant="danger"
            />

            {/* Assign Admins Modal */}
            <Modal show={assignModalOpen} onClose={closeAssignModal} maxWidth="6xl">
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">
                                    Assign admins to {assigningGroup?.name}!
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Select one or more admins. Use filters to narrow the list, then save to sync assignments.
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
                                    <span className="font-semibold">{filteredAssignAdmins.length}</span> visible
                                </div>
                            </div>

                            {/* Admins Table */}
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
                                                        aria-label="Select all visible admins"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-left">Name</th>
                                                <th className="px-4 py-3 text-left">Email</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {filteredAssignAdmins.map((admin) => {
                                                const isSelected = assignSelectedIds.includes(admin.id);
                                                return (
                                                    <tr key={admin.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleAssignAdmin(admin.id)}
                                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                aria-label={`Select ${admin.name}`}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 font-medium text-slate-900">
                                                            {admin.name}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600">{admin.email}</td>
                                                    </tr>
                                                );
                                            })}
                                            {filteredAssignAdmins.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                                                        No admins found matching your search.
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
        </div>
    );
}
