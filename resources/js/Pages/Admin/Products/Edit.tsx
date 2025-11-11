import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type VariantForm = {
    id?: number;
    sku: string;
    label: string;
    gold_purity_id: number | '';
    silver_purity_id: number | '';
    diamond_option_key: string | null;
    size_cm: string;
    price_adjustment: string;
    is_default: boolean;
    metadata?: Record<string, unknown>;
};

type Product = {
    id?: number;
    name?: string;
    sku?: string;
    description?: string;
    brand_id?: number;
    category_id?: number;
    gross_weight?: number | string;
    net_weight?: number | string;
    base_price?: number | string;
    making_charge?: number | string;
    making_charge_discount_type?: 'percentage' | 'fixed' | null;
    making_charge_discount_value?: string | number | null;
    making_charge_discount_overrides?: Array<{
        customer_group_id: number | null;
        type: 'percentage' | 'fixed';
        value: string | number | null;
    }>;
    is_jobwork_allowed?: boolean;
    visibility?: string | null;
    standard_pricing?: Record<string, number | string | null> | null;
    variants?: VariantForm[];
    is_variant_product?: boolean;
    uses_gold?: boolean;
    uses_silver?: boolean;
    uses_diamond?: boolean;
    gold_purity_ids?: number[];
    silver_purity_ids?: number[];
    diamond_options?: DiamondOptionForm[];
    media?: ProductMedia[];
};

type OptionListItem = {
    id: number;
    name: string;
};

type DiamondCatalog = {
    types: OptionListItem[];
    shapes: OptionListItem[];
    colors: OptionListItem[];
    clarities: OptionListItem[];
    cuts: OptionListItem[];
};

type OptionList = Record<string, string>;

type AdminProductEditPageProps = AppPageProps<{
    product: Product | null;
    brands: OptionList;
    categories: OptionList;
    goldPurities: OptionListItem[];
    silverPurities: OptionListItem[];
    diamondCatalog: DiamondCatalog;
    customerGroups: OptionListItem[];
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
    gross_weight: string;
    net_weight: string;
    base_price: string;
    making_charge: string;
    making_charge_discount_type: '' | 'percentage' | 'fixed';
    making_charge_discount_value: string;
    making_charge_discount_overrides: DiscountOverrideForm[];
    is_jobwork_allowed: boolean;
    visibility: string;
    standard_pricing: StandardPricingForm;
    variants: VariantForm[];
    is_variant_product: boolean;
    uses_gold: boolean;
    uses_silver: boolean;
    uses_diamond: boolean;
    gold_purity_ids: number[];
    silver_purity_ids: number[];
    diamond_options: DiamondOptionForm[];
    media_uploads: File[];
    removed_media_ids: number[];
};

type DiamondOptionForm = {
    key: string;
    type_id: number | '';
    shape_id: number | '';
    color_id: number | '';
    clarity_id: number | '';
    cut_id: number | '';
    weight: string;
};

type DiscountOverrideForm = {
    localKey: string;
    customer_group_id: number | '';
    type: 'percentage' | 'fixed';
    value: string;
};

type ProductMedia = {
    id: number;
    type: string;
    url: string;
    position: number;
    metadata?: Record<string, unknown> | null;
};

const emptyVariant = (isDefault = false): VariantForm => ({
    sku: '',
    label: '',
    gold_purity_id: '',
    silver_purity_id: '',
    diamond_option_key: null,
    size_cm: '',
    price_adjustment: '0',
    is_default: isDefault,
    metadata: {},
});

const generateLocalKey = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }

    return `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

const createDiamondOption = (): DiamondOptionForm => ({
    key: generateLocalKey(),
    type_id: '',
    shape_id: '',
    color_id: '',
    clarity_id: '',
    cut_id: '',
    weight: '',
});

const createDiscountOverride = (): DiscountOverrideForm => ({
    localKey: generateLocalKey(),
    customer_group_id: '',
    type: 'percentage',
    value: '',
});

export default function AdminProductEdit() {
    const { props } = usePage<AdminProductEditPageProps>();
    const { product, brands, categories, goldPurities, silverPurities, diamondCatalog, customerGroups, errors } = props;

    const initialVariants: VariantForm[] = product?.variants?.length
        ? product.variants.map((variant, index) => ({
              id: variant.id,
              sku: variant.sku ?? '',
              label: variant.label ?? '',
              gold_purity_id: (variant.gold_purity_id as number | '') ?? '',
              silver_purity_id: (variant.silver_purity_id as number | '') ?? '',
              diamond_option_key: (variant.diamond_option_key as string | null) ?? null,
              size_cm: variant.size_cm ? String(variant.size_cm) : '',
              price_adjustment: String(variant.price_adjustment ?? 0),
              is_default: variant.is_default ?? index === 0,
              metadata: variant.metadata ?? {},
          }))
        : [emptyVariant(true)];

    const initialDiscountOverrides: DiscountOverrideForm[] = product?.making_charge_discount_overrides?.length
        ? product.making_charge_discount_overrides.map((override, index) => ({
              localKey: `${generateLocalKey()}-${index}`,
              customer_group_id:
                  override.customer_group_id !== null && override.customer_group_id !== undefined
                      ? Number(override.customer_group_id)
                      : '',
              type: (override.type as 'percentage' | 'fixed') ?? 'percentage',
              value: override.value !== null && override.value !== undefined ? String(override.value) : '',
          }))
        : [];

    const form = useForm<FormData>(() => ({
        sku: product?.sku ?? '',
        name: product?.name ?? '',
        description: product?.description ?? '',
        brand_id: String(product?.brand_id ?? ''),
        category_id: String(product?.category_id ?? ''),
        gross_weight: product?.gross_weight ? String(product.gross_weight) : '',
        net_weight: product?.net_weight ? String(product.net_weight) : '',
        base_price: product?.base_price ? String(product.base_price) : '',
        making_charge: product?.making_charge ? String(product.making_charge) : '',
        making_charge_discount_type:
            (product?.making_charge_discount_type as 'percentage' | 'fixed' | null) ?? '',
        making_charge_discount_value:
            product?.making_charge_discount_value !== null && product?.making_charge_discount_value !== undefined
                ? String(product.making_charge_discount_value)
                : '',
        making_charge_discount_overrides: initialDiscountOverrides,
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
        variants: initialVariants,
        is_variant_product: product?.is_variant_product ?? true,
        uses_gold: product?.uses_gold ?? false,
        uses_silver: product?.uses_silver ?? false,
        uses_diamond: product?.uses_diamond ?? false,
        gold_purity_ids: product?.gold_purity_ids ?? [],
        silver_purity_ids: product?.silver_purity_ids ?? [],
        diamond_options: product?.diamond_options?.length
            ? product.diamond_options
            : [],
        media_uploads: [],
        removed_media_ids: [],
    }));
    const { data, setData, post, put, processing } = form;

    const goldPurityMap = useMemo(
        () => Object.fromEntries(goldPurities.map((item) => [item.id, item.name])),
        [goldPurities],
    );
    const silverPurityMap = useMemo(
        () => Object.fromEntries(silverPurities.map((item) => [item.id, item.name])),
        [silverPurities],
    );
    const diamondNameMaps = useMemo(
        () => ({
            types: Object.fromEntries(diamondCatalog.types.map((item) => [item.id, item.name])),
            shapes: Object.fromEntries(diamondCatalog.shapes.map((item) => [item.id, item.name])),
            colors: Object.fromEntries(diamondCatalog.colors.map((item) => [item.id, item.name])),
            clarities: Object.fromEntries(diamondCatalog.clarities.map((item) => [item.id, item.name])),
            cuts: Object.fromEntries(diamondCatalog.cuts.map((item) => [item.id, item.name])),
        }),
        [diamondCatalog],
    );

    const buildDiamondOptionLabel = useCallback(
        (option?: DiamondOptionForm | null) => {
            if (!option) {
                return '';
            }

            const parts: string[] = [];
            if (option.weight) {
                parts.push(`${option.weight} Ct`);
            }
            if (option.shape_id) {
                parts.push(diamondNameMaps.shapes[Number(option.shape_id)] ?? '');
            }
            if (option.clarity_id) {
                parts.push(diamondNameMaps.clarities[Number(option.clarity_id)] ?? '');
            }
            if (option.color_id) {
                parts.push(diamondNameMaps.colors[Number(option.color_id)] ?? '');
            }
            if (option.type_id) {
                parts.push(diamondNameMaps.types[Number(option.type_id)] ?? '');
            }
            if (option.cut_id) {
                parts.push(diamondNameMaps.cuts[Number(option.cut_id)] ?? '');
            }

            return parts.filter(Boolean).join(' - ');
        },
        [diamondNameMaps],
    );

    const buildVariantMeta = useCallback(
        (variant: VariantForm, state: FormData) => {
            const goldName =
                variant.gold_purity_id !== '' && variant.gold_purity_id !== null
                    ? goldPurityMap[Number(variant.gold_purity_id)] ?? ''
                    : '';
            const silverName =
                variant.silver_purity_id !== '' && variant.silver_purity_id !== null
                    ? silverPurityMap[Number(variant.silver_purity_id)] ?? ''
                    : '';
            const diamondOption = state.diamond_options.find((option) => option.key === variant.diamond_option_key) ?? null;
            const diamondLabel = buildDiamondOptionLabel(diamondOption);
            const sizeLabel = variant.size_cm ? `${variant.size_cm} cm` : '';

            const autoLabelParts = [diamondLabel, goldName, silverName, sizeLabel].filter(Boolean);
            const autoLabel = autoLabelParts.length ? autoLabelParts.join(' / ') : 'Variant';
            const metalTone = [goldName, silverName].filter(Boolean).join(' + ');
            const stoneQuality = diamondLabel;

            const metadata = {
                gold_purity_id:
                    variant.gold_purity_id !== '' && variant.gold_purity_id !== null ? Number(variant.gold_purity_id) : null,
                silver_purity_id:
                    variant.silver_purity_id !== '' && variant.silver_purity_id !== null ? Number(variant.silver_purity_id) : null,
                diamond_option_key: variant.diamond_option_key ?? null,
                diamond: diamondOption
                    ? {
                          key: diamondOption.key,
                          type_id: diamondOption.type_id !== '' ? Number(diamondOption.type_id) : null,
                          shape_id: diamondOption.shape_id !== '' ? Number(diamondOption.shape_id) : null,
                          color_id: diamondOption.color_id !== '' ? Number(diamondOption.color_id) : null,
                          clarity_id: diamondOption.clarity_id !== '' ? Number(diamondOption.clarity_id) : null,
                          cut_id: diamondOption.cut_id !== '' ? Number(diamondOption.cut_id) : null,
                          weight: diamondOption.weight ? Number(diamondOption.weight) : null,
                      }
                    : null,
                size_cm: variant.size_cm ? Number(variant.size_cm) : null,
                auto_label: autoLabel,
            };

            return {
                autoLabel,
                metalTone,
                stoneQuality,
                sizeText: sizeLabel,
                metadata,
            };
        },
        [buildDiamondOptionLabel, goldPurityMap, silverPurityMap],
    );

    const recalculateVariants = useCallback(
        (draft: FormData) =>
            draft.variants.map((variant, index) => {
                const meta = buildVariantMeta(variant, draft);
                const previousAutoLabel = (variant.metadata?.auto_label as string | undefined) ?? '';
                const shouldReplaceLabel = !variant.label || variant.label === previousAutoLabel;

                return {
                    ...variant,
                    label: shouldReplaceLabel ? meta.autoLabel : variant.label,
                    metadata: meta.metadata,
                    is_default: variant.is_default ?? index === 0,
                };
            }),
        [buildVariantMeta],
    );

    const selectedGoldPurities = useMemo(
        () => goldPurities.filter((purity) => data.gold_purity_ids.includes(purity.id)),
        [data.gold_purity_ids, goldPurities],
    );

    const selectedSilverPurities = useMemo(
        () => silverPurities.filter((purity) => data.silver_purity_ids.includes(purity.id)),
        [data.silver_purity_ids, silverPurities],
    );

    const diamondOptionLabels = useMemo(
        () =>
            data.diamond_options.map((option) => ({
                key: option.key,
                label: buildDiamondOptionLabel(option) || `Option ${option.key.slice(-4)}`,
            })),
        [buildDiamondOptionLabel, data.diamond_options],
    );

    const toggleVariantProduct = (checked: boolean) => {
        setData((prev) => {
            const draft: FormData = {
                ...prev,
                is_variant_product: checked,
                uses_gold: checked ? prev.uses_gold : false,
                uses_silver: checked ? prev.uses_silver : false,
                uses_diamond: checked ? prev.uses_diamond : false,
                gold_purity_ids: checked ? prev.gold_purity_ids : [],
                silver_purity_ids: checked ? prev.silver_purity_ids : [],
                diamond_options: checked ? prev.diamond_options : [],
                variants: checked
                    ? prev.variants.length > 0
                        ? prev.variants
                        : [emptyVariant(true)]
                    : [],
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const toggleUsesGold = (checked: boolean) => {
        setData((prev) => {
            const draft: FormData = {
                ...prev,
                uses_gold: checked,
                gold_purity_ids: checked ? prev.gold_purity_ids : [],
                variants: checked
                    ? prev.variants
                    : prev.variants.map((variant) => ({
                          ...variant,
                          gold_purity_id: '',
                      })),
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const toggleUsesSilver = (checked: boolean) => {
        setData((prev) => {
            const draft: FormData = {
                ...prev,
                uses_silver: checked,
                silver_purity_ids: checked ? prev.silver_purity_ids : [],
                variants: checked
                    ? prev.variants
                    : prev.variants.map((variant) => ({
                          ...variant,
                          silver_purity_id: '',
                      })),
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const toggleUsesDiamond = (checked: boolean) => {
        setData((prev) => {
            const nextOptions =
                checked && prev.diamond_options.length === 0 ? [createDiamondOption()] : checked ? prev.diamond_options : [];

            const draft: FormData = {
                ...prev,
                uses_diamond: checked,
                diamond_options: nextOptions,
                variants: checked
                    ? prev.variants
                    : prev.variants.map((variant) => ({
                          ...variant,
                          diamond_option_key: null,
                      })),
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const toggleGoldPuritySelection = (purityId: number) => {
        setData((prev) => {
            const exists = prev.gold_purity_ids.includes(purityId);
            const nextIds = exists
                ? prev.gold_purity_ids.filter((id) => id !== purityId)
                : [...prev.gold_purity_ids, purityId];

            const draft: FormData = {
                ...prev,
                gold_purity_ids: nextIds,
                variants: prev.variants.map((variant) => {
                    if (typeof variant.gold_purity_id === 'number' && !nextIds.includes(variant.gold_purity_id)) {
                        return {
                            ...variant,
                            gold_purity_id: '',
                        };
                    }

                    return variant;
                }),
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const toggleSilverPuritySelection = (purityId: number) => {
        setData((prev) => {
            const exists = prev.silver_purity_ids.includes(purityId);
            const nextIds = exists
                ? prev.silver_purity_ids.filter((id) => id !== purityId)
                : [...prev.silver_purity_ids, purityId];

            const draft: FormData = {
                ...prev,
                silver_purity_ids: nextIds,
                variants: prev.variants.map((variant) => {
                    if (typeof variant.silver_purity_id === 'number' && !nextIds.includes(variant.silver_purity_id)) {
                        return {
                            ...variant,
                            silver_purity_id: '',
                        };
                    }

                    return variant;
                }),
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const addDiamondOptionRow = () => {
        setData((prev) => {
            const draft: FormData = {
                ...prev,
                diamond_options: [...prev.diamond_options, createDiamondOption()],
            };
            draft.variants = recalculateVariants(draft);
            return draft;
        });
    };

    const updateDiamondOption = (key: string, field: keyof DiamondOptionForm, value: string | number) => {
        setData((prev) => {
            const diamond_options = prev.diamond_options.map((option) => {
                if (option.key !== key) {
                    return option;
                }

                const nextOption: DiamondOptionForm = { ...option };

                if (field === 'weight' && typeof value === 'string') {
                    nextOption.weight = value;
                } else if (field !== 'weight') {
                    if (value === '' || value === null) {
                        nextOption[field] = '';
                    } else if (typeof value === 'number') {
                        nextOption[field] = value;
                    } else if (typeof value === 'string') {
                        nextOption[field] = value === '' ? '' : Number(value);
                    }
                }

                return nextOption;
            });

            const draft: FormData = {
                ...prev,
                diamond_options,
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const removeDiamondOptionRow = (key: string) => {
        setData((prev) => {
            const diamond_options = prev.diamond_options.filter((option) => option.key !== key);
            const draft: FormData = {
                ...prev,
                diamond_options,
                variants: prev.variants.map((variant) =>
                    variant.diamond_option_key === key
                        ? {
                              ...variant,
                              diamond_option_key: null,
                          }
                        : variant,
                ),
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const removeVariant = (index: number) => {
        setData((prev) => {
            if (prev.variants.length === 1) {
                return prev;
            }

            const remaining = prev.variants.filter((_, idx) => idx !== index);
            if (remaining.every((variant) => !variant.is_default) && remaining.length > 0) {
                remaining[0].is_default = true;
            }

            const draft: FormData = {
                ...prev,
                variants: remaining,
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const updateVariant = (index: number, field: keyof VariantForm, value: string | boolean | number | null) => {
        setData((prev) => {
            const variants = prev.variants.map((variant, idx) => {
                if (idx !== index) {
                    return variant;
                }

                const nextVariant: VariantForm = { ...variant };

                switch (field) {
                    case 'is_default':
                        if (typeof value === 'boolean') {
                            nextVariant.is_default = value;
                        }
                        break;
                    case 'gold_purity_id':
                        if (value === '' || typeof value === 'number') {
                            nextVariant.gold_purity_id = value as VariantForm['gold_purity_id'];
                        }
                        break;
                    case 'silver_purity_id':
                        if (value === '' || typeof value === 'number') {
                            nextVariant.silver_purity_id = value as VariantForm['silver_purity_id'];
                        }
                        break;
                    case 'diamond_option_key':
                        nextVariant.diamond_option_key = value ? String(value) : null;
                        break;
                    case 'size_cm':
                        if (typeof value === 'string') {
                            nextVariant.size_cm = value;
                        }
                        break;
                    case 'price_adjustment':
                        if (typeof value === 'string') {
                            nextVariant.price_adjustment = value;
                        }
                        break;
                    case 'sku':
                    case 'label':
                        if (typeof value === 'string') {
                            nextVariant[field] = value;
                        }
                        break;
                    default:
                        break;
                }

                return nextVariant;
            });

            const draft: FormData = {
                ...prev,
                variants,
            };

            draft.variants = recalculateVariants(draft);

            return draft;
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
        setData((prev) => {
            const draft: FormData = {
                ...prev,
                variants: [...prev.variants, emptyVariant(prev.variants.length === 0)],
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const addDiscountOverrideRow = () => {
        setData((prev) => ({
            ...prev,
            making_charge_discount_overrides: [...prev.making_charge_discount_overrides, createDiscountOverride()],
        }));
    };

    const updateDiscountOverrideRow = (index: number, changes: Partial<DiscountOverrideForm>) => {
        setData((prev) => ({
            ...prev,
            making_charge_discount_overrides: prev.making_charge_discount_overrides.map((override, idx) =>
                idx === index ? { ...override, ...changes } : override,
            ),
        }));
    };

    const removeDiscountOverrideRow = (index: number) => {
        setData((prev) => ({
            ...prev,
            making_charge_discount_overrides: prev.making_charge_discount_overrides.filter((_, idx) => idx !== index),
        }));
    };

    useEffect(() => {
        if (data.uses_diamond && data.diamond_options.length === 0) {
            setData((prev) => {
                const draft: FormData = {
                    ...prev,
                    diamond_options: [createDiamondOption()],
                };

                draft.variants = recalculateVariants(draft);

                return draft;
            });
        }
    }, [data.uses_diamond, data.diamond_options.length, recalculateVariants, setData]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.transform((current) => {
            const payload = { ...current };
            payload.uses_gold = current.uses_gold;
            payload.uses_silver = current.uses_silver;
            payload.uses_diamond = current.uses_diamond;

            payload.gold_purity_ids = current.uses_gold ? [...current.gold_purity_ids] : [];
            payload.silver_purity_ids = current.uses_silver ? [...current.silver_purity_ids] : [];

            payload.diamond_options = current.uses_diamond
                ? current.diamond_options.map((option) => ({
                      key: option.key,
                      type_id: option.type_id !== '' ? Number(option.type_id) : null,
                      shape_id: option.shape_id !== '' ? Number(option.shape_id) : null,
                      color_id: option.color_id !== '' ? Number(option.color_id) : null,
                      clarity_id: option.clarity_id !== '' ? Number(option.clarity_id) : null,
                      cut_id: option.cut_id !== '' ? Number(option.cut_id) : null,
                      weight: option.weight ? Number(option.weight) : null,
                  }))
                : [];

            const toNullableNumber = (value: string) => (value === '' ? null : Number(value));

            payload.making_charge_discount_type = current.making_charge_discount_type || null;
            payload.making_charge_discount_value = current.making_charge_discount_type
                ? toNullableNumber(current.making_charge_discount_value)
                : null;
            payload.making_charge_discount_overrides = current.making_charge_discount_overrides
                .map((override) => ({
                    customer_group_id:
                        override.customer_group_id !== '' ? Number(override.customer_group_id) : null,
                    type: override.type,
                    value: toNullableNumber(override.value),
                }))
                .filter((override) => override.customer_group_id !== null && override.value !== null);

            payload.variants = current.is_variant_product
                ? current.variants.map((variant) => {
                      const meta = buildVariantMeta(variant, current);

                      return {
                          id: variant.id,
                          sku: variant.sku,
                          label: variant.label || meta.autoLabel,
                          metal_tone: meta.metalTone || null,
                          stone_quality: meta.stoneQuality || null,
                          size: meta.sizeText || null,
                          price_adjustment: variant.price_adjustment,
                          is_default: variant.is_default,
                          metadata: meta.metadata,
                      };
                  })
                : [];

            if (!current.is_variant_product) {
                payload.uses_gold = false;
                payload.uses_silver = false;
                payload.uses_diamond = false;
            }

            if ((payload.media_uploads?.length ?? 0) === 0) {
                delete payload.media_uploads;
            }
            if ((payload.removed_media_ids?.length ?? 0) === 0) {
                delete payload.removed_media_ids;
            }

            return payload;
        });

        if (product?.id) {
            if ((data.media_uploads?.length ?? 0) > 0) {
                put(route('admin.products.update', product.id), { forceFormData: true });
            } else {
                put(route('admin.products.update', product.id));
            }
        } else {
            if ((data.media_uploads?.length ?? 0) > 0) {
                post(route('admin.products.store'), { forceFormData: true });
            } else {
                post(route('admin.products.store'));
            }
        }
    };

    const variantError = errors.variants;

    const mediaErrors = useMemo(
        () =>
            Object.entries(errors ?? {})
                .filter(([key]) => key.startsWith('media_uploads'))
                .map(([, message]) => message),
        [errors],
    );

    const currentMedia = useMemo(() => {
        if (!product?.media) {
            return [];
        }

        return [...product.media].sort((a, b) => a.position - b.position);
    }, [product?.media]);

    const toggleRemoveMedia = (id: number) => {
        const current = data.removed_media_ids ?? [];
        const exists = current.includes(id);
        const updated = exists ? current.filter((mediaId) => mediaId !== id) : [...current, id];
        setData('removed_media_ids', updated);
    };

    const handleMediaSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : [];
        if (files.length === 0) {
            return;
        }

        setData('media_uploads', [...(data.media_uploads ?? []), ...files]);
        event.target.value = '';
    };

    const removePendingUpload = (index: number) => {
        setData(
            'media_uploads',
            (data.media_uploads ?? []).filter((_, uploadIndex) => uploadIndex !== index),
        );
    };

    const isMarkedForRemoval = (id: number) => {
        return (data.removed_media_ids ?? []).includes(id);
    };

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
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Product media</h2>
                        <p className="text-sm text-slate-500">
                            Upload product images or videos for catalogue displays. You can also remove outdated media assets.
                        </p>
                    </div>
                </div>

                <div className="mt-6 space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Current media</h3>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {currentMedia.length > 0 ? (
                                currentMedia.map((mediaItem) => (
                                        <div
                                            key={mediaItem.id}
                                            className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition ${
                                                isMarkedForRemoval(mediaItem.id) ? 'opacity-50 ring-2 ring-rose-200' : ''
                                            }`}
                                        >
                                            {mediaItem.type === 'video' ? (
                                                <video
                                                    src={mediaItem.url}
                                                    className="h-48 w-full rounded-t-3xl bg-black object-cover"
                                                    controls
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                            ) : (
                                                <img
                                                    src={mediaItem.url}
                                                    alt="Product media"
                                                    className="h-48 w-full rounded-t-3xl object-cover"
                                                />
                                            )}
                                            <div className="flex items-center justify-between px-4 py-3 text-xs text-slate-500">
                                                <span className="rounded-full bg-white/70 px-3 py-1 font-semibold text-slate-700">
                                                    {mediaItem.type.toUpperCase()}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleRemoveMedia(mediaItem.id)}
                                                    className="text-rose-500 transition hover:text-rose-600"
                                                >
                                                    {isMarkedForRemoval(mediaItem.id) ? 'Undo removal' : 'Remove'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                                    No media uploaded yet.
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Upload new files</h3>
                        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-500 transition hover:border-slate-400 hover:bg-slate-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 014-4h10a4 4 0 014 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Click to upload</p>
                                <p className="mt-1 text-xs text-slate-400">JPEG, PNG, WebP, MP4 up to 50MB each.</p>
                            </div>
                            <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                onChange={handleMediaSelect}
                                className="hidden"
                            />
                        </label>
                        {mediaErrors.length > 0 && (
                            <ul className="mt-3 space-y-1">
                                {mediaErrors.map((message, index) => (
                                    <li key={`${index}-${message}`} className="text-xs text-rose-500">
                                        {message}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {(data.media_uploads ?? []).length > 0 && (
                            <ul className="mt-4 space-y-2">
                                {(data.media_uploads ?? []).map((file, index) => (
                                    <li
                                        key={`${file.name}-${index}`}
                                        className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-600"
                                    >
                                        <span className="truncate">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removePendingUpload(index)}
                                            className="text-rose-500 transition hover:text-rose-600"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10">
                    <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Variant configuration</h2>
                            <p className="text-sm text-slate-500">
                                Decide whether this product uses a single price or multiple combinations across metals and diamonds.
                            </p>
                        </div>
                        <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={data.is_variant_product}
                                onChange={(event) => toggleVariantProduct(event.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            Variant product (multi-option catalogue)
                        </label>
                    </div>

                    {!data.is_variant_product ? (
                        <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            Variants are disabled. Customers will see the base price and making charge defined above.
                        </p>
                    ) : (
                        <div className="mt-6 space-y-6">
                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Gold purities</h3>
                                        <p className="text-xs text-slate-500">Choose which gold purities can appear in your variant matrix.</p>
                                    </div>
                                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={data.uses_gold}
                                            onChange={(event) => toggleUsesGold(event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Use gold in variants
                                    </label>
                                </div>
                                {data.uses_gold && (
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        {goldPurities.length > 0 ? (
                                            <div className="flex flex-wrap gap-3">
                                                {goldPurities.map((purity) => {
                                                    const checked = data.gold_purity_ids.includes(purity.id);
                                                    return (
                                                        <label
                                                            key={purity.id}
                                                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                                                checked
                                                                    ? 'border-sky-400 bg-white text-sky-700'
                                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleGoldPuritySelection(purity.id)}
                                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                            />
                                                            {purity.name}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">No gold purities available yet.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Silver purities</h3>
                                        <p className="text-xs text-slate-500">Optional silver fineness values that can pair with your variants.</p>
                                    </div>
                                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={data.uses_silver}
                                            onChange={(event) => toggleUsesSilver(event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Use silver in variants
                                    </label>
                                </div>
                                {data.uses_silver && (
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        {silverPurities.length > 0 ? (
                                            <div className="flex flex-wrap gap-3">
                                                {silverPurities.map((purity) => {
                                                    const checked = data.silver_purity_ids.includes(purity.id);
                                                    return (
                                                        <label
                                                            key={purity.id}
                                                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                                                checked
                                                                    ? 'border-sky-400 bg-white text-sky-700'
                                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={() => toggleSilverPuritySelection(purity.id)}
                                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                            />
                                                            {purity.name}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">No silver purities available yet.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Diamond mixes</h3>
                                        <p className="text-xs text-slate-500">
                                            Define reusable diamond combinations that variants can reference (type, shape, clarity, weight, etc.).
                                        </p>
                                    </div>
                                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={data.uses_diamond}
                                            onChange={(event) => toggleUsesDiamond(event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Use diamonds in variants
                                    </label>
                                </div>
                                {data.uses_diamond && (
                                    <div className="space-y-4">
                                        {data.diamond_options.map((option, index) => (
                                            <div key={option.key} className="rounded-2xl border border-slate-200 p-4">
                                                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                                                    <span>Configuration #{index + 1}</span>
                                                    {data.diamond_options.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDiamondOptionRow(option.key)}
                                                            className="text-rose-500 hover:text-rose-600"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
                                                        Type
                                                        <select
                                                            value={option.type_id}
                                                            onChange={(event) =>
                                                                updateDiamondOption(
                                                                    option.key,
                                                                    'type_id',
                                                                    event.target.value === '' ? '' : Number(event.target.value),
                                                                )
                                                            }
                                                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        >
                                                            <option value="">No type</option>
                                                            {diamondCatalog.types.map((item) => (
                                                                <option key={item.id} value={item.id}>
                                                                    {item.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
                                                        Shape
                                                        <select
                                                            value={option.shape_id}
                                                            onChange={(event) =>
                                                                updateDiamondOption(
                                                                    option.key,
                                                                    'shape_id',
                                                                    event.target.value === '' ? '' : Number(event.target.value),
                                                                )
                                                            }
                                                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        >
                                                            <option value="">No shape</option>
                                                            {diamondCatalog.shapes.map((item) => (
                                                                <option key={item.id} value={item.id}>
                                                                    {item.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
                                                        Color
                                                        <select
                                                            value={option.color_id}
                                                            onChange={(event) =>
                                                                updateDiamondOption(
                                                                    option.key,
                                                                    'color_id',
                                                                    event.target.value === '' ? '' : Number(event.target.value),
                                                                )
                                                            }
                                                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        >
                                                            <option value="">No color</option>
                                                            {diamondCatalog.colors.map((item) => (
                                                                <option key={item.id} value={item.id}>
                                                                    {item.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
                                                        Clarity
                                                        <select
                                                            value={option.clarity_id}
                                                            onChange={(event) =>
                                                                updateDiamondOption(
                                                                    option.key,
                                                                    'clarity_id',
                                                                    event.target.value === '' ? '' : Number(event.target.value),
                                                                )
                                                            }
                                                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        >
                                                            <option value="">No clarity</option>
                                                            {diamondCatalog.clarities.map((item) => (
                                                                <option key={item.id} value={item.id}>
                                                                    {item.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
                                                        Cut
                                                        <select
                                                            value={option.cut_id}
                                                            onChange={(event) =>
                                                                updateDiamondOption(
                                                                    option.key,
                                                                    'cut_id',
                                                                    event.target.value === '' ? '' : Number(event.target.value),
                                                                )
                                                            }
                                                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        >
                                                            <option value="">No cut</option>
                                                            {diamondCatalog.cuts.map((item) => (
                                                                <option key={item.id} value={item.id}>
                                                                    {item.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.3em] text-slate-500">
                                                        Weight (Ct)
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={option.weight}
                                                            onChange={(event) => updateDiamondOption(option.key, 'weight', event.target.value)}
                                                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addDiamondOptionRow}
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                            </svg>
                                            Add diamond option
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {data.is_variant_product && (
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
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                                    {data.uses_gold && (
                                        <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                                            Gold purity
                                            <select
                                                value={variant.gold_purity_id === '' ? '' : variant.gold_purity_id}
                                                onChange={(event) =>
                                                    updateVariant(
                                                        index,
                                                        'gold_purity_id',
                                                        event.target.value === '' ? '' : Number(event.target.value),
                                                    )
                                                }
                                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            >
                                                <option value="">Select gold purity</option>
                                                {selectedGoldPurities.map((purity) => (
                                                    <option key={purity.id} value={purity.id}>
                                                        {purity.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors[`variants.${index}.gold_purity_id`] && (
                                                <span className="text-xs text-rose-500">{errors[`variants.${index}.gold_purity_id`]}</span>
                                            )}
                                        </label>
                                    )}
                                    {data.uses_silver && (
                                        <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                                            Silver purity
                                            <select
                                                value={variant.silver_purity_id === '' ? '' : variant.silver_purity_id}
                                                onChange={(event) =>
                                                    updateVariant(
                                                        index,
                                                        'silver_purity_id',
                                                        event.target.value === '' ? '' : Number(event.target.value),
                                                    )
                                                }
                                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            >
                                                <option value="">Select silver purity</option>
                                                {selectedSilverPurities.map((purity) => (
                                                    <option key={purity.id} value={purity.id}>
                                                        {purity.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors[`variants.${index}.silver_purity_id`] && (
                                                <span className="text-xs text-rose-500">{errors[`variants.${index}.silver_purity_id`]}</span>
                                            )}
                                        </label>
                                    )}
                                    {data.uses_diamond && (
                                        <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                                            Diamond mix
                                            <select
                                                value={variant.diamond_option_key ?? ''}
                                                onChange={(event) =>
                                                    updateVariant(index, 'diamond_option_key', event.target.value || '')
                                                }
                                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            >
                                                <option value="">Select diamond option</option>
                                                {diamondOptionLabels.length === 0 && <option value="" disabled>No options configured</option>}
                                                {diamondOptionLabels.map((option) => (
                                                    <option key={option.key} value={option.key}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors[`variants.${index}.diamond_option_key`] && (
                                                <span className="text-xs text-rose-500">
                                                    {errors[`variants.${index}.diamond_option_key`]}
                                                </span>
                                            )}
                                        </label>
                                    )}
                                    <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                                        Size (cm)
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={variant.size_cm}
                                            onChange={(event) => updateVariant(index, 'size_cm', event.target.value)}
                                            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        />
                                        {errors[`variants.${index}.size_cm`] && (
                                            <span className="text-xs text-rose-500">{errors[`variants.${index}.size_cm`]}</span>
                                        )}
                                    </label>
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
                                            Suggested: {buildVariantMeta(variant, data).autoLabel}
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
                )}

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

