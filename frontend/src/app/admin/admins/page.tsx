'use client';

import { useEffect, useMemo, useState } from 'react';
import { Head } from '@/components/Head';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import TextInput from '@/components/ui/TextInput';
import InputLabel from '@/components/ui/InputLabel';
import InputError from '@/components/ui/InputError';
import Select from '@/components/ui/Select';
import { toastSuccess, toastError } from '@/utils/toast';
import { adminService } from '@/services/adminService';
import { PaginationMeta, generatePaginationLinks } from '@/utils/pagination';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAdminUserSchema, editAdminUserSchema, CreateAdminUserFormData, EditAdminUserFormData } from '@/lib/validation/admin.schema';

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
    const [adminGroups, setAdminGroups] = useState<Array<{ id: number; name: string; is_active: boolean }>>([]);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // React Hook Form setup - dynamically switch schema based on edit mode
    const resolver = useMemo(
        () => zodResolver(editingUser ? editAdminUserSchema : createAdminUserSchema),
        [editingUser]
    );

    const {
        control,
        handleSubmit: handleFormSubmit,
        formState: { errors },
        reset,
        setError,
        trigger,
        watch,
    } = useForm<CreateAdminUserFormData | EditAdminUserFormData>({
        resolver,
        mode: "onSubmit",
        reValidateMode: "onBlur",
        shouldFocusError: true,
        defaultValues: {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            admin_group_id: '',
            type: 'admin',
        },
    });

    // Watch password field for conditional validation
    const passwordValue = watch('password');
    // Toast notifications are handled via RTK

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
            // Filter out paused groups (is_active === false) - only show active groups
            setAdminGroups(
                items
                    .filter((item: any) => item.is_active === true)
                    .map((item: any) => ({ 
                        id: Number(item.id), 
                        name: item.name,
                        is_active: item.is_active === true 
                    }))
            );
        } catch (error: any) {
            // Silently handle error - don't log to console to avoid Next.js error overlay
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
            await adminService.updateAdminGroupAssignment(user.id, groupIdNum);
            await loadUsers();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to update admin group. Please try again.';
            toastError(errorMessage);
            
            // Silently handle error - don't log to console to avoid Next.js overlay
        }
    };

    const onSubmit = async (data: CreateAdminUserFormData | EditAdminUserFormData) => {
        setProcessing(true);
        
        try {
            const payload: any = {
                name: data.name,
                email: data.email,
                type: data.type,
                admin_group_id: data.admin_group_id ? Number(data.admin_group_id) : null,
            };

            if (editingUser) {
                if (data.password && data.password.length > 0) {
                    payload.password = data.password;
                    payload.password_confirmation = data.password_confirmation;
                }
                await adminService.updateAdmin(editingUser.id, payload);
            } else {
                payload.password = data.password;
                payload.password_confirmation = data.password_confirmation;
                await adminService.createAdmin(payload);
            }

            // Reset form
            reset({
                name: '',
                email: '',
                password: '',
                password_confirmation: '',
                admin_group_id: '',
                type: 'admin',
            });
            setEditingUser(null);
            toastSuccess(editingUser ? 'Admin updated successfully.' : 'Admin created successfully.');
            await loadUsers();
        } catch (error: any) {
            // Handle field-level errors
            if (error.response?.data?.errors) {
                const fieldErrors = error.response.data.errors;
                Object.keys(fieldErrors).forEach((key) => {
                    const errorMessage = Array.isArray(fieldErrors[key]) 
                        ? fieldErrors[key][0] 
                        : fieldErrors[key];
                    setError(key as keyof (CreateAdminUserFormData | EditAdminUserFormData), {
                        type: 'server',
                        message: errorMessage,
                    });
                });
            }
            
            // Show error message in FlashMessage (prioritize message field)
            const errorMessage = error.response?.data?.message 
                ? (Array.isArray(error.response.data.message) 
                    ? error.response.data.message.join(', ') 
                    : error.response.data.message)
                : 'Failed to save admin. Please try again.';
            toastError(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const editUser = (user: AdminUser) => {
        setEditingUser(user);
        reset({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            admin_group_id: user.admin_group?.id ? String(user.admin_group.id) : '',
            type: user.type as 'admin' | 'super-admin' | 'production' | 'sales',
        });
    };

    const cancelEdit = () => {
        setEditingUser(null);
        reset({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            admin_group_id: '',
            type: 'admin',
        });
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
                toastSuccess('Admin deleted successfully.');
                await loadUsers();
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || 'Failed to delete admin. Please try again.';
                toastError(errorMessage);
                
                // Silently handle error - don't log to console to avoid Next.js overlay
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
            toastSuccess(`${selectedIds.length} admin(s) deleted successfully.`);
            await loadUsers();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to delete admins. Please try again.';
            toastError(errorMessage);
            
            // Silently handle error - don't log to console to avoid Next.js overlay
        }
    };

    const formTitle = editingUser ? `Edit ${editingUser.name}` : 'Create admin';

    return (
        <>
            <Head title="Admins" />

            <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Admin directory</h1>
                            <p className="mt-1 text-xs sm:text-sm text-slate-500">
                                Create admin accounts and limit what they see by assigning admin groups.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedIds.length === 0}
                                className="rounded-full border border-rose-200 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Bulk delete ({selectedIds.length})
                            </button>
                            {editingUser && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded-full border border-slate-300 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    Cancel edit
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="mt-1.5 sm:mt-1 text-xs sm:text-sm text-slate-500">
                        Only accounts with admin access should live here. Keep at least one Super Admin active at all times.
                    </p>
                </div>

                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">{formTitle}</h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        New admin accounts default to admin-level access and can be restricted by assigning an admin group.
                    </p>

                    <form onSubmit={handleFormSubmit(onSubmit)} className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                        {/* Name */}
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <InputLabel htmlFor="name">Name</InputLabel>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <TextInput
                                            id="name"
                                            type="text"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                trigger('name');
                                            }}
                                            onBlur={async () => {
                                                field.onBlur();
                                                await trigger('name');
                                            }}
                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                        />
                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                    </>
                                )}
                            />
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <InputLabel htmlFor="email">Email</InputLabel>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <TextInput
                                            id="email"
                                            type="email"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                trigger('email');
                                            }}
                                            onBlur={async () => {
                                                field.onBlur();
                                                await trigger('email');
                                            }}
                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                        />
                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                    </>
                                )}
                            />
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <InputLabel htmlFor="password">Password</InputLabel>
                            <Controller
                                name="password"
                                control={control}
                                render={({ field, fieldState }) => {
                                    const confirmationValue = watch('password_confirmation');
                                    const isCreateMode = !editingUser;
                                    return (
                                        <>
                                            <TextInput
                                                id="password"
                                                type="password"
                                                value={field.value || ''}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    // In create mode, validate on change if field has value
                                                    // In edit mode, only validate if field has value
                                                    if (e.target.value) {
                                                        trigger('password');
                                                        // In edit mode, trigger confirmation validation when password is entered
                                                        // In create mode, only trigger if confirmation also has value
                                                        if (!isCreateMode || confirmationValue) {
                                                            trigger('password_confirmation');
                                                        }
                                                    } else if (!isCreateMode) {
                                                        // In edit mode, clear errors if field is cleared
                                                        trigger('password');
                                                        trigger('password_confirmation');
                                                    }
                                                }}
                                                onBlur={async () => {
                                                    field.onBlur();
                                                    // Only validate on blur if field has value OR it's create mode and field was touched
                                                    const hasValue = field.value && field.value.length > 0;
                                                    if (hasValue || (isCreateMode && fieldState.isTouched)) {
                                                        await trigger('password');
                                                        // In edit mode, trigger confirmation validation when password is entered
                                                        // In create mode, only trigger if confirmation also has value
                                                        if (!isCreateMode || ((watch('password_confirmation') ?? '').length > 0)) {
                                                            await trigger('password_confirmation');
                                                        }
                                                    }
                                                }}
                                                className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            />
                                            {fieldState.error && <InputError message={fieldState.error.message} />}
                                            {editingUser && (
                                                <span className="text-[10px] sm:text-xs text-slate-400">Leave blank to keep the existing password.</span>
                                            )}
                                        </>
                                    );
                                }}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <InputLabel htmlFor="password_confirmation">Confirm password</InputLabel>
                            <Controller
                                name="password_confirmation"
                                control={control}
                                render={({ field, fieldState }) => {
                                    const passwordValue = watch('password');
                                    const isCreateMode = !editingUser;
                                    return (
                                        <>
                                            <TextInput
                                                id="password_confirmation"
                                                type="password"
                                                value={field.value || ''}
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    // Only trigger validation if BOTH fields have values
                                                    if (passwordValue && e.target.value) {
                                                        trigger('password_confirmation');
                                                        trigger('password');
                                                    } else if (!isCreateMode && !e.target.value) {
                                                        // In edit mode, clear errors if field is cleared
                                                        trigger('password_confirmation');
                                                    }
                                                }}
                                                onBlur={async () => {
                                                    field.onBlur();
                                                    const currentPassword = watch('password');
                                                    const currentConfirmation = watch('password_confirmation');
                                                    const hasPassword = currentPassword && currentPassword.length > 0;
                                                    const hasConfirmation = currentConfirmation && currentConfirmation.length > 0;
                                                    
                                                    // In edit mode: validate if password is present (confirmation is required)
                                                    // In create mode: validate if field was touched (always required)
                                                    const shouldValidate = (isCreateMode && fieldState.isTouched) || (hasPassword && !isCreateMode);
                                                    
                                                    if (shouldValidate) {
                                                        await trigger('password_confirmation');
                                                        if (hasPassword && hasConfirmation) {
                                                            await trigger('password');
                                                        }
                                                    }
                                                }}
                                                className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            />
                                            {fieldState.error && <InputError message={fieldState.error.message} />}
                                        </>
                                    );
                                }}
                            />
                        </div>

                        {/* User Role */}
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <InputLabel htmlFor="type">User role</InputLabel>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <Select
                                            id="type"
                                            value={field.value}
                                            onChange={(e) => {
                                                const newType = e.target.value as 'admin' | 'super-admin' | 'production' | 'sales';
                                                field.onChange(newType);
                                                if (newType === 'super-admin') {
                                                    reset({ ...watch(), admin_group_id: '' });
                                                }
                                                trigger('type');
                                            }}
                                            onBlur={async () => {
                                                field.onBlur();
                                                await trigger('type');
                                            }}
                                            disabled={editingUser?.type === 'super-admin'}
                                            className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                        >
                                            {availableTypes.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Select>
                                        {fieldState.error && <InputError message={fieldState.error.message} />}
                                    </>
                                )}
                            />
                        </div>

                        {/* Admin Group */}
                        <div className="flex flex-col gap-1.5 sm:gap-2 md:col-span-2 md:max-w-xs">
                            <InputLabel htmlFor="admin_group_id">Admin group (optional)</InputLabel>
                            <Controller
                                name="admin_group_id"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        {watch('type') === 'super-admin' || editingUser?.type === 'super-admin' ? (
                                            <div className="rounded-xl sm:rounded-2xl border border-dashed border-slate-200 px-3 py-2 sm:px-4 text-xs sm:text-sm text-slate-400 mt-1">
                                                Super administrators bypass group restrictions.
                                            </div>
                                        ) : (
                                            <>
                                                <Select
                                                    id="admin_group_id"
                                                    value={field.value || ''}
                                                    onChange={(e) => {
                                                        field.onChange(e.target.value);
                                                        trigger('admin_group_id');
                                                    }}
                                                    onBlur={async () => {
                                                        field.onBlur();
                                                        await trigger('admin_group_id');
                                                    }}
                                                    className={`mt-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                >
                                                    <option value="">Admin (no restrictions)</option>
                                                    {adminGroups.map((group) => (
                                                        <option key={group.id} value={group.id}>
                                                            {group.name}
                                                        </option>
                                                    ))}
                                                </Select>
                                                {fieldState.error && <InputError message={fieldState.error.message} />}
                                            </>
                                        )}
                                    </>
                                )}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-full bg-slate-900 px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:opacity-50"
                            >
                                {editingUser ? 'Save changes' : 'Create admin'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
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
                                        aria-label="Select all users"
                                    />
                                </th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left">Name</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left hidden md:table-cell">Email</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left hidden lg:table-cell">Role</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left">Admin group</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left hidden md:table-cell">Joined</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading && users.data.length === 0 ? (
                                <tr>
                                        <td colSpan={7} className="px-3 py-4 sm:px-5 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : users.data.length === 0 ? (
                                <tr>
                                        <td colSpan={7} className="px-3 py-4 sm:px-5 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                        No admins found.
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                            <td className="px-3 py-2 sm:px-5 sm:py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(user.id)}
                                                onChange={() => toggleSelection(user)}
                                                disabled={isProtected(user)}
                                                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
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
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-500 text-xs sm:text-sm hidden lg:table-cell">{user.type_label || 'Admin'}</td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-600">
                                            {isProtected(user) ? (
                                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                                    Super admin
                                                </span>
                                            ) : user.admin_group ? (
                                                    <span className="rounded-full bg-sky-100 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold text-sky-700">
                                                    {user.admin_group.name}
                                                </span>
                                            ) : (
                                                    <span className="text-slate-400 text-left text-xs sm:text-sm">—</span>
                                            )}
                                        </td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-500 text-xs sm:text-sm hidden md:table-cell">
                                            {user.joined_at ? new Date(user.joined_at).toLocaleDateString('en-IN') : '—'}
                                        </td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 text-right">
                                                <div className="flex justify-end gap-1.5 sm:gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => editUser(user)}
                                                        className="rounded-full border border-slate-300 px-2.5 py-1 sm:px-4 text-[10px] sm:text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteUser(user)}
                                                    disabled={isProtected(user)}
                                                        className="rounded-full border border-rose-200 px-2.5 py-1 sm:px-4 text-[10px] sm:text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
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
