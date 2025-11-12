import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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
    customer_types?: string[] | null;
    min_cart_total?: number | null;
    starts_at?: string | null;
    ends_at?: string | null;
    updated_at?: string | null;
};

type Option = {
    id: number;
    name: string;
};

type Pagination<T> = {
    data: T[];
};

type CustomerTypeOption = {
    value: string;
    label: string;
};

type MakingChargeDiscountsPageProps = AppPageProps<{
    discounts: Pagination<DiscountRow>;
    discountTypes: Array<'percentage' | 'fixed'>;
    brands: Option[];
    categories: Option[];
    customerTypes: CustomerTypeOption[];
    customerGroups: Option[];
}>;

export default function AdminMakingChargeDiscountsIndex() {
    const { discounts, discountTypes, brands, categories, customerTypes, customerGroups } =
        usePage<MakingChargeDiscountsPageProps>().props;
    const [editingDiscount, setEditingDiscount] = useState<DiscountRow | null>(null);
    const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);

    const defaultDiscountType = useMemo(() => discountTypes[0] ?? 'percentage', [discountTypes]);
    const customerTypeLabels = useMemo(
        () =>
            customerTypes.reduce<Record<string, string>>((carry, option) => {
                carry[option.value] = option.label;
                return carry;
            }, {}),
        [customerTypes],
    );
    const customerGroupLabels = useMemo(
        () =>
            customerGroups.reduce<Record<number, string>>((carry, group) => {
                carry[group.id] = group.name;
                return carry;
            }, {}),
        [customerGroups],
    );

    const form = useForm({
        name: '',
        description: '',
        discount_type: defaultDiscountType,
        value: '',
        brand_id: '',
        category_id: '',
        customer_group_id: '',
        customer_types: [] as string[],
        min_cart_total: '',
        is_auto: true,
        is_active: true,
        starts_at: '',
        ends_at: '',
    });

    const resetForm = () => {
        setEditingDiscount(null);
        form.reset();
        form.setData('discount_type', defaultDiscountType);
        form.setData('customer_group_id', '');
        form.setData('customer_types', []);
        form.setData('is_auto', true);
        form.setData('is_active', true);
    };

    const populateForm = (discount: DiscountRow) => {
        setEditingDiscount(discount);
        form.setData({
            name: discount.name,
            description: discount.description ?? '',
            discount_type: discount.discount_type,
            value: String(discount.value),
            brand_id: discount.brand ? String(discount.brand.id) : '',
            category_id: discount.category ? String(discount.category.id) : '',
            customer_group_id: discount.customer_group ? String(discount.customer_group.id) : '',
            customer_types: discount.customer_types ?? [],
            min_cart_total: discount.min_cart_total != null ? String(discount.min_cart_total) : '',
            is_auto: discount.is_auto,
            is_active: discount.is_active,
            starts_at: discount.starts_at ?? '',
            ends_at: discount.ends_at ?? '',
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payload = {
            name: form.data.name,
            description: form.data.description || null,
            discount_type: form.data.discount_type,
            value: Number(form.data.value || 0),
            brand_id: form.data.brand_id ? Number(form.data.brand_id) : null,
            category_id: form.data.category_id ? Number(form.data.category_id) : null,
            customer_group_id: form.data.customer_group_id
                ? Number(form.data.customer_group_id)
                : null,
            customer_types: form.data.customer_types.length ? form.data.customer_types : null,
            min_cart_total: form.data.min_cart_total ? Number(form.data.min_cart_total) : null,
            is_auto: form.data.is_auto,
            is_active: form.data.is_active,
            starts_at: form.data.starts_at || null,
            ends_at: form.data.ends_at || null,
        };

        form.transform(() => payload);

        const options = {
            preserveScroll: true,
            onSuccess: () => resetForm(),
            onFinish: () => form.transform((original) => original),
        } as const;

        if (editingDiscount) {
            form.post(route('admin.offers.making-charge-discounts.update', editingDiscount.id), {
                ...options,
                method: 'put',
            });
        } else {
            form.post(route('admin.offers.making-charge-discounts.store'), options);
        }
    };

    const toggleActivation = (discount: DiscountRow) => {
        router.put(
            route('admin.offers.making-charge-discounts.update', discount.id),
            {
                name: discount.name,
                description: discount.description,
                discount_type: discount.discount_type,
                value: discount.value,
                brand_id: discount.brand?.id,
                category_id: discount.category?.id,
                customer_group_id: discount.customer_group?.id,
                customer_types: discount.customer_types ?? [],
                min_cart_total: discount.min_cart_total,
                is_auto: discount.is_auto,
                is_active: !discount.is_active,
                starts_at: discount.starts_at,
                ends_at: discount.ends_at,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const deleteDiscount = (discount: DiscountRow) => {
        if (!window.confirm(`Remove making charge discount "${discount.name}"?`)) {
            return;
        }

        router.delete(route('admin.offers.making-charge-discounts.destroy', discount.id), {
            preserveScroll: true,
        });
    };

    const toggleSelection = (id: number) => {
        setSelectedDiscounts((current) => {
            if (current.includes(id)) {
                return current.filter((value) => value !== id);
            }

            return [...current, id];
        });
    };

    const allSelected = discounts.data.length > 0 && selectedDiscounts.length === discounts.data.length;

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedDiscounts([]);
            return;
        }

        setSelectedDiscounts(discounts.data.map((discount) => discount.id));
    };

    const bulkDelete = () => {
        if (selectedDiscounts.length === 0) {
            return;
        }

        if (!window.confirm(`Delete ${selectedDiscounts.length} making charge discount(s)?`)) {
            return;
        }

        router.delete(route('admin.offers.making-charge-discounts.bulk-destroy'), {
            data: { ids: selectedDiscounts },
            preserveScroll: true,
            onSuccess: () => setSelectedDiscounts([]),
        });
    };

    useEffect(() => {
        setSelectedDiscounts((current) => current.filter((id) => discounts.data.some((discount) => discount.id === id)));
    }, [discounts.data]);

    return (
        <AdminLayout>
            <Head title="Making charge discounts" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Making charge discounts</h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Configure automatic making charge adjustments by brand, category, customer type, or order value.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingDiscount ? `Edit discount: ${editingDiscount.name}` : 'Create new making charge discount'}
                        </h2>
                        {editingDiscount && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Name</span>
                            <input
                                type="text"
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                required
                            />
                            {form.errors.name && <span className="text-xs text-rose-500">{form.errors.name}</span>}
                        </label>

                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Discount type</span>
                            <select
                                value={form.data.discount_type}
                                onChange={(event) => form.setData('discount_type', event.target.value as 'percentage' | 'fixed')}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                                {discountTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type === 'percentage' ? 'Percentage (%)' : 'Flat amount (₹)'}
                                    </option>
                                ))}
                            </select>
                            {form.errors.discount_type && <span className="text-xs text-rose-500">{form.errors.discount_type}</span>}
                        </label>

                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Discount value</span>
                            <input
                                type="number"
                                step="0.01"
                                value={form.data.value}
                                onChange={(event) => form.setData('value', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                required
                            />
                            {form.errors.value && <span className="text-xs text-rose-500">{form.errors.value}</span>}
                        </label>

                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Minimum order total (₹)</span>
                            <input
                                type="number"
                                step="0.01"
                                value={form.data.min_cart_total}
                                onChange={(event) => form.setData('min_cart_total', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="Optional threshold"
                            />
                            {form.errors.min_cart_total && <span className="text-xs text-rose-500">{form.errors.min_cart_total}</span>}
                        </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Brand</span>
                            <select
                                value={form.data.brand_id}
                                onChange={(event) => form.setData('brand_id', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                                <option value="">All brands</option>
                                {brands.map((brand) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                            {form.errors.brand_id && <span className="text-xs text-rose-500">{form.errors.brand_id}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Category</span>
                            <select
                                value={form.data.category_id}
                                onChange={(event) => form.setData('category_id', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                                <option value="">All categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            {form.errors.category_id && <span className="text-xs text-rose-500">{form.errors.category_id}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Customer group</span>
                            <select
                                value={form.data.customer_group_id}
                                onChange={(event) => form.setData('customer_group_id', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                                <option value="">All customer groups</option>
                                {customerGroups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                            {form.errors.customer_group_id && (
                                <span className="text-xs text-rose-500">{form.errors.customer_group_id}</span>
                            )}
                        </label>
                    </div>

                    <fieldset className="rounded-2xl border border-slate-200 px-4 py-3">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                            Eligible customer types
                        </legend>
                        <div className="mt-3 flex flex-wrap gap-4">
                            {customerTypes.map((type) => {
                                const checked = form.data.customer_types.includes(type.value);
                                return (
                                    <label key={type.value} className="inline-flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            checked={checked}
                                            onChange={(event) => {
                                                if (event.target.checked) {
                                                    form.setData('customer_types', [...form.data.customer_types, type.value]);
                                                } else {
                                                    form.setData(
                                                        'customer_types',
                                                        form.data.customer_types.filter((value) => value !== type.value),
                                                    );
                                                }
                                            }}
                                        />
                                        <span className="uppercase tracking-wide text-slate-500">{type.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                        {form.errors.customer_types && (
                            <p className="mt-2 text-xs text-rose-500">{form.errors.customer_types as string}</p>
                        )}
                    </fieldset>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Start date</span>
                            <input
                                type="date"
                                value={form.data.starts_at}
                                onChange={(event) => form.setData('starts_at', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            />
                            {form.errors.starts_at && <span className="text-xs text-rose-500">{form.errors.starts_at}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>End date</span>
                            <input
                                type="date"
                                value={form.data.ends_at}
                                onChange={(event) => form.setData('ends_at', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            />
                            {form.errors.ends_at && <span className="text-xs text-rose-500">{form.errors.ends_at}</span>}
                        </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={form.data.is_auto}
                                onChange={(event) => form.setData('is_auto', event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            Auto apply during quotation & checkout
                        </label>

                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) => form.setData('is_active', event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            Active
                        </label>
                    </div>

                    <div className="flex justify-end gap-3">
                        {editingDiscount && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                Cancel edit
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {editingDiscount ? 'Update discount' : 'Create discount'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 text-sm md:flex-row md:items-center md:justify-between">
                        <div className="font-semibold text-slate-700">Results ({discounts.data.length})</div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{selectedDiscounts.length} selected</span>
                            <button
                                type="button"
                                onClick={bulkDelete}
                                disabled={selectedDiscounts.length === 0}
                                className="inline-flex items-center rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Bulk delete
                            </button>
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
                                        aria-label="Select all discounts"
                                    />
                                </th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Conditions</th>
                                <th className="px-5 py-3 text-left">Discount</th>
                                <th className="px-5 py-3 text-left">Active</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {discounts.data.map((discount) => (
                                <tr key={discount.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 align-top">
                                        <input
                                            type="checkbox"
                                            checked={selectedDiscounts.includes(discount.id)}
                                            onChange={() => toggleSelection(discount.id)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            aria-label={`Select discount ${discount.name}`}
                                        />
                                    </td>
                                    <td className="px-5 py-3 font-semibold text-slate-900">
                                        <div className="flex flex-col gap-1">
                                            <span>{discount.name}</span>
                                            {discount.description && (
                                                <span className="text-xs text-slate-500">{discount.description}</span>
                                            )}
                                            {(discount.starts_at || discount.ends_at) && (
                                                <span className="text-xs text-slate-400">
                                                    {discount.starts_at ? `Starts ${discount.starts_at}` : 'Starts immediately'}
                                                    {' • '}
                                                    {discount.ends_at ? `Ends ${discount.ends_at}` : 'No end'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">
                                        <div className="flex flex-col gap-1 text-xs uppercase tracking-wide text-slate-500">
                                            <span>
                                                {discount.brand ? `Brand: ${discount.brand.name}` : 'All brands'} •{' '}
                                                {discount.category ? `Category: ${discount.category.name}` : 'All categories'}
                                            </span>
                                            <span>
                                                {discount.customer_group
                                                    ? `Customer group: ${
                                                          customerGroupLabels[discount.customer_group.id] ??
                                                          discount.customer_group.name
                                                      }`
                                                    : 'Customer group: All'}
                                            </span>
                                            <span>
                                                {discount.customer_types && discount.customer_types.length > 0
                                                    ? `Customer types: ${discount.customer_types
                                                          .map((type) => customerTypeLabels[type] ?? type)
                                                          .join(', ')}`
                                                    : 'All customer types'}
                                            </span>
                                            {discount.min_cart_total != null && discount.min_cart_total > 0 && (
                                                <span>Minimum order: ₹ {discount.min_cart_total.toLocaleString('en-IN')}</span>
                                            )}
                                            <span>{discount.is_auto ? 'Auto apply' : 'Manual apply'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">
                                        {discount.discount_type === 'percentage'
                                            ? `${discount.value}% off making charge`
                                            : `₹ ${discount.value.toLocaleString('en-IN')} off making charge`}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                discount.is_active
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {discount.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => populateForm(discount)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleActivation(discount)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                {discount.is_active ? 'Pause' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteDiscount(discount)}
                                                className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {discounts.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No making charge discounts configured yet.
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

