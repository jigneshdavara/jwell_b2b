import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type PrefillProduct = {
    id: number;
    name: string;
    sku: string;
    material?: string | null;
    purity?: string | null;
    gross_weight?: number | null;
    net_weight?: number | null;
    base_price?: number | null;
    making_charge?: number | null;
    standard_pricing?: Record<string, number | string | null> | null;
    variants: Array<{
        id: number;
        label: string;
        price_adjustment: number;
        is_default: boolean;
    }>;
    media: Array<{ url: string; alt: string }>;
};

type JobworkRecord = {
    id: number;
    reference: string;
    product?: string | null;
    variant?: string | null;
    quantity: number;
    submission_mode: string;
    status: string;
    delivery_deadline?: string | null;
    created_at: string;
};

type OfferRecord = {
    code: string;
    name: string;
    description?: string | null;
    value: number;
    type: string;
};

type JobworkPageProps = PageProps<{
    prefillProduct: PrefillProduct | null;
    defaultVariantId: number | null;
    jobworks: JobworkRecord[];
    offers: OfferRecord[];
}>;

type SubmissionMode = 'catalogue' | 'custom';

type FormData = {
    submission_mode: SubmissionMode;
    product_id: number | null;
    product_variant_id: number | null;
    type: 'customer_supplied' | 'vendor_supplied';
    reference_design: string;
    reference_url: string;
    reference_media: string[];
    metal: string;
    purity: string;
    diamond_quality: string;
    quantity: number;
    special_instructions: string;
    delivery_deadline: string;
    wastage_percentage: string;
    manufacturing_charge: string;
};

const submitModes: Array<{ value: SubmissionMode; label: string; helper: string }> = [
    {
        value: 'catalogue',
        label: 'Catalogue design',
        helper: 'Customise an existing Elvee design with metal / variant tweaks.',
    },
    {
        value: 'custom',
        label: 'Upload bespoke concept',
        helper: 'Share brand-new concepts with references, AI renders, or CAD briefs.',
    },
];

export default function JobworkIndex() {
    const { prefillProduct, defaultVariantId, jobworks, offers } = usePage<JobworkPageProps>().props;

    const [mode, setMode] = useState<SubmissionMode>(prefillProduct ? 'catalogue' : 'custom');
    const [referenceMediaInput, setReferenceMediaInput] = useState('');

    const { data, setData, post, processing, errors } = useForm<FormData>({
        submission_mode: prefillProduct ? 'catalogue' : 'custom',
        product_id: prefillProduct?.id ?? null,
        product_variant_id: defaultVariantId ?? null,
        type: 'customer_supplied',
        reference_design: '',
        reference_url: '',
        reference_media: [],
        metal: prefillProduct?.material ?? '',
        purity: prefillProduct?.purity ?? '',
        diamond_quality: '',
        quantity: 1,
        special_instructions: '',
        delivery_deadline: '',
        wastage_percentage: '',
        manufacturing_charge: '',
    });

    useEffect(() => {
        setData('submission_mode', mode);
        if (mode === 'catalogue' && prefillProduct) {
            setData('product_id', prefillProduct.id);
            setData('metal', prefillProduct.material ?? '');
            setData('purity', prefillProduct.purity ?? '');
            setData('product_variant_id', defaultVariantId ?? null);
        }

        if (mode === 'custom') {
            setData('product_id', null);
            setData('product_variant_id', null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    useEffect(() => {
        const media = referenceMediaInput
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        setData('reference_media', media);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [referenceMediaInput]);

    useEffect(() => {
        if (prefillProduct && prefillProduct.media.length) {
            setReferenceMediaInput(prefillProduct.media.map((media) => media.url).join('\n'));
        }
    }, [prefillProduct]);

    const selectedVariant = useMemo(() => {
        if (!prefillProduct || !data.product_variant_id) {
            return null;
        }

        return prefillProduct.variants.find((variant) => variant.id === data.product_variant_id) ?? null;
    }, [prefillProduct, data.product_variant_id]);

    const estimatedAmount = useMemo(() => {
        if (!prefillProduct) {
            return null;
        }
        const base = prefillProduct.base_price ?? 0;
        const making = prefillProduct.making_charge ?? 0;
        const adjustment = selectedVariant?.price_adjustment ?? 0;

        return base + making + adjustment;
    }, [prefillProduct, selectedVariant]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(route('frontend.jobwork.store'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Jobwork & Custom Manufacturing" />

            <div className="space-y-10">
                <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-900">Create a production brief</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Share modification requirements for catalogue pieces or submit brand-new concepts. Our production
                                concierge will revert with quotes and timelines.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-700">
                                Current requests: {jobworks.length}
                            </span>
                            <Link
                                href={route('frontend.catalog.index')}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 font-semibold text-white shadow-slate-900/30 transition hover:bg-slate-700"
                            >
                                Browse catalogue
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex flex-wrap gap-2">
                        {submitModes.map((option) => {
                            const disabled = !prefillProduct && option.value === 'catalogue';

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => !disabled && setMode(option.value)}
                                    disabled={disabled}
                                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                        mode === option.value
                                            ? 'bg-slate-900 text-white shadow-slate-900/30'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                        {submitModes.find((option) => option.value === mode)?.helper}
                        {!prefillProduct && mode === 'catalogue' && (
                            <span className="ml-2 font-semibold text-amber-600">
                                Select a catalogue design first from Browse Catalogue.
                            </span>
                        )}
                    </p>

                    <form onSubmit={submit} className="mt-6 space-y-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-4">
                                {mode === 'catalogue' && prefillProduct ? (
                                    <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                        <div>
                                            <p className="text-xs text-slate-400">Design selected</p>
                                            <h2 className="mt-1 text-lg font-semibold text-slate-900">{prefillProduct.name}</h2>
                                            <p className="text-xs text-slate-500">SKU {prefillProduct.sku}</p>
                                        </div>
                                        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                                            <div>
                                                <p className="font-medium text-slate-500">Base value</p>
                                                <p className="text-slate-900">₹ {(prefillProduct.base_price ?? 0).toLocaleString('en-IN')}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-500">Making charge</p>
                                                <p className="text-slate-900">₹ {(prefillProduct.making_charge ?? 0).toLocaleString('en-IN')}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-500">Gross weight</p>
                                                <p className="text-slate-900">{prefillProduct.gross_weight?.toFixed(2)} g</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-500">Purity</p>
                                                <p className="text-slate-900">{prefillProduct.purity}</p>
                                            </div>
                                        </div>

                                        {prefillProduct.standard_pricing && (
                                            <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600">
                                                <p className="font-semibold text-slate-700">Standard pricing snapshot</p>
                                                <ul className="mt-2 space-y-1">
                                                    {Object.entries(prefillProduct.standard_pricing).map(([key, value]) => (
                                                        <li key={key} className="flex justify-between">
                                                            <span className="text-slate-500">{key.replace('_', ' ')}</span>
                                                            <span className="text-slate-800">{typeof value === 'number' ? value.toLocaleString('en-IN') : value}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {prefillProduct.variants.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-slate-600">Select variant</p>
                                                <div className="grid gap-2">
                                                    {prefillProduct.variants.map((variant) => {
                                                        const isSelected = data.product_variant_id === variant.id;
                                                        const adjustment = variant.price_adjustment;
                                                        const adjustmentLabel =
                                                            adjustment === 0
                                                                ? 'Standard'
                                                                : `${adjustment > 0 ? '+' : ''}₹ ${Math.abs(adjustment).toLocaleString('en-IN')}`;

                                                        return (
                                                            <label
                                                                key={variant.id}
                                                                className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                                                                    isSelected
                                                                        ? 'border-sky-500 bg-sky-50 text-slate-900'
                                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
                                                                }`}
                                                            >
                                                                <span>{variant.label}</span>
                                                                <span className="flex items-center gap-2">
                                                                    <span className="text-xs font-semibold text-slate-500">{adjustmentLabel}</span>
                                                                    <input
                                                                        type="radio"
                                                                        name="product_variant_id"
                                                                        value={variant.id}
                                                                        checked={isSelected}
                                                                        onChange={() => setData('product_variant_id', variant.id)}
                                                                        className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                                                                    />
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {estimatedAmount !== null && (
                                            <div className="rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
                                                <p className="text-xs text-white/70">Estimated total</p>
                                                <p className="mt-1 text-lg font-semibold">₹ {estimatedAmount.toLocaleString('en-IN')}</p>
                                                <p className="text-xs text-white/70">Final value subject to labour & offer adjustments.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Reference design summary *</span>
                                            <textarea
                                                className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                value={data.reference_design}
                                                onChange={(event) => setData('reference_design', event.target.value)}
                                                placeholder="Describe materials, gemstone placements, finishing details, packaging expectations…"
                                            />
                                            {errors.reference_design && (
                                                <span className="text-xs text-rose-500">{errors.reference_design}</span>
                                            )}
                                        </label>

                                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                                            <span>Reference media URLs (one per line)</span>
                                            <textarea
                                                className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                value={referenceMediaInput}
                                                onChange={(event) => setReferenceMediaInput(event.target.value)}
                                                placeholder="https://…"
                                            />
                                            {errors.reference_media && (
                                                <span className="text-xs text-rose-500">{errors.reference_media}</span>
                                            )}
                                        </label>
                                    </div>
                                )}

                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Supply Type</span>
                                    <select
                                        className="rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        value={data.type}
                                        onChange={(event) => setData('type', event.target.value as FormData['type'])}
                                    >
                                        <option value="customer_supplied">Customer supplying metal/stone</option>
                                        <option value="vendor_supplied">Elvee supplying metal/stone</option>
                                    </select>
                                </label>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Metal</span>
                                        <input
                                            type="text"
                                            className="rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            value={data.metal}
                                            onChange={(event) => setData('metal', event.target.value)}
                                        />
                                        {errors.metal && <span className="text-xs text-rose-500">{errors.metal}</span>}
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Purity</span>
                                        <input
                                            type="text"
                                            className="rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            value={data.purity}
                                            onChange={(event) => setData('purity', event.target.value)}
                                        />
                                        {errors.purity && <span className="text-xs text-rose-500">{errors.purity}</span>}
                                    </label>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Diamond / Stone quality</span>
                                        <input
                                            type="text"
                                            className="rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            value={data.diamond_quality}
                                            onChange={(event) => setData('diamond_quality', event.target.value)}
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Quantity</span>
                                        <input
                                            type="number"
                                            min={1}
                                            className="rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            value={data.quantity}
                                            onChange={(event) => setData('quantity', Number(event.target.value) || 1)}
                                        />
                                        {errors.quantity && <span className="text-xs text-rose-500">{errors.quantity}</span>}
                                    </label>
                                </div>

                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Special instructions</span>
                                    <textarea
                                        className="min-h-[100px] rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        value={data.special_instructions}
                                        onChange={(event) => setData('special_instructions', event.target.value)}
                                    />
                                </label>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Delivery deadline</span>
                                        <input
                                            type="date"
                                            className="rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            value={data.delivery_deadline}
                                            onChange={(event) => setData('delivery_deadline', event.target.value)}
                                        />
                                        {errors.delivery_deadline && (
                                            <span className="text-xs text-rose-500">{errors.delivery_deadline}</span>
                                        )}
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Wastage %</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            value={data.wastage_percentage}
                                            onChange={(event) => setData('wastage_percentage', event.target.value)}
                                        />
                                    </label>
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Manufacturing charge (₹)</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            value={data.manufacturing_charge}
                                            onChange={(event) => setData('manufacturing_charge', event.target.value)}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <h3 className="text-sm font-semibold text-slate-800">Active offer playbook</h3>
                                    <ul className="mt-3 space-y-3 text-sm text-slate-600">
                                        {offers.length ? (
                                            offers.map((offer) => (
                                                <li key={offer.code} className="rounded-xl bg-slate-50 p-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-800">{offer.name}</span>
                                                        <span className="text-xs text-slate-500">{offer.code}</span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500">{offer.description}</p>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-xs text-slate-500">No active offers configured.</li>
                                        )}
                                    </ul>
                                </div>

                                {prefillProduct && prefillProduct.media.length > 0 && (
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {prefillProduct.media.map((media) => (
                                            <img
                                                key={media.url}
                                                src={media.url}
                                                alt={media.alt}
                                                className="h-36 w-full rounded-2xl object-cover shadow"
                                            />
                                        ))}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? 'Submitting…' : 'Submit jobwork request'}
                                </button>
                            </div>
                        </div>
                    </form>
                </section>

                <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900">Recent jobwork briefs</h2>
                        <span className="text-xs text-slate-500">Showing latest {jobworks.length}</span>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Reference</th>
                                    <th className="px-4 py-3 text-left">Design</th>
                                    <th className="px-4 py-3 text-left">Mode</th>
                                    <th className="px-4 py-3 text-left">Qty</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Delivery</th>
                                    <th className="px-4 py-3 text-left">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {jobworks.map((jobwork) => (
                                    <tr key={jobwork.id}>
                                        <td className="px-4 py-3 font-semibold text-slate-800">{jobwork.reference}</td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {jobwork.product ?? 'Custom'}
                                            {jobwork.variant ? (
                                                <span className="block text-xs text-slate-400">{jobwork.variant}</span>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 capitalize text-slate-500">{jobwork.submission_mode}</td>
                                        <td className="px-4 py-3 text-slate-600">{jobwork.quantity}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                                {jobwork.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{jobwork.delivery_deadline ?? '—'}</td>
                                        <td className="px-4 py-3 text-slate-500">{jobwork.created_at}</td>
                                    </tr>
                                ))}
                                {jobworks.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                                            No jobwork requests yet. Submit your first brief above.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

