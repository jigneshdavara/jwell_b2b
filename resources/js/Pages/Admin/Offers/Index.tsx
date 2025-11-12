import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type OfferConstraints = {
    min_order_total?: number | null;
    customer_types?: string[] | null;
    customer_group_ids?: number[] | null;
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

type Pagination<T> = {
    data: T[];
};

type CustomerTypeOption = {
    value: string;
    label: string;
};

type CustomerGroupOption = {
    id: number;
    name: string;
};

type AdminOffersPageProps = AppPageProps<{
    offers: Pagination<OfferRow>;
    offerTypes: string[];
    customerTypes: CustomerTypeOption[];
    customerGroups: CustomerGroupOption[];
}>;

export default function AdminOffersIndex() {
    const { offers, offerTypes, customerTypes, customerGroups } = usePage<AdminOffersPageProps>().props;

    const [editingOffer, setEditingOffer] = useState<OfferRow | null>(null);

    const defaultType = useMemo(() => offerTypes[0] ?? 'percentage', [offerTypes]);

    const { data, setData, post, processing, errors, reset, transform } = useForm({
        code: '',
        name: '',
        description: '',
        type: defaultType,
        value: '',
        starts_at: '',
        ends_at: '',
        is_active: true,
        min_order_total: '',
        customer_types: [] as string[],
        customer_group_ids: [] as string[],
    });

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

    const errorFor = (key: string) => (errors as Record<string, string | undefined>)[key];

    const resetForm = () => {
        reset();
        setData('type', offerTypes[0] ?? 'percentage');
        setData('is_active', true);
        setData('customer_types', []);
        setData('customer_group_ids', []);
        setEditingOffer(null);
    };

    const populateForm = (offer: OfferRow) => {
        setEditingOffer(offer);
        setData({
            code: offer.code,
            name: offer.name,
            description: offer.description ?? '',
            type: offer.type,
            value: String(offer.value),
            starts_at: offer.starts_at ?? '',
            ends_at: offer.ends_at ?? '',
            is_active: offer.is_active,
            min_order_total: offer.constraints?.min_order_total != null ? String(offer.constraints.min_order_total) : '',
            customer_types: offer.constraints?.customer_types?.filter(Boolean) ?? [],
            customer_group_ids:
                offer.constraints?.customer_group_ids
                    ?.filter((groupId): groupId is number => typeof groupId === 'number')
                    .map((groupId) => String(groupId)) ?? [],
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedCustomerTypes = Array.from(
            new Set(data.customer_types.filter((type) => Boolean(customerTypeLabels[type]))),
        );
        const customerGroupIds = Array.from(
            new Set(
                data.customer_group_ids
                    .map((value) => Number(value))
                    .filter((value) => Number.isInteger(value) && value > 0),
            ),
        );

        const payload = {
            code: data.code,
            name: data.name,
            description: data.description || null,
            type: data.type,
            value: Number(data.value || 0),
            constraints: {
                min_order_total: data.min_order_total ? Number(data.min_order_total) : null,
                customer_types: normalizedCustomerTypes.length ? normalizedCustomerTypes : null,
                customer_group_ids: customerGroupIds.length ? customerGroupIds : null,
            },
            starts_at: data.starts_at || null,
            ends_at: data.ends_at || null,
            is_active: data.is_active,
        };

        transform(() => payload);

        const options = {
            preserveScroll: true,
            onSuccess: () => resetForm(),
            onFinish: () => transform((formData) => formData),
        } as const;

        if (editingOffer) {
            post(route('admin.offers.update', editingOffer.id), {
                ...options,
                method: 'put',
            });
        } else {
            post(route('admin.offers.store'), options);
        }
    };

    const toggleOffer = (offer: OfferRow) => {
        router.put(route('admin.offers.update', offer.id), {
            code: offer.code,
            name: offer.name,
            description: offer.description,
            type: offer.type,
            value: offer.value,
            constraints: offer.constraints ?? {},
            starts_at: offer.starts_at,
            ends_at: offer.ends_at,
            is_active: !offer.is_active,
        }, {
            preserveScroll: true,
        });
    };

    const deleteOffer = (offer: OfferRow) => {
        if (!window.confirm(`Remove offer ${offer.code}?`)) {
            return;
        }
        router.delete(route('admin.offers.destroy', offer.id), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Offers" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">Offers & Discounts</h1>
                    <p className="mt-2 text-sm text-slate-500">Keep marketing codes aligned with catalogue pushes and campaigns.</p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {editingOffer ? `Edit offer ${editingOffer.code}` : 'Create new offer'}
                        </h2>
                        {editingOffer && (
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
                            <span>Offer code</span>
                            <input
                                type="text"
                                value={data.code}
                                onChange={(event) => setData('code', event.target.value.toUpperCase())}
                                className="rounded-2xl border border-slate-300 px-4 py-2 uppercase focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="SUMMER25"
                                required
                            />
                            {errors.code && <span className="text-xs text-rose-500">{errors.code}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Name</span>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                required
                            />
                            {errors.name && <span className="text-xs text-rose-500">{errors.name}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Type</span>
                            <select
                                value={data.type}
                                onChange={(event) => setData('type', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                                {offerTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                            {errors.type && <span className="text-xs text-rose-500">{errors.type}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Value</span>
                            <input
                                type="number"
                                step="0.01"
                                value={data.value}
                                onChange={(event) => setData('value', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                required
                            />
                            {errors.value && <span className="text-xs text-rose-500">{errors.value}</span>}
                        </label>
                    </div>

                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                        <span>Description</span>
                        <textarea
                            value={data.description}
                            onChange={(event) => setData('description', event.target.value)}
                            className="min-h-[100px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            placeholder="Optional copy for team reference"
                        />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Booking window</span>
                            <div className="grid gap-3 md:grid-cols-2">
                                <input
                                    type="date"
                                    value={data.starts_at}
                                    onChange={(event) => setData('starts_at', event.target.value)}
                                    className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                                <input
                                    type="date"
                                    value={data.ends_at}
                                    onChange={(event) => setData('ends_at', event.target.value)}
                                    className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                            </div>
                            {(errors.starts_at || errors.ends_at) && (
                                <span className="text-xs text-rose-500">{errors.starts_at ?? errors.ends_at}</span>
                            )}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Minimum order total (₹)</span>
                            <input
                                type="number"
                                step="0.01"
                                value={data.min_order_total}
                                onChange={(event) => setData('min_order_total', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="Optional"
                            />
                            {errorFor('constraints.min_order_total') && (
                                <span className="text-xs text-rose-500">{errorFor('constraints.min_order_total')}</span>
                            )}
                        </label>
                    </div>

                    <fieldset className="rounded-2xl border border-slate-200 px-4 py-3">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                            Eligible customer types
                        </legend>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                            {customerTypes.map((type) => {
                                const checked = data.customer_types.includes(type.value);
                                return (
                                    <label key={type.value} className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(event) => {
                                                if (event.target.checked) {
                                                    setData('customer_types', [...data.customer_types, type.value]);
                                                } else {
                                                    setData(
                                                        'customer_types',
                                                        data.customer_types.filter((value) => value !== type.value),
                                                    );
                                                }
                                            }}
                                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        <span className="uppercase tracking-wide">{type.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                        {errorFor('constraints.customer_types') && (
                            <p className="mt-2 text-xs text-rose-500">{errorFor('constraints.customer_types')}</p>
                        )}
                    </fieldset>

                    <fieldset className="rounded-2xl border border-slate-200 px-4 py-3">
                        <legend className="px-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                            Eligible customer groups
                        </legend>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                            {customerGroups.length === 0 ? (
                                <p className="text-xs uppercase tracking-widest text-slate-400">
                                    No customer groups configured. All groups will be eligible.
                                </p>
                            ) : (
                                customerGroups.map((group) => {
                                    const value = String(group.id);
                                    const checked = data.customer_group_ids.includes(value);
                                    return (
                                        <label key={group.id} className="inline-flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(event) => {
                                                    if (event.target.checked) {
                                                        setData('customer_group_ids', [...data.customer_group_ids, value]);
                                                    } else {
                                                        setData(
                                                            'customer_group_ids',
                                                            data.customer_group_ids.filter((id) => id !== value),
                                                        );
                                                    }
                                                }}
                                                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                            />
                                            <span className="tracking-wide text-slate-500">{group.name}</span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                        {errorFor('constraints.customer_group_ids') && (
                            <p className="mt-2 text-xs text-rose-500">{errorFor('constraints.customer_group_ids')}</p>
                        )}
                    </fieldset>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(event) => setData('is_active', event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        Active for checkout & jobwork
                    </label>

                    <div className="flex justify-end gap-3">
                        {editingOffer && (
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
                            disabled={processing}
                            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {editingOffer ? 'Update offer' : 'Create offer'}
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Code</th>
                                <th className="px-5 py-3 text-left">Name</th>
                                <th className="px-5 py-3 text-left">Type</th>
                                <th className="px-5 py-3 text-right">Value</th>
                                <th className="px-5 py-3 text-center">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {offers.data.map((offer) => (
                                <tr key={offer.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{offer.code}</td>
                                    <td className="px-5 py-3 text-slate-600">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-slate-900">{offer.name}</span>
                                            {offer.description && (
                                                <span className="text-xs text-slate-500">{offer.description}</span>
                                            )}
                                            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                                                <span>
                                                    {offer.constraints?.customer_types?.length
                                                        ? `Customers: ${offer.constraints.customer_types
                                                              .map((type) => customerTypeLabels[type] ?? type)
                                                              .join(', ')}`
                                                        : 'Customers: All'}
                                                </span>
                                                <span>
                                                    {offer.constraints?.customer_group_ids?.length
                                                        ? `Groups: ${offer.constraints.customer_group_ids
                                                              .map((id) => customerGroupLabels[id] ?? `#${id}`)
                                                              .join(', ')}`
                                                        : 'Groups: All'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-slate-500 uppercase tracking-wide">{offer.type_label}</td>
                                    <td className="px-5 py-3 text-right text-slate-900">₹ {offer.value.toLocaleString('en-IN')}</td>
                                    <td className="px-5 py-3 text-center">
                                        <span
                                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                offer.is_active
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {offer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => populateForm(offer)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleOffer(offer)}
                                                className="rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                            >
                                                {offer.is_active ? 'Pause' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteOffer(offer)}
                                                className="rounded-full border border-rose-200 px-4 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {offers.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No active offers configured.
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

