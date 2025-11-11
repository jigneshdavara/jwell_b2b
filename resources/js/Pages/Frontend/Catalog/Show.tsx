import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type VariantMetadata = {
    auto_label?: string;
    gold_purity_id?: number | null;
    silver_purity_id?: number | null;
    diamond_option_key?: string | null;
    size_cm?: number | string | null;
    [key: string]: unknown;
};

type ProductVariant = {
    id: number;
    label: string;
    price_adjustment: number;
    is_default: boolean;
    metadata?: VariantMetadata | null;
};

type Product = {
    id: number;
    name: string;
    sku: string;
    description?: string;
    brand?: string;
    material?: string;
    purity?: string;
    gross_weight?: number;
    net_weight?: number;
    base_price?: number;
    making_charge?: number;
    is_jobwork_allowed: boolean;
    uses_gold: boolean;
    uses_silver: boolean;
    uses_diamond: boolean;
    media: Array<{ url: string; alt: string }>;
    variants: ProductVariant[];
};

type OptionItem = {
    id: number;
    name: string;
};

type DiamondOption = {
    key: string;
    type_id?: number | null;
    shape_id?: number | null;
    color_id?: number | null;
    clarity_id?: number | null;
    cut_id?: number | null;
    weight?: number | null;
    label: string;
};

type CatalogShowPageProps = AppPageProps<{
    mode: 'purchase' | 'jobwork';
    product: Product;
    goldPurities: OptionItem[];
    silverPurities: OptionItem[];
    diamondOptions: DiamondOption[];
}>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const fallbackMeta = (metadata?: VariantMetadata | null) => ({
    gold_purity_id: typeof metadata?.gold_purity_id === 'number' ? metadata.gold_purity_id : null,
    silver_purity_id: typeof metadata?.silver_purity_id === 'number' ? metadata.silver_purity_id : null,
    diamond_option_key: typeof metadata?.diamond_option_key === 'string' ? metadata.diamond_option_key : null,
    size_cm:
        metadata?.size_cm !== undefined && metadata?.size_cm !== null
            ? typeof metadata.size_cm === 'number'
                ? metadata.size_cm.toString()
                : String(metadata.size_cm)
            : null,
    auto_label: typeof metadata?.auto_label === 'string' ? metadata.auto_label : null,
});

export default function CatalogShow() {
    const { props } = usePage<CatalogShowPageProps>();
    const { mode, product, goldPurities, silverPurities, diamondOptions } = props;

    const defaultVariant = useMemo(
        () => product.variants.find((variant) => variant.is_default) ?? product.variants[0] ?? null,
        [product.variants],
    );

    const defaultMeta = fallbackMeta(defaultVariant?.metadata);

    const sizeOptions = useMemo(() => {
        const sizes = product.variants
            .map((variant) => fallbackMeta(variant.metadata).size_cm)
            .filter((value): value is string => value !== null && value !== undefined && value !== '');
        return Array.from(new Set(sizes));
    }, [product.variants]);

    const [selectedGoldPurity, setSelectedGoldPurity] = useState<number | ''>(
        product.uses_gold ? defaultMeta.gold_purity_id ?? '' : '',
    );
    const [selectedSilverPurity, setSelectedSilverPurity] = useState<number | ''>(
        product.uses_silver ? defaultMeta.silver_purity_id ?? '' : '',
    );
    const [selectedDiamondOption, setSelectedDiamondOption] = useState<string>(
        product.uses_diamond ? defaultMeta.diamond_option_key ?? '' : '',
    );
    const [selectedSize, setSelectedSize] = useState<string>(
        sizeOptions.length > 0 ? defaultMeta.size_cm ?? sizeOptions[0] : '',
    );
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    type QuotationFormData = {
        product_id: number;
        product_variant_id: number | null;
        mode: 'purchase' | 'jobwork';
        quantity: number;
        notes: string;
        selections: {
            gold_purity_id: number | null | '';
            silver_purity_id: number | null | '';
            diamond_option_key: string | null;
            size_cm: string | null;
        };
    };

    const { data, setData, post, processing, errors } = useForm<QuotationFormData>({
        product_id: product.id,
        product_variant_id: defaultVariant?.id ?? null,
        mode,
        quantity: 1,
        notes: '',
        selections: {
            gold_purity_id: selectedGoldPurity === '' ? null : selectedGoldPurity,
            silver_purity_id: selectedSilverPurity === '' ? null : selectedSilverPurity,
            diamond_option_key: selectedDiamondOption || null,
            size_cm: selectedSize || null,
        },
    });

    const matchingVariant = useMemo(() => {
        return product.variants.find((variant) => {
            const meta = fallbackMeta(variant.metadata);

            if (product.uses_gold) {
                const variantGold = meta.gold_purity_id ?? null;
                const selectedGold = selectedGoldPurity === '' ? null : selectedGoldPurity;
                if (variantGold !== selectedGold) {
                    return false;
                }
            }

            if (product.uses_silver) {
                const variantSilver = meta.silver_purity_id ?? null;
                const selectedSilver = selectedSilverPurity === '' ? null : selectedSilverPurity;
                if (variantSilver !== selectedSilver) {
                    return false;
                }
            }

            if (product.uses_diamond) {
                const variantDiamond = meta.diamond_option_key ?? null;
                const selectedDiamond = selectedDiamondOption || null;
                if (variantDiamond !== selectedDiamond) {
                    return false;
                }
            }

            if (sizeOptions.length > 0) {
                const variantSize = meta.size_cm ?? null;
                const targetSize = selectedSize || null;
                if (variantSize !== targetSize) {
                    return false;
                }
            }

            return true;
        }) ?? null;
    }, [
        product.variants,
        product.uses_gold,
        product.uses_silver,
        product.uses_diamond,
        selectedGoldPurity,
        selectedSilverPurity,
        selectedDiamondOption,
        selectedSize,
        sizeOptions.length,
    ]);

    useEffect(() => {
        setData('product_variant_id', matchingVariant?.id ?? null);
    }, [matchingVariant, setData]);

    useEffect(() => {
        setData('selections', {
            gold_purity_id: selectedGoldPurity === '' ? null : selectedGoldPurity,
            silver_purity_id: selectedSilverPurity === '' ? null : selectedSilverPurity,
            diamond_option_key: selectedDiamondOption || null,
            size_cm: selectedSize || null,
        });
    }, [selectedGoldPurity, selectedSilverPurity, selectedDiamondOption, selectedSize, setData]);

    const isJobworkMode = mode === 'jobwork';
    const jobworkNotAllowed = isJobworkMode && !product.is_jobwork_allowed;

    const estimatedTotal = useMemo(() => {
        const base = product.base_price ?? 0;
        const making = product.making_charge ?? 0;
        const adjustment = matchingVariant?.price_adjustment ?? 0;

        return base + making + adjustment;
    }, [product.base_price, product.making_charge, matchingVariant]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (processing || invalidCombination || jobworkNotAllowed) {
            return;
        }

        setConfirmOpen(true);
    };

    const confirmSubmit = () => {
        if (processing || submitting) return;

        setSubmitting(true);
        post(route('frontend.quotations.store'), {
            preserveScroll: true,
            onSuccess: () => setConfirmOpen(false),
            onFinish: () => setSubmitting(false),
        });
    };

    const addToQuotationList = () => {
        const payload = {
            product_id: product.id,
            product_variant_id: data.product_variant_id,
            quantity: data.quantity,
            configuration: {
                mode,
                notes: data.notes,
                selections: data.selections,
            },
        };

        router.post(route('frontend.cart.items.store'), payload, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmOpen(false);
            },
        });
    };

    const invalidCombination = product.variants.length > 0 && !matchingVariant;

    return (
        <AuthenticatedLayout>
            <Head title={product.name} />

            <div className="space-y-8">
                <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            {product.media.map((media, index) => (
                                <div
                                    key={`${media.url}-${index}`}
                                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
                                >
                                    <img
                                        src={media.url}
                                        alt={media.alt}
                                        className="h-64 w-full object-cover transition duration-500 hover:scale-105"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200/80">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">SKU {product.sku}</p>
                                    <h1 className="mt-2 text-3xl font-semibold text-slate-900">{product.name}</h1>
                                    <p className="mt-3 text-sm text-slate-500">By {product.brand ?? 'AurumCraft Atelier'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Estimate</p>
                                    <p className="text-2xl font-semibold text-slate-900">
                                        {currencyFormatter.format(product.base_price ?? 0)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Making {currencyFormatter.format(product.making_charge ?? 0)}
                                    </p>
                                </div>
                            </div>
                            <p className="mt-6 text-sm leading-7 text-slate-600 whitespace-pre-line">{product.description}</p>
                            <dl className="mt-6 grid gap-4 md:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Material</dt>
                                    <dd className="font-semibold text-slate-800">{product.material ?? 'Custom blend'}</dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Purity</dt>
                                    <dd className="font-semibold text-slate-800">{product.purity ?? 'On request'}</dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Gross wt.</dt>
                                    <dd className="font-semibold text-slate-800">
                                        {(product.gross_weight ?? 0).toFixed(2)} g
                                    </dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Net wt.</dt>
                                    <dd className="font-semibold text-slate-800">
                                        {(product.net_weight ?? 0).toFixed(2)} g
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <form
                            onSubmit={submit}
                            className="w-full space-y-5 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        {isJobworkMode ? 'Request jobwork quotation' : 'Request jewellery quotation'}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Select your configuration and our merchandising desk will share pricing shortly.
                                    </p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                    {isJobworkMode ? 'Jobwork' : 'Jewellery'}
                                </span>
                            </div>

                            {jobworkNotAllowed && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                    This design is not available for jobwork. Switch to Jewellery purchase to request a quotation.
                                </div>
                            )}

                            {product.uses_gold && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">Gold purity</p>
                                    <div className="flex flex-wrap gap-2">
                                        {goldPurities.map((purity) => (
                                            <button
                                                key={purity.id}
                                                type="button"
                                                onClick={() => setSelectedGoldPurity(purity.id)}
                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                    selectedGoldPurity === purity.id
                                                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                            >
                                                {purity.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {product.uses_silver && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">Silver purity</p>
                                    <div className="flex flex-wrap gap-2">
                                        {silverPurities.map((purity) => (
                                            <button
                                                key={purity.id}
                                                type="button"
                                                onClick={() => setSelectedSilverPurity(purity.id)}
                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                    selectedSilverPurity === purity.id
                                                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                            >
                                                {purity.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {product.uses_diamond && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">Diamond mix</p>
                                    <div className="grid gap-2">
                                        {diamondOptions.map((option) => (
                                            <label
                                                key={option.key}
                                                className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                                                    selectedDiamondOption === option.key
                                                        ? 'border-sky-500 bg-sky-50 text-slate-900'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
                                                }`}
                                            >
                                                <span>{option.label}</span>
                                                <input
                                                    type="radio"
                                                    name="diamond_option_key"
                                                    value={option.key}
                                                    checked={selectedDiamondOption === option.key}
                                                    onChange={() => setSelectedDiamondOption(option.key)}
                                                    className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                                                />
                                            </label>
                                        ))}
                                        {diamondOptions.length === 0 && (
                                            <p className="text-xs text-slate-400">No predefined diamond mixes for this design.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {sizeOptions.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500">Size (cm)</p>
                                    <div className="flex flex-wrap gap-2">
                                        {sizeOptions.map((size) => (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => setSelectedSize(size)}
                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                                    selectedSize === size
                                                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {invalidCombination && (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                                    No variant is available for the selected combination. Adjust purity, mix, or size to continue.
                                </div>
                            )}

                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Quantity</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={data.quantity}
                                    onChange={(event) => {
                                        const next = Number(event.target.value);
                                        setData('quantity', Number.isFinite(next) && next > 0 ? Math.floor(next) : 1);
                                    }}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                                {errors.quantity && <span className="text-xs text-rose-500">{errors.quantity}</span>}
                            </label>

                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Notes for merchandising team</span>
                                <textarea
                                    value={data.notes}
                                    onChange={(event) => setData('notes', event.target.value)}
                                    className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    placeholder="List required scope: hallmarking, hallmark packaging, diamond certification, delivery deadlines…"
                                />
                                {errors.notes && <span className="text-xs text-rose-500">{errors.notes}</span>}
                            </label>

                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                <p className="font-semibold text-slate-700">Estimated total</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">
                                    {currencyFormatter.format(estimatedTotal)}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Includes base & making. Final quotation may vary with bullion/diamond parity and labour.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || invalidCombination || jobworkNotAllowed}
                                className="w-full rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Submit quotation
                            </button>
                        </form>

                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Next steps</h3>
                            <p className="mt-3 text-sm text-slate-600">
                                Our merchandising team will review the configuration and share pricing or follow-up questions by email.
                                Once you approve, the request moves to production and appears in your {mode === 'jobwork' ? 'jobwork timeline' : 'orders dashboard'}.
                            </p>
                            <Link
                                href={route('frontend.quotations.index')}
                                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-500"
                            >
                                View all quotations
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M21 12H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            {confirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
                    <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-slate-900">Confirm quotation</h3>
                        <p className="text-sm text-slate-600">
                            Submit this quotation request with the selected configuration? Our merchandising desk will review and respond
                            shortly.
                        </p>
                        <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                            <p><span className="font-semibold text-slate-700">Mode:</span> {mode === 'jobwork' ? 'Jobwork' : 'Jewellery'}</p>
                            <p>
                                <span className="font-semibold text-slate-700">Quantity:</span> {data.quantity}
                            </p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-900"
                                onClick={() => setConfirmOpen(false)}
                                disabled={submitting}
                            >
                                Review again
                            </button>
                            <button
                                type="button"
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-900"
                                onClick={addToQuotationList}
                                disabled={submitting}
                            >
                                Add to quotation list
                            </button>
                            <button
                                type="button"
                                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sky-600/30 hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={confirmSubmit}
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting…' : 'Confirm submission'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

