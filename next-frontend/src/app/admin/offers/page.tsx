'use client';

import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useEffect, useMemo, useState } from 'react';
import { adminService } from '@/services/adminService';
import { toastError } from '@/utils/toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { offerSchema, OfferFormData } from '@/lib/validation/admin.schema';
import TextInput from '@/components/ui/TextInput';
import InputLabel from '@/components/ui/InputLabel';
import InputError from '@/components/ui/InputError';
import Checkbox from '@/components/ui/Checkbox';

type OfferConstraints = {
    min_order_total?: number | null;
    user_types?: string[] | null;
    user_group_ids?: number[] | null;
};

type OfferRow = {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    type: string;
    type_label: string;
    value: number;
    constraints?: OfferConstraints | null;
    starts_at?: string | null;
    ends_at?: string | null;
    is_active: boolean;
    updated_at?: string | null;
};

type UserTypeOption = {
    value: string;
    label: string;
};

type UserGroupOption = {
    id: number;
    name: string;
};

const userTypes: UserTypeOption[] = [
    { value: 'retailer', label: 'Retailer' },
    { value: 'wholesaler', label: 'Wholesaler' },
];

const offerTypes = ['percentage', 'fixed', 'free_shipping', 'buy_x_get_y'];

export default function AdminOffersIndex() {
    const [loading, setLoading] = useState(true);
    const [offers, setOffers] = useState<OfferRow[]>([]);
    const [userGroups, setUserGroups] = useState<UserGroupOption[]>([]);
    const [editingOffer, setEditingOffer] = useState<OfferRow | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<OfferRow | null>(null);

    const defaultType = useMemo(() => offerTypes[0] ?? 'percentage', []);

    const userTypeLabels = useMemo(
        () =>
            userTypes.reduce<Record<string, string>>((carry, option) => {
                carry[option.value] = option.label;
                return carry;
            }, {}),
        [],
    );

    const userGroupLabels = useMemo(
        () =>
            userGroups.reduce<Record<number, string>>((carry, group) => {
                carry[group.id] = group.name;
                return carry;
            }, {}),
        [userGroups],
    );

    // React Hook Form setup
    const {
        control,
        handleSubmit: handleFormSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<OfferFormData>({
        resolver: zodResolver(offerSchema),
        mode: 'onSubmit',
        reValidateMode: 'onBlur',
        shouldFocusError: true,
        defaultValues: {
            code: '',
            name: '',
            description: '',
            type: defaultType as 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y',
            value: 0,
            starts_at: '',
            ends_at: '',
            is_active: true,
            min_order_total: null,
            user_types: [],
            user_group_ids: [],
        },
    });

    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadOffers();
        loadFormOptions();
    }, []);

    const loadFormOptions = async () => {
        try {
            const userGroupsRes = await adminService.getUserGroups(1, 100);
            setUserGroups((userGroupsRes.data.items || userGroupsRes.data.data || []).map((g: any) => ({ id: Number(g.id), name: g.name })));
        } catch (error) {
            console.error('Failed to load form options:', error);
        }
    };

    const loadOffers = async () => {
        setLoading(true);
        try {
            const response = await adminService.getOffers(1, 1000);
            const items = response.data.items || response.data.data || [];

            const formattedItems = items.map((item: any) => ({
                id: Number(item.id),
                code: item.code,
                name: item.name,
                description: item.description,
                type: item.type,
                type_label: item.type_label || item.type.replace(/_/g, ' '),
                value: Number(item.value || 0),
                constraints: item.constraints ? {
                    min_order_total: item.constraints.min_order_total ? Number(item.constraints.min_order_total) : null,
                    user_types: Array.isArray(item.constraints.user_types) ? item.constraints.user_types : null,
                    user_group_ids: Array.isArray(item.constraints.user_group_ids) 
                        ? item.constraints.user_group_ids.map((id: any) => Number(id))
                        : null,
                } : null,
                starts_at: item.starts_at,
                ends_at: item.ends_at,
                is_active: item.is_active ?? true,
                updated_at: item.updated_at,
            }));

            setOffers(formattedItems);
        } catch (error: any) {
            console.error('Failed to load offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        reset({
            code: '',
            name: '',
            description: '',
            type: defaultType as 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y',
            value: 0,
            starts_at: '',
            ends_at: '',
            is_active: true,
            min_order_total: null,
            user_types: [],
            user_group_ids: [],
        });
        setEditingOffer(null);
    };

    const populateForm = (offer: OfferRow) => {
        setEditingOffer(offer);
        reset({
            code: offer.code,
            name: offer.name,
            description: offer.description ?? '',
            type: offer.type as 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y',
            value: offer.value,
            starts_at: offer.starts_at ? offer.starts_at.split('T')[0] : '',
            ends_at: offer.ends_at ? offer.ends_at.split('T')[0] : '',
            is_active: offer.is_active,
            min_order_total: offer.constraints?.min_order_total ?? null,
            user_types: offer.constraints?.user_types?.filter(Boolean) ?? [],
            user_group_ids: offer.constraints?.user_group_ids?.map((id) => String(id)) ?? [],
        });
    };

    const submit = async (formData: OfferFormData) => {
        setProcessing(true);
        try {
            const normalizedUserTypes = Array.from(
                new Set(formData.user_types.filter((type) => Boolean(userTypeLabels[type]))),
            );
            const userGroupIds = Array.from(
                new Set(
                    formData.user_group_ids
                        .map((value) => Number(value))
                        .filter((value) => Number.isInteger(value) && value > 0),
                ),
            );

            const payload: any = {
                code: formData.code,
                name: formData.name,
                description: formData.description || null,
                type: formData.type,
                value: formData.value,
                constraints: {
                    min_order_total: formData.min_order_total ?? null,
                    user_types: normalizedUserTypes.length ? normalizedUserTypes : null,
                    user_group_ids: userGroupIds.length ? userGroupIds : null,
                },
                starts_at: formData.starts_at || null,
                ends_at: formData.ends_at || null,
                is_active: formData.is_active,
            };

            if (editingOffer) {
                await adminService.updateOffer(editingOffer.id, payload);
            } else {
                await adminService.createOffer(payload);
            }
            resetForm();
            await loadOffers();
        } catch (error: any) {
            console.error('Failed to save offer:', error);
            toastError(error.response?.data?.message || 'Failed to save offer. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const toggleOffer = async (offer: OfferRow) => {
        try {
            await adminService.updateOffer(offer.id, {
                code: offer.code,
                name: offer.name,
                description: offer.description,
                type: offer.type,
                value: offer.value,
                constraints: offer.constraints ?? {},
                starts_at: offer.starts_at,
                ends_at: offer.ends_at,
                is_active: !offer.is_active,
            });
            await loadOffers();
        } catch (error: any) {
            console.error('Failed to toggle offer:', error);
            toastError(error.response?.data?.message || 'Failed to update offer. Please try again.');
        }
    };

    const deleteOffer = (offer: OfferRow) => {
        setDeleteConfirm(offer);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteOffer(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadOffers();
            } catch (error: any) {
                console.error('Failed to delete offer:', error);
                toastError(error.response?.data?.message || 'Failed to delete offer. Please try again.');
            }
        }
    };

    return (
        <>
            <Head title="Offers" />

            <div className="space-y-6 sm:space-y-8 px-1 py-4 sm:px-6 sm:py-6 lg:px-8">
                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Offers & Discounts</h1>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">Keep marketing codes aligned with catalogue pushes and campaigns.</p>
                </div>

                <form
                    onSubmit={handleFormSubmit(submit)}
                    className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                            {editingOffer ? `Edit offer ${editingOffer.code}` : 'Create new offer'}
                        </h2>
                        {editingOffer && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <InputLabel htmlFor="code" className="text-xs sm:text-sm text-slate-600 font-normal">Offer code</InputLabel>
                            <Controller
                                name="code"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <TextInput
                                            {...field}
                                            id="code"
                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                            className={`uppercase ${fieldState.error || errors.code ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            placeholder="SUMMER25"
                                        />
                                        {errors.code && (
                                            <InputError message={errors.code.message} />
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <InputLabel htmlFor="name" className="text-xs sm:text-sm text-slate-600 font-normal">Name</InputLabel>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <TextInput
                                            {...field}
                                            id="name"
                                            className={fieldState.error || errors.name ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                        />
                                        {errors.name && (
                                            <InputError message={errors.name.message} />
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <InputLabel htmlFor="type" className="text-xs sm:text-sm text-slate-600 font-normal">Type</InputLabel>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <select
                                            {...field}
                                            id="type"
                                            className={`rounded-xl border bg-white text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm ${
                                                fieldState.error || errors.type ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/20'
                                            }`}
                                        >
                                            {offerTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type.replace(/_/g, ' ')}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.type && (
                                            <InputError message={errors.type.message} />
                                        )}
                                    </>
                                )}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <InputLabel htmlFor="value" className="text-xs sm:text-sm text-slate-600 font-normal">Value</InputLabel>
                            <Controller
                                name="value"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <TextInput
                                            {...field}
                                            id="value"
                                            type="number"
                                            step="0.01"
                                            value={field.value === 0 ? '' : String(field.value)}
                                            onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                                            className={fieldState.error || errors.value ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                        />
                                        {errors.value && (
                                            <InputError message={errors.value.message} />
                                        )}
                                    </>
                                )}
                            />
                        </div>
                    </div>

                    <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                        <span>Description</span>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field, fieldState }) => (
                                <>
                                    <textarea
                                        {...field}
                                        className={`min-h-[80px] sm:min-h-[100px] rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm ${
                                            fieldState.error || errors.description ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/20'
                                        }`}
                                        placeholder="Optional copy for team reference"
                                    />
                                    {errors.description && (
                                        <InputError message={errors.description.message} />
                                    )}
                                </>
                            )}
                        />
                    </label>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <InputLabel htmlFor="booking_window" className="text-xs sm:text-sm text-slate-600 font-normal">Booking window</InputLabel>
                            <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                                <Controller
                                    name="starts_at"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <input
                                            {...field}
                                            type="date"
                                            className={`rounded-xl border bg-white text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm ${
                                                fieldState.error || errors.starts_at ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/20'
                                            }`}
                                        />
                                    )}
                                />
                                <Controller
                                    name="ends_at"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <input
                                            {...field}
                                            type="date"
                                            className={`rounded-xl border bg-white text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm ${
                                                fieldState.error || errors.ends_at ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : 'border-slate-300 focus:border-slate-900 focus:ring-slate-900/20'
                                            }`}
                                        />
                                    )}
                                />
                            </div>
                            {(errors.starts_at || errors.ends_at) && (
                                <InputError message={errors.starts_at?.message || errors.ends_at?.message} />
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                            <InputLabel htmlFor="min_order_total" className="text-xs sm:text-sm text-slate-600 font-normal">Minimum order total (₹)</InputLabel>
                            <Controller
                                name="min_order_total"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <TextInput
                                            {...field}
                                            id="min_order_total"
                                            type="number"
                                            step="0.01"
                                            value={field.value === null ? '' : String(field.value)}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                field.onChange(val === '' ? null : (isNaN(Number(val)) ? null : Number(val)));
                                            }}
                                            className={fieldState.error || errors.min_order_total ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}
                                            placeholder="Optional"
                                        />
                                        {errors.min_order_total && (
                                            <InputError message={errors.min_order_total.message} />
                                        )}
                                    </>
                                )}
                            />
                        </div>
                    </div>

                    <fieldset className="rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3">
                        <legend className="px-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                            Eligible customer types
                        </legend>
                        <Controller
                            name="user_types"
                            control={control}
                            render={({ field }) => (
                                <div className="mt-2 sm:mt-3 flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600">
                                    {userTypes.map((type) => {
                                        const checked = field.value.includes(type.value);
                                        return (
                                            <label key={type.value} className="inline-flex items-center gap-1.5 sm:gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(event) => {
                                                        if (event.target.checked) {
                                                            field.onChange([...field.value, type.value]);
                                                        } else {
                                                            field.onChange(field.value.filter((value) => value !== type.value));
                                                        }
                                                    }}
                                                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                />
                                                <span className="uppercase tracking-wide text-xs sm:text-sm">{type.label}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        />
                        <InputError message={errors.user_types?.message} />
                    </fieldset>

                    <fieldset className="rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3">
                        <legend className="px-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                            Eligible customer groups
                        </legend>
                        <Controller
                            name="user_group_ids"
                            control={control}
                            render={({ field }) => (
                                <div className="mt-2 sm:mt-3 flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600">
                                    {userGroups.length === 0 ? (
                                        <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400">
                                            No customer groups configured. All groups will be eligible.
                                        </p>
                                    ) : (
                                        userGroups.map((group) => {
                                            const value = String(group.id);
                                            const checked = field.value.includes(value);
                                            return (
                                                <label key={group.id} className="inline-flex items-center gap-1.5 sm:gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(event) => {
                                                            if (event.target.checked) {
                                                                field.onChange([...field.value, value]);
                                                            } else {
                                                                field.onChange(field.value.filter((id) => id !== value));
                                                            }
                                                        }}
                                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                    />
                                                    <span className="tracking-wide text-slate-500 text-xs sm:text-sm">{group.name}</span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        />
                        <InputError message={errors.user_group_ids?.message} />
                    </fieldset>

                    <div>
                        <Controller
                            name="is_active"
                            control={control}
                            render={({ field }) => (
                                <label className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">
                                    <Checkbox
                                        checked={field.value}
                                        onChange={field.onChange}
                                    />
                                    Active for checkout & jobwork
                                </label>
                            )}
                        />
                        <InputError message={errors.is_active?.message} />
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                        {editingOffer && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-4 sm:py-2 sm:text-sm"
                            >
                                Cancel edit
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-sm"
                        >
                            {editingOffer ? 'Update offer' : 'Create offer'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 sm:py-12">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                                <thead className="bg-slate-50 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-slate-500">
                                <tr>
                                        <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Code</th>
                                        <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Name</th>
                                        <th className="px-3 py-2 text-left sm:px-5 sm:py-3 hidden md:table-cell">Type</th>
                                        <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Value</th>
                                        <th className="px-3 py-2 text-center sm:px-5 sm:py-3 hidden lg:table-cell">Status</th>
                                        <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {offers.map((offer) => (
                                    <tr key={offer.id} className="hover:bg-slate-50">
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 font-semibold text-slate-900 text-xs sm:text-sm">{offer.code}</td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-600">
                                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                                    <span className="font-semibold text-slate-900 text-xs sm:text-sm">{offer.name}</span>
                                                {offer.description && (
                                                        <span className="text-[10px] sm:text-xs text-slate-500">{offer.description}</span>
                                                )}
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-slate-400">
                                                    <span>
                                                        {offer.constraints?.user_types?.length
                                                            ? `Customers: ${offer.constraints.user_types
                                                                  .map((type) => userTypeLabels[type] ?? type)
                                                                  .join(', ')}`
                                                            : 'Customers: All'}
                                                    </span>
                                                    <span>
                                                        {offer.constraints?.user_group_ids?.length
                                                            ? `Groups: ${offer.constraints.user_group_ids
                                                                  .map((id) => userGroupLabels[id] ?? `#${id}`)
                                                                  .join(', ')}`
                                                            : 'Groups: All'}
                                                    </span>
                                                </div>
                                                    <div className="md:hidden mt-1">
                                                        <span className="text-[10px] text-slate-500">Type: </span>
                                                        <span className="text-[10px] text-slate-500 uppercase tracking-wide">{offer.type_label}</span>
                                                        <span className="text-[10px] text-slate-500 ml-2">· </span>
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                                offer.is_active
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-slate-100 text-slate-500'
                                                            }`}
                                                        >
                                                            {offer.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                            </div>
                                        </td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-500 uppercase tracking-wide text-xs sm:text-sm hidden md:table-cell">{offer.type_label}</td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 text-right text-slate-900 text-xs sm:text-sm">₹ {offer.value.toLocaleString('en-IN')}</td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 text-center hidden lg:table-cell">
                                            <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold ${
                                                    offer.is_active
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {offer.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 text-right">
                                                <div className="flex justify-end gap-1 sm:gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => populateForm(offer)}
                                                        className="rounded-full border border-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-3 sm:py-1.5 sm:text-xs md:px-4"
                                                        title="Edit"
                                                >
                                                        <span className="hidden sm:inline">Edit</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:hidden">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                        </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleOffer(offer)}
                                                        className="rounded-full border border-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-3 sm:py-1.5 sm:text-xs md:px-4"
                                                        title={offer.is_active ? 'Pause' : 'Activate'}
                                                    >
                                                        <span className="hidden sm:inline">{offer.is_active ? 'Pause' : 'Activate'}</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:hidden">
                                                            {offer.is_active ? (
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                                            ) : (
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                                            )}
                                                        </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteOffer(offer)}
                                                        className="rounded-full border border-rose-200 px-2 py-1 text-[10px] font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 sm:px-3 sm:py-1.5 sm:text-xs md:px-4"
                                                        title="Delete"
                                                >
                                                        <span className="hidden sm:inline">Delete</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:hidden">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {offers.length === 0 && (
                                    <tr>
                                            <td colSpan={6} className="px-3 py-4 sm:px-5 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                            No active offers configured.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                show={deleteConfirm !== null}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={handleDelete}
                title="Remove Offer"
                message={deleteConfirm ? `Are you sure you want to remove offer ${deleteConfirm.code}?` : ''}
                confirmText="Remove"
                variant="danger"
            />
        </>
    );
}
