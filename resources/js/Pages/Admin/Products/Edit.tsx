import RichTextEditor from '@/Components/RichTextEditor';
import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type VariantMetalForm = {
    id?: number;
    metal_id: number | '';
    metal_purity_id: number | '';
    metal_tone_id: number | '';
    metal_weight: string;
};

type VariantDiamondForm = {
    id?: number;
    diamond_id?: number | '';
    diamonds_count?: string;
};

type VariantColorstoneForm = {
    id?: number;
    colorstone_id?: number | '';
    stones_count?: string;
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
    colorstones?: VariantColorstoneForm[];
};

type ProductDiamondOption = {
    key?: string | null;
    shape_id: number | null;
    color_id: number | null;
    clarity_id: number | null;
    weight: number | null;
    diamonds_count: number | null;
};

type Product = {
    id?: number;
    name?: string;
    titleline?: string;
    sku?: string;
    description?: string;
    brand_id?: number;
    category_id?: number;
    collection?: string;
    producttype?: string;
    gender?: string;
    making_charge?: number | string;
    making_charge_discount_type?: 'percentage' | 'fixed' | null;
    making_charge_discount_value?: string | number | null;
    making_charge_discount_overrides?: Array<{
        customer_group_id: number | null;
        type: 'percentage' | 'fixed';
        value: string | number | null;
    }>;
    is_active?: boolean;
    media?: ProductMedia[];
    variants?: Array<{
        id?: number;
        sku?: string;
        label?: string;
        metal_id?: number | '';
        metal_purity_id?: number | '';
        diamond_option_key?: string | null;
        size_cm?: number | string;
        price_adjustment?: number | string;
        is_default?: boolean;
        inventory_quantity?: number;
        metadata?: Record<string, any>;
        metals?: Array<{
            id?: number;
            metal_id?: number | '';
            metal_purity_id?: number | '';
            metal_tone_id?: number | '';
            metal_weight?: number | string;
        }>;
        diamonds?: Array<{
            id?: number;
            diamond_id?: number | '';
            diamonds_count?: number | string;
        }>;
        colorstones?: Array<{
            id?: number;
            colorstone_id?: number | '';
            stones_count?: number | string;
        }>;
    }>;
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

type ColorstoneCatalog = {
    shapes: OptionListItem[];
    colors: OptionListItem[];
    qualities: OptionListItem[];
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
    diamondCatalog: DiamondCatalog;
    colorstoneCatalog: ColorstoneCatalog;
    diamonds: OptionListItem[];
    colorstones: OptionListItem[];
    customerGroups: OptionListItem[];
    metals: MetalOption[];
    metalPurities: MetalPurityOption[];
    metalTones: MetalToneOption[];
    errors: Record<string, string>;
}>;

type FormData = {
    sku: string;
    name: string;
    titleline: string;
    description: string;
    brand_id: string;
    category_id: string;
    collection: string;
    producttype: string;
    gender: string;
    making_charge: string;
    making_charge_discount_type: '' | 'percentage' | 'fixed' | null;
    making_charge_discount_value: string | number | null;
    making_charge_discount_overrides: DiscountOverrideForm[];
    is_active: boolean;
    is_variant_product?: boolean;
    variants?: VariantForm[];
    metal_ids?: number[];
    metal_purity_ids?: number[];
    metal_tone_ids?: number[];
    metal_mix_mode?: Record<string, string>;
    diamond_selections?: Array<{ diamond_id: number | ''; count: string }>;
    diamond_options?: DiamondOptionForm[];
    diamond_mixing_mode?: 'shared' | 'as_variant';
    uses_diamond?: boolean;
    colorstone_selections?: Array<{ colorstone_id: number | ''; count: string }>;
    media_uploads?: File[];
    removed_media_ids?: number[];
    variant_options?: Record<string, any>;
    size_unit?: 'mm' | 'cm';
    size_values?: string[];
    size_dimension_enabled?: boolean;
};

type DiamondOptionForm = {
    key: string;
    shape_id: number | '';
    color_id: number | '';
    clarity_id: number | '';
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
    colorstones: [],
});

const generateLocalKey = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }

    return `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

const createDiamondOption = (): DiamondOptionForm => ({
    key: generateLocalKey(),
    shape_id: '',
    color_id: '',
    clarity_id: '',
    weight: '',
    diamonds_count: '',
});

const createEmptyMetal = (): VariantMetalForm => ({
    metal_id: '',
    metal_purity_id: '',
    metal_tone_id: '',
    metal_weight: '',
});

const createEmptyDiamond = (): VariantDiamondForm => ({
    id: undefined,
    diamond_id: '',
    diamonds_count: '',
});

const createEmptyColorstone = (): VariantColorstoneForm => ({
    id: undefined,
    colorstone_id: '',
    stones_count: '',
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
        diamondCatalog,
        colorstoneCatalog,
        diamonds,
        colorstones,
        customerGroups,
        metals,
        metalPurities,
        metalTones,
        errors,
    } = props;

    // Note: Variants are no longer managed at the product level
    // Variants should be managed separately through product_variants table
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
                  metal_weight: metal.metal_weight ? String(metal.metal_weight) : '',
              })) ?? [],
              diamonds: variant.diamonds?.map((diamond: any) => ({
                  id: diamond.id,
                  diamond_id: diamond.diamond_id ?? '',
                  diamonds_count: diamond.diamonds_count ? String(diamond.diamonds_count) : '',
              })) ?? [],
              colorstones: variant.colorstones?.map((colorstone: any) => ({
                  id: colorstone.id,
                  colorstone_id: colorstone.colorstone_id ?? '',
                  stones_count: colorstone.stones_count ? String(colorstone.stones_count) : '',
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

    // Extract metal_ids, purities, tones, diamonds, and colorstones from existing variants
    const extractSelectionsFromVariants = useMemo(() => {
        if (!product?.variants?.length) {
            return {
                metalIds: [] as number[],
                metalPurityIds: [] as number[],
                metalToneIds: [] as number[],
                diamondOptions: [] as DiamondOptionForm[],
                colorstoneSelections: [] as Array<{ colorstone_id: number | ''; count: string }>,
            };
        }

        const metalIdsSet = new Set<number>();
        const metalPurityIdsSet = new Set<number>();
        const metalToneIdsSet = new Set<number>();
        const diamondSelectionsMap = new Map<number, { diamond_id: number; count: string }>();
        const colorstoneSelectionsMap = new Map<number, { colorstone_id: number; count: string }>();

        product.variants.forEach((variant: any) => {
            // Extract metals
            if (variant.metals?.length) {
                variant.metals.forEach((metal: any) => {
                    if (metal.metal_id && metal.metal_id !== '') {
                        metalIdsSet.add(typeof metal.metal_id === 'number' ? metal.metal_id : Number(metal.metal_id));
                    }
                    if (metal.metal_purity_id && metal.metal_purity_id !== '') {
                        metalPurityIdsSet.add(typeof metal.metal_purity_id === 'number' ? metal.metal_purity_id : Number(metal.metal_purity_id));
                    }
                    if (metal.metal_tone_id && metal.metal_tone_id !== '') {
                        metalToneIdsSet.add(typeof metal.metal_tone_id === 'number' ? metal.metal_tone_id : Number(metal.metal_tone_id));
                    }
                });
            }

            // Extract diamonds - use diamond_id (simplified structure)
            if (variant.diamonds?.length) {
                variant.diamonds.forEach((diamond: any) => {
                    if (diamond.diamond_id && diamond.diamond_id !== '' && diamond.diamond_id !== null) {
                        const diamondId = typeof diamond.diamond_id === 'number' ? diamond.diamond_id : Number(diamond.diamond_id);
                        // Only add if not already in the map (avoid duplicates)
                        if (!diamondSelectionsMap.has(diamondId)) {
                            diamondSelectionsMap.set(diamondId, {
                                diamond_id: diamondId,
                                count: diamond.diamonds_count && diamond.diamonds_count !== '' && diamond.diamonds_count !== null ? String(diamond.diamonds_count) : '',
                            });
                        }
                    }
                });
            }

            // Extract colorstones - use colorstone_id (simplified structure)
            if (variant.colorstones?.length) {
                variant.colorstones.forEach((colorstone: any) => {
                    if (colorstone.colorstone_id && colorstone.colorstone_id !== '' && colorstone.colorstone_id !== null) {
                        const colorstoneId = typeof colorstone.colorstone_id === 'number' ? colorstone.colorstone_id : Number(colorstone.colorstone_id);
                        // Only add if not already in the map (avoid duplicates)
                        if (!colorstoneSelectionsMap.has(colorstoneId)) {
                            colorstoneSelectionsMap.set(colorstoneId, {
                                colorstone_id: colorstoneId,
                                count: colorstone.stones_count && colorstone.stones_count !== '' && colorstone.stones_count !== null ? String(colorstone.stones_count) : '',
                            });
                        }
                    }
                });
            }
        });

        return {
            metalIds: Array.from(metalIdsSet),
            metalPurityIds: Array.from(metalPurityIdsSet),
            metalToneIds: Array.from(metalToneIdsSet),
            diamondSelections: Array.from(diamondSelectionsMap.values()),
            colorstoneSelections: Array.from(colorstoneSelectionsMap.values()),
        };
    }, [product]);

    const form = useForm<Record<string, any>>(() => ({
        sku: product?.sku ?? '',
        name: product?.name ?? '',
        titleline: product?.titleline ?? '',
        description: product?.description ?? '',
        brand_id: String(product?.brand_id ?? ''),
        category_id: String(product?.category_id ?? ''),
        collection: product?.collection ?? '',
        producttype: product?.producttype ?? '',
        gender: product?.gender ?? '',
        making_charge: product?.making_charge ? String(product.making_charge) : '',
        making_charge_discount_type:
            (product?.making_charge_discount_type as 'percentage' | 'fixed' | null) ?? null,
        making_charge_discount_value:
            product?.making_charge_discount_value !== null && product?.making_charge_discount_value !== undefined
                ? String(product.making_charge_discount_value)
                : null,
        making_charge_discount_overrides: initialDiscountOverrides,
        is_active: product?.is_active ?? true,
        is_variant_product: true, // Always enable variant product by default
        variants: product?.variants?.length
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
                  metals: variant.metals?.map((metal: any) => ({
                      id: metal.id,
                      metal_id: metal.metal_id ?? '',
                      metal_purity_id: metal.metal_purity_id ?? '',
                      metal_tone_id: metal.metal_tone_id ?? '',
                      metal_weight: metal.metal_weight ? String(metal.metal_weight) : '',
                  })) ?? [],
                  diamonds: variant.diamonds?.map((diamond: any) => ({
                      id: diamond.id,
                      diamond_id: diamond.diamond_id ?? '',
                      diamonds_count: diamond.diamonds_count ? String(diamond.diamonds_count) : '',
                  })) ?? [],
                  colorstones: variant.colorstones?.map((colorstone: any) => ({
                      id: colorstone.id,
                      colorstone_id: colorstone.colorstone_id ?? '',
                      stones_count: colorstone.stones_count ? String(colorstone.stones_count) : '',
                  })) ?? [],
              }))
            : [emptyVariant(true)],
        metal_ids: extractSelectionsFromVariants.metalIds,
        metal_purity_ids: extractSelectionsFromVariants.metalPurityIds,
        metal_tone_ids: extractSelectionsFromVariants.metalToneIds,
        diamond_options: [],
        uses_diamond: (extractSelectionsFromVariants.diamondSelections?.length ?? 0) > 0,
        diamond_selections: extractSelectionsFromVariants.diamondSelections ?? [],
        colorstone_selections: extractSelectionsFromVariants.colorstoneSelections ?? [],
        media_uploads: [],
        removed_media_ids: [],
    }) as Record<string, any>);
    const { setData, post, put, processing } = form;
    const data = form.data as FormData;
    
    // Local state for description to prevent re-renders on every keystroke
    const [localDescription, setLocalDescription] = useState(data.description);
    const descriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync local description with form data when form data changes externally
    useEffect(() => {
        if (data.description !== localDescription) {
            setLocalDescription(data.description);
        }
    }, [data.description]);

    // Debounced handler for description changes
    const handleDescriptionChange = useCallback((value: string) => {
        setLocalDescription(value);
        
        // Clear existing timeout
        if (descriptionTimeoutRef.current) {
            clearTimeout(descriptionTimeoutRef.current);
        }
        
        // Set new timeout to update form data after 300ms of no typing
        descriptionTimeoutRef.current = setTimeout(() => {
            setData('description', value);
        }, 300);
    }, [setData]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (descriptionTimeoutRef.current) {
                clearTimeout(descriptionTimeoutRef.current);
            }
        };
    }, []);
    
    const [sizeValueInput, setSizeValueInput] = useState('');
    // Allow multiple variants to be expanded simultaneously
    const [expandedDiamondVariantIndices, setExpandedDiamondVariantIndices] = useState<Set<number>>(new Set());
    const [expandedMetalVariantIndices, setExpandedMetalVariantIndices] = useState<Set<number>>(new Set());
    const [expandedColorstoneVariantIndices, setExpandedColorstoneVariantIndices] = useState<Set<number>>(new Set());
    
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

    const toggleColorstoneExpansion = useCallback((index: number) => {
        setExpandedColorstoneVariantIndices(prev => {
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
            
            // Build diamond label from variant.diamonds array
            let diamondLabel = '';
            if (variant.diamonds && variant.diamonds.length > 0) {
                const diamondParts: string[] = [];
                variant.diamonds.forEach((diamond) => {
                    // Use diamond_id to get diamond name (will be resolved in the component where diamonds list is available)
                    if (diamond.diamond_id && typeof diamond.diamond_id === 'number') {
                        const count = diamond.diamonds_count ? ` (${diamond.diamonds_count})` : '';
                        diamondParts.push(`Diamond${count}`);
                    }
                });
                diamondLabel = diamondParts.join(' / ');
            }

            const rawMetadata = (variant.metadata ?? {}) as Record<string, FormDataConvertible>;
            const storedSizeValue =
                typeof rawMetadata.size_value === 'string' || typeof rawMetadata.size_value === 'number'
                    ? String(rawMetadata.size_value)
                    : '';
            const storedSizeUnit =
                rawMetadata.size_unit === 'mm' || rawMetadata.size_unit === 'cm'
                    ? (rawMetadata.size_unit as 'mm' | 'cm')
                    : 'cm';

            let sizeUnit: 'mm' | 'cm' = storedSizeUnit || 'cm';
            let sizeValue = '';

            if (storedSizeValue) {
                sizeValue = formatDecimal(Number(storedSizeValue));
            } else if (variant.size_cm) {
                sizeValue = formatDecimal(parseFloat(variant.size_cm));
                sizeUnit = 'cm';
            }

            const sizeLabel = sizeValue ? `${sizeValue}${sizeUnit}` : '';

            const autoLabelParts = [diamondLabel, metalLabel, sizeLabel].filter(Boolean);
            const autoLabel = autoLabelParts.length ? autoLabelParts.join(' / ') : 'Variant';
            const metalTone = metalLabel;
            const stoneQuality = diamondLabel;

            // Build diamond metadata from variant.diamonds array
            let diamondMetadata = null;
            if (variant.diamonds && variant.diamonds.length > 0) {
                // Use diamonds array (new approach with diamond_id)
                diamondMetadata = variant.diamonds.map((diamond) => ({
                    diamond_id: diamond.diamond_id !== '' && diamond.diamond_id !== null ? Number(diamond.diamond_id) : null,
                    diamonds_count: diamond.diamonds_count ? Number(diamond.diamonds_count) : null,
                }));
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
        [convertFromCentimeters, formatDecimal, metalMap, metalPurityMap, metalToneMap],
    );

    const recalculateVariants = useCallback(
        (draft: FormData) =>
            (draft.variants || []).map((variant, index) => {
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
        const selectedMetalIds = data.metal_ids || [];
        if (selectedMetalIds.length === 0) {
            return metalPurities || [];
        }
        return (metalPurities || []).filter((purity) => 
            selectedMetalIds.includes(purity.metal_id)
        );
    }, [data.metal_ids, metalPurities]);

    const availableTones = useMemo(() => {
        const selectedMetalIds = data.metal_ids || [];
        if (selectedMetalIds.length === 0) {
            return metalTones || [];
        }
        return (metalTones || []).filter((tone) => 
            selectedMetalIds.includes(tone.metal_id)
        );
    }, [data.metal_ids, metalTones]);

    // Get selected purities and tones
    // Note: metal_purity_ids and metal_tone_ids removed from products table
    const selectedPurities = useMemo(() => [], []);
    const selectedTones = useMemo(() => [], []);

    // Note: diamond_options removed from products table
    const diamondOptionLabels = useMemo(() => [], []);

    // Note: diamond_options removed from products table
    const diamondLabelMap = useMemo(() => ({}), []);

    const toggleVariantProduct = (checked: boolean) => {
        setData((prev: FormData) => ({
            ...prev,
            is_variant_product: checked,
        }));
    };

    // Note: Diamond options removed from products table
    const toggleUsesDiamond = (checked: boolean) => {
        // No-op: diamond options removed from products table
    };

    // Note: Size dimension removed from products table
    const toggleSizeDimension = (checked: boolean) => {
        // No-op: size dimension removed from products table
    };

    const changeSizeUnit = (unit: 'mm' | 'cm') => {
        setData((prev: FormData) => {
            if (prev.size_unit === unit) {
                return prev;
            }

            const convertedValues = (prev.size_values || []).map((value) => {
                const centimeters = convertToCentimeters(value, prev.size_unit || 'cm');
                return centimeters ? convertFromCentimeters(centimeters, unit) : value;
            });

            const draft: FormData = {
                ...prev,
                size_unit: unit,
                size_values: convertedValues,
                variants: (prev.variants || []).map((variant: VariantForm) => {
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
            if ((prev.size_values || []).includes(normalized)) {
                return prev;
            }

            const draft: FormData = {
                ...prev,
                size_values: [...(prev.size_values || []), normalized],
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
                size_values: (prev.size_values || []).filter((entry) => entry !== value),
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };


    const toggleMetalSelection = (metalId: number) => {
        setData((prev: FormData) => {
            const currentMetalIds = prev.metal_ids || [];
            const exists = currentMetalIds.includes(metalId);
            const nextMetalIds = exists
                ? currentMetalIds.filter((id) => id !== metalId)
                : [...currentMetalIds, metalId];

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
                metal_purity_ids: (prev.metal_purity_ids || []).filter((id) => !metalPuritiesToRemove.includes(id)),
                metal_tone_ids: (prev.metal_tone_ids || []).filter((id) => !metalTonesToRemove.includes(id)),
                // Preserve metal_mix_mode when toggling metals (don't reset it)
                metal_mix_mode: prev.metal_mix_mode,
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const toggleMetalPuritySelection = (purityId: number) => {
        setData((prev: FormData) => {
            const currentPurityIds = prev.metal_purity_ids || [];
            const exists = currentPurityIds.includes(purityId);
            const nextIds = exists
                ? currentPurityIds.filter((id) => id !== purityId)
                : [...currentPurityIds, purityId];

            return {
                ...prev,
                metal_purity_ids: nextIds,
            };
        });
    };

    const toggleMetalToneSelection = (toneId: number) => {
        setData((prev: FormData) => {
            const currentToneIds = prev.metal_tone_ids || [];
            const exists = currentToneIds.includes(toneId);
            const nextIds = exists
                ? currentToneIds.filter((id) => id !== toneId)
                : [...currentToneIds, toneId];

            return {
                ...prev,
                metal_tone_ids: nextIds,
            };
        });
    };

    const addDiamondSelection = () => {
        setData((prev: FormData) => {
            const currentSelections = prev.diamond_selections || [];
            return {
                ...prev,
                diamond_selections: [...currentSelections, { diamond_id: '', count: '' }],
            };
        });
    };

    const removeDiamondSelection = (index: number) => {
        setData((prev: FormData) => {
            const currentSelections = prev.diamond_selections || [];
            return {
                ...prev,
                diamond_selections: currentSelections.filter((_, i) => i !== index),
            };
        });
    };

    const updateDiamondSelection = (index: number, field: 'diamond_id' | 'count', value: number | string) => {
        setData((prev: FormData) => {
            const currentSelections = prev.diamond_selections || [];
            const updatedSelections = currentSelections.map((selection, i) => {
                if (i !== index) return selection;
                return {
                    ...selection,
                    [field]: value,
                };
            });
            return {
                ...prev,
                diamond_selections: updatedSelections,
            };
        });
    };

    const addColorstoneSelection = () => {
        setData((prev: FormData) => {
            const currentSelections = prev.colorstone_selections || [];
            return {
                ...prev,
                colorstone_selections: [...currentSelections, { colorstone_id: '', count: '' }],
            };
        });
    };

    const removeColorstoneSelection = (index: number) => {
        setData((prev: FormData) => {
            const currentSelections = prev.colorstone_selections || [];
            return {
                ...prev,
                colorstone_selections: currentSelections.filter((_, i) => i !== index),
            };
        });
    };

    const updateColorstoneSelection = (index: number, field: 'colorstone_id' | 'count', value: number | string) => {
        setData((prev: FormData) => {
            const currentSelections = prev.colorstone_selections || [];
            const updatedSelections = currentSelections.map((selection, i) => {
                if (i !== index) return selection;
                return {
                    ...selection,
                    [field]: value,
                };
            });
            return {
                ...prev,
                colorstone_selections: updatedSelections,
            };
        });
    };

    const addDiamondOptionRow = () => {
        setData((prev: FormData) => {
            const draft: FormData = {
                ...prev,
                diamond_options: [...(prev.diamond_options || []), createDiamondOption()],
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
            const diamond_options = (prev.diamond_options || []).map((option: DiamondOptionForm) => {
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
            const diamond_options = (prev.diamond_options || []).filter((option: DiamondOptionForm) => option.key !== key);
            const draft: FormData = {
                ...prev,
                diamond_options,
                variants: (prev.variants || []).map((variant: VariantForm) =>
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
            if ((prev.variants || []).length === 1) {
                return prev;
            }

            const remaining = (prev.variants || []).filter((_, idx: number) => idx !== index);
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
            const variants = (prev.variants || []).map((variant: VariantForm, idx: number) => {
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
            const variants = (prev.variants || []).map((variant: VariantForm, idx: number) => {
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
            variants: (prev.variants || []).map((variant: VariantForm, idx: number) => ({
                ...variant,
                is_default: idx === index,
            })),
        }));
    };

    // Diamond management functions (per-variant, manual)
    const addDiamondToVariant = (variantIndex: number) => {
        setData((prev: FormData) => {
            const variants = (prev.variants || []).map((variant: VariantForm, idx: number) => {
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
            const variants = (prev.variants || []).map((variant: VariantForm, idx: number) => {
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
            const variants = (prev.variants || []).map((variant: VariantForm, idx: number) => {
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
            const variants = (prev.variants || []).map((variant: VariantForm, idx: number) => {
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

    // Colorstone management functions (per-variant)
    const addColorstoneToVariant = (variantIndex: number) => {
        setData((prev: FormData) => {
            const variants = (prev.variants || []).map((variant: VariantForm, idx: number) => {
                if (idx !== variantIndex) {
                    return variant;
                }
                const currentColorstones = variant.colorstones || [];
                return {
                    ...variant,
                    colorstones: [...currentColorstones, createEmptyColorstone()],
                };
            });
            return {
                ...prev,
                variants,
            };
        });
    };

    const removeColorstoneFromVariant = (variantIndex: number, colorstoneIndex: number) => {
        setData((prev: FormData) => {
            const variants = (prev.variants || []).map((variant: VariantForm, idx: number) => {
                if (idx !== variantIndex) {
                    return variant;
                }
                const currentColorstones = variant.colorstones || [];
                return {
                    ...variant,
                    colorstones: currentColorstones.filter((_, cIdx: number) => cIdx !== colorstoneIndex),
                };
            });
            return {
                ...prev,
                variants,
            };
        });
    };

    const updateColorstoneInVariant = (
        variantIndex: number,
        colorstoneIndex: number,
        field: keyof VariantColorstoneForm,
        value: string | number | '',
    ) => {
        setData((prev: FormData) => {
            const variants = (prev.variants || []).map((variant: VariantForm, idx: number) => {
                if (idx !== variantIndex) {
                    return variant;
                }
                const currentColorstones = variant.colorstones || [];
                const updatedColorstones = currentColorstones.map((colorstone: VariantColorstoneForm, cIdx: number) => {
                    if (cIdx !== colorstoneIndex) {
                        return colorstone;
                    }
                    return {
                        ...colorstone,
                        [field]: value,
                    };
                });
                return {
                    ...variant,
                    colorstones: updatedColorstones,
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
            if ((prev.metal_ids || []).length > 0 && (prev.metal_purity_ids || []).length > 0) {
                (prev.metal_purity_ids || []).forEach((purityId) => {
                    const purity = metalPurities.find((p) => p.id === purityId);
                    if (purity && (prev.metal_ids || []).includes(purity.metal_id)) {
                        if (!puritiesByMetal.has(purity.metal_id)) {
                            puritiesByMetal.set(purity.metal_id, []);
                        }
                        puritiesByMetal.get(purity.metal_id)!.push(purityId);
                    }
                });
            }
            
            // Group tones by metal
            const tonesByMetal = new Map<number, number[]>();
            if ((prev.metal_ids || []).length > 0 && (prev.metal_tone_ids || []).length > 0) {
                (prev.metal_tone_ids || []).forEach((toneId) => {
                    const tone = metalTones.find((t) => t.id === toneId);
                    if (tone && (prev.metal_ids || []).includes(tone.metal_id)) {
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
            
                (prev.metal_ids || []).forEach((metalId) => {
                    const purities = puritiesByMetal.get(metalId) || [];
                const tones = tonesByMetal.get(metalId) || [];
                
                // Get per-metal mixing mode (default to 'normal' if not set)
                // Try multiple lookup strategies to ensure we find the saved value
                let metalMode: 'normal' | 'mix_tones' | 'mix_purities' = 'normal';
                if (prev.metal_mix_mode) {
                    // Try direct numeric key lookup
                    const mode1 = prev.metal_mix_mode[metalId];
                    metalMode = (mode1 === 'normal' || mode1 === 'mix_tones' || mode1 === 'mix_purities') ? mode1 : metalMode;
                    // If not found, try string key lookup
                    if (metalMode === 'normal') {
                        const mode2 = prev.metal_mix_mode[String(metalId) as unknown as number];
                        metalMode = (mode2 === 'normal' || mode2 === 'mix_tones' || mode2 === 'mix_purities') ? mode2 : metalMode;
                    }
                    // If still not found, iterate through all keys
                    if (metalMode === 'normal') {
                        Object.keys(prev.metal_mix_mode).forEach((key) => {
                            const keyNum = Number(key);
                            if (keyNum === metalId) {
                                const value = prev.metal_mix_mode?.[keyNum];
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
            
            if ((prev.metal_ids || []).length > 0) {
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
                const metalComboArrays = (prev.metal_ids || []).map(metalId => 
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
                clarity_id: number | null;
                color_id: number | null;
                shape_id: number | null;
            }> = [];
            
            if (prev.uses_diamond && (prev.diamond_options || []).length > 0) {
                // Build diamond combinations from diamond_options
                (prev.diamond_options || []).forEach((option) => {
                    diamondCombinations.push({
                        key: option.key,
                        clarity_id: option.clarity_id !== '' ? Number(option.clarity_id) : null,
                        color_id: option.color_id !== '' ? Number(option.color_id) : null,
                        shape_id: option.shape_id !== '' ? Number(option.shape_id) : null,
                    });
                });
            } else {
                // No diamonds, use null placeholder
                diamondCombinations.push({
                    key: '',
                    clarity_id: null,
                    color_id: null,
                    shape_id: null,
                });
            }
            
            const sizeOptions =
                prev.size_dimension_enabled && (prev.size_values || []).length > 0 ? (prev.size_values || []) : [null];

            // Check if we have at least one option to generate variants
            const hasSizes = prev.size_dimension_enabled && (sizeOptions || []).length > 0 && (sizeOptions || [])[0] !== null;
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
                    clarity_id: number | null;
                    color_id: number | null;
                    shape_id: number | null;
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
                    (sizeOptions || []).forEach((sizeOption) => {
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
                    clarity_id: null,
                    color_id: null,
                    shape_id: null,
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
                                clarity_id: null,
                                color_id: null,
                                shape_id: null,
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
                metals: Array<{ metal_id: number; metal_purity_id: number | null; metal_tone_id: number | null; metal_weight: string }>;
                diamonds: Array<{ diamond_id: number | null; diamonds_count: string }>;
            }>();

            // Build lookup map from existing variants
            (prev.variants || []).forEach((existingVariant) => {
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
                        metal_weight: m.metal_weight || '',
                    })),
                    diamonds: (existingVariant.diamonds || []).map(d => ({
                        diamond_id: d.diamond_id !== '' && d.diamond_id !== null ? (typeof d.diamond_id === 'number' ? d.diamond_id : Number(d.diamond_id)) : null,
                        diamonds_count: d.diamonds_count || '',
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
                    // Check for diamond_selections first (new approach with diamond_id), then fallback to diamond_options
                    if (prev.diamond_selections && prev.diamond_selections.length > 0) {
                        // Use diamond_selections (new approach with diamond_id)
                        variant.diamonds = prev.diamond_selections
                            .filter((selection) => selection.diamond_id !== '' && selection.diamond_id !== null)
                            .map((selection) => {
                                // Try to find matching existing diamond entry
                                const existingDiamond = existingData?.diamonds.find(
                                    ed => (ed as any).diamond_id === (typeof selection.diamond_id === 'number' ? selection.diamond_id : Number(selection.diamond_id))
                                );
                                
                                return {
                                    id: (existingDiamond as any)?.id,
                                    diamond_id: typeof selection.diamond_id === 'number' ? selection.diamond_id : Number(selection.diamond_id),
                                    diamonds_count: (existingDiamond as any)?.diamonds_count || selection.count || '',
                                };
                            });
                        variant.diamond_option_key = null;
                    } else {
                        variant.diamond_option_key = null;
                        variant.diamonds = [];
                    }
                } else {
                    // 'as_variant' mode: Use diamond_selections from the form
                    variant.diamond_option_key = null;
                    
                    if ((prev.diamond_selections || []).length > 0) {
                        // Use diamond_selections for all variants (they're shared)
                        variant.diamonds = (prev.diamond_selections || []).map((selection) => {
                        const existingDiamond = existingData?.diamonds.find(
                                ed => ed.diamond_id === (selection.diamond_id !== '' && selection.diamond_id !== null ? (typeof selection.diamond_id === 'number' ? selection.diamond_id : Number(selection.diamond_id)) : null)
                        );
                        
                            return {
                            id: undefined,
                                diamond_id: selection.diamond_id !== '' && selection.diamond_id !== null ? (typeof selection.diamond_id === 'number' ? selection.diamond_id : Number(selection.diamond_id)) : '',
                                diamonds_count: existingDiamond?.diamonds_count || selection.count || '',
                            };
                        });
                    } else {
                        variant.diamonds = [];
                    }
                }

                const metadata: Record<string, FormDataConvertible> = {
                    ...(variant.metadata ?? {}),
                    status: 'enabled',
                };

                if (combo.size) {
                    const centimeters = convertToCentimeters(combo.size, prev.size_unit || 'cm');
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
                            clarity_id: combo.diamond.clarity_id,
                            color_id: combo.diamond.color_id,
                            shape_id: combo.diamond.shape_id,
                        };
                    }
                    // In 'shared' mode, all variants share the same diamond list (stored in variant.diamonds)
                }

                // Set colorstones for all variants (colorstones are always shared across variants)
                if (prev.colorstone_selections && prev.colorstone_selections.length > 0) {
                    variant.colorstones = prev.colorstone_selections
                        .filter((selection) => selection.colorstone_id !== '' && selection.colorstone_id !== null)
                        .map((selection) => {
                            // Try to find matching existing colorstone entry from the variant's existing colorstones
                            const existingVariant = (prev.variants || []).find((v: VariantForm) => {
                                // Find any variant that has colorstones to preserve their IDs
                                return v.colorstones && v.colorstones.length > 0;
                            });
                            const existingColorstone = existingVariant?.colorstones?.find(
                                (ec: any) => ec.colorstone_id === (typeof selection.colorstone_id === 'number' ? selection.colorstone_id : Number(selection.colorstone_id))
                            );
                            
                            return {
                                id: existingColorstone?.id,
                                colorstone_id: typeof selection.colorstone_id === 'number' ? selection.colorstone_id : Number(selection.colorstone_id),
                                stones_count: existingColorstone?.stones_count || selection.count || '',
                            };
                        });
                } else {
                    variant.colorstones = [];
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

        // Check for media uploads before transform (since transform may delete the field)
        const hasMediaUploads = (form.data.media_uploads?.length ?? 0) > 0;

        form.transform((current) => {
            const formState = current as FormData;
            const payload: any = { ...formState };
            
            // Preserve File objects in media_uploads (they might be lost in spread)
            if (formState.media_uploads && Array.isArray(formState.media_uploads) && formState.media_uploads.length > 0) {
                payload.media_uploads = formState.media_uploads;
            }
            
            // Ensure required string fields are preserved
            payload.sku = formState.sku || '';
            payload.name = formState.name || '';
            payload.titleline = formState.titleline || null;
            payload.collection = formState.collection || null;
            payload.producttype = formState.producttype || null;
            payload.gender = formState.gender || null;
            payload.description = formState.description || '';
            
            // Convert string IDs to numbers for backend validation
            // Ensure brand_id and category_id are always numbers (required fields)
            const brandIdValue = formState.brand_id;
            if (brandIdValue !== '' && brandIdValue !== null && brandIdValue !== undefined) {
                const brandIdNum = Number(brandIdValue);
                payload.brand_id = isNaN(brandIdNum) ? null : brandIdNum;
            } else {
                payload.brand_id = null;
            }
            
            const categoryIdValue = formState.category_id;
            if (categoryIdValue !== '' && categoryIdValue !== null && categoryIdValue !== undefined) {
                const categoryIdNum = Number(categoryIdValue);
                payload.category_id = isNaN(categoryIdNum) ? null : categoryIdNum;
            } else {
                payload.category_id = null;
            }
            
            
            // Convert making_charge to number (required field)
            const makingChargeValue = formState.making_charge;
            if (makingChargeValue === '' || makingChargeValue === null || makingChargeValue === undefined) {
                payload.making_charge = 0;
            } else {
                const numValue = Number(makingChargeValue);
                payload.making_charge = isNaN(numValue) ? 0 : numValue;
            }
            

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

            // Add is_active field
            payload.is_active = formState.is_active ?? true;

            // Remove metadata field (no longer used)
            delete payload.metadata;

            // Only delete media_uploads if it's truly empty (not if it has files)
            // Files are File objects and need to be preserved for upload
            if (!payload.media_uploads || (Array.isArray(payload.media_uploads) && payload.media_uploads.length === 0)) {
                delete payload.media_uploads;
            }
            // Only delete removed_media_ids if it's empty
            if (!payload.removed_media_ids || (Array.isArray(payload.removed_media_ids) && payload.removed_media_ids.length === 0)) {
                delete payload.removed_media_ids;
            }


            // Ensure all required fields are explicitly set (don't rely on spread operator alone)
            if (!payload.sku) payload.sku = '';
            if (!payload.name) payload.name = '';
            if (payload.brand_id === undefined) payload.brand_id = null;
            if (payload.category_id === undefined) payload.category_id = null;
            if (payload.making_charge === undefined) payload.making_charge = 0;

            // Ensure variants are included in payload - they must be sent to backend
            if (formState.variants && Array.isArray(formState.variants)) {
                payload.variants = formState.variants;
            } else {
                payload.variants = [];
            }

            // Ensure variant_options and other variant-related fields are included
            if (formState.variant_options !== undefined) {
                payload.variant_options = formState.variant_options;
            }
            if (formState.metal_ids !== undefined) {
                payload.metal_ids = formState.metal_ids;
            }
            if (formState.metal_purity_ids !== undefined) {
                payload.metal_purity_ids = formState.metal_purity_ids;
            }
            if (formState.metal_tone_ids !== undefined) {
                payload.metal_tone_ids = formState.metal_tone_ids;
            }
            if (formState.diamond_selections !== undefined) {
                payload.diamond_selections = formState.diamond_selections;
            }
            if (formState.colorstone_selections !== undefined) {
                payload.colorstone_selections = formState.colorstone_selections;
            }

            // Add method spoofing for PUT requests when files are present (Laravel requirement)
            if (product?.id && hasMediaUploads) {
                payload._method = 'PUT';
            }

            return payload;
        });

        const submitOptions = {
            preserveScroll: true,
            forceFormData: hasMediaUploads,
            onFinish: () => {
                // Reset transform so it doesn't affect other requests
                form.transform((data) => data);
            },
        };

        if (product?.id) {
            // Use POST with _method=PUT for file uploads (Laravel requirement)
            // Otherwise use PUT for regular updates
            if (hasMediaUploads) {
                post(route('admin.products.update', product.id), submitOptions);
            } else {
                put(route('admin.products.update', product.id), submitOptions);
            }
        } else {
            post(route('admin.products.store'), submitOptions);
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
                                {product?.id ? 'Update product' : 'Create product'}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Define product master information and atelier references.
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

                    <div className="mt-6 space-y-6">
                        {/* Basic Information Section */}
                        <div className="grid gap-6 lg:grid-cols-2">
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
                                    <span>Title Line *</span>
                                    <input
                                        type="text"
                                        value={data.titleline}
                                        onChange={(event) => setData('titleline', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder="Enter product title line"
                                    />
                                    {errors.titleline && <span className="text-xs text-rose-500">{errors.titleline}</span>}
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
                            </div>

                            <div className="space-y-4">
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
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Collection *</span>
                                    <input
                                        type="text"
                                        value={data.collection}
                                        onChange={(event) => setData('collection', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder="Enter collection name"
                                    />
                                    {errors.collection && <span className="text-xs text-rose-500">{errors.collection}</span>}
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Product Type *</span>
                                    <input
                                        type="text"
                                        value={data.producttype}
                                        onChange={(event) => setData('producttype', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder="Enter product type"
                                    />
                                    {errors.producttype && <span className="text-xs text-rose-500">{errors.producttype}</span>}
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Gender *</span>
                                    <select
                                        value={data.gender}
                                        onChange={(event) => setData('gender', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Men">Men</option>
                                        <option value="Women">Women</option>
                                        <option value="Unisex">Unisex</option>
                                        <option value="Kids">Kids</option>
                                    </select>
                                    {errors.gender && <span className="text-xs text-rose-500">{errors.gender}</span>}
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Making charge (₹) *</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.making_charge}
                                        onChange={(event) => setData('making_charge', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    {errors.making_charge && <span className="text-xs text-rose-500">{errors.making_charge}</span>}
                                </label>
                            </div>
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
                            value={localDescription}
                            onChange={handleDescriptionChange}
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
                                                    onError={(e) => {
                                                        console.error('Video load error:', mediaItem.url);
                                                        (e.target as HTMLVideoElement).style.display = 'none';
                                                    }}
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                            ) : (
                                                <img
                                                    src={mediaItem.url}
                                                    alt="Product media"
                                                    className="h-48 w-full rounded-t-3xl object-cover"
                                                    onError={(e) => {
                                                        console.error('Image load error:', mediaItem.url);
                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                                                    }}
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
                                checked={data.is_variant_product ?? true}
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
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <h3 className="text-sm font-semibold text-slate-900 mb-2">Variant Configuration Options</h3>
                                <p className="text-xs text-slate-600 mb-4">
                                    Use the configuration buttons in the variant table below to add metals (with purity and tone), diamonds, and colorstones to each variant.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 13h8l-4-4m0 8l4-4" />
                                        </svg>
                                        <span className="text-slate-700">Configure Metals</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <span className="text-slate-700">Configure Diamonds</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <span className="text-slate-700">Configure Colorstones</span>
                                    </div>
                                </div>
                            </div>
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
                                            {(data.size_values || []).length === 0 && (
                                                <span className="text-xs text-slate-400">
                                                    Add at least one size value to use in the variant matrix.
                                                </span>
                                            )}
                                        </div>
                                        {(data.size_values || []).length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {(data.size_values || []).map((value) => (
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
                                            const checked = (data.metal_ids || []).includes(metal.id);
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

                            {(data.metal_ids || []).length > 0 && (
                                <>
                                    {/* Per-metal configuration cards */}
                                    <div className="space-y-4">
                                                {metals
                                                    .filter((metal) => (data.metal_ids || []).includes(metal.id))
                                                    .map((metal) => {
                                                        const metalPurities = availablePurities.filter((p) => p.metal_id === metal.id);
                                                const metalTonesList = availableTones.filter((t) => t.metal_id === metal.id);
                                                const selectedPurities = metalPurities.filter((p) => (data.metal_purity_ids || []).includes(p.id));
                                                const selectedTones = metalTonesList.filter((t) => (data.metal_tone_ids || []).includes(t.id));
                                                
                                                // Calculate variant count for this metal (simple: purities × tones)
                                                const metalVariantCount = (() => {
                                                    if (selectedPurities.length > 0 && selectedTones.length > 0) {
                                                        return selectedPurities.length * selectedTones.length;
                                                    } else if (selectedPurities.length > 0) {
                                                        return selectedPurities.length;
                                                    } else if (selectedTones.length > 0) {
                                                        return selectedTones.length;
                                                    }
                                                    return 0;
                                                })();

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
                                                                        const checked = (data.metal_purity_ids || []).includes(purity.id);
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
                                                                        const checked = (data.metal_tone_ids || []).includes(tone.id);
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
                                                            
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                    
                                    {/* Variant count preview */}
                                    {(data.metal_ids || []).length > 0 && (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">Preview generated variants</p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        This setup will generate approximately <span className="font-semibold text-slate-900">{(data.variants || []).length}</span> variant{(data.variants || []).length !== 1 ? 's' : ''} based on your current configuration.
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

                            {/* Diamonds selection */}
                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Diamonds</h3>
                                        <p className="text-xs text-slate-500">Select diamonds and specify counts for your product variants.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addDiamondSelection}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-400 hover:bg-sky-50"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                        </svg>
                                        Add Diamond
                                    </button>
                                </div>
                                {(data.diamond_selections || []).length > 0 ? (
                                    <div className="space-y-3">
                                        {(data.diamond_selections || []).map((selection, index) => (
                                            <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                                <div className="flex-1">
                                                    <label className="mb-1 block text-xs font-semibold text-slate-600">Diamond</label>
                                                    <select
                                                        value={selection.diamond_id === '' ? '' : selection.diamond_id}
                                                        onChange={(e) => updateDiamondSelection(index, 'diamond_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    >
                                                        <option value="">Select diamond</option>
                                                        {diamonds.map((diamond) => (
                                                            <option key={diamond.id} value={diamond.id}>
                                                                {diamond.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-32">
                                                    <label className="mb-1 block text-xs font-semibold text-slate-600">Count</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={selection.count}
                                                        onChange={(e) => updateDiamondSelection(index, 'count', e.target.value)}
                                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDiamondSelection(index)}
                                                    className="mt-6 rounded-full border border-rose-200 p-2 text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                                    aria-label="Remove diamond"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">No diamonds added. Click "Add Diamond" to add one.</p>
                                )}
                            </div>

                            {/* Colorstones selection */}
                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Colorstones</h3>
                                        <p className="text-xs text-slate-500">Select colorstones and specify counts for your product variants.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addColorstoneSelection}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-400 hover:bg-sky-50"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                        </svg>
                                        Add Colorstone
                                    </button>
                                </div>
                                {(data.colorstone_selections || []).length > 0 ? (
                                    <div className="space-y-3">
                                        {(data.colorstone_selections || []).map((selection, index) => (
                                            <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                                <div className="flex-1">
                                                    <label className="mb-1 block text-xs font-semibold text-slate-600">Colorstone</label>
                                                    <select
                                                        value={selection.colorstone_id === '' ? '' : selection.colorstone_id}
                                                        onChange={(e) => updateColorstoneSelection(index, 'colorstone_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    >
                                                        <option value="">Select colorstone</option>
                                                        {colorstones.map((colorstone) => (
                                                            <option key={colorstone.id} value={colorstone.id}>
                                                                {colorstone.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-32">
                                                    <label className="mb-1 block text-xs font-semibold text-slate-600">Count</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={selection.count}
                                                        onChange={(e) => updateColorstoneSelection(index, 'count', e.target.value)}
                                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeColorstoneSelection(index)}
                                                    className="mt-6 rounded-full border border-rose-200 p-2 text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                                    aria-label="Remove colorstone"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">No colorstones added. Click "Add Colorstone" to add one.</p>
                                )}
                            </div>

                        </div>
                    )}
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900">Variant Matrix</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Configure product variants with metals, diamonds, and colorstones. The default variant powers the customer catalogue card pricing.
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
                                            <th className="px-5 py-3 text-left min-w-[250px]">Metal</th>
                                            <th className="px-5 py-3 text-left min-w-[250px]">Diamonds</th>
                                            <th className="px-5 py-3 text-left min-w-[250px]">Colorstones</th>
                                            <th className="px-5 py-3 text-left">Inventory Quantity</th>
                                            <th className="px-5 py-3 text-left">Status</th>
                                            <th className="px-5 py-3 text-left">Default</th>
                                            <th className="px-5 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                {(data.variants || []).map((variant, index) => {
                                    // Use buildVariantMeta to get the correct metal label (handles mixed tones)
                                    const meta = buildVariantMeta(variant, data);
                                    const metalLabel = meta.metalTone || '—';
                                    
                                    // Extract metal details from variant.metals array for display
                                    const variantMetals = (variant.metals || []).filter(
                                        (m) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                                    );
                                    
                                    // Calculate total metal weight
                                    const totalMetalWeight = variantMetals.reduce((sum, metal) => {
                                        const weight = parseFloat(metal.metal_weight || '0');
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
                                    
                                    // Build diamond display from variant.diamonds array (variant-specific)
                                    // Show only diamond name and count, not all details
                                    let variantDiamonds: Array<{ diamond_id: number | null; diamonds_count: string }> = [];
                                    
                                    // Check if variant has diamonds with diamond_id (from diamond_selections flow)
                                    const diamondsWithId = (variant.diamonds || [])
                                        .filter((d) => d.diamond_id !== '' && d.diamond_id !== null && d.diamond_id !== undefined)
                                        .map((d) => ({
                                            diamond_id: typeof d.diamond_id === 'number' ? d.diamond_id : Number(d.diamond_id),
                                            diamonds_count: d.diamonds_count || '',
                                        }));
                                    
                                    if (diamondsWithId.length > 0) {
                                        variantDiamonds = diamondsWithId;
                                    } else if ((variant.diamonds || []).length > 0) {
                                        // Variant has diamonds with shape/color/clarity IDs - show simplified display
                                        variantDiamonds = (variant.diamonds || []).map((d) => ({
                                            diamond_id: null, // No direct diamond_id, will show as "Diamond"
                                            diamonds_count: d.diamonds_count || '',
                                        }));
                                    } else if ((data.diamond_selections || []).length > 0) {
                                        // Fallback to product-level diamond_selections
                                        variantDiamonds = (data.diamond_selections || [])
                                            .filter((selection) => selection.diamond_id !== '' && selection.diamond_id !== null && selection.diamond_id !== undefined)
                                            .map((selection) => ({
                                                diamond_id: typeof selection.diamond_id === 'number' ? selection.diamond_id : Number(selection.diamond_id),
                                                diamonds_count: selection.count || '',
                                            }));
                                    }
                                    
                                    // Build colorstone display from variant.colorstones array (variant-specific)
                                    // Show only colorstone name and count, not all details
                                    let variantColorstones: Array<{ colorstone_id: number | null; stones_count: string }> = [];
                                    
                                    // Check if variant has colorstones with colorstone_id (from colorstone_selections flow)
                                    const colorstonesWithId = (variant.colorstones || [])
                                        .filter((c) => c.colorstone_id !== '' && c.colorstone_id !== null && c.colorstone_id !== undefined)
                                        .map((c) => ({
                                            colorstone_id: typeof c.colorstone_id === 'number' ? c.colorstone_id : Number(c.colorstone_id),
                                            stones_count: c.stones_count || '',
                                        }));
                                    
                                    if (colorstonesWithId.length > 0) {
                                        variantColorstones = colorstonesWithId;
                                    } else if ((variant.colorstones || []).length > 0) {
                                        // Variant has colorstones with shape/color/quality IDs - show simplified display
                                        variantColorstones = (variant.colorstones || []).map((c) => ({
                                            colorstone_id: null, // No direct colorstone_id, will show as "Colorstone"
                                            stones_count: c.stones_count || '',
                                        }));
                                    } else if ((data.colorstone_selections || []).length > 0) {
                                        // Fallback to product-level colorstone_selections
                                        variantColorstones = (data.colorstone_selections || [])
                                            .filter((selection) => selection.colorstone_id !== '' && selection.colorstone_id !== null && selection.colorstone_id !== undefined)
                                            .map((selection) => ({
                                                colorstone_id: typeof selection.colorstone_id === 'number' ? selection.colorstone_id : Number(selection.colorstone_id),
                                                stones_count: selection.count || '',
                                            }));
                                    }
                                    
                                    const variantMetadata = (variant.metadata ?? {}) as Record<string, FormDataConvertible>;
                                    const metaSizeValue =
                                        typeof variantMetadata.size_value === 'string' || typeof variantMetadata.size_value === 'number'
                                            ? String(variantMetadata.size_value)
                                            : '';
                                    const metaSizeUnit =
                                        variantMetadata.size_unit === 'mm' || variantMetadata.size_unit === 'cm'
                                            ? (variantMetadata.size_unit as 'mm' | 'cm')
                                            : 'cm';
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
                                                <div className="space-y-3 min-w-[250px]">
                                                    {variantMetals.length > 0 ? (
                                                        variantMetals.map((metal, metalIndex) => {
                                                            const metalName = metalMap[metal.metal_id] || 'Unknown Metal';
                                                            const purityName = metal.metal_purity_id && typeof metal.metal_purity_id === 'number'
                                                                ? metalPurities.find(p => p.id === metal.metal_purity_id)?.name || ''
                                                                : '';
                                                            const toneName = metal.metal_tone_id && typeof metal.metal_tone_id === 'number'
                                                                ? metalTones.find(t => t.id === metal.metal_tone_id)?.name || ''
                                                                : '';
                                                            const weight = metal.metal_weight || '';
                                                            
                                                            return (
                                                                <div key={metalIndex} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                                                                    {/* Metal Type */}
                                                                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                                                        <div className="text-xs font-medium text-slate-500 mb-1">Metal</div>
                                                                        <div className="text-sm font-semibold text-slate-800">{metalName}</div>
                                                                    </div>
                                                                    
                                                                    {/* Purity */}
                                                                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                                                        <div className="text-xs font-medium text-slate-500 mb-1">Purity</div>
                                                                        <div className="text-sm text-slate-700">{purityName || '—'}</div>
                                                                    </div>
                                                                    
                                                                    {/* Tone */}
                                                                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                                                        <div className="text-xs font-medium text-slate-500 mb-1">Tone</div>
                                                                        <div className="text-sm text-slate-700">{toneName || '—'}</div>
                                                                    </div>
                                                                    
                                                                    {/* Weight */}
                                                                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                                                        <div className="text-xs font-medium text-slate-500 mb-1.5">Weight (g)</div>
                                                                        <input
                                                                            type="number"
                                                                            step="0.001"
                                                                            min="0.001"
                                                                            required
                                                                            value={weight}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                updateMetalInVariant(index, metalIndex, 'metal_weight', value);
                                                                            }}
                                                                            className={`w-full rounded-lg border px-2.5 py-1.5 text-sm font-mono transition-colors ${
                                                                                (!weight || weight === '') 
                                                                                    ? 'border-rose-300 bg-rose-50 text-rose-500 focus:border-rose-400 focus:bg-white' 
                                                                                    : 'border-slate-200 bg-white text-slate-700 focus:border-sky-400'
                                                                            } focus:outline-none focus:ring-1 focus:ring-sky-200`}
                                                                            placeholder="0.000"
                                                                        />
                                                                        {(!weight || weight === '') && (
                                                                            <span className="mt-1 text-[10px] text-rose-500">Required</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-sm text-slate-400">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="space-y-3 min-w-[250px]">
                                                    {variantDiamonds.length > 0 ? (
                                                        variantDiamonds.map((diamond, diamondIndex) => {
                                                            const diamondName = diamond.diamond_id 
                                                                ? (diamonds?.find(d => d.id === diamond.diamond_id)?.name || 'Diamond')
                                                                : 'Diamond';
                                                            const count = diamond.diamonds_count || '';
                                                            
                                                            return (
                                                                <div key={diamondIndex} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                                                                    <div className="flex-1">
                                                                        <div className="text-xs font-medium text-slate-500 mb-1">Diamond</div>
                                                                        <div className="text-sm font-semibold text-slate-800">{diamondName}</div>
                                                                    </div>
                                                                    <div className="w-24">
                                                                        <div className="text-xs font-medium text-slate-500 mb-1">Count</div>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            step="1"
                                                                            required
                                                                            value={count}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                updateDiamondInVariant(index, diamondIndex, 'diamonds_count', value);
                                                                            }}
                                                                            className={`w-full rounded-lg border px-2.5 py-1.5 text-sm font-mono transition-colors ${
                                                                                (!count || count === '') 
                                                                                    ? 'border-rose-300 bg-rose-50 text-rose-500 focus:border-rose-400 focus:bg-white' 
                                                                                    : 'border-slate-200 bg-white text-slate-700 focus:border-sky-400'
                                                                            } focus:outline-none focus:ring-1 focus:ring-sky-200`}
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-sm text-slate-400">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="space-y-3 min-w-[250px]">
                                                    {variantColorstones.length > 0 ? (
                                                        variantColorstones.map((colorstone, colorstoneIndex) => {
                                                            const colorstoneName = colorstone.colorstone_id 
                                                                ? (colorstones?.find(c => c.id === colorstone.colorstone_id)?.name || 'Colorstone')
                                                                : 'Colorstone';
                                                            const count = colorstone.stones_count || '';
                                                            
                                                            return (
                                                                <div key={colorstoneIndex} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                                                                    <div className="flex-1">
                                                                        <div className="text-xs font-medium text-slate-500 mb-1">Colorstone</div>
                                                                        <div className="text-sm font-semibold text-slate-800">{colorstoneName}</div>
                                                                    </div>
                                                                    <div className="w-24">
                                                                        <div className="text-xs font-medium text-slate-500 mb-1">Count</div>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            step="1"
                                                                            required
                                                                            value={count}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                updateColorstoneInVariant(index, colorstoneIndex, 'stones_count', value);
                                                                            }}
                                                                            className={`w-full rounded-lg border px-2.5 py-1.5 text-sm font-mono transition-colors ${
                                                                                (!count || count === '') 
                                                                                    ? 'border-rose-300 bg-rose-50 text-rose-500 focus:border-rose-400 focus:bg-white' 
                                                                                    : 'border-slate-200 bg-white text-slate-700 focus:border-sky-400'
                                                                            } focus:outline-none focus:ring-1 focus:ring-sky-200`}
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-sm text-slate-400">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="flex flex-col gap-1">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        required
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
                                                        className={`w-full min-w-[100px] rounded-xl border px-3 py-1.5 text-sm text-slate-700 transition-colors ${
                                                            (variant.inventory_quantity === undefined || variant.inventory_quantity === null || variant.inventory_quantity === '')
                                                                ? 'border-rose-300 bg-rose-50 text-rose-500 focus:border-rose-400 focus:bg-white' 
                                                                : 'border-slate-200 bg-white focus:border-sky-400'
                                                        } focus:outline-none focus:ring-2 focus:ring-sky-200`}
                                                        placeholder="0"
                                                    />
                                                    {(variant.inventory_quantity === undefined || variant.inventory_quantity === null || variant.inventory_quantity === '') && (
                                                        <span className="text-[10px] text-rose-500">Required</span>
                                                    )}
                                                </div>
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
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariant(index)}
                                                        className="inline-flex items-center justify-center rounded-full border border-rose-200 p-1.5 text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                                        aria-label="Remove variant"
                                                        title="Remove Variant"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12m-9 3v6m6-6v6M10 4h4a1 1 0 0 1 1 1v1H9V5a1 1 0 0 1 1-1Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14l-.8 11.2A2 2 0 0 1 16.2 20H7.8a2 2 0 0 1-1.99-1.8L5 7Z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expandable metal management section */}
                                        {expandedMetalVariantIndices.has(index) && (
                                            <tr>
                                                <td colSpan={13} className="px-5 py-4">
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
                                                                                        value={metal.metal_weight || ''}
                                                                                        onChange={(e) => {
                                                                                            const value = e.target.value;
                                                                                            updateMetalInVariant(index, metalIndex, 'metal_weight', value);
                                                                                        }}
                                                                                        className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors ${
                                                                                            !metal.metal_weight 
                                                                                                ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:bg-white' 
                                                                                                : 'border-slate-200 bg-white focus:border-sky-400'
                                                                                        } focus:outline-none focus:ring-2 focus:ring-sky-200`}
                                                                                        placeholder="Enter weight (required)"
                                                                                    />
                                                                                    {!metal.metal_weight && (
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
                                                <td colSpan={13} className="px-5 py-4">
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
                                                                                Diamond
                                                                                <select
                                                                                    value={typeof diamond.diamond_id === 'string' || !diamond.diamond_id ? '' : String(diamond.diamond_id)}
                                                                                    onChange={(e) => updateDiamondInVariant(index, diamondIndex, 'diamond_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                                                >
                                                                                    <option value="">Select diamond</option>
                                                                                    {(diamonds || []).map((diamondOption) => (
                                                                                        <option key={diamondOption.id} value={diamondOption.id}>
                                                                                            {diamondOption.name}
                                                                                        </option>
                                                                                    ))}
                                                                                </select>
                                                                            </label>
                                                                            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                                                                Number of Diamonds
                                                                                <input
                                                                                    type="number"
                                                                                    step="1"
                                                                                    min="0"
                                                                                    value={diamond.diamonds_count}
                                                                                    onChange={(e) => updateDiamondInVariant(index, diamondIndex, 'diamonds_count', e.target.value)}
                                                                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
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
                                 {(data.variants || []).length === 0 && (
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

            </form>
        </AdminLayout>
    );
}

