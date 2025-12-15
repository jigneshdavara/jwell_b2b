import type { FormDataConvertible } from '@inertiajs/core';

/**
 * Metal entry combination for variant generation
 */
type MetalEntryCombination = {
    metal_id: number;
    metal_purity_id: number | null;
    metal_tone_id: number | null;
};

/**
 * Variant metal form structure
 */
type VariantMetalForm = {
    id?: number;
    metal_id: number | '';
    metal_purity_id: number | '';
    metal_tone_id: number | '';
    metal_weight: string;
};

/**
 * Variant form structure
 */
type VariantForm = {
    id?: number;
    sku: string;
    label: string;
    metal_id: number | '';
    metal_purity_id: number | '';
    diamond_option_key: string | null;
    size_id?: number | null;
    is_default: boolean;
    inventory_quantity?: number | string;
    metadata?: Record<string, FormDataConvertible>;
    metals?: VariantMetalForm[];
    diamonds?: Array<{
        id?: number;
        diamond_id?: number | '';
        diamonds_count?: string;
    }>;
};

/**
 * Form data structure for product editing
 */
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
    making_charge_amount: string;
    making_charge_types: ('fixed' | 'percentage')[];
    making_charge_percentage: string;
    is_active: boolean;
    variants?: VariantForm[];
    diamond_selections?: Array<{ diamond_id: number | ''; count: string }>;
    metal_selections?: Array<{
        metal_id: number | '';
        metal_purity_id: number | '';
        metal_tone_id: number | '';
        weight: string;
    }>;
    selected_metals?: number[];
    metal_configurations?: Record<number, {
        purities: number[];
        tones: number[];
    }>;
    uses_diamond?: boolean;
    catalog_ids?: number[];
    subcategory_ids?: number[];
    media_uploads?: File[];
    removed_media_ids?: number[];
    selected_sizes?: number[];
    all_sizes_available?: boolean;
};

/**
 * Category option with sizes
 */
type CategoryOption = {
    id: number;
    name: string;
    sizes?: Array<{ id: number; name: string; value?: string }>;
};

/**
 * Product with category
 */
type ProductWithCategory = {
    category?: {
        id: number;
        name: string;
        sizes?: Array<{ id: number; name: string; value?: string }>;
    } | null;
};

/**
 * Parameters for variant matrix generation
 */
type GenerateVariantMatrixParams = {
    formData: FormData;
    parentCategories: CategoryOption[];
    product?: ProductWithCategory | null;
    emptyVariant: (isDefault?: boolean) => VariantForm;
    recalculateVariants: (draft: FormData) => VariantForm[];
};

/**
 * Generates a variant matrix based on selected metals, purities, tones, and sizes.
 * 
 * This function creates all possible combinations of:
 * - Selected metals × purities × tones
 * - Combined with selected sizes (if any)
 * 
 * It preserves existing variant data (weights, diamonds, inventory) when regenerating.
 * 
 * @param params - Configuration parameters for matrix generation
 * @returns Updated form data with generated variants
 */
export function generateVariantMatrix({
    formData,
    parentCategories,
    product,
    emptyVariant,
    recalculateVariants,
}: GenerateVariantMatrixParams): FormData {
    const allMetalCombinations: MetalEntryCombination[][] = [];

    const selectedMetals = formData.selected_metals || [];
    const metalConfigurations = formData.metal_configurations || {};

    // Generate all metal combinations (metal × purity × tone)
    if (selectedMetals.length > 0) {
        selectedMetals.forEach((metalId) => {
            const config = metalConfigurations[metalId] || { purities: [], tones: [] };
            const purities = config.purities.length > 0 ? config.purities : [null];
            const tones = config.tones.length > 0 ? config.tones : [null];

            purities.forEach((purityId) => {
                tones.forEach((toneId) => {
                    allMetalCombinations.push([{
                        metal_id: metalId,
                        metal_purity_id: purityId !== null ? purityId : null,
                        metal_tone_id: toneId !== null ? toneId : null,
                    }]);
                });
            });
        });
    }

    if (allMetalCombinations.length === 0) {
        return formData;
    }

    // Handle size selection
    let selectedSizes = formData.selected_sizes || [];
    
    if (formData.all_sizes_available === true) {
        const categoryId = formData.category_id ? Number(formData.category_id) : null;
        const selectedCategory = categoryId ? parentCategories.find(cat => cat.id === categoryId) : null;
        const categorySizes = (selectedCategory && 'sizes' in selectedCategory && selectedCategory.sizes) || 
                              (product?.category?.sizes || []);
        if (categorySizes.length > 0) {
            selectedSizes = categorySizes.map((s: any) => typeof s.id === 'number' ? s.id : Number(s.id));
        }
    }
    
    // Generate combinations: metal combinations × sizes
    const combinations: Array<{
        metals: MetalEntryCombination[];
        size_id: number | null;
    }> = [];

    if (selectedSizes.length > 0) {
        allMetalCombinations.forEach((metalEntries) => {
            selectedSizes.forEach((sizeId) => {
                combinations.push({
                    metals: metalEntries,
                    size_id: sizeId,
                });
            });
        });
    } else {
        allMetalCombinations.forEach((metalEntries) => {
            combinations.push({
                metals: metalEntries,
                size_id: null,
            });
        });
    }

    if (combinations.length === 0) {
        return formData;
    }

    // Preserve existing variant data (weights, diamonds, inventory)
    const existingVariantData = new Map<string, {
        metals: Array<{ metal_id: number; metal_purity_id: number | null; metal_tone_id: number | null; metal_weight: string }>;
        diamonds: Array<{ diamond_id: number | null; diamonds_count: string }>;
        inventory_quantity?: number | string;
    }>();

    (formData.variants || []).forEach((existingVariant) => {
        if (!existingVariant.metals || existingVariant.metals.length === 0) return;

        const existingSizeId = (existingVariant as any).size_id || null;
        const sizeKey = existingSizeId ? `size-${existingSizeId}` : 'no-size';
        const metalsKey = existingVariant.metals
            .filter(m => m.metal_id !== '' && typeof m.metal_id === 'number')
            .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
            .sort()
            .join('|');

        const variantKey = `${metalsKey}::${sizeKey}`;

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
            inventory_quantity: existingVariant.inventory_quantity !== undefined && existingVariant.inventory_quantity !== null && existingVariant.inventory_quantity !== '' 
                ? existingVariant.inventory_quantity 
                : undefined,
        });
    });

    // Create new variants from combinations
    const newVariants = combinations.map((combo, index) => {
        const variant = emptyVariant(index === 0);

        const sizeKey = combo.size_id ? `size-${combo.size_id}` : 'no-size';
        const metalsKey = combo.metals
            .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
            .sort()
            .join('|');
        const variantKey = `${metalsKey}::${sizeKey}`;

        const existingData = existingVariantData.get(variantKey);

        // Map metals with preserved weights
        variant.metals = combo.metals.map((metalEntry) => {
            const existingMetal = existingData?.metals.find(
                em => em.metal_id === metalEntry.metal_id &&
                em.metal_purity_id === (metalEntry.metal_purity_id ?? null) &&
                em.metal_tone_id === (metalEntry.metal_tone_id ?? null)
            );

            // Try to get weight from metal selections
            let weightFromSelection = '';
            if ((formData.metal_selections || []).length > 0) {
                const matchingSelection = (formData.metal_selections || []).find(
                    s => {
                        const sMetalId = typeof s.metal_id === 'number' ? s.metal_id : Number(s.metal_id);
                        const sPurityId = s.metal_purity_id === '' ? null : (typeof s.metal_purity_id === 'number' ? s.metal_purity_id : Number(s.metal_purity_id));
                        const sToneId = s.metal_tone_id === '' ? null : (typeof s.metal_tone_id === 'number' ? s.metal_tone_id : Number(s.metal_tone_id));

                        return sMetalId === metalEntry.metal_id &&
                            sPurityId === (metalEntry.metal_purity_id ?? null) &&
                            sToneId === (metalEntry.metal_tone_id ?? null);
                    }
                );
                if (matchingSelection) {
                    weightFromSelection = matchingSelection.weight || '';
                }
            }

            // For new variants, set weight to empty (only preserve if existing data exists)
            // Don't use weightFromSelection - always set to empty for new variants to show as required
            let metalWeight = '';
            if (existingMetal?.metal_weight && existingMetal.metal_weight !== '') {
                // Only preserve existing weight if it has a value
                metalWeight = existingMetal.metal_weight;
            } else {
                // New variant - set to empty string (will show as required)
                metalWeight = '';
            }

            return {
                id: undefined,
                metal_id: metalEntry.metal_id,
                metal_purity_id: metalEntry.metal_purity_id ?? '',
                metal_tone_id: metalEntry.metal_tone_id ?? '',
                metal_weight: metalWeight,
            };
        });

        // Set variant metal_id and metal_purity_id from first metal
        if (combo.metals.length > 0) {
            const firstMetal = combo.metals[0];
            variant.metal_id = firstMetal.metal_id;
            if (firstMetal.metal_purity_id !== null) {
                variant.metal_purity_id = firstMetal.metal_purity_id;
            }
        }

        // Apply diamond selections to variant
        variant.diamond_option_key = null;
        
        // Apply diamond selections from formData if they exist
        const diamondSelections = formData.diamond_selections || [];
        if (diamondSelections.length > 0) {
            variant.diamonds = diamondSelections
                .filter((selection) => selection.diamond_id !== '' && selection.diamond_id !== null && selection.diamond_id !== undefined)
                .map((selection) => {
                    // Use the count from diamond_selections (user's current input) as the source of truth
                    // This ensures that when user changes the count and clicks "Generate Matrix", the new count is applied
                    const diamondId = typeof selection.diamond_id === 'number' ? selection.diamond_id : Number(selection.diamond_id);
                    
                    return {
                        id: undefined,
                        diamond_id: diamondId,
                        diamonds_count: selection.count || '',
                    };
                });
        } else {
            // If no diamond selections, preserve existing diamonds if they match the variant
            variant.diamonds = (existingData?.diamonds || [])
                .filter(d => d.diamond_id !== null)
                .map(d => ({
                    id: undefined,
                    diamond_id: d.diamond_id as number,
                    diamonds_count: d.diamonds_count,
                }));
        }
        
        variant.size_id = combo.size_id || null;

        // Set inventory_quantity to empty for new variants (preserve existing if available)
        if (existingData && existingData.inventory_quantity !== undefined && existingData.inventory_quantity !== null && existingData.inventory_quantity !== '') {
            // Preserve existing inventory quantity
            variant.inventory_quantity = typeof existingData.inventory_quantity === 'number' ? existingData.inventory_quantity : parseInt(String(existingData.inventory_quantity), 10);
        } else {
            // Set to empty/undefined for new variants (will show as required)
            variant.inventory_quantity = undefined;
        }

        // Set metadata
        const metadata: Record<string, FormDataConvertible> = {
            ...(variant.metadata ?? {}),
            status: 'enabled',
        };

        variant.metadata = metadata;

        return variant;
    });

    // Create updated form data
    const draft: FormData = {
        ...formData,
        variants: newVariants,
    };

    // Recalculate variant labels and SKUs
    draft.variants = recalculateVariants(draft);

    return draft;
}

