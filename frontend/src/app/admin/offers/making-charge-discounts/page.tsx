'use client';

import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Head } from '@/components/Head';
import { useEffect, useMemo, useState } from 'react';
import { adminService } from '@/services/adminService';
import { toastError } from '@/utils/toast';

type DiscountRow = {
    id: number;
    name: string;
    description?: string | null;
    discount_type: 'percentage' | 'fixed';
    value: number;
    is_auto: boolean;
    is_active: boolean;
    brand?: { id: number; name: string } | null;
    category?: { id: number; name: string } | null;
    customer_group?: { id: number; name: string } | null;
    user_types?: string[] | null;
    min_cart_total?: number | null;
    starts_at?: string | null;
    ends_at?: string | null;
    updated_at?: string | null;
};

type Option = {
    id: number;
    name: string;
};

type UserTypeOption = {
    value: string;
    label: string;
};

const userTypes: UserTypeOption[] = [
    { value: 'retailer', label: 'Retailer' },
    { value: 'wholesaler', label: 'Wholesaler' },
];

const discountTypes: Array<'percentage' | 'fixed'> = ['percentage', 'fixed'];

export default function AdminMakingChargeDiscountsIndex() {
    const [loading, setLoading] = useState(true);
    const [discounts, setDiscounts] = useState<DiscountRow[]>([]);
    const [brands, setBrands] = useState<Option[]>([]);
    const [categories, setCategories] = useState<Option[]>([]);
    const [userGroups, setUserGroups] = useState<Option[]>([]);
    const [editingDiscount, setEditingDiscount] = useState<DiscountRow | null>(null);
    const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<DiscountRow | null>(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

    const defaultDiscountType = useMemo(() => discountTypes[0] ?? 'percentage', []);
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

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        discount_type: defaultDiscountType,
        value: '',
        brand_id: '',
        category_id: '',
        user_group_id: '',
        user_types: [] as string[],
        min_cart_total: '',
        is_auto: true,
        is_active: true,
        starts_at: '',
        ends_at: '',
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadDiscounts();
        loadFormOptions();
    }, []);

    const loadFormOptions = async () => {
        try {
            const [brandsRes, categoriesRes, userGroupsRes] = await Promise.all([
                adminService.getBrands(1, 100),
                adminService.getCategories(1, 100),
                adminService.getUserGroups(1, 100),
            ]);

            setBrands((brandsRes.data.items || brandsRes.data.data || []).map((b: any) => ({ id: Number(b.id), name: b.name })));
            setCategories((categoriesRes.data.items || categoriesRes.data.data || []).map((c: any) => ({ id: Number(c.id), name: c.name })));
            setUserGroups((userGroupsRes.data.items || userGroupsRes.data.data || []).map((g: any) => ({ id: Number(g.id), name: g.name })));
        } catch (error) {
            console.error('Failed to load form options:', error);
        }
    };

    const loadDiscounts = async () => {
        setLoading(true);
        try {
            const response = await adminService.getMakingChargeDiscounts(1, 1000);
            const items = response.data.items || response.data.data || [];

            const formattedItems = items.map((item: any) => ({
                id: Number(item.id),
                name: item.name,
                description: item.description,
                discount_type: item.discount_type || 'percentage',
                value: Number(item.value || 0),
                is_auto: item.is_auto ?? true,
                is_active: item.is_active ?? true,
                brand: item.brand ? { id: Number(item.brand.id), name: item.brand.name } : null,
                category: item.category ? { id: Number(item.category.id), name: item.category.name } : null,
                customer_group: item.customer_group ? { id: Number(item.customer_group.id), name: item.customer_group.name } : null,
                user_types: Array.isArray(item.user_types) ? item.user_types : (item.user_types ? [item.user_types] : null),
                min_cart_total: item.min_cart_total ? Number(item.min_cart_total) : null,
                starts_at: item.starts_at,
                ends_at: item.ends_at,
                updated_at: item.updated_at,
            }));

            setDiscounts(formattedItems);
        } catch (error: any) {
            console.error('Failed to load making charge discounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingDiscount(null);
        setFormData({
            name: '',
            description: '',
            discount_type: defaultDiscountType,
            value: '',
            brand_id: '',
            category_id: '',
            user_group_id: '',
            user_types: [],
            min_cart_total: '',
            is_auto: true,
            is_active: true,
            starts_at: '',
            ends_at: '',
        });
    };

    const populateForm = (discount: DiscountRow) => {
        setEditingDiscount(discount);
        setFormData({
            name: discount.name,
            description: discount.description ?? '',
            discount_type: discount.discount_type,
            value: String(discount.value),
            brand_id: discount.brand ? String(discount.brand.id) : '',
            category_id: discount.category ? String(discount.category.id) : '',
            user_group_id: discount.customer_group ? String(discount.customer_group.id) : '',
            user_types: discount.user_types ?? [],
            min_cart_total: discount.min_cart_total != null ? String(discount.min_cart_total) : '',
            is_auto: discount.is_auto,
            is_active: discount.is_active,
            starts_at: discount.starts_at ? discount.starts_at.split('T')[0] : '',
            ends_at: discount.ends_at ? discount.ends_at.split('T')[0] : '',
        });
    };

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        try {
            const payload: any = {
                name: formData.name,
                description: formData.description || null,
                discount_type: formData.discount_type,
                value: Number(formData.value || 0),
                brand_id: formData.brand_id ? Number(formData.brand_id) : null,
                category_id: formData.category_id ? Number(formData.category_id) : null,
                user_group_id: formData.user_group_id ? Number(formData.user_group_id) : null,
                user_types: formData.user_types.length ? formData.user_types : null,
                min_cart_total: formData.min_cart_total ? Number(formData.min_cart_total) : null,
                is_auto: formData.is_auto,
                is_active: formData.is_active,
                starts_at: formData.starts_at || null,
                ends_at: formData.ends_at || null,
            };

            if (editingDiscount) {
                await adminService.updateMakingChargeDiscount(editingDiscount.id, payload);
            } else {
                await adminService.createMakingChargeDiscount(payload);
            }
            resetForm();
            await loadDiscounts();
        } catch (error: any) {
            console.error('Failed to save making charge discount:', error);
            toastError(error.response?.data?.message || 'Failed to save discount. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const toggleActivation = async (discount: DiscountRow) => {
        try {
            await adminService.updateMakingChargeDiscount(discount.id, {
                name: discount.name,
                description: discount.description,
                discount_type: discount.discount_type,
                value: discount.value,
                brand_id: discount.brand?.id,
                category_id: discount.category?.id,
                user_group_id: discount.customer_group?.id,
                user_types: discount.user_types ?? [],
                min_cart_total: discount.min_cart_total,
                is_auto: discount.is_auto,
                is_active: !discount.is_active,
                starts_at: discount.starts_at,
                ends_at: discount.ends_at,
            });
            await loadDiscounts();
        } catch (error: any) {
            console.error('Failed to toggle discount:', error);
            toastError(error.response?.data?.message || 'Failed to update discount. Please try again.');
        }
    };

    const deleteDiscount = (discount: DiscountRow) => {
        setDeleteConfirm(discount);
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            try {
                await adminService.deleteMakingChargeDiscount(deleteConfirm.id);
                setDeleteConfirm(null);
                await loadDiscounts();
            } catch (error: any) {
                console.error('Failed to delete making charge discount:', error);
                toastError(error.response?.data?.message || 'Failed to delete discount. Please try again.');
            }
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedDiscounts((current) => {
            if (current.includes(id)) {
                return current.filter((value) => value !== id);
            }
            return [...current, id];
        });
    };

    const allSelected = discounts.length > 0 && selectedDiscounts.length === discounts.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedDiscounts([]);
            return;
        }
        setSelectedDiscounts(discounts.map((discount) => discount.id));
    };

    const bulkDelete = () => {
        if (selectedDiscounts.length === 0) {
            return;
        }
        setBulkDeleteConfirm(true);
    };

    const handleBulkDelete = async () => {
        try {
            await adminService.bulkDeleteMakingChargeDiscounts(selectedDiscounts);
            setSelectedDiscounts([]);
            setBulkDeleteConfirm(false);
            await loadDiscounts();
        } catch (error: any) {
            console.error('Failed to bulk delete discounts:', error);
            toastError(error.response?.data?.message || 'Failed to delete discounts. Please try again.');
        }
    };

    useEffect(() => {
        setSelectedDiscounts((current) => current.filter((id) => discounts.some((discount) => discount.id === id)));
    }, [discounts]);

    return (
        <>
            <Head title="Making charge discounts" />

            <div className="space-y-6 sm:space-y-8 px-1 py-4 sm:px-6 sm:py-6 lg:px-8">
                <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Making charge discounts</h1>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                        Configure automatic making charge adjustments by brand, category, customer type, or order value.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                            {editingDiscount ? `Edit discount: ${editingDiscount.name}` : 'Create new making charge discount'}
                        </h2>
                        {editingDiscount && (
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
                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                            <span>Name</span>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                required
                            />
                        </label>

                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                            <span>Discount type</span>
                            <select
                                value={formData.discount_type}
                                onChange={(event) => setFormData({ ...formData, discount_type: event.target.value as 'percentage' | 'fixed' })}
                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                            >
                                {discountTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type === 'percentage' ? 'Percentage (%)' : 'Flat amount (₹)'}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                            <span>Discount value</span>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.value}
                                onChange={(event) => setFormData({ ...formData, value: event.target.value })}
                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                required
                            />
                        </label>

                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                            <span>Minimum order total (₹)</span>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.min_cart_total}
                                onChange={(event) => setFormData({ ...formData, min_cart_total: event.target.value })}
                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                placeholder="Optional threshold"
                            />
                        </label>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                            <span>Brand</span>
                            <select
                                value={formData.brand_id}
                                onChange={(event) => setFormData({ ...formData, brand_id: event.target.value })}
                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                            >
                                <option value="">All brands</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                            <span>Category</span>
                            <select
                                value={formData.category_id}
                                onChange={(event) => setFormData({ ...formData, category_id: event.target.value })}
                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                            >
                                <option value="">All categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                            <span>Customer group</span>
                            <select
                                value={formData.user_group_id}
                                onChange={(event) => setFormData({ ...formData, user_group_id: event.target.value })}
                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                            >
                                <option value="">All customer groups</option>
                                {userGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <fieldset className="rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3">
                        <legend className="px-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                            Eligible customer types
                        </legend>
                        <div className="mt-2 sm:mt-3 flex flex-wrap gap-3 sm:gap-4">
                            {userTypes.map((type) => {
                                const checked = formData.user_types.includes(type.value);
                                return (
                                    <label key={type.value} className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            checked={checked}
                                            onChange={(event) => {
                                                if (event.target.checked) {
                                                    setFormData({ ...formData, user_types: [...formData.user_types, type.value] });
                                                } else {
                                                    setFormData({
                                                        ...formData,
                                                        user_types: formData.user_types.filter((value) => value !== type.value),
                                                    });
                                                }
                                            }}
                                        />
                                        <span className="uppercase tracking-wide text-slate-500 text-xs sm:text-sm">{type.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                            <span>Start date</span>
                            <input
                                type="date"
                                value={formData.starts_at}
                                onChange={(event) => setFormData({ ...formData, starts_at: event.target.value })}
                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                            />
                        </label>
                        <label className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                            <span>End date</span>
                            <input
                                type="date"
                                value={formData.ends_at}
                                onChange={(event) => setFormData({ ...formData, ends_at: event.target.value })}
                                className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                            />
                        </label>
                    </div>

                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                        <label className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={formData.is_auto}
                                onChange={(event) => setFormData({ ...formData, is_auto: event.target.checked })}
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            Auto apply during quotation & checkout
                        </label>

                        <label className="flex items-center gap-2 sm:gap-3 rounded-2xl border border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(event) => setFormData({ ...formData, is_active: event.target.checked })}
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            Active
                        </label>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                        {editingDiscount && (
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
                            {editingDiscount ? 'Update discount' : 'Create discount'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-2 sm:gap-3 border-b border-slate-200 px-3 py-3 text-xs sm:text-sm sm:px-5 sm:py-4 md:flex-row md:items-center md:justify-between">
                        <div className="font-semibold text-slate-700">Results ({discounts.length})</div>
                        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-slate-500">
                            <span>{selectedDiscounts.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedDiscounts.length === 0}
                                className="inline-flex items-center rounded-full border border-rose-200 px-2.5 py-1 text-[10px] font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3 sm:py-1 sm:text-xs"
                            >
                                Bulk delete
                            </button>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-8 sm:py-12">
                            <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                        </div>
                    ) : (
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
                                            aria-label="Select all discounts"
                                        />
                                    </th>
                                        <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Name</th>
                                        <th className="px-3 py-2 text-left sm:px-5 sm:py-3 hidden lg:table-cell">Conditions</th>
                                        <th className="px-3 py-2 text-left sm:px-5 sm:py-3 hidden md:table-cell">Discount</th>
                                        <th className="px-3 py-2 text-left sm:px-5 sm:py-3 hidden lg:table-cell">Active</th>
                                        <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {discounts.map((discount) => (
                                    <tr key={discount.id} className="hover:bg-slate-50">
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 align-top">
                                            <input
                                                type="checkbox"
                                                checked={selectedDiscounts.includes(discount.id)}
                                                onChange={() => toggleSelection(discount.id)}
                                                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                aria-label={`Select discount ${discount.name}`}
                                            />
                                        </td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 font-semibold text-slate-900">
                                                <div className="flex flex-col gap-0.5 sm:gap-1">
                                                    <span className="text-xs sm:text-sm">{discount.name}</span>
                                                {discount.description && (
                                                        <span className="text-[10px] sm:text-xs text-slate-500">{discount.description}</span>
                                                )}
                                                {(discount.starts_at || discount.ends_at) && (
                                                        <span className="text-[10px] sm:text-xs text-slate-400">
                                                        {discount.starts_at ? `Starts ${discount.starts_at.split('T')[0]}` : 'Starts immediately'}
                                                        {' • '}
                                                        {discount.ends_at ? `Ends ${discount.ends_at.split('T')[0]}` : 'No end'}
                                                    </span>
                                                )}
                                                    <div className="lg:hidden mt-1 space-y-0.5">
                                                        <div className="text-[10px] text-slate-500">
                                                            {discount.discount_type === 'percentage'
                                                                ? `${discount.value}% off making charge`
                                                                : `₹ ${discount.value.toLocaleString('en-IN')} off making charge`}
                                                        </div>
                                                        <div>
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                                    discount.is_active
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : 'bg-slate-100 text-slate-500'
                                                                }`}
                                                            >
                                                                {discount.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                    </div>
                                            </div>
                                        </td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-500 hidden lg:table-cell">
                                                <div className="flex flex-col gap-0.5 sm:gap-1 text-[10px] sm:text-xs uppercase tracking-wide text-slate-500">
                                                <span>
                                                    {discount.brand ? `Brand: ${discount.brand.name}` : 'All brands'} •{' '}
                                                    {discount.category ? `Category: ${discount.category.name}` : 'All categories'}
                                                </span>
                                                <span>
                                                    {discount.customer_group
                                                        ? `Customer group: ${
                                                              userGroupLabels[discount.customer_group.id] ??
                                                              discount.customer_group.name
                                                          }`
                                                        : 'Customer group: All'}
                                                </span>
                                                <span>
                                                    {discount.user_types && discount.user_types.length > 0
                                                        ? `Customer types: ${discount.user_types
                                                              .map((type) => userTypeLabels[type] ?? type)
                                                              .join(', ')}`
                                                        : 'All customer types'}
                                                </span>
                                                {discount.min_cart_total != null && discount.min_cart_total > 0 && (
                                                    <span>Minimum order: ₹ {discount.min_cart_total.toLocaleString('en-IN')}</span>
                                                )}
                                                <span>{discount.is_auto ? 'Auto apply' : 'Manual apply'}</span>
                                            </div>
                                        </td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 text-slate-500 text-xs sm:text-sm hidden md:table-cell">
                                            {discount.discount_type === 'percentage'
                                                ? `${discount.value}% off making charge`
                                                : `₹ ${discount.value.toLocaleString('en-IN')} off making charge`}
                                        </td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 hidden lg:table-cell">
                                            <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold ${
                                                    discount.is_active
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {discount.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                            <td className="px-3 py-2 sm:px-5 sm:py-3 text-right">
                                                <div className="flex justify-end gap-1 sm:gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => populateForm(discount)}
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
                                                    onClick={() => toggleActivation(discount)}
                                                        className="rounded-full border border-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-3 sm:py-1.5 sm:text-xs md:px-4"
                                                        title={discount.is_active ? 'Pause' : 'Activate'}
                                                    >
                                                        <span className="hidden sm:inline">{discount.is_active ? 'Pause' : 'Activate'}</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:hidden">
                                                            {discount.is_active ? (
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                                                            ) : (
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                                            )}
                                                        </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteDiscount(discount)}
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
                                {discounts.length === 0 && (
                                    <tr>
                                            <td colSpan={6} className="px-3 py-4 sm:px-5 sm:py-6 text-center text-xs sm:text-sm text-slate-500">
                                            No making charge discounts configured yet.
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
                title="Remove Making Charge Discount"
                message={deleteConfirm ? `Are you sure you want to remove making charge discount "${deleteConfirm.name}"?` : ''}
                confirmText="Remove"
                variant="danger"
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                onClose={() => setBulkDeleteConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Delete Making Charge Discounts"
                message={`Are you sure you want to delete ${selectedDiscounts.length} making charge discount(s)?`}
                confirmText="Delete"
                variant="danger"
            />
        </>
    );
}
