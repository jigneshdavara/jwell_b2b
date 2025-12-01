import RichTextEditor from '@/Components/RichTextEditor';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type VariantMetalForm = {
    id?: number;
    metal_id: number | '';
    metal_purity_id: number | '';
    metal_tone_id: number | '';
    weight_grams: string;
    metal_weight: string;
};

type VariantDiamondForm = {
    id?: number;
    diamond_type_id: number | '';
    diamond_shape_id: number | '';
    diamond_color_id: number | '';
    diamond_clarity_id: number | '';
    diamond_cut_id: number | '';
    diamonds_count: string;
    total_carat: string;
};

type VariantForm = {
    id?: number;
    sku: string;
    label: string;
    metal_id: number | '';
    metal_purity_id: number | '';
    diamond_option_key: string | null;
    size_cm: string;
    price_adjustment: string;
    is_default: boolean;
    total_weight?: number | string;
    inventory_quantity?: number | string;
    metadata?: Record<string, FormDataConvertible>;
    // Optional: for multiple metals per variant
    metals?: VariantMetalForm[];
    diamonds?: VariantDiamondForm[];
};

type ProductDiamondOption = {
    key?: string | null;
    type_id: number | null;
    shape_id: number | null;
    color_id: number | null;
    clarity_id: number | null;
    cut_id: number | null;
    weight: number | null;
    diamonds_count: number | null;
};

type Product = {
    id?: number;
    name?: string;
    sku?: string;
    description?: string;
    brand_id?: number;
    category_id?: number;
    product_catalog_ids?: number[];
    gross_weight?: number | string;
    net_weight?: number | string;
    gold_weight?: number | string;
    silver_weight?: number | string;
    other_material_weight?: number | string;
    total_weight?: number | string;
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
    mixed_metal_tones_per_purity?: boolean;
    mixed_metal_purities_per_tone?: boolean;
    metal_mix_mode?: Record<number, 'normal' | 'mix_tones' | 'mix_purities'>;
    uses_diamond?: boolean;
    diamond_mixing_mode?: 'shared' | 'as_variant';
    metal_ids?: number[];
    metal_purity_ids?: number[];
    metal_tone_ids?: number[];
    diamond_options?: ProductDiamondOption[];
    diamond_type_ids?: number[];
    diamond_clarity_ids?: number[];
    diamond_color_ids?: number[];
    diamond_shape_ids?: number[];
    diamond_cut_ids?: number[];
    media?: ProductMedia[];
    metadata?: {
        size_dimension?: {
            unit?: 'mm' | 'cm';
            values?: Array<number | string>;
        } | null;
    } | null;
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

type MetalOption = {
    id: number;
    name: string;
    slug: string;
};

type MetalPurityOption = {
    id: number;
    metal_id: number;
    name: string;
    metal: { id: number; name: string } | null;
};

type MetalToneOption = {
    id: number;
    metal_id: number;
    name: string;
    metal: { id: number; name: string } | null;
};

type AdminProductEditPageProps = AppPageProps<{
    product: Product | null;
    brands: OptionList;
    categories: OptionList;
    productCatalogs: OptionList;
    diamondCatalog: DiamondCatalog;
    customerGroups: OptionListItem[];
    metals: MetalOption[];
    metalPurities: MetalPurityOption[];
    metalTones: MetalToneOption[];
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
    product_catalog_ids: string[];
    gross_weight: string;
    net_weight: string;
    gold_weight: string;
    silver_weight: string;
    other_material_weight: string;
    total_weight: string;
    base_price: string;
    making_charge: string;
    making_charge_discount_type: '' | 'percentage' | 'fixed' | null;
    making_charge_discount_value: string | number | null;
    making_charge_discount_overrides: DiscountOverrideForm[];
    is_jobwork_allowed: boolean;
    visibility: string;
    standard_pricing: StandardPricingForm;
    variants: VariantForm[];
    is_variant_product: boolean;
    mixed_metal_tones_per_purity: boolean;
    mixed_metal_purities_per_tone: boolean;
    metal_mix_mode: Record<number, 'normal' | 'mix_tones' | 'mix_purities'>;
    uses_diamond: boolean;
    diamond_mixing_mode: 'shared' | 'as_variant';
    metal_ids: number[];
    metal_purity_ids: number[];
    metal_tone_ids: number[];
    diamond_options: DiamondOptionForm[]; // Keep for backward compatibility, but will be replaced
    diamond_type_ids: number[];
    diamond_clarity_ids: number[];
    diamond_color_ids: number[];
    diamond_shape_ids: number[];
    diamond_cut_ids: number[];
    media_uploads?: File[];
    removed_media_ids?: number[];
    size_dimension_enabled: boolean;
    size_unit: 'mm' | 'cm';
    size_values: string[];
};

type DiamondOptionForm = {
    key: string;
    type_id: number | '';
    shape_id: number | '';
    color_id: number | '';
    clarity_id: number | '';
    cut_id: number | '';
    weight: string;
    diamonds_count: string;
};

type DiscountOverrideForm = {
    localKey: string;
    customer_group_id: number | '';
    type: 'percentage' | 'fixed';
    value: string | number | null;
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
    metal_id: '',
    metal_purity_id: '',
    diamond_option_key: null,
    size_cm: '',
    price_adjustment: '0',
    is_default: isDefault,
    metadata: {},
    metals: [],
    diamonds: [],
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
    diamonds_count: '',
});

const createEmptyDiamond = (): VariantDiamondForm => ({
    id: undefined,
    diamond_type_id: '',
    diamond_shape_id: '',
    diamond_color_id: '',
    diamond_clarity_id: '',
    diamond_cut_id: '',
    diamonds_count: '',
    total_carat: '',
});

const createDiscountOverride = (): DiscountOverrideForm => ({
    localKey: generateLocalKey(),
    customer_group_id: '',
    type: 'percentage',
    value: '',
});

export default function AdminProductEdit() {
    const { props } = usePage<AdminProductEditPageProps>();
    const {
        product,
        brands,
        categories,
        productCatalogs,
        diamondCatalog,
        customerGroups,
        metals,
        metalPurities,
        metalTones,
        errors,
    } = props;

    const initialDiamondOptions: DiamondOptionForm[] = product?.diamond_options?.length
        ? product.diamond_options.map((option, index) => ({
              key: option.key ?? `${generateLocalKey()}-${index}`,
              type_id: option.type_id ?? '',
              shape_id: option.shape_id ?? '',
              color_id: option.color_id ?? '',
              clarity_id: option.clarity_id ?? '',
              cut_id: option.cut_id ?? '',
              weight: option.weight !== null && option.weight !== undefined ? String(option.weight) : '',
              diamonds_count: option.diamonds_count !== null && option.diamonds_count !== undefined ? String(option.diamonds_count) : '',
          }))
        : [];

    const initialVariants: VariantForm[] = product?.variants?.length
        ? product.variants.map((variant: any, index) => ({
              id: variant.id,
              sku: variant.sku ?? '',
              label: variant.label ?? '',
              metal_id: variant.metal_id ?? '',
              metal_purity_id: variant.metal_purity_id ?? '',
              diamond_option_key: (variant.diamond_option_key as string | null) ?? null,
              size_cm: variant.size_cm ? String(variant.size_cm) : '',
              price_adjustment: String(variant.price_adjustment ?? 0),
              is_default: variant.is_default ?? index === 0,
              inventory_quantity: variant.inventory_quantity !== undefined && variant.inventory_quantity !== null ? Number(variant.inventory_quantity) : 0,
              metadata: variant.metadata ?? {},
              // Optional: for multiple metals per variant
              metals: variant.metals?.map((metal: any) => ({
                  id: metal.id,
                  metal_id: metal.metal_id ?? '',
                  metal_purity_id: metal.metal_purity_id ?? '',
                  metal_tone_id: metal.metal_tone_id ?? '',
                  weight_grams: metal.weight_grams ? String(metal.weight_grams) : '',
                  metal_weight: metal.metal_weight ? String(metal.metal_weight) : (metal.weight_grams ? String(metal.weight_grams) : ''),
              })) ?? [],
              diamonds: variant.diamonds?.map((diamond: any) => ({
                  id: diamond.id,
                  diamond_type_id: diamond.diamond_type_id ?? '',
                  diamond_shape_id: diamond.diamond_shape_id ?? '',
                  diamond_color_id: diamond.diamond_color_id ?? '',
                  diamond_clarity_id: diamond.diamond_clarity_id ?? '',
                  diamond_cut_id: diamond.diamond_cut_id ?? '',
                  diamonds_count: diamond.diamonds_count ? String(diamond.diamonds_count) : '',
                  total_carat: diamond.total_carat ? String(diamond.total_carat) : '',
              })) ?? [],
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

    const sizeDimension = product?.metadata?.size_dimension ?? null;
    const initialSizeUnit = sizeDimension?.unit === 'cm' ? 'cm' : 'mm';
    const initialSizeValues = Array.isArray(sizeDimension?.values)
        ? (sizeDimension?.values ?? []).map((value) => String(value))
        : [];
    const initialSizeEnabled = initialSizeValues.length > 0;

    const form = useForm<Record<string, any>>(() => ({
        sku: product?.sku ?? '',
        name: product?.name ?? '',
        description: product?.description ?? '',
        brand_id: String(product?.brand_id ?? ''),
        category_id: String(product?.category_id ?? ''),
        product_catalog_ids: (product?.product_catalog_ids ?? []).map((id) => String(id)),
        gross_weight: product?.gross_weight ? String(product.gross_weight) : '',
        net_weight: product?.net_weight ? String(product.net_weight) : '',
        making_charge: product?.making_charge ? String(product.making_charge) : '',
        making_charge_discount_type:
            (product?.making_charge_discount_type as 'percentage' | 'fixed' | null) ?? null,
        making_charge_discount_value:
            product?.making_charge_discount_value !== null && product?.making_charge_discount_value !== undefined
                ? String(product.making_charge_discount_value)
                : null,
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
        mixed_metal_tones_per_purity: product?.mixed_metal_tones_per_purity ?? false,
        mixed_metal_purities_per_tone: product?.mixed_metal_purities_per_tone ?? false,
        metal_mix_mode: (() => {
            // Normalize metal_mix_mode to ensure keys are numbers (JSON keys are strings in JavaScript)
            // This follows the same pattern as diamond_mixing_mode initialization
            const rawMode = product?.metal_mix_mode;
            
            // Handle null, undefined - return empty object for new products
            if (!rawMode) {
                return {} as Record<number, 'normal' | 'mix_tones' | 'mix_purities'>;
            }
            
            // Handle empty array - return empty object for new products
            if (Array.isArray(rawMode)) {
                // If it's an empty array, return empty object
                // If it has items, it might be incorrectly formatted, try to process it
                if (rawMode.length === 0) {
                    return {} as Record<number, 'normal' | 'mix_tones' | 'mix_purities'>;
                }
                // If array has items, it's likely incorrectly formatted, return empty
                return {} as Record<number, 'normal' | 'mix_tones' | 'mix_purities'>;
            }
            
            // Ensure it's an object
            if (typeof rawMode !== 'object') {
                return {} as Record<number, 'normal' | 'mix_tones' | 'mix_purities'>;
            }
            
            // Handle empty object (no saved modes yet) - return empty object
            const keys = Object.keys(rawMode);
            if (keys.length === 0) {
                return {} as Record<number, 'normal' | 'mix_tones' | 'mix_purities'>;
            }
            
            // Normalize: convert string keys to numeric keys
            const normalized: Record<number, 'normal' | 'mix_tones' | 'mix_purities'> = {};
            keys.forEach((key) => {
                const numKey = Number(key);
                // Access value using the original key (which is a string from JSON)
                const value = (rawMode as Record<string, unknown>)[key];
                // Validate the value is one of the allowed modes and key is a valid number
                if (!isNaN(numKey) && numKey > 0 && (value === 'normal' || value === 'mix_tones' || value === 'mix_purities')) {
                    normalized[numKey] = value as 'normal' | 'mix_tones' | 'mix_purities';
                }
            });
            
            return normalized;
        })(),
        uses_diamond: product?.uses_diamond ?? false,
        diamond_mixing_mode: (product?.diamond_mixing_mode && (product.diamond_mixing_mode === 'shared' || product.diamond_mixing_mode === 'as_variant')) 
            ? (product.diamond_mixing_mode as 'shared' | 'as_variant')
            : 'shared',
        metal_ids: product?.metal_ids ?? [],
        metal_purity_ids: product?.metal_purity_ids ?? [],
        metal_tone_ids: product?.metal_tone_ids ?? [],
        diamond_options: initialDiamondOptions,
        diamond_type_ids: product?.diamond_type_ids ?? [],
        diamond_clarity_ids: product?.diamond_clarity_ids ?? [],
        diamond_color_ids: product?.diamond_color_ids ?? [],
        diamond_shape_ids: product?.diamond_shape_ids ?? [],
        diamond_cut_ids: product?.diamond_cut_ids ?? [],
        media_uploads: [],
        removed_media_ids: [],
        size_dimension_enabled: initialSizeEnabled,
        size_unit: initialSizeUnit,
        size_values: initialSizeValues,
    }) as Record<string, any>);
    const { setData, post, put, processing } = form;
    const data = form.data as FormData;
    const [sizeValueInput, setSizeValueInput] = useState('');
    // Allow multiple variants to be expanded simultaneously
    const [expandedDiamondVariantIndices, setExpandedDiamondVariantIndices] = useState<Set<number>>(new Set());
    const [expandedMetalVariantIndices, setExpandedMetalVariantIndices] = useState<Set<number>>(new Set());
    
    // Helper functions to toggle expansion
    const toggleMetalExpansion = useCallback((index: number) => {
        setExpandedMetalVariantIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }, []);
    
    const toggleDiamondExpansion = useCallback((index: number) => {
        setExpandedDiamondVariantIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }, []);

    const formatDecimal = (value: number): string => {
        if (!Number.isFinite(value)) {
            return '';
        }

        return value.toFixed(3).replace(/\.?0+$/, '');
    };

    const convertToCentimeters = (value: string, unit: 'mm' | 'cm'): string => {
        const numeric = parseFloat(value);
        if (!Number.isFinite(numeric)) {
            return '';
        }

        const centimeters = unit === 'mm' ? numeric / 10 : numeric;
        return formatDecimal(centimeters);
    };

    const convertFromCentimeters = (value: string | number, unit: 'mm' | 'cm'): string => {
        const numeric = typeof value === 'number' ? value : parseFloat(value);
        if (!Number.isFinite(numeric)) {
            return '';
        }

        const converted = unit === 'mm' ? numeric * 10 : numeric;
        return formatDecimal(converted);
    };


    // Create maps for metal purities and tones
    const metalPurityMap = useMemo(
        () => Object.fromEntries(metalPurities.map((item) => [item.id, item.name])),
        [metalPurities],
    );
    const metalToneMap = useMemo(
        () => Object.fromEntries(metalTones.map((item) => [item.id, item.name])),
        [metalTones],
    );
    const metalMap = useMemo(
        () => Object.fromEntries(metals.map((item) => [item.id, item.name])),
        [metals],
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
            // Build metal + purity + tone label
            // Support both old format (metal_id/metal_purity_id on variant) and new format (variant.metals array)
            let metalLabel = '';
            
            // Check if variant has metals array (new format with support for multiple metals, tones, or purities)
            if (variant.metals && variant.metals.length > 0) {
                const metalsData = variant.metals
                    .filter((metal) => metal.metal_id !== '' && typeof metal.metal_id === 'number')
                    .map((metal) => ({
                        metal_id: metal.metal_id as number,
                        metal_purity_id: metal.metal_purity_id !== '' && metal.metal_purity_id !== null ? Number(metal.metal_purity_id) : null,
                        metal_tone_id: metal.metal_tone_id !== '' && metal.metal_tone_id !== null ? Number(metal.metal_tone_id) : null,
                    }));
                
                if (metalsData.length === 0) {
                    metalLabel = '';
                } else {
                    // Group metals by metal_id to handle multi-metal variants
                    const metalsByMetalId = new Map<number, typeof metalsData>();
                    metalsData.forEach((metal) => {
                        if (!metalsByMetalId.has(metal.metal_id)) {
                            metalsByMetalId.set(metal.metal_id, []);
                        }
                        metalsByMetalId.get(metal.metal_id)!.push(metal);
                    });
                    
                    // Build label for each metal group
                    const metalLabelParts: string[] = [];
                    
                    metalsByMetalId.forEach((metalsInGroup, metalId) => {
                        const metalName = metalMap[metalId] ?? '';
                        if (!metalName) return;
                        
                        // Check if we have multiple purities with same tone (mixed purities per tone)
                        const uniquePurities = new Set(metalsInGroup.map((m) => m.metal_purity_id).filter(Boolean));
                        const uniqueTones = new Set(metalsInGroup.map((m) => m.metal_tone_id).filter(Boolean));
                        
                        let groupLabel = '';
                        
                        if (uniquePurities.size > 1 && uniqueTones.size === 1) {
                            // Mixed purities per tone: "18K + 22K Yellow Gold"
                            const toneId = Array.from(uniqueTones)[0];
                            const toneName = toneId ? (metalToneMap[toneId] ?? '') : '';
                            const purityNames = Array.from(uniquePurities)
                                .map((purityId) => (purityId ? (metalPurityMap[purityId] ?? '') : ''))
                                .filter(Boolean)
                                .sort();
                            
                            if (purityNames.length > 0) {
                                if (toneName) {
                                    groupLabel = `${purityNames.join(' + ')} ${toneName} ${metalName}`;
                                } else {
                                    groupLabel = `${purityNames.join(' + ')} ${metalName}`;
                                }
                            } else {
                                groupLabel = metalName;
                            }
                        } else if (uniqueTones.size > 1 && uniquePurities.size === 1) {
                            // Mixed tones per purity: "18K Yellow + White Gold"
                            const purityId = Array.from(uniquePurities)[0];
                            const purityName = purityId ? (metalPurityMap[purityId] ?? '') : '';
                            const toneNames = Array.from(uniqueTones)
                                .map((toneId) => (toneId ? (metalToneMap[toneId] ?? '') : ''))
                                .filter(Boolean)
                                .sort();
                            
                            if (toneNames.length > 0) {
                                if (purityName) {
                                    groupLabel = `${purityName} ${toneNames.join(' + ')} ${metalName}`;
                                } else {
                                    groupLabel = `${toneNames.join(' + ')} ${metalName}`;
                                }
                            } else {
                                groupLabel = purityName ? `${purityName} ${metalName}` : metalName;
                            }
                        } else {
                            // Single purity and tone, or fallback
                            const firstMetal = metalsInGroup[0];
                            const purityId = firstMetal.metal_purity_id;
                            const toneId = firstMetal.metal_tone_id;
                            const purityName = purityId ? (metalPurityMap[purityId] ?? '') : '';
                            const toneName = toneId ? (metalToneMap[toneId] ?? '') : '';
                            
                            if (purityName && toneName) {
                                groupLabel = `${purityName} ${toneName} ${metalName}`;
                            } else if (purityName) {
                                groupLabel = `${purityName} ${metalName}`;
                            } else if (toneName) {
                                groupLabel = `${toneName} ${metalName}`;
                            } else {
                                groupLabel = metalName;
                            }
                        }
                        
                        if (groupLabel) {
                            metalLabelParts.push(groupLabel);
                        }
                    });
                    
                    // Join all metal labels with " / " for multi-metal variants
                    metalLabel = metalLabelParts.join(' / ');
                }
            } else if (variant.metal_id !== '' && typeof variant.metal_id === 'number') {
                // Fallback to old format (backward compatibility)
                const metalName = metalMap[variant.metal_id] ?? '';
                if (variant.metal_purity_id !== '' && typeof variant.metal_purity_id === 'number') {
                    const purityLabel = metalPurityMap[variant.metal_purity_id] ?? '';
                    metalLabel = purityLabel ? `${purityLabel} ${metalName}` : metalName;
                } else {
                    metalLabel = metalName;
                }
            }
            
            // Build diamond label from variant.diamonds array (new approach) or diamond_option_key (backward compatibility)
            let diamondLabel = '';
            if (variant.diamonds && variant.diamonds.length > 0) {
                const diamondParts: string[] = [];
                variant.diamonds.forEach((diamond) => {
                    const parts: string[] = [];
                    if (diamond.diamond_type_id !== '' && diamond.diamond_type_id !== null) {
                        parts.push(diamondNameMaps.types[Number(diamond.diamond_type_id)] || '');
                    }
                    if (diamond.diamond_clarity_id !== '' && diamond.diamond_clarity_id !== null) {
                        parts.push(diamondNameMaps.clarities[Number(diamond.diamond_clarity_id)] || '');
                    }
                    if (diamond.diamond_color_id !== '' && diamond.diamond_color_id !== null) {
                        parts.push(diamondNameMaps.colors[Number(diamond.diamond_color_id)] || '');
                    }
                    if (diamond.diamond_shape_id !== '' && diamond.diamond_shape_id !== null) {
                        parts.push(diamondNameMaps.shapes[Number(diamond.diamond_shape_id)] || '');
                    }
                    if (diamond.diamond_cut_id !== '' && diamond.diamond_cut_id !== null) {
                        parts.push(diamondNameMaps.cuts[Number(diamond.diamond_cut_id)] || '');
                    }
                    if (diamond.total_carat && diamond.total_carat !== '') {
                        parts.push(`${diamond.total_carat}ct`);
                    }
                    if (parts.length > 0) {
                        diamondParts.push(parts.filter(Boolean).join(' — '));
                    }
                });
                diamondLabel = diamondParts.join(' / ');
            } else {
                // Fallback to old diamond_option_key approach
            const diamondOption = state.diamond_options.find((option) => option.key === variant.diamond_option_key) ?? null;
                diamondLabel = buildDiamondOptionLabel(diamondOption);
            }

            const rawMetadata = (variant.metadata ?? {}) as Record<string, FormDataConvertible>;
            const storedSizeValue =
                typeof rawMetadata.size_value === 'string' || typeof rawMetadata.size_value === 'number'
                    ? String(rawMetadata.size_value)
                    : '';
            const storedSizeUnit =
                rawMetadata.size_unit === 'mm' || rawMetadata.size_unit === 'cm'
                    ? (rawMetadata.size_unit as 'mm' | 'cm')
                    : state.size_unit;

            let sizeUnit: 'mm' | 'cm' = state.size_dimension_enabled ? storedSizeUnit : 'cm';
            let sizeValue = '';

            if (state.size_dimension_enabled) {
                if (storedSizeValue) {
                    sizeValue = formatDecimal(Number(storedSizeValue));
                } else if (variant.size_cm) {
                    sizeValue = convertFromCentimeters(variant.size_cm, state.size_unit);
                }
            } else if (variant.size_cm) {
                sizeValue = formatDecimal(parseFloat(variant.size_cm));
                sizeUnit = 'cm';
            }

            const sizeLabel = sizeValue ? `${sizeValue}${sizeUnit}` : '';

            const autoLabelParts = [diamondLabel, metalLabel, sizeLabel].filter(Boolean);
            const autoLabel = autoLabelParts.length ? autoLabelParts.join(' / ') : 'Variant';
            const metalTone = metalLabel;
            const stoneQuality = diamondLabel;

            // Build diamond metadata from variant.diamonds array or diamond_option_key (backward compatibility)
            let diamondMetadata = null;
            if (variant.diamonds && variant.diamonds.length > 0) {
                // Use diamonds array (new approach)
                diamondMetadata = variant.diamonds.map((diamond) => ({
                    type_id: diamond.diamond_type_id !== '' && diamond.diamond_type_id !== null ? Number(diamond.diamond_type_id) : null,
                    shape_id: diamond.diamond_shape_id !== '' && diamond.diamond_shape_id !== null ? Number(diamond.diamond_shape_id) : null,
                    color_id: diamond.diamond_color_id !== '' && diamond.diamond_color_id !== null ? Number(diamond.diamond_color_id) : null,
                    clarity_id: diamond.diamond_clarity_id !== '' && diamond.diamond_clarity_id !== null ? Number(diamond.diamond_clarity_id) : null,
                    cut_id: diamond.diamond_cut_id !== '' && diamond.diamond_cut_id !== null ? Number(diamond.diamond_cut_id) : null,
                    total_carat: diamond.total_carat ? Number(diamond.total_carat) : null,
                }));
            } else {
                // Fallback to old diamond_option_key approach
                const diamondOption = state.diamond_options.find((option) => option.key === variant.diamond_option_key) ?? null;
                if (diamondOption) {
                    diamondMetadata = {
                          key: diamondOption.key,
                          type_id: diamondOption.type_id !== '' ? Number(diamondOption.type_id) : null,
                          shape_id: diamondOption.shape_id !== '' ? Number(diamondOption.shape_id) : null,
                          color_id: diamondOption.color_id !== '' ? Number(diamondOption.color_id) : null,
                          clarity_id: diamondOption.clarity_id !== '' ? Number(diamondOption.clarity_id) : null,
                          cut_id: diamondOption.cut_id !== '' ? Number(diamondOption.cut_id) : null,
                          weight: diamondOption.weight ? Number(diamondOption.weight) : null,
                    };
                }
            }
            
            const metadata: Record<string, FormDataConvertible> = {
                metal_id: variant.metal_id !== '' && variant.metal_id !== null ? Number(variant.metal_id) : null,
                metal_purity_id:
                    variant.metal_purity_id !== '' && variant.metal_purity_id !== null ? Number(variant.metal_purity_id) : null,
                diamond_option_key: variant.diamond_option_key ?? null,
                diamond: diamondMetadata,
                size_cm: variant.size_cm ? Number(variant.size_cm) : null,
                auto_label: autoLabel,
            };

            if (sizeValue) {
                metadata.size_value = sizeValue;
                metadata.size_unit = sizeUnit;
            } else {
                delete metadata.size_value;
                delete metadata.size_unit;
            }

            const storedStatus =
                typeof rawMetadata.status === 'string' && rawMetadata.status.trim().length > 0
                    ? String(rawMetadata.status)
                    : undefined;

            if (storedStatus) {
                metadata.status = storedStatus;
            } else {
                metadata.status = 'enabled';
            }

            return {
                autoLabel,
                metalTone,
                stoneQuality,
                sizeText: sizeLabel,
                metadata,
            };
        },
        [buildDiamondOptionLabel, convertFromCentimeters, formatDecimal, metalMap, metalPurityMap, metalToneMap],
    );

    const recalculateVariants = useCallback(
        (draft: FormData) =>
            draft.variants.map((variant, index) => {
                const meta = buildVariantMeta(variant, draft);
                const previousAutoLabel = (variant.metadata?.auto_label as string | undefined) ?? '';
                const shouldReplaceLabel = !variant.label || variant.label === previousAutoLabel;

                const previousAutoSku = (variant.metadata?.auto_sku as string | undefined) ?? '';
                const baseSkuSource = (draft.sku ?? '').trim();
                const normalizedBase = baseSkuSource ? baseSkuSource.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : 'SKU';
                const autoSku = `${normalizedBase}-${String(index + 1).padStart(2, '0')}`;
                const shouldReplaceSku = !variant.sku || variant.sku === previousAutoSku;

                return {
                    ...variant,
                    sku: shouldReplaceSku ? autoSku : variant.sku,
                    label: shouldReplaceLabel ? meta.autoLabel : variant.label,
                    metadata: {
                        ...meta.metadata,
                        auto_sku: autoSku,
                    },
                    is_default: variant.is_default ?? index === 0,
                };
            }),
        [buildVariantMeta],
    );


    // Get purities and tones filtered by selected metals
    const availablePurities = useMemo(() => {
        if (data.metal_ids.length === 0) return [];
        return metalPurities.filter((purity) => data.metal_ids.includes(purity.metal_id));
    }, [data.metal_ids, metalPurities]);

    const availableTones = useMemo(() => {
        if (data.metal_ids.length === 0) return [];
        return metalTones.filter((tone) => data.metal_ids.includes(tone.metal_id));
    }, [data.metal_ids, metalTones]);

    // Get selected purities and tones
    const selectedPurities = useMemo(
        () => availablePurities.filter((purity) => data.metal_purity_ids.includes(purity.id)),
        [data.metal_purity_ids, availablePurities],
    );

    const selectedTones = useMemo(
        () => availableTones.filter((tone) => data.metal_tone_ids.includes(tone.id)),
        [data.metal_tone_ids, availableTones],
    );

    const diamondOptionLabels = useMemo(
        () =>
            data.diamond_options.map((option) => ({
                key: option.key,
                label: buildDiamondOptionLabel(option) || `Option ${option.key.slice(-4)}`,
            })),
        [buildDiamondOptionLabel, data.diamond_options],
    );

    const diamondLabelMap = useMemo(
        () =>
            diamondOptionLabels.reduce<Record<string, string>>((carry, option) => {
                carry[option.key] = option.label;
                return carry;
            }, {}),
        [diamondOptionLabels],
    );

    const toggleVariantProduct = (checked: boolean) => {
        setData((prev: FormData) => {
            const draft: FormData = {
                ...prev,
                is_variant_product: checked,
                uses_diamond: checked ? prev.uses_diamond : false,
                metal_ids: checked ? prev.metal_ids : [],
                metal_purity_ids: checked ? prev.metal_purity_ids : [],
                metal_tone_ids: checked ? prev.metal_tone_ids : [],
                diamond_options: checked ? prev.diamond_options : [],
                size_dimension_enabled: checked ? prev.size_dimension_enabled : false,
                size_values: checked ? prev.size_values : [],
                size_unit: checked ? prev.size_unit : 'mm',
                variants: checked
                    ? prev.variants.length > 0
                        ? prev.variants
                        : [emptyVariant(true)]
                    : [],
            };

            if (!checked) {
                draft.size_dimension_enabled = false;
                draft.size_values = [];
                draft.size_unit = 'mm';
            }

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const toggleUsesDiamond = (checked: boolean) => {
        setData((prev: FormData) => {
            const nextOptions =
                checked && prev.diamond_options.length === 0 
                    ? [createDiamondOption()] 
                    : checked ? prev.diamond_options : [];

            const draft: FormData = {
                ...prev,
                uses_diamond: checked,
                // Preserve diamond_mixing_mode even when disabling diamonds
                diamond_mixing_mode: prev.diamond_mixing_mode || 'shared',
                diamond_options: nextOptions,
                variants: checked
                    ? prev.variants
                    : prev.variants.map((variant: VariantForm) => ({
                          ...variant,
                          diamond_option_key: null,
                          diamonds: [],
                      })),
            };

            if (!checked) {
                draft.diamond_type_ids = [];
                draft.diamond_clarity_ids = [];
                draft.diamond_color_ids = [];
                draft.diamond_shape_ids = [];
                draft.diamond_cut_ids = [];
            }

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const toggleSizeDimension = (checked: boolean) => {
        setData((prev: FormData) => {
            const draft: FormData = {
                ...prev,
                size_dimension_enabled: checked,
                size_values: checked ? prev.size_values : [],
                size_unit: checked ? prev.size_unit : 'mm',
                variants: prev.variants.map((variant: VariantForm) => {
                    if (checked) {
                        return {
                            ...variant,
                        };
                    }

                    const metadata = { ...(variant.metadata ?? {}) };
                    delete metadata.size_value;
                    delete metadata.size_unit;

                    return {
                        ...variant,
                        size_cm: '',
                        metadata,
                    };
                }),
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const changeSizeUnit = (unit: 'mm' | 'cm') => {
        setData((prev: FormData) => {
            if (prev.size_unit === unit) {
                return prev;
            }

            const convertedValues = prev.size_values.map((value) => {
                const centimeters = convertToCentimeters(value, prev.size_unit);
                return centimeters ? convertFromCentimeters(centimeters, unit) : value;
            });

            const draft: FormData = {
                ...prev,
                size_unit: unit,
                size_values: convertedValues,
                variants: prev.variants.map((variant: VariantForm) => {
                    if (!variant.size_cm) {
                        return {
                            ...variant,
                            metadata: {
                                ...(variant.metadata ?? {}),
                                size_unit: unit,
                            },
                        };
                    }

                    const metadata = { ...(variant.metadata ?? {}) };
                    const displayValue = convertFromCentimeters(variant.size_cm, unit);

                    if (displayValue) {
                        metadata.size_value = displayValue;
                        metadata.size_unit = unit;
                    } else {
                        delete metadata.size_value;
                        metadata.size_unit = unit;
                    }

                    return {
                        ...variant,
                        metadata,
                    };
                }),
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const addSizeValue = () => {
        const rawValue = sizeValueInput.trim();
        if (!rawValue) {
            return;
        }

        const numeric = parseFloat(rawValue);
        if (!Number.isFinite(numeric) || numeric <= 0) {
            return;
        }

        const normalized = formatDecimal(numeric);

        setData((prev: FormData) => {
            if (prev.size_values.includes(normalized)) {
                return prev;
            }

            const draft: FormData = {
                ...prev,
                size_values: [...prev.size_values, normalized],
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });

        setSizeValueInput('');
    };

    const removeSizeValue = (value: string) => {
        setData((prev: FormData) => {
            const draft: FormData = {
                ...prev,
                size_values: prev.size_values.filter((entry) => entry !== value),
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };


    const toggleMetalSelection = (metalId: number) => {
        setData((prev: FormData) => {
            const exists = prev.metal_ids.includes(metalId);
            const nextMetalIds = exists
                ? prev.metal_ids.filter((id) => id !== metalId)
                : [...prev.metal_ids, metalId];

            // Remove purities and tones for deselected metal
            const metalPuritiesToRemove = metalPurities
                .filter((p) => p.metal_id === metalId)
                .map((p) => p.id);
            const metalTonesToRemove = metalTones
                .filter((t) => t.metal_id === metalId)
                .map((t) => t.id);

            const draft: FormData = {
                ...prev,
                metal_ids: nextMetalIds,
                metal_purity_ids: prev.metal_purity_ids.filter((id) => !metalPuritiesToRemove.includes(id)),
                metal_tone_ids: prev.metal_tone_ids.filter((id) => !metalTonesToRemove.includes(id)),
                // Preserve metal_mix_mode when toggling metals (don't reset it)
                metal_mix_mode: prev.metal_mix_mode,
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const toggleMetalPuritySelection = (purityId: number) => {
        setData((prev: FormData) => {
            const exists = prev.metal_purity_ids.includes(purityId);
            const nextIds = exists
                ? prev.metal_purity_ids.filter((id) => id !== purityId)
                : [...prev.metal_purity_ids, purityId];

            return {
                ...prev,
                metal_purity_ids: nextIds,
            };
        });
    };

    const toggleMetalToneSelection = (toneId: number) => {
        setData((prev: FormData) => {
            const exists = prev.metal_tone_ids.includes(toneId);
            const nextIds = exists
                ? prev.metal_tone_ids.filter((id) => id !== toneId)
                : [...prev.metal_tone_ids, toneId];

            return {
                ...prev,
                metal_tone_ids: nextIds,
            };
        });
    };

    const addDiamondOptionRow = () => {
        setData((prev: FormData) => {
            const draft: FormData = {
                ...prev,
                diamond_options: [...prev.diamond_options, createDiamondOption()],
            };
            draft.variants = recalculateVariants(draft);
            return draft;
        });
    };

    const updateDiamondOption = (
        key: string,
        field: Exclude<keyof DiamondOptionForm, 'key'>,
        value: string | number | null,
    ) => {
        setData((prev: FormData) => {
            const diamond_options = prev.diamond_options.map((option: DiamondOptionForm) => {
                if (option.key !== key) {
                    return option;
                }

                if (field === 'weight' || field === 'diamonds_count') {
                    return {
                        ...option,
                        [field]: value === null ? '' : String(value),
                    };
                }

                const nextValue =
                    value === null || value === ''
                        ? ''
                        : typeof value === 'number'
                        ? value
                        : value === ''
                        ? ''
                        : Number(value);

                return {
                    ...option,
                    [field]: nextValue as DiamondOptionForm[typeof field],
                };
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
        setData((prev: FormData) => {
            const diamond_options = prev.diamond_options.filter((option: DiamondOptionForm) => option.key !== key);
            const draft: FormData = {
                ...prev,
                diamond_options,
                variants: prev.variants.map((variant: VariantForm) =>
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
        setData((prev: FormData) => {
            if (prev.variants.length === 1) {
                return prev;
            }

            const remaining = prev.variants.filter((_, idx: number) => idx !== index);
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
        setData((prev: FormData) => {
            const variants = prev.variants.map((variant: VariantForm, idx: number) => {
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
                    case 'metal_id':
                        if (value === '' || typeof value === 'number') {
                            nextVariant.metal_id = value as VariantForm['metal_id'];
                            // Reset purity when metal changes
                            if (value === '' || typeof value !== 'number') {
                                nextVariant.metal_purity_id = '';
                            }
                        }
                        break;
                    case 'metal_purity_id':
                        if (value === '' || typeof value === 'number') {
                            nextVariant.metal_purity_id = value as VariantForm['metal_purity_id'];
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
                    case 'total_weight':
                        if (value === '' || value === null) {
                            nextVariant[field] = '';
                        } else if (typeof value === 'string' || typeof value === 'number') {
                            nextVariant[field] = value;
                        }
                        break;
                    case 'inventory_quantity':
                        if (value === '' || value === null) {
                            nextVariant[field] = 0;
                        } else if (typeof value === 'string') {
                            const numVal = parseInt(value, 10);
                            nextVariant[field] = isNaN(numVal) ? 0 : numVal;
                        } else if (typeof value === 'number') {
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

    const updateVariantMetadata = (index: number, changes: Record<string, FormDataConvertible | null>) => {
        setData((prev: FormData) => {
            const variants = prev.variants.map((variant: VariantForm, idx: number) => {
                if (idx !== index) {
                    return variant;
                }

                const metadata = { ...(variant.metadata ?? {}) } as Record<string, FormDataConvertible>;

                Object.entries(changes).forEach(([key, value]) => {
                    if (value === null) {
                        delete metadata[key];
                    } else {
                        metadata[key] = value;
                    }
                });

                return {
                    ...variant,
                    metadata,
                };
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
        setData((prev: FormData) => ({
            ...prev,
            variants: prev.variants.map((variant: VariantForm, idx: number) => ({
                ...variant,
                is_default: idx === index,
            })),
        }));
    };

    // Diamond management functions (per-variant, manual)
    const addDiamondToVariant = (variantIndex: number) => {
        setData((prev: FormData) => {
            const variants = prev.variants.map((variant: VariantForm, idx: number) => {
                if (idx !== variantIndex) {
                    return variant;
                }
                const currentDiamonds = variant.diamonds || [];
                return {
                    ...variant,
                    diamonds: [...currentDiamonds, createEmptyDiamond()],
                };
            });
            return {
                ...prev,
                variants,
            };
        });
    };

    const removeDiamondFromVariant = (variantIndex: number, diamondIndex: number) => {
        setData((prev: FormData) => {
            const variants = prev.variants.map((variant: VariantForm, idx: number) => {
                if (idx !== variantIndex) {
                    return variant;
                }
                const currentDiamonds = variant.diamonds || [];
                return {
                    ...variant,
                    diamonds: currentDiamonds.filter((_, dIdx: number) => dIdx !== diamondIndex),
                };
            });
            return {
                ...prev,
                variants,
            };
        });
    };

    const updateDiamondInVariant = (
        variantIndex: number,
        diamondIndex: number,
        field: keyof VariantDiamondForm,
        value: string | number | '',
    ) => {
        setData((prev: FormData) => {
            const variants = prev.variants.map((variant: VariantForm, idx: number) => {
                if (idx !== variantIndex) {
                    return variant;
                }
                const currentDiamonds = variant.diamonds || [];
                const updatedDiamonds = currentDiamonds.map((diamond: VariantDiamondForm, dIdx: number) => {
                    if (dIdx !== diamondIndex) {
                        return diamond;
                    }
                    return {
                        ...diamond,
                        [field]: value,
                    };
                });
                return {
                    ...variant,
                    diamonds: updatedDiamonds,
                };
            });
            return {
                ...prev,
                variants,
            };
        });
    };

    // Metal management functions (per-variant)
    const updateMetalInVariant = (
        variantIndex: number,
        metalIndex: number,
        field: keyof VariantMetalForm,
        value: string | number | '',
    ) => {
        setData((prev: FormData) => {
            const variants = prev.variants.map((variant: VariantForm, idx: number) => {
                if (idx !== variantIndex) {
                    return variant;
                }
                const currentMetals = variant.metals || [];
                const updatedMetals = currentMetals.map((metal: VariantMetalForm, mIdx: number) => {
                    if (mIdx !== metalIndex) {
                        return metal;
                    }
                    return {
                        ...metal,
                        [field]: value,
                    };
                });
                return {
                    ...variant,
                    metals: updatedMetals,
                };
            });
            return {
                ...prev,
                variants,
            };
        });
    };

    // Extract variant matrix generation logic into a reusable function
    const generateVariantMatrixForData = (prev: FormData): FormData => {
                // Group purities by metal
                const puritiesByMetal = new Map<number, number[]>();
            if (prev.metal_ids.length > 0 && prev.metal_purity_ids.length > 0) {
                prev.metal_purity_ids.forEach((purityId) => {
                    const purity = metalPurities.find((p) => p.id === purityId);
                    if (purity && prev.metal_ids.includes(purity.metal_id)) {
                        if (!puritiesByMetal.has(purity.metal_id)) {
                            puritiesByMetal.set(purity.metal_id, []);
                        }
                        puritiesByMetal.get(purity.metal_id)!.push(purityId);
                    }
                });
            }
            
            // Group tones by metal
            const tonesByMetal = new Map<number, number[]>();
            if (prev.metal_ids.length > 0 && prev.metal_tone_ids.length > 0) {
                prev.metal_tone_ids.forEach((toneId) => {
                    const tone = metalTones.find((t) => t.id === toneId);
                    if (tone && prev.metal_ids.includes(tone.metal_id)) {
                        if (!tonesByMetal.has(tone.metal_id)) {
                            tonesByMetal.set(tone.metal_id, []);
                        }
                        tonesByMetal.get(tone.metal_id)!.push(toneId);
                    }
                });
            }

            // For each metal, generate its metal entry combinations based on mode
            // Each combination represents possible metal entries for that metal
            // Then we'll take the Cartesian product across all metals
            type MetalEntryCombination = {
                metal_id: number;
                metal_purity_id: number | null;
                metal_tone_id: number | null;
            };
            
            /**
             * Generate metal combinations for a single metal based on mixing mode
             * This follows the same pattern as diamond mixing logic
             */
            const generateMetalCombinationsForMetal = (
                metalId: number,
                purities: number[],
                tones: number[],
                mode: 'normal' | 'mix_tones' | 'mix_purities'
            ): MetalEntryCombination[][] => {
                const combinations: MetalEntryCombination[][] = [];
                
                // If no purities and no tones, return single metal entry
                if (purities.length === 0 && tones.length === 0) {
                    return [[{
                        metal_id: metalId,
                        metal_purity_id: null,
                        metal_tone_id: null,
                    }]];
                }
                
                // If no tones, create one entry per purity
                if (tones.length === 0 && purities.length > 0) {
                    return purities.map(purityId => [{
                        metal_id: metalId,
                        metal_purity_id: purityId,
                        metal_tone_id: null,
                    }]);
                }
                
                // If no purities, create one entry per tone
                if (purities.length === 0 && tones.length > 0) {
                    return tones.map(toneId => [{
                        metal_id: metalId,
                        metal_purity_id: null,
                        metal_tone_id: toneId,
                    }]);
                }
                
                // Both purities and tones exist - apply mixing mode
                if (mode === 'normal') {
                    // MODE 1: Separate variants - Cartesian product of purities × tones
                    // Example: [18K, 14K] × [Yellow, White] = 4 variants
                    purities.forEach(purityId => {
                        tones.forEach(toneId => {
                            combinations.push([{
                                metal_id: metalId,
                                metal_purity_id: purityId,
                                metal_tone_id: toneId,
                            }]);
                        });
                    });
                } else if (mode === 'mix_tones') {
                    // MODE 2: Combine tones per purity
                    // For each purity, combine all tones into ONE variant
                    // Example: [18K, 14K] with [Yellow, White] = 2 variants:
                    //   - 18K (Yellow + White)
                    //   - 14K (Yellow + White)
                    purities.forEach(purityId => {
                        combinations.push(
                            tones.map(toneId => ({
                                metal_id: metalId,
                                metal_purity_id: purityId,
                                metal_tone_id: toneId,
                            }))
                        );
                    });
                } else if (mode === 'mix_purities') {
                    // MODE 3: Combine purities per tone
                    // For each tone, combine all purities into ONE variant
                    // Example: [18K, 14K] with [Yellow, White] = 2 variants:
                    //   - Yellow (18K + 14K)
                    //   - White (18K + 14K)
                    tones.forEach(toneId => {
                        combinations.push(
                            purities.map(purityId => ({
                                metal_id: metalId,
                                metal_purity_id: purityId,
                                metal_tone_id: toneId,
                            }))
                        );
                    });
                }
                
                return combinations;
            };
            
            const metalCombinationsByMetal = new Map<number, MetalEntryCombination[][]>();
            
                prev.metal_ids.forEach((metalId) => {
                    const purities = puritiesByMetal.get(metalId) || [];
                const tones = tonesByMetal.get(metalId) || [];
                
                // Get per-metal mixing mode (default to 'normal' if not set)
                // Try multiple lookup strategies to ensure we find the saved value
                let metalMode: 'normal' | 'mix_tones' | 'mix_purities' = 'normal';
                if (prev.metal_mix_mode) {
                    // Try direct numeric key lookup
                    metalMode = prev.metal_mix_mode[metalId] || metalMode;
                    // If not found, try string key lookup
                    if (metalMode === 'normal' && prev.metal_mix_mode[String(metalId) as unknown as number]) {
                        metalMode = prev.metal_mix_mode[String(metalId) as unknown as number] || metalMode;
                    }
                    // If still not found, iterate through all keys
                    if (metalMode === 'normal') {
                        Object.keys(prev.metal_mix_mode).forEach((key) => {
                            const keyNum = Number(key);
                            if (keyNum === metalId) {
                                const value = prev.metal_mix_mode[keyNum];
                                if (value === 'normal' || value === 'mix_tones' || value === 'mix_purities') {
                                    metalMode = value;
                                }
                            }
                        });
                    }
                }
                
                // Generate combinations for this metal
                const combinations = generateMetalCombinationsForMetal(
                    metalId,
                    purities,
                    tones,
                    metalMode
                );
                
                metalCombinationsByMetal.set(metalId, combinations);
            });
            
            // Now take the Cartesian product of all metals' combinations
            // This gives us all possible multi-metal variant combinations
            const allMetalCombinations: MetalEntryCombination[][] = [];
            
            if (prev.metal_ids.length > 0) {
                // Helper function to compute Cartesian product
                const cartesianProduct = <T,>(arrays: T[][]): T[][] => {
                    if (arrays.length === 0) return [[]];
                    if (arrays.length === 1) return arrays[0].map(item => [item]);
                    
                    const [first, ...rest] = arrays;
                    const restProduct = cartesianProduct(rest);
                    const result: T[][] = [];
                    
                    for (const item of first) {
                        for (const restCombo of restProduct) {
                            result.push([item, ...restCombo]);
                        }
                    }
                    
                    return result;
                };
                
                // Get all metal combination arrays
                const metalComboArrays = prev.metal_ids.map(metalId => 
                    metalCombinationsByMetal.get(metalId) || []
                );
                
                // Compute Cartesian product
                const product = cartesianProduct(metalComboArrays);
                
                // Flatten each product result into a single array of metal entries
                allMetalCombinations.push(...product.map(combo => 
                    combo.flat()
                ));
            }

            // Build diamond combinations from diamond_options
            // In 'shared' mode: diamonds don't multiply variants, they're attached to all variants
            // In 'as_variant' mode: diamonds multiply variants (Cartesian product)
            const diamondCombinations: Array<{
                key: string;
                type_id: number | null;
                clarity_id: number | null;
                color_id: number | null;
                shape_id: number | null;
                cut_id: number | null;
            }> = [];
            
            if (prev.uses_diamond && prev.diamond_options.length > 0) {
                // Build diamond combinations from diamond_options
                prev.diamond_options.forEach((option) => {
                    diamondCombinations.push({
                        key: option.key,
                        type_id: option.type_id !== '' ? Number(option.type_id) : null,
                        clarity_id: option.clarity_id !== '' ? Number(option.clarity_id) : null,
                        color_id: option.color_id !== '' ? Number(option.color_id) : null,
                        shape_id: option.shape_id !== '' ? Number(option.shape_id) : null,
                        cut_id: option.cut_id !== '' ? Number(option.cut_id) : null,
                    });
                });
            } else {
                // No diamonds, use null placeholder
                diamondCombinations.push({
                    key: '',
                    type_id: null,
                    clarity_id: null,
                    color_id: null,
                    shape_id: null,
                    cut_id: null,
                });
            }
            
            const sizeOptions =
                prev.size_dimension_enabled && prev.size_values.length > 0 ? prev.size_values : [null];

            // Check if we have at least one option to generate variants
            const hasSizes = prev.size_dimension_enabled && sizeOptions.length > 0 && sizeOptions[0] !== null;
            const hasDiamonds = prev.uses_diamond && diamondCombinations.length > 0 && diamondCombinations[0].key !== '';
            const mixingMode = prev.diamond_mixing_mode || 'shared';
            
            // In 'shared' mode, diamonds don't count as a dimension for variant generation
            // In 'as_variant' mode, diamonds multiply variants
            const hasDiamondsAsDimension = hasDiamonds && mixingMode === 'as_variant';
            
            if (allMetalCombinations.length === 0 && !hasSizes && !hasDiamondsAsDimension) {
                return prev;
            }

            const combinations: Array<{
                metals: MetalEntryCombination[];
                diamond: {
                    key: string;
                    type_id: number | null;
                    clarity_id: number | null;
                    color_id: number | null;
                    shape_id: number | null;
                    cut_id: number | null;
                };
                size: string | null;
            }> = [];

            // Generate base combinations: metals × sizes
            // Then, depending on mode:
            // - 'shared': attach all diamonds to each base variant (no multiplication)
            // - 'as_variant': multiply base variants by diamonds (Cartesian product)
            
            // First, generate base combinations (metals × sizes)
            const baseCombinations: Array<{
                metals: MetalEntryCombination[];
                size: string | null;
            }> = [];
            
            if (allMetalCombinations.length > 0) {
                allMetalCombinations.forEach((metalEntries) => {
                    sizeOptions.forEach((sizeOption) => {
                        baseCombinations.push({
                            metals: metalEntries,
                            size: sizeOption ?? null,
                        });
                    });
                });
            } else if (hasSizes) {
                sizeOptions.forEach((sizeOption) => {
                    baseCombinations.push({
                        metals: [],
                        size: sizeOption ?? null,
                    });
                });
            } else {
                // No metals, no sizes - create one base variant
                baseCombinations.push({
                    metals: [],
                    size: null,
                });
            }
            
            // Now, apply diamond logic based on mode
            if (mixingMode === 'shared') {
                // 'shared' mode: All base variants get the same diamond list (no multiplication)
                // Use the first diamond combination (or null if no diamonds)
                const sharedDiamond = hasDiamonds ? diamondCombinations[0] : {
                    key: '',
                    type_id: null,
                    clarity_id: null,
                    color_id: null,
                    shape_id: null,
                    cut_id: null,
                };
                
                baseCombinations.forEach((baseCombo) => {
                        combinations.push({
                        metals: baseCombo.metals,
                        diamond: sharedDiamond,
                        size: baseCombo.size,
                        });
                    });
            } else {
                // 'as_variant' mode: Multiply base variants by diamonds (Cartesian product)
                baseCombinations.forEach((baseCombo) => {
                    if (hasDiamonds) {
                        diamondCombinations.forEach((diamondCombo) => {
                            combinations.push({
                                metals: baseCombo.metals,
                                diamond: diamondCombo,
                                size: baseCombo.size,
                            });
                        });
                    } else {
                        // No diamonds, just use base combination
                        combinations.push({
                            metals: baseCombo.metals,
                            diamond: {
                                key: '',
                                type_id: null,
                                clarity_id: null,
                                color_id: null,
                                shape_id: null,
                                cut_id: null,
                            },
                            size: baseCombo.size,
                        });
                    }
                });
            }

            if (combinations.length === 0) {
                return prev;
            }

            // Create a map to preserve existing metal weights and diamond counts
            // Key: variant identifier based on metals + size + diamond
            const existingVariantData = new Map<string, {
                metals: Array<{ metal_id: number; metal_purity_id: number | null; metal_tone_id: number | null; metal_weight: string; weight_grams: string }>;
                diamonds: Array<{ diamond_type_id: number | null; diamond_shape_id: number | null; diamond_color_id: number | null; diamond_clarity_id: number | null; diamond_cut_id: number | null; diamonds_count: string; total_carat: string }>;
            }>();

            // Build lookup map from existing variants
            prev.variants.forEach((existingVariant) => {
                if (!existingVariant.metals || existingVariant.metals.length === 0) return;
                
                // Create a key based on metal combination + size + diamond
                const sizeKey = existingVariant.size_cm || 'no-size';
                const diamondKey = existingVariant.diamond_option_key || 'no-diamond';
                const metalsKey = existingVariant.metals
                    .filter(m => m.metal_id !== '' && typeof m.metal_id === 'number')
                    .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                    .sort()
                    .join('|');
                
                const variantKey = `${metalsKey}::${sizeKey}::${diamondKey}`;
                
                existingVariantData.set(variantKey, {
                    metals: existingVariant.metals.map(m => ({
                        metal_id: typeof m.metal_id === 'number' ? m.metal_id : 0,
                        metal_purity_id: m.metal_purity_id !== '' && m.metal_purity_id !== null ? (typeof m.metal_purity_id === 'number' ? m.metal_purity_id : Number(m.metal_purity_id)) : null,
                        metal_tone_id: m.metal_tone_id !== '' && m.metal_tone_id !== null ? (typeof m.metal_tone_id === 'number' ? m.metal_tone_id : Number(m.metal_tone_id)) : null,
                        metal_weight: m.metal_weight || m.weight_grams || '',
                        weight_grams: m.weight_grams || m.metal_weight || '',
                    })),
                    diamonds: (existingVariant.diamonds || []).map(d => ({
                        diamond_type_id: d.diamond_type_id !== '' && d.diamond_type_id !== null ? (typeof d.diamond_type_id === 'number' ? d.diamond_type_id : Number(d.diamond_type_id)) : null,
                        diamond_shape_id: d.diamond_shape_id !== '' && d.diamond_shape_id !== null ? (typeof d.diamond_shape_id === 'number' ? d.diamond_shape_id : Number(d.diamond_shape_id)) : null,
                        diamond_color_id: d.diamond_color_id !== '' && d.diamond_color_id !== null ? (typeof d.diamond_color_id === 'number' ? d.diamond_color_id : Number(d.diamond_color_id)) : null,
                        diamond_clarity_id: d.diamond_clarity_id !== '' && d.diamond_clarity_id !== null ? (typeof d.diamond_clarity_id === 'number' ? d.diamond_clarity_id : Number(d.diamond_clarity_id)) : null,
                        diamond_cut_id: d.diamond_cut_id !== '' && d.diamond_cut_id !== null ? (typeof d.diamond_cut_id === 'number' ? d.diamond_cut_id : Number(d.diamond_cut_id)) : null,
                        diamonds_count: d.diamonds_count || '',
                        total_carat: d.total_carat || '',
                    })),
                });
            });

            const newVariants = combinations.map((combo, index) => {
                const variant = emptyVariant(index === 0);

                // Create lookup key for this combination
                const sizeKey = combo.size || 'no-size';
                const diamondKey = combo.diamond.key || 'no-diamond';
                const metalsKey = combo.metals
                    .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                    .sort()
                    .join('|');
                const variantKey = `${metalsKey}::${sizeKey}::${diamondKey}`;
                
                // Try to find existing data for this variant
                const existingData = existingVariantData.get(variantKey);

                // Build metals array from the combination, preserving weights if they exist
                variant.metals = combo.metals.map((metalEntry) => {
                    // Try to find matching existing metal entry
                    const existingMetal = existingData?.metals.find(
                        em => em.metal_id === metalEntry.metal_id &&
                        em.metal_purity_id === (metalEntry.metal_purity_id ?? null) &&
                        em.metal_tone_id === (metalEntry.metal_tone_id ?? null)
                    );
                    
                    return {
                        id: undefined,
                        metal_id: metalEntry.metal_id,
                        metal_purity_id: metalEntry.metal_purity_id ?? '',
                        metal_tone_id: metalEntry.metal_tone_id ?? '',
                        weight_grams: existingMetal?.weight_grams || '',
                        metal_weight: existingMetal?.metal_weight || '',
                    };
                });
                
                // Set metal_id and metal_purity_id on variant for backward compatibility (use first metal)
                if (combo.metals.length > 0) {
                    const firstMetal = combo.metals[0];
                    variant.metal_id = firstMetal.metal_id;
                    if (firstMetal.metal_purity_id !== null) {
                        variant.metal_purity_id = firstMetal.metal_purity_id;
                    }
                }

                // Set diamond_option_key and diamonds based on mode
                const diamondMixingMode = prev.diamond_mixing_mode || 'shared';
                
                if (diamondMixingMode === 'shared') {
                    // In 'shared' mode, all variants reference the same diamond list
                    // Store all diamonds from diamond_options in the variant
                    if (prev.uses_diamond && prev.diamond_options.length > 0) {
                        variant.diamonds = prev.diamond_options.map((option) => {
                            // Try to find matching existing diamond entry
                            const existingDiamond = existingData?.diamonds.find(
                                ed => ed.diamond_type_id === (option.type_id !== '' ? option.type_id : null) &&
                                ed.diamond_shape_id === (option.shape_id !== '' ? option.shape_id : null) &&
                                ed.diamond_color_id === (option.color_id !== '' ? option.color_id : null) &&
                                ed.diamond_clarity_id === (option.clarity_id !== '' ? option.clarity_id : null) &&
                                ed.diamond_cut_id === (option.cut_id !== '' ? option.cut_id : null)
                            );
                            
                            return {
                                id: undefined,
                                diamond_type_id: option.type_id !== '' ? option.type_id : '',
                                diamond_clarity_id: option.clarity_id !== '' ? option.clarity_id : '',
                                diamond_color_id: option.color_id !== '' ? option.color_id : '',
                                diamond_shape_id: option.shape_id !== '' ? option.shape_id : '',
                                diamond_cut_id: option.cut_id !== '' ? option.cut_id : '',
                                diamonds_count: existingDiamond?.diamonds_count || (option.diamonds_count !== '' && option.diamonds_count !== null && option.diamonds_count !== undefined ? option.diamonds_count : ''),
                                total_carat: existingDiamond?.total_carat || option.weight || '',
                            };
                        });
                        // Use first diamond option key for backward compatibility
                        variant.diamond_option_key = prev.diamond_options[0].key || null;
                    } else {
                        variant.diamond_option_key = null;
                        variant.diamonds = [];
                    }
                } else {
                    // 'as_variant' mode: Each variant has its specific diamond from the combination
                    const diamondOptionKey = combo.diamond.key || null;
                    variant.diamond_option_key = diamondOptionKey;
                    
                    // Build diamonds array from diamond combination
                    if (diamondOptionKey && (combo.diamond.type_id || combo.diamond.clarity_id || combo.diamond.color_id || combo.diamond.shape_id || combo.diamond.cut_id)) {
                        // Try to find matching existing diamond entry
                        const existingDiamond = existingData?.diamonds.find(
                            ed => ed.diamond_type_id === (combo.diamond.type_id ?? null) &&
                            ed.diamond_shape_id === (combo.diamond.shape_id ?? null) &&
                            ed.diamond_color_id === (combo.diamond.color_id ?? null) &&
                            ed.diamond_clarity_id === (combo.diamond.clarity_id ?? null) &&
                            ed.diamond_cut_id === (combo.diamond.cut_id ?? null)
                        );
                        
                        variant.diamonds = [{
                            id: undefined,
                            diamond_type_id: combo.diamond.type_id ?? '',
                            diamond_clarity_id: combo.diamond.clarity_id ?? '',
                            diamond_color_id: combo.diamond.color_id ?? '',
                            diamond_shape_id: combo.diamond.shape_id ?? '',
                            diamond_cut_id: combo.diamond.cut_id ?? '',
                            diamonds_count: existingDiamond?.diamonds_count || '',
                            total_carat: existingDiamond?.total_carat || '',
                        }];
                    } else {
                        variant.diamonds = [];
                    }
                }

                const metadata: Record<string, FormDataConvertible> = {
                    ...(variant.metadata ?? {}),
                    status: 'enabled',
                };

                if (combo.size) {
                    const centimeters = convertToCentimeters(combo.size, prev.size_unit);
                    variant.size_cm = centimeters;
                    metadata.size_value = combo.size;
                    metadata.size_unit = prev.size_unit;
                } else {
                    delete metadata.size_value;
                    delete metadata.size_unit;
                }
                
                // Store diamond option in metadata
                const variantDiamondMixingMode = prev.diamond_mixing_mode || 'shared';
                if (variant.diamond_option_key) {
                    metadata.diamond_option_key = variant.diamond_option_key;
                    if (variantDiamondMixingMode === 'as_variant') {
                        // In 'as_variant' mode, store the specific diamond for this variant
                        metadata.diamond = {
                            type_id: combo.diamond.type_id,
                            clarity_id: combo.diamond.clarity_id,
                            color_id: combo.diamond.color_id,
                            shape_id: combo.diamond.shape_id,
                            cut_id: combo.diamond.cut_id,
                        };
                    }
                    // In 'shared' mode, all variants share the same diamond list (stored in variant.diamonds)
                }

                variant.metadata = metadata;

                return variant;
            });

            const draft: FormData = {
                ...prev,
                variants: newVariants,
                // Preserve metal_mix_mode when regenerating variants
                metal_mix_mode: prev.metal_mix_mode || {},
            };

            draft.variants = recalculateVariants(draft);

            return draft;
    };

    const generateVariantMatrix = () => {
        setData((prev: FormData) => generateVariantMatrixForData(prev));
    };

    const addDiscountOverrideRow = () => {
        setData((prev: FormData) => ({
            ...prev,
            making_charge_discount_overrides: [...prev.making_charge_discount_overrides, createDiscountOverride()],
        }));
    };

    const updateDiscountOverrideRow = (index: number, changes: Partial<DiscountOverrideForm>) => {
        setData((prev: FormData) => ({
            ...prev,
            making_charge_discount_overrides: prev.making_charge_discount_overrides.map((override: DiscountOverrideForm, idx: number) =>
                idx === index ? { ...override, ...changes } : override,
            ),
        }));
    };

    const removeDiscountOverrideRow = (index: number) => {
        setData((prev: FormData) => ({
            ...prev,
            making_charge_discount_overrides: prev.making_charge_discount_overrides.filter((_, idx: number) => idx !== index),
        }));
    };

    // Diamonds are NOT part of automatic variant generation
    // No useEffect needed for diamond attributes

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        form.transform((current) => {
            const formState = current as FormData;
            const payload: any = { ...formState };
            payload.uses_diamond = formState.uses_diamond;
            // Always send diamond_mixing_mode to preserve the user's selection
            payload.diamond_mixing_mode = formState.diamond_mixing_mode || 'shared';

            payload.metal_ids = [...formState.metal_ids];
            payload.metal_purity_ids = [...formState.metal_purity_ids];
            payload.metal_tone_ids = [...formState.metal_tone_ids];
            // Always send metal_mix_mode to preserve user's selection
            // Backend will handle conversion of keys to integers
            // Convert numeric keys to strings for JSON serialization (Laravel expects string keys in JSON)
            const metalMixModePayload: Record<string, string> = {};
            if (formState.metal_mix_mode && typeof formState.metal_mix_mode === 'object') {
                Object.keys(formState.metal_mix_mode).forEach((key) => {
                    const numKey = Number(key);
                    const value = formState.metal_mix_mode[numKey];
                    if (!isNaN(numKey) && numKey > 0 && (value === 'normal' || value === 'mix_tones' || value === 'mix_purities')) {
                        metalMixModePayload[String(numKey)] = value;
                    }
                });
            }
            payload.metal_mix_mode = metalMixModePayload;
            // Diamond attribute IDs for automatic variant matrix generation
            payload.diamond_type_ids = formState.uses_diamond ? [...formState.diamond_type_ids] : [];
            payload.diamond_clarity_ids = formState.uses_diamond ? [...formState.diamond_clarity_ids] : [];
            payload.diamond_color_ids = formState.uses_diamond ? [...formState.diamond_color_ids] : [];
            payload.diamond_shape_ids = formState.uses_diamond ? [...formState.diamond_shape_ids] : [];
            payload.diamond_cut_ids = formState.uses_diamond ? [...formState.diamond_cut_ids] : [];
            
            // Diamond options are always saved (used in both modes)
            payload.diamond_options = formState.uses_diamond
                ? formState.diamond_options.map((option: DiamondOptionForm) => ({
                      key: option.key,
                      type_id: option.type_id !== '' ? Number(option.type_id) : null,
                      shape_id: option.shape_id !== '' ? Number(option.shape_id) : null,
                      color_id: option.color_id !== '' ? Number(option.color_id) : null,
                      clarity_id: option.clarity_id !== '' ? Number(option.clarity_id) : null,
                      cut_id: option.cut_id !== '' ? Number(option.cut_id) : null,
                      weight: option.weight ? Number(option.weight) : null,
                      diamonds_count: option.diamonds_count ? Number(option.diamonds_count) : null,
                  }))
                : [];

            const toNullableNumber = (value: string | number | null | undefined) => {
                if (value === null || value === undefined || value === '') {
                    return null;
                }

                return typeof value === 'number' ? value : Number(value);
            };

            payload.making_charge_discount_type = formState.making_charge_discount_type || null;
            payload.making_charge_discount_value = formState.making_charge_discount_type
                ? toNullableNumber(formState.making_charge_discount_value)
                : null;
            payload.making_charge_discount_overrides = formState.making_charge_discount_overrides
                .map((override: DiscountOverrideForm) => ({
                    customer_group_id:
                        override.customer_group_id !== '' ? Number(override.customer_group_id) : null,
                    type: override.type,
                    value: toNullableNumber(override.value),
                }))
                .filter((override) => override.customer_group_id !== null && override.value !== null);

            payload.variants = formState.is_variant_product
                ? formState.variants.map((variant: VariantForm) => {
                      const meta = buildVariantMeta(variant, formState);

                      // Build metals array - prioritize variant.metals if present, otherwise use metal_id/metal_purity_id
                      const metalsArray = (variant.metals || []).length > 0
                          ? (variant.metals || []).map((metal: VariantMetalForm) => ({
                                id: metal.id,
                                metal_id: metal.metal_id !== '' && metal.metal_id !== null ? Number(metal.metal_id) : null,
                                metal_purity_id: metal.metal_purity_id !== '' && metal.metal_purity_id !== null ? Number(metal.metal_purity_id) : null,
                                metal_tone_id: metal.metal_tone_id !== '' && metal.metal_tone_id !== null ? Number(metal.metal_tone_id) : null,
                                weight_grams: metal.weight_grams !== '' && metal.weight_grams !== null ? metal.weight_grams : null,
                                metal_weight: metal.metal_weight !== '' && metal.metal_weight !== null ? metal.metal_weight : (metal.weight_grams !== '' && metal.weight_grams !== null ? metal.weight_grams : null),
                                metadata: {},
                            })).filter((m) => m.metal_id !== null && m.metal_id > 0)
                          : [];

                      // Build diamonds array
                      const diamondsArray = (variant.diamonds || []).map((diamond: VariantDiamondForm) => ({
                          id: diamond.id,
                          diamond_type_id: diamond.diamond_type_id !== '' && diamond.diamond_type_id !== null ? Number(diamond.diamond_type_id) : null,
                          diamond_shape_id: diamond.diamond_shape_id !== '' && diamond.diamond_shape_id !== null ? Number(diamond.diamond_shape_id) : null,
                          diamond_color_id: diamond.diamond_color_id !== '' && diamond.diamond_color_id !== null ? Number(diamond.diamond_color_id) : null,
                          diamond_clarity_id: diamond.diamond_clarity_id !== '' && diamond.diamond_clarity_id !== null ? Number(diamond.diamond_clarity_id) : null,
                          diamond_cut_id: diamond.diamond_cut_id !== '' && diamond.diamond_cut_id !== null ? Number(diamond.diamond_cut_id) : null,
                          diamonds_count: diamond.diamonds_count !== '' && diamond.diamonds_count !== null ? Number(diamond.diamonds_count) : null,
                          total_carat: diamond.total_carat !== '' && diamond.total_carat !== null ? diamond.total_carat : null,
                          metadata: {},
                      })).filter((d) => 
                          d.diamond_type_id !== null || 
                          d.diamond_shape_id !== null || 
                          d.diamond_color_id !== null || 
                          d.diamond_clarity_id !== null || 
                          d.diamond_cut_id !== null
                      );

                      return {
                          id: variant.id,
                          sku: variant.sku,
                          label: variant.label || meta.autoLabel,
                          // Only include metal_id/metal_purity_id if metals array is empty (for backward compatibility with matrix generation)
                          metal_id: metalsArray.length === 0 && variant.metal_id !== '' && variant.metal_id !== null && variant.metal_id > 0 
                              ? Number(variant.metal_id) 
                              : null,
                          metal_purity_id: metalsArray.length === 0 && variant.metal_purity_id !== '' && variant.metal_purity_id !== null && variant.metal_purity_id > 0
                              ? Number(variant.metal_purity_id)
                              : null,
                          metal_tone: meta.metalTone || null,
                          stone_quality: meta.stoneQuality || null,
                          size: meta.sizeText || null,
                          price_adjustment: variant.price_adjustment,
                          inventory_quantity: variant.inventory_quantity !== undefined && variant.inventory_quantity !== null && variant.inventory_quantity !== ''
                              ? (typeof variant.inventory_quantity === 'number' ? variant.inventory_quantity : Number(variant.inventory_quantity))
                              : 0,
                          is_default: variant.is_default,
                          metadata: meta.metadata,
                          // Send metals and diamonds arrays
                          metals: metalsArray,
                          diamonds: diamondsArray,
                      };
                  })
                : [];

            const sizeMetadataValues = formState.size_values
                .map((value) => parseFloat(value))
                .filter((value) => Number.isFinite(value) && value > 0);

            if (formState.size_dimension_enabled && sizeMetadataValues.length > 0) {
                payload.metadata = {
                    size_dimension: {
                        unit: formState.size_unit,
                        values: sizeMetadataValues,
                    },
                };
            } else {
                payload.metadata = null;
            }

            if (!payload.metadata) {
                delete payload.metadata;
            }

            delete payload.size_dimension_enabled;
            delete payload.size_unit;
            delete payload.size_values;

            if (!formState.is_variant_product) {
                payload.uses_diamond = false;
                payload.metal_ids = [];
                payload.metal_purity_ids = [];
                payload.metal_tone_ids = [];
                payload.uses_diamond = false;
                // Reset diamond attribute IDs when variant product is disabled
                payload.diamond_type_ids = [];
                payload.diamond_clarity_ids = [];
                payload.diamond_color_ids = [];
                payload.diamond_shape_ids = [];
                payload.diamond_cut_ids = [];
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
                            <div className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Assign catalogues</span>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(productCatalogs).map(([id, name]) => {
                                        const value = String(id);
                                        const selected = data.product_catalog_ids.includes(value);

                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => {
                                                    if (selected) {
                                                        setData(
                                                            'product_catalog_ids',
                                                            data.product_catalog_ids.filter((catalogId) => catalogId !== value),
                                                        );
                                                    } else {
                                                        setData('product_catalog_ids', [...data.product_catalog_ids, value]);
                                                    }
                                                }}
                                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                                                    selected
                                                        ? 'bg-sky-600 text-white shadow-sky-600/30'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-600'
                                                }`}
                                            >
                                                {name}
                                                {selected && <span className="text-[10px] uppercase tracking-[0.3em]">×</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                                <span className="text-[11px] text-slate-400">
                                    Link the product to one or more catalogues for customer-facing navigation.
                                </span>
                                {errors.product_catalog_ids && (
                                    <span className="text-xs text-rose-500">{errors.product_catalog_ids}</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
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
                    <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Product description</h2>
                            <p className="text-sm text-slate-500">
                                Provide merchandising copy, craftsmanship details, and any atelier notes for this SKU.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <RichTextEditor
                            value={data.description}
                            onChange={(value) => setData('description', value)}
                            className="overflow-hidden rounded-3xl border border-slate-200"
                            placeholder="Detail the design notes, materials, finish, and atelier craftsmanship."
                        />
                        {errors.description && <span className="mt-2 block text-xs text-rose-500">{errors.description}</span>}
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
                            Variants are disabled. Customers will see the making charge defined above.
                        </p>
                    ) : (
                        <div className="mt-6 space-y-6">
                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Size dimension</h3>
                                        <p className="text-xs text-slate-500">
                                            Maintain consistent size data across variants. Add numeric values and choose the preferred unit.
                                        </p>
                                    </div>
                                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={data.size_dimension_enabled}
                                            onChange={(event) => toggleSizeDimension(event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        Use size dimension
                                    </label>
                                </div>
                                {data.size_dimension_enabled && (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                            <span>Unit</span>
                                            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                                                <input
                                                    type="radio"
                                                    name="size-unit"
                                                    value="mm"
                                                    checked={data.size_unit === 'mm'}
                                                    onChange={() => changeSizeUnit('mm')}
                                                    className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                                                />
                                                Millimetres (mm)
                                            </label>
                                            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                                                <input
                                                    type="radio"
                                                    name="size-unit"
                                                    value="cm"
                                                    checked={data.size_unit === 'cm'}
                                                    onChange={() => changeSizeUnit('cm')}
                                                    className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                                                />
                                                Centimetres (cm)
                                            </label>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="0.001"
                                                    min="0"
                                                    value={sizeValueInput}
                                                    onChange={(event) => setSizeValueInput(event.target.value)}
                                                    className="w-24 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    placeholder={`e.g. 25${data.size_unit}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addSizeValue}
                                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                                >
                                                    Add size
                                                </button>
                                            </div>
                                            {data.size_values.length === 0 && (
                                                <span className="text-xs text-slate-400">
                                                    Add at least one size value to use in the variant matrix.
                                                </span>
                                            )}
                                        </div>
                                        {data.size_values.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {data.size_values.map((value) => (
                                                    <span
                                                        key={`${value}-${data.size_unit}`}
                                                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                                                    >
                                                        {value}
                                                        {data.size_unit}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSizeValue(value)}
                                                            className="text-rose-500 transition hover:text-rose-600"
                                                            aria-label={`Remove size ${value}${data.size_unit}`}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div>
                                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Metals</h3>
                                    <p className="text-xs text-slate-500">Select metals that can be used in your product variants.</p>
                                </div>
                                {metals.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {metals.map((metal) => {
                                            const checked = data.metal_ids.includes(metal.id);
                                            return (
                                                <label
                                                    key={metal.id}
                                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                                        checked
                                                            ? 'border-sky-400 bg-white text-sky-700'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleMetalSelection(metal.id)}
                                                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                    />
                                                    {metal.name}
                                                </label>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">No metals available yet.</p>
                                )}
                            </div>

                            {data.metal_ids.length > 0 && (
                                <>
                                    {/* Per-metal configuration cards */}
                                    <div className="space-y-4">
                                                {metals
                                                    .filter((metal) => data.metal_ids.includes(metal.id))
                                                    .map((metal) => {
                                                        const metalPurities = availablePurities.filter((p) => p.metal_id === metal.id);
                                                const metalTonesList = availableTones.filter((t) => t.metal_id === metal.id);
                                                const selectedPurities = metalPurities.filter((p) => data.metal_purity_ids.includes(p.id));
                                                const selectedTones = metalTonesList.filter((t) => data.metal_tone_ids.includes(t.id));
                                                const hasPurities = selectedPurities.length > 0;
                                                const hasTones = selectedTones.length > 0;
                                                // Get current mode for this metal (ensure metal.id is a number for lookup)
                                                // This follows the same pattern as diamond_mixing_mode lookup
                                                const metalId = typeof metal.id === 'number' ? metal.id : Number(metal.id);
                                                
                                                // Lookup the saved mode - keys should be numbers after normalization
                                                // Direct numeric lookup should work after normalization
                                                const savedMode = data.metal_mix_mode?.[metalId];
                                                
                                                // Validate and use saved mode, or default to 'normal' for new products
                                                const currentMode: 'normal' | 'mix_tones' | 'mix_purities' = 
                                                    (savedMode && (savedMode === 'normal' || savedMode === 'mix_tones' || savedMode === 'mix_purities'))
                                                        ? savedMode
                                                        : 'normal';
                                                
                                                // Calculate variant count for this metal
                                                const calculateMetalVariantCount = (): number => {
                                                    if (!hasPurities && !hasTones) return 0;
                                                    
                                                    if (currentMode === 'mix_tones' && hasPurities && hasTones) {
                                                        return selectedPurities.length;
                                                    } else if (currentMode === 'mix_purities' && hasPurities && hasTones) {
                                                        return selectedTones.length;
                                                    } else if (hasPurities && hasTones) {
                                                        return selectedPurities.length * selectedTones.length;
                                                    } else if (hasPurities) {
                                                        return selectedPurities.length;
                                                    } else if (hasTones) {
                                                        return selectedTones.length;
                                                    }
                                                    return 0;
                                                };
                                                
                                                const metalVariantCount = calculateMetalVariantCount();
                                                
                                                // Generate live summary text
                                                const getMixingSummary = (): string => {
                                                    if (!hasPurities && !hasTones) return '';
                                                    
                                                    const purityNames = selectedPurities.map(p => p.name).sort().join(', ');
                                                    const toneNames = selectedTones.map(t => t.name).sort().join(', ');
                                                    
                                                    if (currentMode === 'normal') {
                                                        if (hasPurities && hasTones) {
                                                            const combinations: string[] = [];
                                                            selectedPurities.forEach(p => {
                                                                selectedTones.forEach(t => {
                                                                    combinations.push(`${p.name} ${t.name}`);
                                                                });
                                                            });
                                                            return `Will create separate variants for each combination: ${combinations.join(', ')}.`;
                                                        } else if (hasPurities) {
                                                            return `Will create separate variants for: ${purityNames}.`;
                                                        } else if (hasTones) {
                                                            return `Will create separate variants for: ${toneNames}.`;
                                                        }
                                                    } else if (currentMode === 'mix_tones' && hasPurities && hasTones) {
                                                        return `Will create one variant per purity: ${selectedPurities.map(p => 
                                                            `${p.name} (${toneNames})`
                                                        ).join(', ')}.`;
                                                    } else if (currentMode === 'mix_purities' && hasPurities && hasTones) {
                                                        return `Will create one variant per tone: ${selectedTones.map(t => 
                                                            `${t.name} (${purityNames})`
                                                        ).join(', ')}.`;
                                                    }
                                                    
                                                    return '';
                                                };
                                                
                                                const mixingSummary = getMixingSummary();

                                                        return (
                                                    <div key={metal.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                                                            <h3 className="text-base font-semibold text-slate-900">Metal: {metal.name}</h3>
                                                            {metalVariantCount > 0 && (
                                                                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                                                                    {metalVariantCount} variant{metalVariantCount !== 1 ? 's' : ''} for this metal
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="space-y-4">
                                                            {/* Purities selection */}
                                                            <div>
                                                                <label className="mb-2 block text-xs font-semibold text-slate-600">
                                                                    Purities for this metal
                                                                </label>
                                                                {metalPurities.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {metalPurities.map((purity) => {
                                                                        const checked = data.metal_purity_ids.includes(purity.id);
                                                                        return (
                                                                            <label
                                                                                key={purity.id}
                                                                                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                                                                    checked
                                                                                            ? 'border-sky-400 bg-sky-50 text-sky-700 shadow-sm'
                                                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                                                }`}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={checked}
                                                                                    onChange={() => toggleMetalPuritySelection(purity.id)}
                                                                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                                />
                                                                                    {purity.name}
                                                                            </label>
                                                        );
                                                    })}
                                            </div>
                                        ) : (
                                                                    <p className="text-xs text-slate-400">No purities available for {metal.name}.</p>
                                        )}
                                                                <p className="mt-2 text-xs text-slate-500">
                                                                    Choose all purities in which this design is available for {metal.name}.
                                                                </p>
                                    </div>

                                                            {/* Tones selection */}
                                        <div>
                                                                <label className="mb-2 block text-xs font-semibold text-slate-600">
                                                                    Tones for this metal
                                                                </label>
                                                                {metalTonesList.length > 0 ? (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {metalTonesList.map((tone) => {
                                                                        const checked = data.metal_tone_ids.includes(tone.id);
                                                                        return (
                                                                            <label
                                                                                key={tone.id}
                                                                                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                                                                    checked
                                                                                            ? 'border-sky-400 bg-sky-50 text-sky-700 shadow-sm'
                                                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                                                                }`}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={checked}
                                                                                    onChange={() => toggleMetalToneSelection(tone.id)}
                                                                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                                />
                                                                                {tone.name}
                                                                            </label>
                                                                        );
                                                                    })}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-xs text-slate-400">No tones available for {metal.name}.</p>
                                                                )}
                                                                <p className="mt-2 text-xs text-slate-500">
                                                                    Choose all tones in which this design is available for {metal.name}.
                                                                </p>
                                                            </div>
                                                            
                                                            {/* Mixing behavior selection - only show if both purities and tones are selected */}
                                                            {hasPurities && hasTones && (
                                                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                                                    <label className="mb-3 block text-xs font-semibold text-slate-700">
                                                                        Mixing behavior
                                                                    </label>
                                                                    <div className="space-y-3">
                                                                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-sky-300 hover:bg-sky-50/50">
                                                                            <input
                                                                                type="radio"
                                                                                name={`metal-mix-mode-${metal.id}`}
                                                                                value="normal"
                                                                                checked={currentMode === 'normal'}
                                                                                onChange={() => {
                                                                                    setData((prev: FormData) => {
                                                                                        const metalId = typeof metal.id === 'number' ? metal.id : Number(metal.id);
                                                                                        const draft: FormData = {
                                                                                            ...prev,
                                                                                            metal_mix_mode: {
                                                                                                ...prev.metal_mix_mode,
                                                                                                [metalId]: 'normal' as const,
                                                                                            },
                                                                                        };
                                                                                        // Regenerate variant matrix when mixing mode changes
                                                                                        // Use generateVariantMatrix logic inline to regenerate variants
                                                                                        return generateVariantMatrixForData(draft);
                                                                                    });
                                                                                }}
                                                                                className="mt-0.5 h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                            />
                                                                            <div className="flex-1">
                                                                                <div className="font-semibold text-slate-900">Separate variants</div>
                                                                                <div className="mt-1 text-xs text-slate-600">
                                                                                    Create one variant for each purity × tone combination for this metal.
                                                                                </div>
                                                                            </div>
                                                                        </label>
                                                                        
                                                                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-sky-300 hover:bg-sky-50/50">
                                                                            <input
                                                                                type="radio"
                                                                                name={`metal-mix-mode-${metal.id}`}
                                                                                value="mix_tones"
                                                                                checked={currentMode === 'mix_tones'}
                                                                                onChange={() => {
                                                                                    setData((prev: FormData) => {
                                                                                        const metalId = typeof metal.id === 'number' ? metal.id : Number(metal.id);
                                                                                        const draft: FormData = {
                                                                                            ...prev,
                                                                                            metal_mix_mode: {
                                                                                                ...prev.metal_mix_mode,
                                                                                                [metalId]: 'mix_tones' as const,
                                                                                            },
                                                                                        };
                                                                                        // Regenerate variant matrix when mixing mode changes
                                                                                        return generateVariantMatrixForData(draft);
                                                                                    });
                                                                                }}
                                                                                className="mt-0.5 h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                            />
                                                                            <div className="flex-1">
                                                                                <div className="font-semibold text-slate-900">Combine tones per purity</div>
                                                                                <div className="mt-1 text-xs text-slate-600">
                                                                                    For each purity, combine all selected tones into a single variant. Example: 18K Yellow + White Gold in one variant.
                                                                                </div>
                                                                            </div>
                                                                        </label>
                                                                        
                                                                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-sky-300 hover:bg-sky-50/50">
                                                                            <input
                                                                                type="radio"
                                                                                name={`metal-mix-mode-${metal.id}`}
                                                                                value="mix_purities"
                                                                                checked={currentMode === 'mix_purities'}
                                                                                onChange={() => {
                                                                                    setData((prev: FormData) => {
                                                                                        const metalId = typeof metal.id === 'number' ? metal.id : Number(metal.id);
                                                                                        const draft: FormData = {
                                                                                            ...prev,
                                                                                            metal_mix_mode: {
                                                                                                ...prev.metal_mix_mode,
                                                                                                [metalId]: 'mix_purities' as const,
                                                                                            },
                                                                                        };
                                                                                        // Regenerate variant matrix when mixing mode changes
                                                                                        return generateVariantMatrixForData(draft);
                                                                                    });
                                                                                }}
                                                                                className="mt-0.5 h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                                                                            />
                                                                            <div className="flex-1">
                                                                                <div className="font-semibold text-slate-900">Combine purities per tone</div>
                                                                                <div className="mt-1 text-xs text-slate-600">
                                                                                    For each tone, combine all selected purities into a single variant. Example: 18K + 22K Yellow Gold in one variant.
                                                                                </div>
                                                                            </div>
                                                                        </label>
                                                                    </div>
                                                                    
                                                                    {/* Live summary */}
                                                                    {mixingSummary && (
                                                                        <div className="mt-4 rounded-lg bg-sky-50 border border-sky-200 p-3">
                                                                            <p className="text-xs font-medium text-sky-900">Preview:</p>
                                                                            <p className="mt-1 text-xs text-sky-700">{mixingSummary}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                    
                                    {/* Variant count preview */}
                                    {data.metal_ids.length > 0 && (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">Preview generated variants</p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        This setup will generate approximately <span className="font-semibold text-slate-900">{data.variants.length}</span> variant{data.variants.length !== 1 ? 's' : ''} based on your current configuration.
                                                    </p>
                                    </div>
                                                <button
                                                    type="button"
                                                    onClick={generateVariantMatrix}
                                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                                                >
                                                    Regenerate matrix
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Diamond mixes section */}
                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Diamond mixes</h3>
                                        <p className="text-xs text-slate-500">
                                            Define reusable diamond combinations that can be referenced by product variants.
                                        </p>
                                    </div>
                                    <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
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
                                        {/* Show diamond mixes section */}
                                        <>
                                        {data.diamond_options.map((option, index) => (
                                            <div key={option.key} className="rounded-2xl border border-slate-200 bg-white p-4">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h4 className="text-sm font-semibold text-slate-900">Configuration #{index + 1}</h4>
                                                    {data.diamond_options.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDiamondOptionRow(option.key)}
                                                            className="text-xs text-rose-500 transition hover:text-rose-700"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                        Type
                                                        <select
                                                            value={option.type_id === '' ? '' : option.type_id}
                                                            onChange={(e) => updateDiamondOption(option.key, 'type_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        >
                                                            <option value="">No type</option>
                                                            {diamondCatalog.types.map((type) => (
                                                                <option key={type.id} value={type.id}>
                                                                    {type.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    
                                                    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                        Shape
                                                        <select
                                                            value={option.shape_id === '' ? '' : option.shape_id}
                                                            onChange={(e) => updateDiamondOption(option.key, 'shape_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        >
                                                            <option value="">No shape</option>
                                                            {diamondCatalog.shapes.map((shape) => (
                                                                <option key={shape.id} value={shape.id}>
                                                                    {shape.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    
                                                    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                        Color
                                                        <select
                                                            value={option.color_id === '' ? '' : option.color_id}
                                                            onChange={(e) => updateDiamondOption(option.key, 'color_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        >
                                                            <option value="">No color</option>
                                                            {diamondCatalog.colors.map((color) => (
                                                                <option key={color.id} value={color.id}>
                                                                    {color.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    
                                                    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                        Clarity
                                                        <select
                                                            value={option.clarity_id === '' ? '' : option.clarity_id}
                                                            onChange={(e) => updateDiamondOption(option.key, 'clarity_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        >
                                                            <option value="">No clarity</option>
                                                            {diamondCatalog.clarities.map((clarity) => (
                                                                <option key={clarity.id} value={clarity.id}>
                                                                    {clarity.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    
                                                    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                        Cut
                                                        <select
                                                            value={option.cut_id === '' ? '' : option.cut_id}
                                                            onChange={(e) => updateDiamondOption(option.key, 'cut_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        >
                                                            <option value="">No cut</option>
                                                            {diamondCatalog.cuts.map((cut) => (
                                                                <option key={cut.id} value={cut.id}>
                                                                    {cut.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    
                                                    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                        Weight (Ct)
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={option.weight}
                                                            onChange={(e) => updateDiamondOption(option.key, 'weight', e.target.value)}
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                            placeholder="0.00"
                                                        />
                                                    </label>
                                                    
                                                    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                        Number of Diamonds
                                                        <input
                                                            type="number"
                                                            step="1"
                                                            min="0"
                                                            value={option.diamonds_count}
                                                            onChange={(e) => updateDiamondOption(option.key, 'diamonds_count', e.target.value)}
                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                            placeholder="0"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <button
                                            type="button"
                                            onClick={addDiamondOptionRow}
                                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-400 hover:bg-sky-50"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                            </svg>
                                            Add diamond option
                                        </button>
                                        </>
                                        
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {data.is_variant_product && (
                    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">Variant Matrix</h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Configure product variants with metals, diamonds, and specifications. The default variant powers the customer catalogue card pricing.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={generateVariantMatrix}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                Generate Matrix
                            </button>
                        </div>

                        {variantError && (
                            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-200/50">
                                {variantError}
                            </div>
                        )}

                        {/* Variant Table */}
                        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-500">
                                        <tr>
                                            <th className="px-5 py-3 text-left min-w-[150px]">SKU</th>
                                            <th className="px-5 py-3 text-left min-w-[300px]">Variant Label</th>
                                            <th className="px-5 py-3 text-left">Metal</th>
                                            <th className="px-5 py-3 text-left">Metal Purity</th>
                                            <th className="px-5 py-3 text-left">Metal Tone</th>
                                            <th className="px-5 py-3 text-left">Metal Weight (g)</th>
                                            <th className="px-5 py-3 text-left">Diamond Type</th>
                                            <th className="px-5 py-3 text-left">Diamond Clarity</th>
                                            <th className="px-5 py-3 text-left">Diamond Color</th>
                                            <th className="px-5 py-3 text-left">Diamond Shape</th>
                                            <th className="px-5 py-3 text-left">Diamond Cut</th>
                                            <th className="px-5 py-3 text-left">Diamond Weight</th>
                                            <th className="px-5 py-3 text-left">Size</th>
                                            <th className="px-5 py-3 text-left">Inventory Quantity</th>
                                            <th className="px-5 py-3 text-left">Status</th>
                                            <th className="px-5 py-3 text-left">Default</th>
                                            <th className="px-5 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                {data.variants.map((variant, index) => {
                                    // Use buildVariantMeta to get the correct metal label (handles mixed tones)
                                    const meta = buildVariantMeta(variant, data);
                                    const metalLabel = meta.metalTone || '—';
                                    
                                    // Extract metal details from variant.metals array for display
                                    const variantMetals = (variant.metals || []).filter(
                                        (m) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                                    );
                                    
                                    // Calculate total metal weight
                                    const totalMetalWeight = variantMetals.reduce((sum, metal) => {
                                        const weight = parseFloat(metal.metal_weight || metal.weight_grams || '0');
                                        return sum + (isNaN(weight) ? 0 : weight);
                                    }, 0);
                                    
                                    // Group metals by metal_id for display
                                    const metalsByMetalId = new Map<number, Array<{
                                        metal_id: number;
                                        metal_purity_id: number | string | null;
                                        metal_tone_id: number | string | null;
                                    }>>();
                                    
                                    variantMetals.forEach((metal) => {
                                        const metalId = metal.metal_id as number;
                                        if (!metalsByMetalId.has(metalId)) {
                                            metalsByMetalId.set(metalId, []);
                                        }
                                        metalsByMetalId.get(metalId)!.push({
                                            metal_id: metalId,
                                            metal_purity_id: metal.metal_purity_id !== '' && metal.metal_purity_id !== null ? (typeof metal.metal_purity_id === 'number' ? metal.metal_purity_id : Number(metal.metal_purity_id)) : null,
                                            metal_tone_id: metal.metal_tone_id !== '' && metal.metal_tone_id !== null ? (typeof metal.metal_tone_id === 'number' ? metal.metal_tone_id : Number(metal.metal_tone_id)) : null,
                                        });
                                    });
                                    
                                    // Build display strings for each column
                                    const metalNames: string[] = [];
                                    const purityNames: string[] = [];
                                    const toneNames: string[] = [];
                                    
                                    metalsByMetalId.forEach((metalsInGroup, metalId) => {
                                        const metalName = metalMap[metalId] || '';
                                        if (metalName) {
                                            metalNames.push(metalName);
                                        }
                                        
                                        // Collect unique purities for this metal
                                        const purities = new Set<number>();
                                        const tones = new Set<number>();
                                        
                                        metalsInGroup.forEach((m) => {
                                            if (m.metal_purity_id !== null) {
                                                const purityId = typeof m.metal_purity_id === 'number' ? m.metal_purity_id : Number(m.metal_purity_id);
                                                if (Number.isFinite(purityId)) {
                                                    purities.add(purityId);
                                                }
                                            }
                                            if (m.metal_tone_id !== null) {
                                                const toneId = typeof m.metal_tone_id === 'number' ? m.metal_tone_id : Number(m.metal_tone_id);
                                                if (Number.isFinite(toneId)) {
                                                    tones.add(toneId);
                                                }
                                            }
                                        });
                                        
                                        // Build purity display
                                        if (purities.size > 0) {
                                            const purityLabels = Array.from(purities)
                                                .map((purityId) => {
                                                    const purityIdNum = typeof purityId === 'number' ? purityId : Number(purityId);
                                                    return Number.isFinite(purityIdNum) ? (metalPurityMap[purityIdNum] || '') : '';
                                                })
                                                .filter(Boolean)
                                                .sort();
                                            
                                            if (purityLabels.length > 0) {
                                                if (purities.size > 1) {
                                                    purityNames.push(`${purityLabels.join(' + ')} (${metalName})`);
                                        } else {
                                                    purityNames.push(`${purityLabels[0]} (${metalName})`);
                                                }
                                            }
                                        }
                                        
                                        // Build tone display
                                        if (tones.size > 0) {
                                            const toneLabels = Array.from(tones)
                                                .map((toneId) => {
                                                    const toneIdNum = typeof toneId === 'number' ? toneId : Number(toneId);
                                                    return Number.isFinite(toneIdNum) ? (metalToneMap[toneIdNum] || '') : '';
                                                })
                                                .filter(Boolean)
                                                .sort();
                                            
                                            if (toneLabels.length > 0) {
                                                if (tones.size > 1) {
                                                    toneNames.push(`${toneLabels.join(' + ')} (${metalName})`);
                                                } else {
                                                    toneNames.push(`${toneLabels[0]} (${metalName})`);
                                                }
                                            }
                                        }
                                    });
                                    
                                    const metalDisplay = metalNames.length > 0 ? metalNames.join(', ') : '—';
                                    const purityDisplay = purityNames.length > 0 ? purityNames.join(' / ') : '—';
                                    const toneDisplay = toneNames.length > 0 ? toneNames.join(' / ') : '—';
                                    
                                    // Build diamond display from variant.diamonds array or diamond_option_key (backward compatibility)
                                    let variantDiamonds = (variant.diamonds || []).filter(
                                        (d) => 
                                            (d.diamond_type_id !== '' && d.diamond_type_id !== null) ||
                                            (d.diamond_clarity_id !== '' && d.diamond_clarity_id !== null) ||
                                            (d.diamond_color_id !== '' && d.diamond_color_id !== null) ||
                                            (d.diamond_shape_id !== '' && d.diamond_shape_id !== null) ||
                                            (d.diamond_cut_id !== '' && d.diamond_cut_id !== null)
                                    );
                                    
                                    // If no diamonds in array but diamond_option_key exists, try to get from diamond_options
                                    if (variantDiamonds.length === 0 && variant.diamond_option_key) {
                                        const diamondOption = data.diamond_options.find((opt) => opt.key === variant.diamond_option_key);
                                        if (diamondOption) {
                                            // Convert diamond option to diamond format for display
                                            variantDiamonds = [{
                                                id: undefined,
                                                diamond_type_id: diamondOption.type_id !== '' ? diamondOption.type_id : '',
                                                diamond_clarity_id: diamondOption.clarity_id !== '' ? diamondOption.clarity_id : '',
                                                diamond_color_id: diamondOption.color_id !== '' ? diamondOption.color_id : '',
                                                diamond_shape_id: diamondOption.shape_id !== '' ? diamondOption.shape_id : '',
                                                diamond_cut_id: diamondOption.cut_id !== '' ? diamondOption.cut_id : '',
                                                diamonds_count: '',
                                                total_carat: diamondOption.weight || '',
                                            }];
                                        }
                                    }
                                    
                                    // Extract individual diamond attributes for separate columns
                                    const diamondTypeDisplay: string[] = [];
                                    const diamondClarityDisplay: string[] = [];
                                    const diamondColorDisplay: string[] = [];
                                    const diamondShapeDisplay: string[] = [];
                                    const diamondCutDisplay: string[] = [];
                                    const diamondWeightDisplay: string[] = [];
                                    
                                    variantDiamonds.forEach((diamond) => {
                                        if (diamond.diamond_type_id !== '' && diamond.diamond_type_id !== null) {
                                            const typeName = diamondNameMaps.types[Number(diamond.diamond_type_id)];
                                            if (typeName && !diamondTypeDisplay.includes(typeName)) {
                                                diamondTypeDisplay.push(typeName);
                                            }
                                        }
                                        if (diamond.diamond_clarity_id !== '' && diamond.diamond_clarity_id !== null) {
                                            const clarityName = diamondNameMaps.clarities[Number(diamond.diamond_clarity_id)];
                                            if (clarityName && !diamondClarityDisplay.includes(clarityName)) {
                                                diamondClarityDisplay.push(clarityName);
                                            }
                                        }
                                        if (diamond.diamond_color_id !== '' && diamond.diamond_color_id !== null) {
                                            const colorName = diamondNameMaps.colors[Number(diamond.diamond_color_id)];
                                            if (colorName && !diamondColorDisplay.includes(colorName)) {
                                                diamondColorDisplay.push(colorName);
                                            }
                                        }
                                        if (diamond.diamond_shape_id !== '' && diamond.diamond_shape_id !== null) {
                                            const shapeName = diamondNameMaps.shapes[Number(diamond.diamond_shape_id)];
                                            if (shapeName && !diamondShapeDisplay.includes(shapeName)) {
                                                diamondShapeDisplay.push(shapeName);
                                            }
                                        }
                                        if (diamond.diamond_cut_id !== '' && diamond.diamond_cut_id !== null) {
                                            const cutName = diamondNameMaps.cuts[Number(diamond.diamond_cut_id)];
                                            if (cutName && !diamondCutDisplay.includes(cutName)) {
                                                diamondCutDisplay.push(cutName);
                                            }
                                        }
                                        if (diamond.total_carat && diamond.total_carat !== '') {
                                            const weightStr = `${diamond.total_carat}ct`;
                                            if (!diamondWeightDisplay.includes(weightStr)) {
                                                diamondWeightDisplay.push(weightStr);
                                            }
                                        }
                                    });
                                    
                                    const variantMetadata = (variant.metadata ?? {}) as Record<string, FormDataConvertible>;
                                    const metaSizeValue =
                                        typeof variantMetadata.size_value === 'string' || typeof variantMetadata.size_value === 'number'
                                            ? String(variantMetadata.size_value)
                                            : '';
                                    const metaSizeUnit =
                                        variantMetadata.size_unit === 'mm' || variantMetadata.size_unit === 'cm'
                                            ? (variantMetadata.size_unit as 'mm' | 'cm')
                                            : data.size_unit;
                                    const sizeDisplay = metaSizeValue
                                        ? `${metaSizeValue}${metaSizeUnit}`
                                        : variant.size_cm
                                        ? `${formatDecimal(parseFloat(variant.size_cm))}cm`
                                        : '—';
                                    const variantStatus =
                                        typeof variantMetadata.status === 'string' && variantMetadata.status.trim().length > 0
                                            ? String(variantMetadata.status)
                                            : 'enabled';
                                    const suggestedLabel = meta.autoLabel;

                                    return (
                                        <>
                                        <tr
                                            key={variant.id ?? `variant-${index}`}
                                            className={`hover:bg-slate-50 ${variantStatus === 'disabled' ? 'opacity-70' : ''} ${variant.is_default ? 'bg-sky-50/30' : ''}`}
                                        >
                                            <td className="px-5 py-3 align-middle min-w-[150px]">
                                                <input
                                                    type="text"
                                                    value={variant.sku}
                                                    onChange={(event) => updateVariant(index, 'sku', event.target.value)}
                                                    className="w-full min-w-[120px] rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    placeholder="Variant SKU"
                                                />
                                                {errors[`variants.${index}.sku`] && (
                                                    <p className="mt-1 text-xs text-rose-500">{errors[`variants.${index}.sku`]}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 align-middle min-w-[300px]">
                                                <input
                                                    type="text"
                                                    value={variant.label}
                                                    onChange={(event) => updateVariant(index, 'label', event.target.value)}
                                                    className="w-full min-w-[280px] rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    placeholder="Display label"
                                                />
                                                {errors[`variants.${index}.label`] && (
                                                    <p className="mt-1 text-xs text-rose-500">{errors[`variants.${index}.label`]}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="max-w-xs">
                                                    <span className="text-sm font-medium text-slate-800">{metalDisplay}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="max-w-xs">
                                                    <span className="text-sm text-slate-700">{purityDisplay}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="max-w-xs">
                                                    <span className="text-sm text-slate-700">{toneDisplay}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="space-y-2 min-w-[120px]">
                                                    {variantMetals.length > 0 ? (
                                                        variantMetals.map((metal, metalIndex) => {
                                                            const metalName = metalMap[metal.metal_id] || 'Unknown Metal';
                                                            const purityName = metal.metal_purity_id && typeof metal.metal_purity_id === 'number'
                                                                ? metalPurities.find(p => p.id === metal.metal_purity_id)?.name || ''
                                                                : '';
                                                            const toneName = metal.metal_tone_id && typeof metal.metal_tone_id === 'number'
                                                                ? metalTones.find(t => t.id === metal.metal_tone_id)?.name || ''
                                                                : '';
                                                            
                                                            return (
                                                                <div key={metalIndex} className="flex flex-col gap-1">
                                                                    <label className="text-xs font-medium text-slate-600">
                                                                        {metalName}{purityName && ` - ${purityName}`}{toneName && ` - ${toneName}`}
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.001"
                                                                        min="0.001"
                                                                        required
                                                                        value={metal.metal_weight || metal.weight_grams || ''}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            updateMetalInVariant(index, metalIndex, 'metal_weight', value);
                                                                            // Also update weight_grams for backward compatibility
                                                                            if (!metal.weight_grams || metal.weight_grams === '') {
                                                                                updateMetalInVariant(index, metalIndex, 'weight_grams', value);
                                                                            }
                                                                        }}
                                                                        className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                                                            (!metal.metal_weight && !metal.weight_grams) 
                                                                                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:bg-white' 
                                                                                : 'border-slate-200 bg-white focus:border-sky-400'
                                                                        } focus:outline-none focus:ring-1 focus:ring-sky-200`}
                                                                        placeholder="0.000"
                                                                    />
                                                                    {(!metal.metal_weight && !metal.weight_grams) && (
                                                                        <span className="text-[10px] text-rose-500">Required</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-sm text-slate-400">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="max-w-xs">
                                                    <span className="text-sm text-slate-700">{diamondTypeDisplay.length > 0 ? diamondTypeDisplay.join(', ') : '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="max-w-xs">
                                                    <span className="text-sm text-slate-700">{diamondClarityDisplay.length > 0 ? diamondClarityDisplay.join(', ') : '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="max-w-xs">
                                                    <span className="text-sm text-slate-700">{diamondColorDisplay.length > 0 ? diamondColorDisplay.join(', ') : '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="max-w-xs">
                                                    <span className="text-sm text-slate-700">{diamondShapeDisplay.length > 0 ? diamondShapeDisplay.join(', ') : '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="max-w-xs">
                                                    <span className="text-sm text-slate-700">{diamondCutDisplay.length > 0 ? diamondCutDisplay.join(', ') : '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="max-w-xs">
                                                    <span className="text-sm text-slate-700">{diamondWeightDisplay.length > 0 ? diamondWeightDisplay.join(', ') : '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                {sizeDisplay}
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={variant.inventory_quantity !== undefined && variant.inventory_quantity !== null && variant.inventory_quantity !== '' ? String(variant.inventory_quantity) : ''}
                                                    onChange={(event) => {
                                                        const val = event.target.value.trim();
                                                        if (val === '') {
                                                            updateVariant(index, 'inventory_quantity', '');
                                                        } else {
                                                            const numVal = parseInt(val, 10);
                                                            if (!isNaN(numVal) && numVal >= 0) {
                                                                updateVariant(index, 'inventory_quantity', numVal);
                                                            }
                                                        }
                                                    }}
                                                    onBlur={(event) => {
                                                        const val = event.target.value.trim();
                                                        if (val === '') {
                                                            updateVariant(index, 'inventory_quantity', 0);
                                                        }
                                                    }}
                                                    className="w-full min-w-[100px] rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-5 py-3 text-slate-700">
                                                <select
                                                    value={variantStatus}
                                                    onChange={(event) =>
                                                        updateVariantMetadata(index, {
                                                            status: event.target.value as FormDataConvertible,
                                                        })
                                                    }
                                                    className={`rounded-xl border px-3 py-1.5 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                                                        variantStatus === 'enabled'
                                                            ? 'border-emerald-300 bg-emerald-50'
                                                            : 'border-amber-300 bg-amber-50'
                                                    }`}
                                                >
                                                    <option value="enabled">Enabled</option>
                                                    <option value="disabled">Disabled</option>
                                                </select>
                                            </td>
                                            <td className="px-5 py-3 text-slate-700">
                                                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                                                    <input
                                                        type="radio"
                                                        name="default-variant-table"
                                                        checked={variant.is_default}
                                                        onChange={() => markDefault(index)}
                                                        className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                                                    />
                                                    <span>{variant.is_default ? 'Default' : 'Set default'}</span>
                                                </label>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariant(index)}
                                                    className="inline-flex items-center justify-center rounded-full border border-rose-200 p-2 text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                                    aria-label="Remove variant"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12m-9 3v6m6-6v6M10 4h4a1 1 0 0 1 1 1v1H9V5a1 1 0 0 1 1-1Z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14l-.8 11.2A2 2 0 0 1 16.2 20H7.8a2 2 0 0 1-1.99-1.8L5 7Z" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                        {/* Expandable metal management section */}
                                        {expandedMetalVariantIndices.has(index) && (
                                            <tr>
                                                <td colSpan={17} className="px-5 py-4">
                                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-slate-900">Metals for this Variant</h4>
                                                                <p className="mt-1 text-xs text-slate-600">
                                                                    <span className="font-semibold text-rose-600">Required:</span> Enter metal weight (in grams) for each metal in this variant.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        {variantMetals.length === 0 ? (
                                                            <p className="text-xs text-slate-400">
                                                                No metals assigned to this variant.
                                                            </p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {variantMetals.map((metal, metalIndex) => {
                                                                    const metalName = metalMap[metal.metal_id] || 'Unknown Metal';
                                                                    const purityName = metal.metal_purity_id && typeof metal.metal_purity_id === 'number'
                                                                        ? metalPurities.find(p => p.id === metal.metal_purity_id)?.name || ''
                                                                        : '';
                                                                    const toneName = metal.metal_tone_id && typeof metal.metal_tone_id === 'number'
                                                                        ? metalTones.find(t => t.id === metal.metal_tone_id)?.name || ''
                                                                        : '';
                                                                    
                                                                    return (
                                                                        <div key={metalIndex} className="rounded-xl border border-slate-200 bg-white p-4">
                                                                            <div className="mb-3 flex items-center justify-between">
                                                                                <span className="text-xs font-semibold text-slate-600">
                                                                                    {metalName}
                                                                                    {purityName && ` — ${purityName}`}
                                                                                    {toneName && ` — ${toneName}`}
                                                                                </span>
                                                                            </div>
                                                                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                                                                <label className="flex flex-col gap-1.5">
                                                                                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                                                                        <span>Metal Weight (g)</span>
                                                                                        <span className="text-rose-500 font-bold text-sm" title="Required field">*</span>
                                                                                    </span>
                                                                                    <input
                                                                                        type="number"
                                                                                        step="0.001"
                                                                                        min="0.001"
                                                                                        required
                                                                                        value={metal.metal_weight || metal.weight_grams || ''}
                                                                                        onChange={(e) => {
                                                                                            const value = e.target.value;
                                                                                            updateMetalInVariant(index, metalIndex, 'metal_weight', value);
                                                                                            // Also update weight_grams for backward compatibility
                                                                                            if (!metal.weight_grams || metal.weight_grams === '') {
                                                                                                updateMetalInVariant(index, metalIndex, 'weight_grams', value);
                                                                                            }
                                                                                        }}
                                                                                        className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                                                                                            (!metal.metal_weight && !metal.weight_grams) 
                                                                                                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:bg-white' 
                                                                                                : 'border-slate-200 bg-white focus:border-sky-400'
                                                                                        } focus:outline-none focus:ring-2 focus:ring-sky-200`}
                                                                                        placeholder="Enter weight (required)"
                                                                                    />
                                                                                    {(!metal.metal_weight && !metal.weight_grams) && (
                                                                                        <span className="text-xs text-rose-600 font-medium">⚠️ This field is required</span>
                                                                                    )}
                                                                                </label>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {/* Expandable diamond management section */}
                                        {expandedDiamondVariantIndices.has(index) && (
                                            <tr>
                                                <td colSpan={17} className="px-5 py-4">
                                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-slate-900">Diamonds for this Variant</h4>
                                                                {data.diamond_mixing_mode === 'shared' && (
                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        This variant uses the shared diamond list defined above. All variants share the same diamonds.
                                                                    </p>
                                                                )}
                                                                {data.diamond_mixing_mode === 'as_variant' && (
                                                                    <p className="mt-1 text-xs text-slate-500">
                                                                        This variant has its specific diamond from the diamond mixes list. Each variant-diamond combination is a separate sellable variant.
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {data.diamond_mixing_mode === 'shared' && (
                                                                <p className="mb-4 text-xs text-slate-500">
                                                                    In "shared" mode, diamonds are managed in the "Diamond mixes" section above. All variants use the same diamond list.
                                                                </p>
                                                            )}
                                                            {data.diamond_mixing_mode === 'as_variant' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => addDiamondToVariant(index)}
                                                                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-400 hover:bg-sky-50"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                                                    </svg>
                                                                    Add Diamond
                                                                </button>
                                                            )}
                                                        </div>
                                                        
                                                        {variantDiamonds.length === 0 ? (
                                                            <p className="text-xs text-slate-400">
                                                                {data.diamond_mixing_mode === 'shared' 
                                                                    ? 'No diamonds assigned to this variant from the shared matrix.'
                                                                    : 'No diamonds added to this variant. Click "Add Diamond" to add one.'}
                                                            </p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {variantDiamonds.map((diamond, diamondIndex) => (
                                                                    <div key={diamondIndex} className="rounded-xl border border-slate-200 bg-white p-4">
                                                                        <div className="mb-3 flex items-center justify-between">
                                                                            <span className="text-xs font-semibold text-slate-600">Diamond #{diamondIndex + 1}</span>
                                                                            {data.diamond_mixing_mode === 'as_variant' && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeDiamondFromVariant(index, diamondIndex)}
                                                                                    className="text-xs text-rose-500 transition hover:text-rose-700"
                                                                                >
                                                                                    Remove
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                                                            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                                                Type
                                                                                <select
                                                                                    value={diamond.diamond_type_id === '' ? '' : diamond.diamond_type_id}
                                                                                    onChange={(e) => updateDiamondInVariant(index, diamondIndex, 'diamond_type_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                                                    disabled={data.diamond_mixing_mode === 'shared'}
                                                                                    className={`rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 ${data.diamond_mixing_mode === 'shared' ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                                                >
                                                                                    <option value="">Select type</option>
                                                                                    {diamondCatalog.types.map((type) => (
                                                                                        <option key={type.id} value={type.id}>
                                                                                            {type.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </label>
                                                                            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                                                Clarity
                                                                                <select
                                                                                    value={diamond.diamond_clarity_id === '' ? '' : diamond.diamond_clarity_id}
                                                                                    onChange={(e) => updateDiamondInVariant(index, diamondIndex, 'diamond_clarity_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                                                    disabled={data.diamond_mixing_mode === 'shared'}
                                                                                    className={`rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 ${data.diamond_mixing_mode === 'shared' ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                                                >
                                                                                    <option value="">Select clarity</option>
                                                                                    {diamondCatalog.clarities.map((clarity) => (
                                                                                        <option key={clarity.id} value={clarity.id}>
                                                                                            {clarity.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </label>
                                                                            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                                                Color
                                                                                <select
                                                                                    value={diamond.diamond_color_id === '' ? '' : diamond.diamond_color_id}
                                                                                    onChange={(e) => updateDiamondInVariant(index, diamondIndex, 'diamond_color_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                                                    disabled={data.diamond_mixing_mode === 'shared'}
                                                                                    className={`rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 ${data.diamond_mixing_mode === 'shared' ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                                                >
                                                                                    <option value="">Select color</option>
                                                                                    {diamondCatalog.colors.map((color) => (
                                                                                        <option key={color.id} value={color.id}>
                                                                                            {color.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </label>
                                                                            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                                                Shape
                                                                                <select
                                                                                    value={diamond.diamond_shape_id === '' ? '' : diamond.diamond_shape_id}
                                                                                    onChange={(e) => updateDiamondInVariant(index, diamondIndex, 'diamond_shape_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                                                    disabled={data.diamond_mixing_mode === 'shared'}
                                                                                    className={`rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 ${data.diamond_mixing_mode === 'shared' ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                                                >
                                                                                    <option value="">Select shape</option>
                                                                                    {diamondCatalog.shapes.map((shape) => (
                                                                                        <option key={shape.id} value={shape.id}>
                                                                                            {shape.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </label>
                                                                            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                                                Cut
                                                                                <select
                                                                                    value={diamond.diamond_cut_id === '' ? '' : diamond.diamond_cut_id}
                                                                                    onChange={(e) => updateDiamondInVariant(index, diamondIndex, 'diamond_cut_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                                                    disabled={data.diamond_mixing_mode === 'shared'}
                                                                                    className={`rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 ${data.diamond_mixing_mode === 'shared' ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                                                >
                                                                                    <option value="">Select cut</option>
                                                                                    {diamondCatalog.cuts.map((cut) => (
                                                                                        <option key={cut.id} value={cut.id}>
                                                                                            {cut.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </label>
                                                                            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                                                Total Carat
                                                                                <input
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    min="0"
                                                                                    value={diamond.total_carat}
                                                                                    onChange={(e) => updateDiamondInVariant(index, diamondIndex, 'total_carat', e.target.value)}
                                                                                    disabled={data.diamond_mixing_mode === 'shared'}
                                                                                    className={`rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 ${data.diamond_mixing_mode === 'shared' ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                                                    placeholder="0.00"
                                                                                />
                                                                            </label>
                                                                            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                                                Number of Diamonds
                                                                                <input
                                                                                    type="number"
                                                                                    step="1"
                                                                                    min="0"
                                                                                    value={diamond.diamonds_count}
                                                                                    onChange={(e) => updateDiamondInVariant(index, diamondIndex, 'diamonds_count', e.target.value)}
                                                                                    disabled={data.diamond_mixing_mode === 'shared'}
                                                                                    className={`rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 ${data.diamond_mixing_mode === 'shared' ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                                                                    placeholder="0"
                                                                                />
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </>
                                    );
                                })}
                                {data.variants.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={17}
                                            className="px-5 py-6 text-center text-xs uppercase tracking-[0.1em] text-slate-400"
                                        >
                                            No variants configured. Generate matrix to create variants.
                                        </td>
                                    </tr>
                                )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </form>
        </AdminLayout>
    );
}

