'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Head } from '@/components/Head';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { adminService } from '@/services/adminService';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';

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


const featureOptions: FeatureOption[] = [
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

export default function AdminUserGroupsPage() {
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<{ data: UserGroupRow[]; meta: PaginationMeta }>({
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 20 }
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<UserGroupRow | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<UserGroupRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        features: [] as string[],
        is_active: true,
        position: 0,
    });

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const featureLabels = useMemo(
        () =>
            featureOptions.reduce<Record<string, string>>((carry, option) => {
                carry[option.value] = option.label;
                return carry;
            }, {}),
        [],
    );

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
                    slug: item.slug,
                    description: item.description,
                    is_active: item.is_active,
                    position: item.position || 0,
                    features: Array.isArray(item.features) ? item.features : [],
                })),
                meta: {
                    current_page: responseMeta.page || responseMeta.current_page || currentPage,
                    last_page: responseMeta.lastPage || responseMeta.last_page || 1,
                    total: responseMeta.total || 0,
                    per_page: responseMeta.perPage || responseMeta.per_page || perPage,
                    from: responseMeta.from,
                    to: responseMeta.to,
                    links: responseMeta.links || generatePaginationLinks(responseMeta.page || responseMeta.current_page || currentPage, responseMeta.lastPage || responseMeta.last_page || 1),
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
        setFormData({
            name: '',
            description: '',
            features: [],
            is_active: true,
            position: 0,
        });
        setErrors({});
    };

    const openCreateModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (group: UserGroupRow) => {
        setEditingGroup(group);
        setFormData({
            name: group.name,
            description: group.description ?? '',
            is_active: group.is_active,
            position: group.position,
            features: group.features ?? [],
        });
        setModalOpen(true);
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const payload: any = {
                name: formData.name,
                description: formData.description || null,
                features: formData.features.length > 0 ? formData.features : null,
                is_active: formData.is_active,
                position: formData.position || 0,
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

    const toggleActivation = async (group: UserGroupRow) => {
        try {
            await adminService.updateUserGroup(group.id, {
                name: group.name,
                description: group.description,
                features: group.features,
                is_active: !group.is_active,
                position: group.position,
            });
            await loadGroups();
        } catch (error: any) {
            console.error('Failed to toggle activation:', error);
            alert(error.response?.data?.message || 'Failed to update user group. Please try again.');
        }
    };

    const deleteGroup = (group: UserGroupRow) => {
        setDeleteConfirm(group);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteUserGroup(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadGroups();
            } catch (error: any) {
                console.error('Failed to delete user group:', error);
                alert(error.response?.data?.message || 'Failed to delete user group. Please try again.');
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
            await adminService.bulkDeleteUserGroups(selectedGroups);
            setSelectedGroups([]);
            setBulkDeleteConfirm(false);
            await loadGroups();
        } catch (error: any) {
            console.error('Failed to delete user groups:', error);
            alert(error.response?.data?.message || 'Failed to delete user groups. Please try again.');
        }
    };

    const toggleFeature = (value: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            features: checked ? [...prev.features, value] : prev.features.filter((item) => item !== value),
        }));
    };

    return (
        <>
            <Head title="User groups" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">User groups</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Bundle panel permissions into reusable groups and assign them to internal or external users.
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
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
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
                                        className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
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
                            {loading && groups.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-6 text-center text-sm text-slate-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : groups.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No user groups defined yet.
                                    </td>
                                </tr>
                            ) : (
                                groups.data.map((group) => (
                                    <tr key={group.id} className="hover:bg-slate-50">
                                        <td className="px-5 py-3 align-top">
                                            <input
                                                type="checkbox"
                                                checked={selectedGroups.includes(group.id)}
                                                onChange={() => toggleSelection(group.id)}
                                                className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                aria-label={`Select user group ${group.name}`}
                                            />
                                        </td>
                                        <td className="px-5 py-3 align-top font-semibold text-slate-900">
                                            <div className="flex flex-col gap-1">
                                                <span>{group.name}</span>
                                                {group.description && <span className="text-xs text-slate-500 font-normal">{group.description}</span>}
                                                <span className="text-xs text-slate-400 font-normal">Slug: {group.slug}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 align-top text-slate-600">
                                            {group.features && group.features.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {group.features.map((feature) => (
                                                        <span
                                                            key={feature}
                                                            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500"
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

                <Pagination 
                    meta={groups.meta} 
                    onPageChange={setCurrentPage} 
                />

                <Modal show={modalOpen} onClose={resetForm} maxWidth="6xl">
                    <div className="flex min-h-0 flex-col">
                        <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {editingGroup ? `Edit user group: ${editingGroup.name}` : 'Create new user group'}
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
                                        {editingGroup ? 'Update user group' : 'Create user group'}
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
                                                    value={formData.name}
                                                    onChange={(event) => setFormData(prev => ({ ...prev, name: event.target.value }))}
                                                    className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                                    required
                                                />
                                                {errors.name && <span className="text-xs text-rose-500">{errors.name}</span>}
                                            </label>
                                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                                <span>Display order</span>
                                                <input
                                                    type="number"
                                                    value={formData.position}
                                                    onChange={(event) => setFormData(prev => ({ ...prev, position: Number(event.target.value) }))}
                                                    className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                                    min={0}
                                                />
                                                {errors.position && <span className="text-xs text-rose-500">{errors.position}</span>}
                                            </label>
                                        </div>

                                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(event) => setFormData(prev => ({ ...prev, is_active: event.target.checked }))}
                                                className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                            />
                                            Active for assignment
                                        </label>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Description</span>
                                            <textarea
                                                value={formData.description}
                                                onChange={(event) => setFormData(prev => ({ ...prev, description: event.target.value }))}
                                                className="min-h-[120px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                                placeholder="Optional notes for internal reference."
                                            />
                                            {errors.description && <span className="text-xs text-rose-500">{errors.description}</span>}
                                        </label>
                                    </div>
                                </div>

                                <fieldset className="rounded-2xl border border-slate-200 px-4 py-4">
                                    <legend className="px-2 text-xs font-semibold text-slate-400">
                                        Feature access
                                    </legend>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        {featureOptions.map((feature) => {
                                            const checked = formData.features.includes(feature.value);
                                            return (
                                                <label key={feature.value} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 cursor-pointer hover:bg-slate-100 transition">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(event) => toggleFeature(feature.value, event.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                    />
                                                    {feature.label}
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {errors.features && <p className="mt-2 text-xs text-rose-500">{errors.features}</p>}
                                </fieldset>
                            </form>
                        </div>
                    </div>
                </Modal>

                <ConfirmationModal
                    show={deleteConfirm !== null}
                    onClose={() => setDeleteConfirm(null)}
                    onConfirm={handleDelete}
                    title="Remove User Group"
                    message={deleteConfirm ? `Are you sure you want to remove user group ${deleteConfirm.name}?` : ''}
                    confirmText="Remove"
                    variant="danger"
                />

                <ConfirmationModal
                    show={bulkDeleteConfirm}
                    onClose={() => setBulkDeleteConfirm(false)}
                    onConfirm={handleBulkDelete}
                    title="Delete User Groups"
                    message={`Are you sure you want to delete ${selectedGroups.length} selected user group(s)?`}
                    confirmText="Delete"
                    variant="danger"
                />
            </div>
        </>
    );
}
