'use client';

import { useEffect, useState } from 'react';
import { Head } from '@/components/Head';
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

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

const mockUserGroups = [
    { id: 1, name: 'Inventory Managers' },
    { id: 2, name: 'Sales Ops' },
];

const mockAvailableTypes = [
    { value: 'admin', label: 'Administrator' },
    { value: 'super-admin', label: 'Super Administrator' },
    { value: 'production', label: 'Production Staff' },
];

const mockUsers: TeamUser[] = [
    { id: 1, name: 'Admin User', email: 'admin@example.com', type: 'super-admin', type_label: 'Super Administrator', user_group: null, joined_at: '2025-01-01T10:00:00Z' },
    { id: 2, name: 'Staff Member', email: 'staff@example.com', type: 'admin', type_label: 'Administrator', user_group: { id: 1, name: 'Inventory Managers' }, joined_at: '2025-02-15T14:30:00Z' },
];

export default function AdminTeamUsersPage() {
    const [allUsers, setAllUsers] = useState<TeamUser[]>(mockUsers);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<TeamUser | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        type: 'admin',
        user_group_id: '',
        password: '',
        password_confirmation: '',
    });
    const [processing, setProcessing] = useState(false);

    const resetFormAndModal = () => {
        setEditingUser(null);
        setModalOpen(false);
        setFormData({ name: '', email: '', type: 'admin', user_group_id: '', password: '', password_confirmation: '' });
    };

    const openEditModal = (user: TeamUser) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            type: user.type,
            user_group_id: user.user_group?.id.toString() ?? '',
            password: '',
            password_confirmation: '',
        });
        setModalOpen(true);
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        setTimeout(() => {
            if (editingUser) {
                setAllUsers(allUsers.map(u => u.id === editingUser.id ? { ...u, ...formData, user_group: mockUserGroups.find(g => g.id === Number(formData.user_group_id)) ?? null } : u));
            } else {
                setAllUsers([...allUsers, { id: Date.now(), ...formData, type_label: mockAvailableTypes.find(t => t.value === formData.type)?.label ?? '', user_group: mockUserGroups.find(g => g.id === Number(formData.user_group_id)) ?? null, joined_at: new Date().toISOString() }]);
            }
            setProcessing(false);
            resetFormAndModal();
        }, 500);
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            setAllUsers(allUsers.filter(u => u.id !== deleteConfirm.id));
            setDeleteConfirm(null);
        }
    };

    return (
        <>
            <Head title="Team Management" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Team Users</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage internal administrative users and their access roles.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/20 transition hover:bg-navy"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                        </svg>
                        Add user
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 text-sm">
                        <div className="font-semibold text-slate-700">Team Members ({allUsers.length})</div>
                    </div>
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Email</th>
                                <th className="px-5 py-3 text-left">Role</th>
                                <th className="px-5 py-3 text-left">Group</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {allUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{user.name}</td>
                                    <td className="px-5 py-3 text-slate-500">{user.email}</td>
                                    <td className="px-5 py-3">
                                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                            {user.type_label}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">{user.user_group?.name ?? '—'}</td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => openEditModal(user)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5V19a1 1 0 001 1h2.5a1 1 0 00.7-.3l9.8-9.8a1 1 0 000-1.4l-2.5-2.5a1 1 0 00-1.4 0l-9.8 9.8a1 1 0 00-.3.7z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
                                                </svg>
                                            </button>
                                            <button type="button" onClick={() => setDeleteConfirm(user)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600">
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
            </div>

            <Modal show={modalOpen} onClose={resetFormAndModal} maxWidth="xl">
                <form onSubmit={submit} className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    required
                                >
                                    {mockAvailableTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">User Group</label>
                                <select
                                    value={formData.user_group_id}
                                    onChange={(e) => setFormData({ ...formData, user_group_id: e.target.value })}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                >
                                    <option value="">No Group</option>
                                    {mockUserGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                                </select>
                            </div>
                        </div>
                        {!editingUser && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        required={!editingUser}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={formData.password_confirmation}
                                        onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        required={!editingUser}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                        <button type="button" onClick={resetFormAndModal} className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                        <button type="submit" disabled={processing} className="rounded-full bg-elvee-blue px-5 py-2 text-sm font-semibold text-white">Save</button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                show={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Remove Team User"
                message={deleteConfirm ? `Are you sure you want to remove user ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />
        </>
    );
}
