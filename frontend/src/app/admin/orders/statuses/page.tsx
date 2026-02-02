'use client';

import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useEffect, useMemo, useState } from 'react';
import { adminService } from '@/services/adminService';
import { toastError } from '@/utils/toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orderStatusSchema, type OrderStatusFormData } from '@/lib/validation/admin.schema';
import TextInput from '@/components/ui/TextInput';
import InputLabel from '@/components/ui/InputLabel';
import InputError from '@/components/ui/InputError';
import Checkbox from '@/components/ui/Checkbox';

type OrderStatusRow = {
    id: number;
    name: string;
    code: string;
    color: string;
    is_default: boolean;
    is_active: boolean;
    display_order: number | null;
};

export default function AdminOrderStatusesIndex() {
    const [loading, setLoading] = useState(true);
    const [statusesData, setStatusesData] = useState<OrderStatusRow[]>([]);
    const [editingStatus, setEditingStatus] = useState<OrderStatusRow | null>(null);
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<OrderStatusRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const {
        control,
        handleSubmit: handleFormSubmit,
        formState: { errors },
        reset,
        setError,
        trigger,
    } = useForm<OrderStatusFormData>({
        resolver: zodResolver(orderStatusSchema),
        mode: 'onSubmit',
        reValidateMode: 'onBlur',
        shouldFocusError: true,
        defaultValues: {
            name: '',
            code: '',
            color: '#64748b',
            is_default: false,
            is_active: true,
            display_order: null,
        },
    });
    const [processing, setProcessing] = useState(false);

    // Load data from API
    useEffect(() => {
        loadStatuses();
    }, []);

    const loadStatuses = async () => {
        try {
            setLoading(true);
            const response = await adminService.getOrderStatuses(1, 100);
            const items = response.data?.items || response.data?.data || [];
            setStatusesData(items.map((item: any) => ({
                id: Number(item.id),
                name: item.name,
                code: item.code,
                color: item.color,
                is_default: item.is_default,
                is_active: item.is_active,
                display_order: item.display_order,
            })));
        } catch (error: any) {
            console.error('Failed to load order statuses:', error);
            setErrors({ general: error.response?.data?.message || 'Failed to load order statuses' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingStatus(null);
        reset({
            name: '',
            code: '',
            color: '#64748b',
            is_default: false,
            is_active: true,
            display_order: null,
        });
    };

    const populateForm = (status: OrderStatusRow) => {
        setEditingStatus(status);
        reset({
            name: status.name,
            code: status.code,
            color: status.color ?? '#64748b',
            is_default: status.is_default,
            is_active: status.is_active,
            display_order: status.display_order,
        });
    };

    const onSubmit = async (data: OrderStatusFormData) => {
        setProcessing(true);

        try {
            const payload = {
                name: data.name,
                code: data.code,
                color: data.color,
                is_default: data.is_default,
                is_active: data.is_active,
                display_order: data.display_order ?? 0,
            };

            if (editingStatus) {
                await adminService.updateOrderStatusConfig(editingStatus.id, payload);
            } else {
                await adminService.createOrderStatus(payload);
            }
            resetForm();
            await loadStatuses();
        } catch (error: any) {
            console.error('Failed to save order status:', error);
            const errorMessage = error?.response?.data?.message || 'Failed to save order status. Please try again.';
            toastError(errorMessage);
            
            // Set form errors if validation errors exist
            if (error?.response?.data?.errors) {
                const serverErrors = error.response.data.errors;
                Object.keys(serverErrors).forEach((key) => {
                    setError(key as keyof OrderStatusFormData, {
                        type: 'server',
                        message: serverErrors[key][0],
                    });
                });
            }
        } finally {
            setProcessing(false);
        }
    };

    const toggleStatus = async (status: OrderStatusRow) => {
        try {
            await adminService.updateOrderStatusConfig(status.id, {
                name: status.name,
                code: status.code,
                color: status.color,
                is_default: status.is_default,
                is_active: !status.is_active,
                display_order: status.display_order ?? 0,
            });
            await loadStatuses();
        } catch (error: any) {
            console.error('Failed to toggle status:', error);
            toastError(error.response?.data?.message || 'Failed to update status');
        }
    };

    const setDefaultStatus = async (status: OrderStatusRow) => {
        try {
            await adminService.updateOrderStatusConfig(status.id, {
                name: status.name,
                code: status.code,
                color: status.color,
                is_default: true,
                is_active: status.is_active,
                display_order: status.display_order ?? 0,
            });
            await loadStatuses();
        } catch (error: any) {
            console.error('Failed to set default status:', error);
            toastError(error.response?.data?.message || 'Failed to set default status');
        }
    };

    const deleteStatus = (status: OrderStatusRow) => {
        setDeleteConfirm(status);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteOrderStatus(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadStatuses();
            } catch (error: any) {
                console.error('Failed to delete status:', error);
                toastError(error.response?.data?.message || 'Failed to delete status');
            }
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedStatuses((current) => {
            if (current.includes(id)) {
                return current.filter((selectedId) => selectedId !== id);
            }

            return [...current, id];
        });
    };

    const allSelected = statusesData.length > 0 && selectedStatuses.length === statusesData.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedStatuses([]);
            return;
        }

        setSelectedStatuses(statusesData.map((status) => status.id));
    };

    const bulkDelete = () => {
        if (selectedStatuses.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        try {
            await adminService.bulkDeleteOrderStatuses(selectedStatuses);
            setSelectedStatuses([]);
            setBulkDeleteConfirm(false);
            await loadStatuses();
        } catch (error: any) {
            console.error('Failed to delete statuses:', error);
            toastError(error.response?.data?.message || 'Failed to delete statuses');
        }
    };

    useEffect(() => {
        setSelectedStatuses((current) => current.filter((id) => statusesData.some((status) => status.id === id)));
    }, [statusesData]);

    const statuses = {
        data: statusesData,
    };

    if (loading) {
        return (
            <>
                <Head title="Order statuses" />
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-xs sm:text-sm text-slate-500">Loading...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Order statuses" />

            <div className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
                {errors.general && (
                    <div className="rounded-xl sm:rounded-2xl bg-rose-50 border border-rose-200 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-rose-700">
                        {errors.general}
                    </div>
                )}
                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Order statuses</h1>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500">
                        Configure the lifecycle stages that orders move through. One status must be marked as the default for new orders.
                    </p>
                </div>

                <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                            {editingStatus ? `Edit status ${editingStatus.name}` : 'Create new order status'}
                        </h2>
                        {editingStatus && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                        <div>
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
                                            className={`mt-1.5 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                        />
                                        <InputError message={errors.name?.message} />
                                    </>
                                )}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="code">Code</InputLabel>
                            <Controller
                                name="code"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <TextInput
                                            id="code"
                                            type="text"
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                trigger('code');
                                            }}
                                            onBlur={async () => {
                                                field.onBlur();
                                                await trigger('code');
                                            }}
                                            className={`mt-1.5 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                        />
                                        <InputError message={errors.code?.message} />
                                    </>
                                )}
                            />
                        </div>
                        <div>
                            <InputLabel htmlFor="display_order">Display Order</InputLabel>
                            <Controller
                                name="display_order"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <TextInput
                                            id="display_order"
                                            type="number"
                                            min={0}
                                            value={field.value === null || field.value === undefined ? '' : field.value.toString()}
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? null : Number(e.target.value);
                                                field.onChange(value);
                                                trigger('display_order');
                                            }}
                                            onBlur={async () => {
                                                field.onBlur();
                                                await trigger('display_order');
                                            }}
                                            className={`mt-1.5 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                        />
                                        <InputError message={errors.display_order?.message} />
                                    </>
                                )}
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                        <div>
                            <InputLabel className="mb-1.5">Color (hex)</InputLabel>
                            <Controller
                                name="color"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <input
                                                type="color"
                                                value={field.value || '#64748b'}
                                                onChange={(e) => {
                                                    field.onChange(e.target.value);
                                                    trigger('color');
                                                }}
                                                onBlur={async () => {
                                                    field.onBlur();
                                                    await trigger('color');
                                                }}
                                                className="h-8 w-12 sm:h-10 sm:w-16 rounded-md border border-slate-300 bg-white"
                                            />
                                            <TextInput
                                                type="text"
                                                value={field.value || ''}
                                                onChange={(e) => {
                                                    field.onChange(e.target.value);
                                                    trigger('color');
                                                }}
                                                onBlur={async () => {
                                                    field.onBlur();
                                                    await trigger('color');
                                                }}
                                                className={`flex-1 ${fieldState.error ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                                placeholder="#64748b"
                                                maxLength={7}
                                            />
                                        </div>
                                        <InputError message={errors.color?.message} />
                                    </>
                                )}
                            />
                        </div>
                        <div className="flex flex-col gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600">
                            <Controller
                                name="is_active"
                                control={control}
                                render={({ field }) => (
                                    <label className="inline-flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2 sm:px-4 sm:py-3">
                                        <Checkbox
                                            checked={field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                        />
                                        Active status
                                    </label>
                                )}
                            />
                            <Controller
                                name="is_default"
                                control={control}
                                render={({ field }) => (
                                    <>
                                        <label className="inline-flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-slate-200 px-3 py-2 sm:px-4 sm:py-3">
                                            <Checkbox
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                            />
                                            Default for new orders
                                        </label>
                                        <InputError message={errors.is_default?.message} />
                                    </>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                        {editingStatus && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-full border border-slate-300 px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                Cancel edit
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-slate-900 px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {editingStatus ? 'Save changes' : 'Create status'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-2 sm:gap-3 border-b border-slate-200 px-3 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="font-semibold text-slate-700">Results ({statuses.data.length})</div>
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500">
                            <span>{selectedStatuses.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedStatuses.length === 0}
                                className="inline-flex items-center rounded-full border border-rose-200 px-2.5 py-1 sm:px-3 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 text-[10px] sm:text-xs"
                            >
                                Bulk delete
                            </button>
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
                                        aria-label="Select all order statuses"
                                    />
                                </th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left">Name</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left hidden md:table-cell">Code</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left">Color</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left hidden lg:table-cell">Display Order</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left hidden md:table-cell">Default</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left">Status</th>
                                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {statuses.data.map((status) => (
                                <tr key={status.id} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 sm:px-5 sm:py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedStatuses.includes(status.id)}
                                            onChange={() => toggleSelection(status.id)}
                                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select order status ${status.name}`}
                                        />
                                    </td>
                                        <td className="px-3 py-2 sm:px-5 sm:py-3 font-semibold text-slate-900 text-xs sm:text-sm">{status.name}</td>
                                        <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-400 text-xs sm:text-sm hidden md:table-cell">{status.code}</td>
                                        <td className="px-3 py-2 sm:px-5 sm:py-3">
                                            <span className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold text-slate-600">
                                            <span
                                                    className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border border-slate-200"
                                                style={{ backgroundColor: status.color }}
                                            />
                                            {status.color}
                                        </span>
                                    </td>
                                        <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-500 text-xs sm:text-sm hidden lg:table-cell">{status.display_order}</td>
                                        <td className="px-3 py-2 sm:px-5 sm:py-3 hidden md:table-cell">
                                        {status.is_default ? (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold text-emerald-700">
                                                Default
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setDefaultStatus(status)}
                                                    className="text-[10px] sm:text-xs font-semibold text-sky-600 hover:text-sky-800"
                                            >
                                                Set default
                                            </button>
                                        )}
                                    </td>
                                        <td className="px-3 py-2 sm:px-5 sm:py-3">
                                        <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold ${
                                                status.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {status.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                        <td className="px-3 py-2 sm:px-5 sm:py-3 text-right">
                                            <div className="flex justify-end gap-1 sm:gap-2">
                                            <button
                                                type="button"
                                                onClick={() => populateForm(status)}
                                                    className="rounded-full border border-slate-300 px-2.5 py-1 sm:px-4 text-[10px] sm:text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleStatus(status)}
                                                    className="rounded-full border border-slate-300 px-2.5 py-1 sm:px-4 text-[10px] sm:text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                {status.is_active ? 'Pause' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteStatus(status)}
                                                    className="rounded-full border border-rose-200 px-2.5 py-1 sm:px-4 text-[10px] sm:text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {statuses.data.length === 0 && (
                                <tr>
                                        <td colSpan={8} className="px-3 py-4 sm:px-5 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                        No order statuses defined yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Remove Order Status"
                message={deleteConfirm ? `Are you sure you want to remove order status ${deleteConfirm.name}?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Order Statuses"
                message={`Are you sure you want to delete ${selectedStatuses.length} selected order status(es)?`}
                confirmText="Delete"
                variant="danger"
            />
        </>
    );
}
