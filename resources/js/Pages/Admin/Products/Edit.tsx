import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

type VariantOptionKey = 'metal_tone' | 'stone_quality' | 'size';

type VariantForm = {
    id?: number;
    sku: string;
    label: string;
    metal_tone: string;
    stone_quality: string;
    size: string;
    price_adjustment: string;
    is_default: boolean;
};

type Product = {
    id?: number;
    name?: string;
    sku?: string;
    description?: string;
    brand_id?: number;
    category_id?: number;
    material_id?: number;
    gross_weight?: number | string;
    net_weight?: number | string;
    base_price?: number | string;
    making_charge?: number | string;
    is_jobwork_allowed?: boolean;
    visibility?: string | null;
    standard_pricing?: Record<string, number | string | null> | null;
    variant_options?: Record<VariantOptionKey, string[]> | null;
    variants?: VariantForm[];
};

type OptionList = Record<string, string>;

type AdminProductEditPageProps = AppPageProps<{
    product: Product | null;
    brands: OptionList;
    categories: OptionList;
    materials: OptionList;
    variantLibrary: Record<VariantOptionKey, string[]>;
    errors: Record<string, string>;
}>;

type StandardPricingForm = {
    labour_brand: string;
    diamond_rate: string;
    gold_rate: string;
    colourstone_rate: string;
};

type FormData = {
    sku: string;
    name: string;
    description: string;
    brand_id: string;
    category_id: string;
    material_id: string;
    gross_weight: string;
    net_weight: string;
    base_price: string;
    making_charge: string;
    is_jobwork_allowed: boolean;
    visibility: string;
    standard_pricing: StandardPricingForm;
    variant_options: Record<VariantOptionKey, string[]>;
    variants: VariantForm[];
};

const emptyVariant = (isDefault = false): VariantForm => ({
    sku: '',
    label: '',
    metal_tone: '',
    stone_quality: '',
    size: '',
    price_adjustment: '0',
    is_default: isDefault,
});

const mergeOptionValues = (
    ...lists: Array<Array<string | number | null | undefined>>
): string[] => {
    const bucket = new Set<string>();

    lists.forEach((list) => {
        list.forEach((value) => {
            if (value === undefined || value === null) return;
            const stringified = String(value).trim();
            if (stringified.length === 0) return;
            bucket.add(stringified);
        });
    });

    return Array.from(bucket);
};

export default function AdminProductEdit() {
    const { props } = usePage<AdminProductEditPageProps>();
    const { product, brands, categories, materials, variantLibrary, errors } = props;

    const initialVariants: VariantForm[] = product?.variants?.length
        ? product.variants.map((variant, index) => ({
              id: variant.id,
              sku: variant.sku ?? '',
              label: variant.label ?? '',
              metal_tone: variant.metal_tone ?? '',
              stone_quality: variant.stone_quality ?? '',
              size: variant.size ?? '',
              price_adjustment: String(variant.price_adjustment ?? 0),
              is_default: variant.is_default ?? index === 0,
          }))
        : [emptyVariant(true)];

    const initialVariantOptions: Record<VariantOptionKey, string[]> = {
        metal_tone: mergeOptionValues(product?.variant_options?.metal_tone ?? [], variantLibrary.metal_tone ?? []),
        stone_quality: mergeOptionValues(product?.variant_options?.stone_quality ?? [], variantLibrary.stone_quality ?? []),
        size: mergeOptionValues(product?.variant_options?.size ?? [], variantLibrary.size ?? []),
    };

    const { data, setData, post, put, processing } = useForm<FormData>(() => ({
        sku: product?.sku ?? '',
        name: product?.name ?? '',
        description: product?.description ?? '',
        brand_id: String(product?.brand_id ?? ''),
        category_id: String(product?.category_id ?? ''),
        material_id: String(product?.material_id ?? ''),
        gross_weight: product?.gross_weight ? String(product.gross_weight) : '',
        net_weight: product?.net_weight ? String(product.net_weight) : '',
        base_price: product?.base_price ? String(product.base_price) : '',
        making_charge: product?.making_charge ? String(product.making_charge) : '',
        is_jobwork_allowed: product?.is_jobwork_allowed ?? false,
        visibility: product?.visibility ?? 'public',
        standard_pricing: {
            labour_brand: product?.standard_pricing?.labour_brand ? String(product.standard_pricing.labour_brand) : '',
            diamond_rate: product?.standard_pricing?.diamond_rate ? String(product.standard_pricing.diamond_rate) : '',
            gold_rate: product?.standard_pricing?.gold_rate ? String(product.standard_pricing.gold_rate) : '',
            colourstone_rate: product?.standard_pricing?.colourstone_rate
                ? String(product.standard_pricing.colourstone_rate)
                : '',
        },
        variant_options: initialVariantOptions,
        variants: initialVariants,
    }));

    const [optionDrafts, setOptionDrafts] = useState<Record<VariantOptionKey, string>>({
        metal_tone: '',
        stone_quality: '',
        size: '',
    });

    const optionKeys: Array<{ key: VariantOptionKey; label: string }> = [
        { key: 'metal_tone', label: 'Metal tone' },
        { key: 'stone_quality', label: 'Stone quality' },
        { key: 'size', label: 'Size' },
    ];

    const addOption = (key: VariantOptionKey) => {
        const value = optionDrafts[key].trim();
        if (!value) return;

        setData((prev) => {
            const existing = prev.variant_options?.[key] ?? [];
            if (existing.includes(value)) {
                return prev;
            }

            return {
                ...prev,
                variant_options: {
                    ...prev.variant_options,
                    [key]: [...existing, value],
                },
            };
        });

        setOptionDrafts({ ...optionDrafts, [key]: '' });
    };

    const removeOption = (key: VariantOptionKey, value: string) => {
        setData((prev) => {
            const current = prev.variant_options?.[key] ?? [];
            return {
                ...prev,
                variant_options: {
                    ...prev.variant_options,
                    [key]: current.filter((option) => option !== value),
                },
            };
        });
    };

    const removeVariant = (index: number) => {
        setData((prev) => {
            if (prev.variants.length === 1) {
                return prev;
            }

            const next = prev.variants.filter((_, idx) => idx !== index);
            if (next.every((variant) => !variant.is_default)) {
                next[0].is_default = true;
            }

            return {
                ...prev,
                variants: next,
            };
        });
    };

    const updateVariant = (index: number, field: keyof VariantForm, value: string | boolean) => {
        setData((prev) => {
            const variants = prev.variants.map((variant, idx) => {
                if (idx !== index) return variant;

                const updated = {
                    ...variant,
                    [field]: value,
                } as VariantForm;

                if (['metal_tone', 'stone_quality', 'size'].includes(field as string)) {
                    const typedValue = typeof value === 'string' ? value : '';
                    const autoLabel = [
                        field === 'metal_tone' ? typedValue : updated.metal_tone,
                        field === 'stone_quality' ? typedValue : updated.stone_quality,
                        field === 'size' ? typedValue : updated.size,
                    ]
                        .filter((part) => part && part.length)
                        .join(' / ');

                    if (!variant.label || variant.label === autoLabel) {
                        updated.label = autoLabel;
                    }
                }

                return updated;
            });

            let variantOptions = prev.variant_options;
            if (['metal_tone', 'stone_quality', 'size'].includes(field as string) && typeof value === 'string') {
                const key = field as VariantOptionKey;
                const trimmed = value.trim();
                if (trimmed.length) {
                    const existing = new Set(variantOptions[key] ?? []);
                    if (!existing.has(trimmed)) {
                        variantOptions = {
                            ...variantOptions,
                            [key]: [...existing, trimmed],
                        };
                    }
                }
            }

            return {
                ...prev,
                variants,
                variant_options: variantOptions,
            };
        });
    };

    const markDefault = (index: number) => {
        setData((prev) => ({
            ...prev,
            variants: prev.variants.map((variant, idx) => ({
                ...variant,
                is_default: idx === index,
            })),
        }));
    };

    const addVariantRow = () => {
        setData((prev) => ({
            ...prev,
            variants: [...prev.variants, emptyVariant(prev.variants.length === 0)],
        }));
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (product?.id) {
            put(route('admin.products.update', product.id));
        } else {
            post(route('admin.products.store'));
        }
    };

    const variantError = errors.variants;

    const standardPricingFields: Array<{ key: keyof StandardPricingForm; label: string; type: 'text' | 'number' }> = useMemo(
        () => [
            { key: 'labour_brand', label: 'Labour brand / atelier', type: 'text' },
            { key: 'diamond_rate', label: 'Diamond rate (₹/ct)', type: 'number' },
            { key: 'gold_rate', label: 'Gold rate (₹/g)', type: 'number' },
            { key: 'colourstone_rate', label: 'Colour stone rate (₹/ct)', type: 'number' },
        ],
        [],
    );

    return (
        <AdminLayout>
            <Head title={product?.id ? `Edit ${product.name}` : 'New Product'} />

            <form onSubmit={submit} className="space-y-10">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10">
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">
                                {product?.id ? 'Update catalogue record' : 'Create catalogue record'}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Define product master information, atelier references, and jobwork eligibility.
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Saving…' : product?.id ? 'Save changes' : 'Create product'}
                        </button>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>SKU *</span>
                                <input
                                    type="text"
                                    value={data.sku}
                                    onChange={(event) => setData('sku', event.target.value)}
                                    className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                                {errors.sku && <span className="text-xs text-rose-500">{errors.sku}</span>}
                            </label>
                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Product name *</span>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(event) => setData('name', event.target.value)}
                                    className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                                {errors.name && <span className="text-xs text-rose-500">{errors.name}</span>}
                            </label>
                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Description</span>
                                <textarea
                                    value={data.description}
                                    onChange={(event) => setData('description', event.target.value)}
                                    className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                                {errors.description && <span className="text-xs text-rose-500">{errors.description}</span>}
                            </label>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Brand *</span>
                                    <select
                                        value={data.brand_id}
                                        onChange={(event) => setData('brand_id', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    >
                                        <option value="">Select brand</option>
                                        {Object.entries(brands).map(([id, name]) => (
                                            <option key={id} value={id}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.brand_id && <span className="text-xs text-rose-500">{errors.brand_id}</span>}
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Category *</span>
                                    <select
                                        value={data.category_id}
                                        onChange={(event) => setData('category_id', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    >
                                        <option value="">Select category</option>
                                        {Object.entries(categories).map(([id, name]) => (
                                            <option key={id} value={id}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category_id && <span className="text-xs text-rose-500">{errors.category_id}</span>}
                                </label>
                            </div>
                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Material *</span>
                                <select
                                    value={data.material_id}
                                    onChange={(event) => setData('material_id', event.target.value)}
                                    className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                >
                                    <option value="">Select material</option>
                                    {Object.entries(materials).map(([id, name]) => (
                                        <option key={id} value={id}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                                {errors.material_id && <span className="text-xs text-rose-500">{errors.material_id}</span>}
                            </label>

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Gross weight (g)</span>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={data.gross_weight}
                                        onChange={(event) => setData('gross_weight', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    {errors.gross_weight && <span className="text-xs text-rose-500">{errors.gross_weight}</span>}
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Net weight (g)</span>
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={data.net_weight}
                                        onChange={(event) => setData('net_weight', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    {errors.net_weight && <span className="text-xs text-rose-500">{errors.net_weight}</span>}
                                </label>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Base price (₹) *</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.base_price}
                                        onChange={(event) => setData('base_price', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    {errors.base_price && <span className="text-xs text-rose-500">{errors.base_price}</span>}
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Making charge (₹) *</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.making_charge}
                                        onChange={(event) => setData('making_charge', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    {errors.making_charge && <span className="text-xs text-rose-500">{errors.making_charge}</span>}
                                </label>
                            </div>

                            <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={data.is_jobwork_allowed}
                                    onChange={(event) => setData('is_jobwork_allowed', event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                Jobwork requests allowed for this SKU
                            </label>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Variant option library</h2>
                            <p className="text-sm text-slate-500">Populate dropdown values for metal tones, stone grids, and sizes.</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
                        {optionKeys.map(({ key, label }) => (
                            <div key={key} className="space-y-3">
                                <div className="flex items-center justify-between text-sm text-slate-600">
                                    <span>{label}</span>
                                    <span className="text-xs text-slate-400">{(data.variant_options?.[key] ?? []).length} options</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(data.variant_options?.[key] ?? []).map((value) => (
                                        <span
                                            key={value}
                                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                                        >
                                            {value}
                                            <button
                                                type="button"
                                                onClick={() => removeOption(key, value)}
                                                className="text-slate-400 transition hover:text-rose-500"
                                                aria-label={`Remove ${label} ${value}`}
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                    {(data.variant_options?.[key] ?? []).length === 0 && (
                                        <span className="text-xs text-slate-400">No entries yet</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={optionDrafts[key]}
                                        onChange={(event) => setOptionDrafts({ ...optionDrafts, [key]: event.target.value })}
                                        className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder={`Add ${label.toLowerCase()}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addOption(key)}
                                        className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-slate-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10">
                    <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Variant matrix</h2>
                            <p className="text-sm text-slate-500">
                                Configure connected dropdowns. Default variant powers the customer catalogue card pricing.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={addVariantRow}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                            </svg>
                            Add variant
                        </button>
                    </div>

                    {variantError && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{variantError}</p>}

                    <div className="mt-6 space-y-4">
                        {data.variants.map((variant, index) => (
                            <div key={variant.id ?? `row-${index}`} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                                <div className="grid gap-4 md:grid-cols-5">
                                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                                        SKU
                                        <input
                                            type="text"
                                            value={variant.sku}
                                            onChange={(event) => updateVariant(index, 'sku', event.target.value)}
                                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Optional"
                                        />
                                        {errors[`variants.${index}.sku`] && (
                                            <span className="text-xs text-rose-500">{errors[`variants.${index}.sku`]}</span>
                                        )}
                                    </label>
                                    {optionKeys.map(({ key, label }) => (
                                        <label
                                            key={`${variant.id ?? index}-${key}`}
                                            className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500"
                                        >
                                            {label}
                                            <input
                                                type="text"
                                                list={`variant-${key}-${index}`}
                                                value={variant[key] as string}
                                                onChange={(event) => updateVariant(index, key, event.target.value)}
                                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                placeholder={`Enter ${label.toLowerCase()}`}
                                            />
                                            <datalist id={`variant-${key}-${index}`}>
                                                {(data.variant_options?.[key] ?? []).map((value) => (
                                                    <option key={value} value={value} />
                                                ))}
                                            </datalist>
                                            {errors[`variants.${index}.${key}`] && (
                                                <span className="text-xs text-rose-500">{errors[`variants.${index}.${key}`]}</span>
                                            )}
                                        </label>
                                    ))}
                                </div>

                                <div className="mt-4 grid gap-4 md:grid-cols-3">
                                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                                        Price adjustment (₹)
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={variant.price_adjustment}
                                            onChange={(event) => updateVariant(index, 'price_adjustment', event.target.value)}
                                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        />
                                        {errors[`variants.${index}.price_adjustment`] && (
                                            <span className="text-xs text-rose-500">{errors[`variants.${index}.price_adjustment`]}</span>
                                        )}
                                    </label>
                                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                                        Variant label
                                        <input
                                            type="text"
                                            value={variant.label}
                                            onChange={(event) => updateVariant(index, 'label', event.target.value)}
                                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        />
                                        {errors[`variants.${index}.label`] && (
                                            <span className="text-xs text-rose-500">{errors[`variants.${index}.label`]}</span>
                                        )}
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400">
                                            Suggested: {[variant.metal_tone, variant.stone_quality, variant.size].filter(Boolean).join(' / ')}
                                        </span>
                                    </label>
                                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                                        <input
                                            type="radio"
                                            checked={variant.is_default}
                                            onChange={() => markDefault(index)}
                                            className="h-4 w-4 text-slate-900 focus:ring-slate-900"
                                            name="default-variant"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">Default display variant</p>
                                            <p className="text-xs text-slate-500">Used for price cards & listing highlights.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                                    <span>Row #{index + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(index)}
                                        className="text-rose-500 hover:text-rose-600"
                                    >
                                        Remove variant
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Pricing references</h2>
                            <p className="text-sm text-slate-500">Keep your atelier and rate cards handy for quick quoting.</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {standardPricingFields.map((field) => (
                            <label key={field.key} className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>{field.label}</span>
                                <input
                                    type={field.type}
                                    value={data.standard_pricing[field.key]}
                                    onChange={(event) =>
                                        setData('standard_pricing', {
                                            ...data.standard_pricing,
                                            [field.key]: event.target.value,
                                        })
                                    }
                                    className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                                {errors[`standard_pricing.${field.key}`] && (
                                    <span className="text-xs text-rose-500">{errors[`standard_pricing.${field.key}`]}</span>
                                )}
                            </label>
                        ))}
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}

