'use client';

import { Head } from '@/components/Head';
import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateVariantMatrix as generateVariantMatrixUtil } from '@/utils/variantMatrixGenerator';
import { useParams, useRouter } from 'next/navigation';
import { adminService } from '@/services/adminService';
import { toastSuccess, toastError } from '@/utils/toast';
import { getMediaUrl } from '@/utils/mediaUrl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, ProductFormData } from '@/lib/validation/admin.schema';
import BasicInfoSection from '@/components/ui/BasicInfoSection';
import MediaSection from '@/components/ui/MediaSection';
import VariantConfigurationSection from '@/components/ui/VariantConfigurationSection';
import ProductDescriptionSection from '@/components/ui/ProductDescriptionSection';
import type {
    VariantMetalForm,
    VariantDiamondForm,
    VariantForm,
    AdminProduct as Product,
    OptionListItem,
    OptionList,
    MetalOption,
    MetalPurityOption,
    MetalToneOption,
    CatalogOption,
    SubcategoryOption,
    AdminProductMedia as ProductMedia,
} from '@/types/product';

const emptyVariant = (isDefault = false): VariantForm => ({
    sku: '',
    label: '',
    metal_id: '',
    metal_purity_id: '',
    diamond_option_key: null,
    size_id: null,
    is_default: isDefault,
    metadata: {},
    metals: [],
    diamonds: [],
});

const createEmptyDiamond = (): VariantDiamondForm => ({
    id: undefined,
    diamond_id: '',
    diamonds_count: '',
});


export default function AdminProductEdit() {
    const params = useParams();
    const router = useRouter();
    // Handle 'new' as create mode, otherwise parse as number
    const productId = params?.id && params.id !== 'new' ? Number(params.id) : null;
    
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<Product | null>(null);
    const [brands, setBrands] = useState<OptionList>({});
    const [parentCategories, setParentCategories] = useState<OptionListItem[]>([]);
    const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
    const [catalogs, setCatalogs] = useState<CatalogOption[]>([]);
    const [diamonds, setDiamonds] = useState<OptionListItem[]>([]);
    const [metals, setMetals] = useState<MetalOption[]>([]);
    const [metalPurities, setMetalPurities] = useState<MetalPurityOption[]>([]);
    const [metalTones, setMetalTones] = useState<MetalToneOption[]>([]);
    const [sizes, setSizes] = useState<OptionListItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    // Load form options and product data
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Load form options
                const optionsResponse = await adminService.getProductFormOptions();
                const options = optionsResponse.data;
                
                // Convert brands to OptionList format
                const brandsMap: OptionList = {};
                (options.brands || []).forEach((brand: any) => {
                    brandsMap[Number(brand.id)] = brand.name;
                });
                setBrands(brandsMap);
                
                // Use parentCategories from backend (includes sizes and styles)
                // Fallback to filtering categories if parentCategories not available
                const parentCats = options.parentCategories || (options.categories || []).filter((cat: any) => !cat.parent_id);
                
                // Debug: Log to verify backend data
                
                const mappedParentCategories = parentCats.map((cat: any) => {
                    // Backend might return sizes/styles in different formats
                    // Handle both snake_case and camelCase, and check nested structures
                    let sizes: Array<{ id: number; name: string; value?: string }> = [];
                    
                    // Try multiple possible locations for sizes
                    if (Array.isArray(cat.sizes) && cat.sizes.length > 0) {
                        sizes = cat.sizes.map((s: any) => ({
                            id: typeof s.id === 'number' ? s.id : Number(s.id),
                            name: s.name || s.value || '',
                            value: s.value || s.name || '',
                        }));
                    } else if (Array.isArray(cat.size) && cat.size.length > 0) {
                        sizes = cat.size.map((s: any) => ({
                            id: typeof s.id === 'number' ? s.id : Number(s.id),
                            name: s.name || s.value || '',
                            value: s.value || s.name || '',
                        }));
                    } else if (cat.sizes_data && Array.isArray(cat.sizes_data)) {
                        sizes = cat.sizes_data.map((s: any) => ({
                            id: typeof s.id === 'number' ? s.id : Number(s.id),
                            name: s.name || s.value || '',
                            value: s.value || s.name || '',
                        }));
                    }
                    
                    // If sizes are not in category, try to get from global sizes list filtered by category
                    if (sizes.length === 0 && cat.id) {
                        // Check if there's a category_id field in the global sizes list
                        const categorySizes = (options.sizes || []).filter((s: any) => 
                            s.category_id === cat.id || s.categoryId === cat.id || s.category_id === Number(cat.id)
                        );
                        if (categorySizes.length > 0) {
                            sizes = categorySizes.map((s: any) => ({
                                id: typeof s.id === 'number' ? s.id : Number(s.id),
                                name: s.name || s.value || '',
                                value: s.value || s.name || '',
                            }));
                        }
                    }
                    
                    const styles = Array.isArray(cat.styles) && cat.styles.length > 0
                        ? cat.styles.map((s: any) => ({
                            id: typeof s.id === 'number' ? s.id : Number(s.id),
                            name: s.name || '',
                        }))
                        : [];
                    
                    return {
                        id: Number(cat.id),
                        name: cat.name,
                        sizes,
                        styles,
                    };
                });
                setParentCategories(mappedParentCategories);
                
                // Subcategories
                const subcats = (options.categories || []).filter((cat: any) => cat.parent_id);
                setSubcategories(subcats.map((cat: any) => ({ 
                    id: Number(cat.id), 
                    name: cat.name, 
                    parent_id: Number(cat.parent_id) 
                })));
                
                // Other options - Handle both snake_case and camelCase from API
                // Note: NestJS backend might not return catalogs, so we need to fetch them separately if missing
                let catalogsData = options.catalogs || [];
                
                // If catalogs are not in options, try to fetch them separately
                if (catalogsData.length === 0) {
                    try {
                        const catalogsResponse = await adminService.getCatalogs(1, 1000); // Get all catalogs
                        catalogsData = catalogsResponse.data?.data || catalogsResponse.data?.items || [];
                    } catch (error) {
                        console.error('Failed to load catalogs separately:', error);
                    }
                }
                
                setCatalogs(catalogsData.map((cat: any) => ({
                    id: Number(cat.id),
                    code: cat.code || '',
                    name: cat.name || '',
                    products_count: cat.products_count || cat.productsCount || 0,
                    display_order: cat.display_order || cat.displayOrder || 0,
                    is_active: cat.is_active ?? cat.isActive ?? true,
                })));
                setDiamonds((options.diamonds || []).map((d: any) => ({ id: Number(d.id), name: d.name })));
                setMetals((options.metals || []).map((m: any) => ({ id: Number(m.id), name: m.name })));
                // Handle both snake_case (metal_purities) and camelCase (metalPurities) from API
                const metalPuritiesData = options.metal_purities || options.metalPurities || [];
                setMetalPurities(metalPuritiesData.map((mp: any) => ({
                    id: Number(mp.id),
                    metal_id: Number(mp.metal_id || mp.metalId),
                    name: mp.name,
                    metal: mp.metals ? { id: Number(mp.metals.id), name: mp.metals.name } : null,
                    is_active: mp.is_active ?? mp.isActive ?? true,
                })));
                // Handle both snake_case (metal_tones) and camelCase (metalTones) from API
                const metalTonesData = options.metal_tones || options.metalTones || [];
                setMetalTones(metalTonesData.map((mt: any) => ({
                    id: Number(mt.id),
                    metal_id: Number(mt.metal_id || mt.metalId),
                    name: mt.name,
                    metal: mt.metals ? { id: Number(mt.metals.id), name: mt.metals.name } : null,
                    is_active: mt.is_active ?? mt.isActive ?? true,
                })));
                // Load sizes - need to fetch category-sizes relationships separately
                const sizesData = options.sizes || [];
                setSizes(sizesData.map((s: any) => ({ id: Number(s.id), name: s.name || '' })));
                
                // Optimize: Fetch all categories at once using getCategories API instead of individual getCategory calls
                // Check which categories need sizes/styles
                const categoriesNeedingDetails = mappedParentCategories.filter((cat: { id: number; name: string; sizes: Array<{ id: number; name: string; value?: string }>; styles: Array<{ id: number; name: string }> }) => 
                    (!cat.sizes || cat.sizes.length === 0) || (!cat.styles || cat.styles.length === 0)
                );
                
                // If we have categories that need details, fetch all categories at once
                if (categoriesNeedingDetails.length > 0) {
                    try {
                        // Fetch all categories with a high limit - this includes sizes and styles for each category
                        const allCategoriesResponse = await adminService.getCategories(1, 1000);
                        const allCategoriesItems = allCategoriesResponse.data?.data?.items || allCategoriesResponse.data?.items || [];
                        
                        // Create a map of category ID to category data with sizes/styles from the response
                        const categoryDetailsMap = new Map<number, { sizes: Array<{ id: number; name: string; value?: string }>; styles: Array<{ id: number; name: string }> }>();
                        
                        // Extract sizes and styles from the getCategories response
                        allCategoriesItems.forEach((categoryItem: any) => {
                            const categoryId = Number(categoryItem.id);
                            
                            // Extract sizes
                            let categorySizes: Array<{ id: number; name: string; value?: string }> = [];
                            if (categoryItem?.sizes && Array.isArray(categoryItem.sizes)) {
                                categorySizes = categoryItem.sizes.map((s: { id: number | string; name?: string; value?: string }) => ({
                                    id: typeof s.id === 'number' ? s.id : Number(s.id),
                                    name: s.name || s.value || '',
                                    value: s.value || s.name || '',
                                }));
                            }
                            
                            // Extract styles
                            let categoryStyles: Array<{ id: number; name: string }> = [];
                            if (categoryItem?.styles && Array.isArray(categoryItem.styles)) {
                                categoryStyles = categoryItem.styles.map((s: { id: number | string; name?: string }) => ({
                                    id: typeof s.id === 'number' ? s.id : Number(s.id),
                                    name: s.name || '',
                                }));
                            }
                            
                            if (categorySizes.length > 0 || categoryStyles.length > 0) {
                                categoryDetailsMap.set(categoryId, { sizes: categorySizes, styles: categoryStyles });
                            }
                        });
                        
                        // Update parentCategories with fetched sizes/styles from the single API call
                        const updatedParentCategories = mappedParentCategories.map((cat: { id: number; name: string; sizes: Array<{ id: number; name: string; value?: string }>; styles: Array<{ id: number; name: string }> }) => {
                            const details = categoryDetailsMap.get(cat.id);
                            if (details) {
                                return {
                                    ...cat,
                                    sizes: details.sizes.length > 0 ? details.sizes : cat.sizes,
                                    styles: details.styles.length > 0 ? details.styles : cat.styles,
                                };
                            }
                            return cat;
                        });
                        
                        setParentCategories(updatedParentCategories);
                    } catch (error) {
                        console.error('Failed to fetch category sizes/styles:', error);
                        // Continue with categories without sizes if fetch fails
                        setParentCategories(mappedParentCategories);
                    }
                } else {
                    // All categories already have sizes/styles, no need to fetch
                    setParentCategories(mappedParentCategories);
                }
                
                // Load product if editing
                if (productId) {
                    const productResponse = await adminService.getProduct(productId);
                    const productData = productResponse.data;
                    setProduct(productData);
                }
            } catch (error: any) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [productId]);

    const extractSelectionsFromVariants = useMemo(() => {
        if (!product?.variants?.length) {
            return {
                metalPurityIds: [] as number[],
                metalToneIds: [] as number[],
                diamondSelections: [] as Array<{ diamond_id: number; count: string }>,
                metalSelections: [] as Array<{ metal_id: number; metal_purity_id: number; metal_tone_id: number; weight: string }>,
                selectedMetals: [] as number[],
                metalConfigurations: {} as Record<number, { purities: number[]; tones: number[] }>,
            };
        }

        const metalPurityIdsSet = new Set<number>();
        const metalToneIdsSet = new Set<number>();
        const diamondSelectionsMap = new Map<number, { diamond_id: number; count: string }>();
        const metalSelectionsMap = new Map<string, { metal_id: number; metal_purity_id: number; metal_tone_id: number; weight: string }>();

        const selectedMetalsSet = new Set<number>();
        const metalConfigurationsMap = new Map<number, { purities: Set<number>; tones: Set<number> }>();

        product.variants.forEach((variant: any) => {
            if (variant.metals?.length) {
                variant.metals.forEach((metal: any) => {
                    if (metal.metal_id && metal.metal_id !== '' && metal.metal_id !== null) {
                        const metalId = typeof metal.metal_id === 'number' ? metal.metal_id : Number(metal.metal_id);

                        let purityIdValue = metal.metal_purity_id;
                        if ((purityIdValue === null || purityIdValue === undefined || purityIdValue === '' || purityIdValue === 0) && metal.metal_purity) {
                            purityIdValue = metal.metal_purity.id;
                        }

                        let toneIdValue = metal.metal_tone_id;
                        if ((toneIdValue === null || toneIdValue === undefined || toneIdValue === '' || toneIdValue === 0) && metal.metal_tone) {
                            toneIdValue = metal.metal_tone.id;
                        }

                        const purityId = purityIdValue && purityIdValue !== '' && purityIdValue !== 0
                            ? (typeof purityIdValue === 'number' ? purityIdValue : Number(purityIdValue))
                            : 0;
                        const toneId = toneIdValue && toneIdValue !== '' && toneIdValue !== 0
                            ? (typeof toneIdValue === 'number' ? toneIdValue : Number(toneIdValue))
                            : 0;
                        const weight = metal.metal_weight ? String(metal.metal_weight) : '';
                        const key = `${metalId}-${purityId}-${toneId}`;
                        if (!metalSelectionsMap.has(key)) {
                            metalSelectionsMap.set(key, {
                                metal_id: metalId,
                                metal_purity_id: purityId || 0,
                                metal_tone_id: toneId || 0,
                                weight: weight,
                            });
                        }

                        if (!isNaN(metalId) && metalId > 0) {
                            selectedMetalsSet.add(metalId);

                            if (!metalConfigurationsMap.has(metalId)) {
                                metalConfigurationsMap.set(metalId, { purities: new Set<number>(), tones: new Set<number>() });
                            }

                            const config = metalConfigurationsMap.get(metalId)!;
                            if (!isNaN(purityId) && purityId > 0) {
                                config.purities.add(purityId);
                                metalPurityIdsSet.add(purityId);
                            }
                            if (!isNaN(toneId) && toneId > 0) {
                                config.tones.add(toneId);
                                metalToneIdsSet.add(toneId);
                            }
                        }
                    }
                });
            }

            if (variant.diamonds?.length) {
                variant.diamonds.forEach((diamond: any) => {
                    if (diamond.diamond_id && diamond.diamond_id !== '' && diamond.diamond_id !== null) {
                        const diamondId = typeof diamond.diamond_id === 'number' ? diamond.diamond_id : Number(diamond.diamond_id);
                        if (!diamondSelectionsMap.has(diamondId)) {
                            diamondSelectionsMap.set(diamondId, {
                                diamond_id: diamondId,
                                count: diamond.diamonds_count && diamond.diamonds_count !== '' && diamond.diamonds_count !== null ? String(diamond.diamonds_count) : '',
                            });
                        }
                    }
                });
            }
        });

        const metalConfigurations: Record<number, { purities: number[]; tones: number[] }> = {};
        metalConfigurationsMap.forEach((config, metalId) => {
            metalConfigurations[metalId] = {
                purities: Array.from(config.purities),
                tones: Array.from(config.tones),
            };
        });

        return {
            metalPurityIds: Array.from(metalPurityIdsSet),
            metalToneIds: Array.from(metalToneIdsSet),
            diamondSelections: Array.from(diamondSelectionsMap.values()),
            metalSelections: Array.from(metalSelectionsMap.values()).map(m => ({
                metal_id: m.metal_id,
                metal_purity_id: m.metal_purity_id || '',
                metal_tone_id: m.metal_tone_id || '',
                weight: m.weight,
            })),
            selectedMetals: Array.from(selectedMetalsSet),
            metalConfigurations: metalConfigurations,
        };
    }, [product]);

    // Initialize form data from product
    const getInitialFormData = useMemo((): ProductFormData => ({
        sku: product?.sku ?? '',
        name: product?.name ?? '',
        titleline: product?.titleline ?? '',
        description: product?.description ?? '',
        catalog_ids: product?.catalog_ids ?? [],
        subcategory_ids: (product?.subcategory_ids ?? []).map((id: any) => Number(id)).filter((id: any) => !isNaN(id) && id > 0),
        brand_id: product?.brand_id ? String(product.brand_id) : '',
        category_id: product?.category_id ? String(product.category_id) : '',
        style_ids: (product?.style_ids || []).map((id: any) => Number(id)).filter((id: any) => !isNaN(id) && id > 0),
        collection: product?.collection ?? '',
        producttype: product?.producttype ?? '',
        gender: (product?.gender && ['Men', 'Women', 'Unisex', 'Kids'].includes(product.gender)) ? product.gender as 'Men' | 'Women' | 'Unisex' | 'Kids' : 'Men',
        making_charge_amount: product?.making_charge_amount ? String(product.making_charge_amount) : '',
        making_charge_types: (() => {
            const hasFixed = product?.making_charge_amount && Number(product.making_charge_amount) > 0;
            const hasPercentage = product?.making_charge_percentage && Number(product.making_charge_percentage) > 0;
            if (hasFixed && hasPercentage) return ['fixed', 'percentage'];
            if (hasPercentage) return ['percentage'];
            if (hasFixed) return ['fixed'];
            return ['fixed'];
        })(),
        making_charge_percentage: product?.making_charge_percentage ? String(product.making_charge_percentage) : '',
        is_active: product?.is_active ?? true,
        variants: product?.variants?.length
            ? product.variants.map((variant: any, index: number) => {
                  const firstMetal = variant.metals && variant.metals.length > 0 ? variant.metals[0] : null;
                  const metalId = firstMetal?.metal_id ?? (variant.metadata?.metal_id ?? '');
                  const metalPurityId = firstMetal?.metal_purity_id ?? (variant.metadata?.metal_purity_id ?? '');
                  const diamondOptionKey = variant.metadata?.diamond_option_key ?? null;

                  return {
                      id: variant.id,
                      sku: variant.sku ?? '',
                      label: variant.label ?? '',
                      metal_id: metalId !== '' && metalId !== null && metalId !== undefined ? (typeof metalId === 'number' ? metalId : Number(metalId)) : '',
                      metal_purity_id: metalPurityId !== '' && metalPurityId !== null && metalPurityId !== undefined ? (typeof metalPurityId === 'number' ? metalPurityId : Number(metalPurityId)) : '',
                      diamond_option_key: diamondOptionKey,
                      size_id: variant.size_id ?? null,
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
                  };
              })
            : [emptyVariant(true)],
        uses_diamond: (extractSelectionsFromVariants.diamondSelections?.length ?? 0) > 0,
        diamond_selections: extractSelectionsFromVariants.diamondSelections ?? [],
        metal_selections: (extractSelectionsFromVariants.metalSelections ?? []).map((m: any) => ({
            metal_id: typeof m.metal_id === 'number' ? m.metal_id : Number(m.metal_id),
            metal_purity_id: typeof m.metal_purity_id === 'number' ? m.metal_purity_id : Number(m.metal_purity_id),
            metal_tone_id: typeof m.metal_tone_id === 'number' ? m.metal_tone_id : Number(m.metal_tone_id),
            weight: String(m.weight ?? ''),
        })),
        selected_metals: extractSelectionsFromVariants.selectedMetals ?? [],
        metal_configurations: extractSelectionsFromVariants.metalConfigurations ?? {},
        all_sizes_available: (() => {
            if (product?.category?.sizes && product.category.sizes.length > 0 && product?.variants && product.variants.length > 0) {
                const categorySizeIds = product.category.sizes
                    .map((s: any) => typeof s.id === 'number' ? s.id : Number(s.id))
                    .filter((id: any) => !isNaN(id))
                    .sort();
                
                const variantSizeIds = product.variants
                    .map((v: any) => {
                        const sizeId = v.size_id;
                        return sizeId !== null && sizeId !== undefined ? (typeof sizeId === 'number' ? sizeId : Number(sizeId)) : null;
                    })
                    .filter((id: any) => id !== null && !isNaN(id))
                    .sort()
                    .filter((v: any, i: number, arr: any[]) => arr.indexOf(v) === i);
                
                if (variantSizeIds.length === 0) {
                    return undefined;
                }
                
                const allSizesMatch = categorySizeIds.length === variantSizeIds.length && 
                    categorySizeIds.every((categoryId: any) => variantSizeIds.includes(categoryId));
                
                if (allSizesMatch) {
                    return true;
                } else {
                    return false;
                }
            }
            return undefined;
        })(),
        selected_sizes: (() => {
            if (product?.variants && product.variants.length > 0) {
                // Extract all unique size IDs from variants
                const variantSizeIds = product.variants
                    .map((v: any) => {
                        const sizeId = v.size_id;
                        return sizeId !== null && sizeId !== undefined ? (typeof sizeId === 'number' ? sizeId : Number(sizeId)) : null;
                    })
                    .filter((id: number | null): id is number => id !== null && !isNaN(id));
                
                // Remove duplicates
                const uniqueSizeIds = Array.from(new Set(variantSizeIds));
                
                return uniqueSizeIds;
            }
            return [];
        })(),
        show_all_variants_by_size: product?.metadata?.show_all_variants_by_size ?? true,
        media_uploads: [],
        removed_media_ids: [],
    }), [product, extractSelectionsFromVariants]);

    // Initialize React Hook Form
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        clearErrors,
        formState: { errors: formErrors, isSubmitting },
        reset,
        trigger,
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: getInitialFormData as any,
    });

    // Update form when product loads
    useEffect(() => {
        if (!productId || (productId && product !== null)) {
            reset(getInitialFormData as any);
        }
    }, [product, productId, getInitialFormData, reset]);

    // Watch form values for reactive updates
    const data = watch();

    // Helper function for setValue that supports string field name pattern
    const setDataField = (field: string, value: any) => {
        setValue(field as any, value, { shouldValidate: true });
        // Clear error for this field when user starts typing (Laravel-style validation)
        if (formErrors[field as keyof typeof formErrors]) {
            clearErrors(field as any);
        }
        // Also clear from separate errors state (for API errors)
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const [localDescription, setLocalDescription] = useState(data?.description || '');
    const descriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Ensure show_all_variants_by_size defaults to true when sizes are selected
    useEffect(() => {
        if ((data?.selected_sizes || []).length > 0 && data?.show_all_variants_by_size === undefined) {
            setValue('show_all_variants_by_size', true);
        }
    }, [data?.selected_sizes, data?.show_all_variants_by_size, setValue]);

    useEffect(() => {
        if (data?.description !== localDescription) {
            setLocalDescription(data?.description || '');
        }
    }, [data?.description]);

    const handleDescriptionChange = useCallback((value: string) => {
        setLocalDescription(value);
        // Clear error when user starts typing
        if (errors.description) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.description;
                return newErrors;
            });
        }
        if (descriptionTimeoutRef.current) {
            clearTimeout(descriptionTimeoutRef.current);
        }
        descriptionTimeoutRef.current = setTimeout(() => {
            setDataField('description', value);
        }, 300);
    }, [errors.description]);

    useEffect(() => {
        return () => {
            if (descriptionTimeoutRef.current) {
                clearTimeout(descriptionTimeoutRef.current);
            }
        };
    }, []);

    const [expandedDiamondVariantIndices, setExpandedDiamondVariantIndices] = useState<Set<number>>(new Set());
    const [expandedMetalVariantIndices, setExpandedMetalVariantIndices] = useState<Set<number>>(new Set());
    // Separate state for generated variant matrix (for display only, not saved to form until submit)
    const [generatedMatrixVariants, setGeneratedMatrixVariants] = useState<VariantForm[]>([]);
    // Store the show_all_variants_by_size setting used when generating the matrix
    const [generatedShowAllVariantsBySize, setGeneratedShowAllVariantsBySize] = useState<boolean | undefined>(undefined);
    // Client-side validation error for metal selection
    const [metalSelectionError, setMetalSelectionError] = useState<string | null>(null);

    // Initialize generatedMatrixVariants from existing product variants when editing
    useEffect(() => {
        if (product?.id && product?.variants && product.variants.length > 0 && generatedMatrixVariants.length === 0) {
            // Format existing variants to match VariantForm structure
            const formattedVariants: VariantForm[] = product.variants.map((variant: any) => {
                // Format metals
                const formattedMetals: VariantMetalForm[] = (variant.metals || []).map((metal: any) => ({
                    id: metal.id,
                    metal_id: metal.metal_id ?? '',
                    metal_purity_id: metal.metal_purity_id ?? '',
                    metal_tone_id: metal.metal_tone_id ?? '',
                    metal_weight: metal.metal_weight ? String(metal.metal_weight) : '',
                }));

                // Format diamonds
                const formattedDiamonds: VariantDiamondForm[] = (variant.diamonds || []).map((diamond: any) => ({
                    id: diamond.id,
                    diamond_id: diamond.diamond_id ?? '',
                    diamonds_count: diamond.diamonds_count ? String(diamond.diamonds_count) : '',
                }));

                return {
                    id: variant.id,
                    sku: variant.sku ?? '',
                    label: variant.label ?? '',
                    metal_id: variant.metals?.[0]?.metal_id ?? '',
                    metal_purity_id: variant.metals?.[0]?.metal_purity_id ?? '',
                    diamond_option_key: variant.metadata?.diamond_option_key ?? null,
                    size_id: variant.metadata?.size_id ?? variant.size_id ?? null,
                    is_default: variant.is_default ?? false,
                    inventory_quantity: variant.inventory_quantity ?? 0,
                    metadata: variant.metadata ?? {},
                    metals: formattedMetals,
                    diamonds: formattedDiamonds,
                };
            });

            setGeneratedMatrixVariants(formattedVariants);
            
            // Also set the show_all_variants_by_size based on existing variants
            // If all variants have the same metal configuration but different sizes, it was likely "show all"
            setGeneratedShowAllVariantsBySize(product?.metadata?.show_all_variants_by_size ?? true);
        }
    }, [product?.id, product?.variants]);

    const formatDecimal = (value: number): string => {
        if (!Number.isFinite(value)) {
            return '';
        }

        return value.toFixed(3).replace(/\.?0+$/, '');
    };


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

    const buildVariantMeta = useCallback(
        (variant: VariantForm, state: ProductFormData) => {
            let metalLabel = '';

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
                    const metalsByMetalId = new Map<number, typeof metalsData>();
                    metalsData.forEach((metal) => {
                        if (!metalsByMetalId.has(metal.metal_id)) {
                            metalsByMetalId.set(metal.metal_id, []);
                        }
                        metalsByMetalId.get(metal.metal_id)!.push(metal);
                    });

                    const metalLabelParts: string[] = [];

                    metalsByMetalId.forEach((metalsInGroup, metalId) => {
                        const metalName = metalMap[metalId] ?? '';
                        if (!metalName) return;

                        const uniquePurities = new Set(metalsInGroup.map((m) => m.metal_purity_id).filter(Boolean));
                        const uniqueTones = new Set(metalsInGroup.map((m) => m.metal_tone_id).filter(Boolean));

                        let groupLabel = '';

                        if (uniquePurities.size > 1 && uniqueTones.size === 1) {
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

                    metalLabel = metalLabelParts.join(' / ');
                }
            } else if (variant.metal_id !== '' && typeof variant.metal_id === 'number') {
                const metalName = metalMap[variant.metal_id] ?? '';
                if (variant.metal_purity_id !== '' && typeof variant.metal_purity_id === 'number') {
                    const purityLabel = metalPurityMap[variant.metal_purity_id] ?? '';
                    metalLabel = purityLabel ? `${purityLabel} ${metalName}` : metalName;
                } else {
                    metalLabel = metalName;
                }
            }

            // Diamond label removed - only metal details will be in variant label
            // Diamonds are still stored in metadata but not shown in the label

            const rawMetadata = (variant.metadata ?? {}) as Record<string, any>;
            const sizeLabel = '';

            // Only include metal label and size label (no diamond label)
            const autoLabelParts = [metalLabel, sizeLabel].filter(Boolean);
            const autoLabel = autoLabelParts.length ? autoLabelParts.join(' / ') : 'Variant';
            const metalTone = metalLabel;

            let diamondMetadata = null;
            if (variant.diamonds && variant.diamonds.length > 0) {
                diamondMetadata = variant.diamonds.map((diamond) => ({
                    diamond_id: diamond.diamond_id !== '' && diamond.diamond_id !== null ? Number(diamond.diamond_id) : null,
                    diamonds_count: diamond.diamonds_count ? Number(diamond.diamonds_count) : null,
                }));
            }

            const metadata: Record<string, any> = {
                metal_id: variant.metal_id !== '' && variant.metal_id !== null ? Number(variant.metal_id) : null,
                metal_purity_id:
                    variant.metal_purity_id !== '' && variant.metal_purity_id !== null ? Number(variant.metal_purity_id) : null,
                diamond_option_key: variant.diamond_option_key ?? null,
                diamond: diamondMetadata,
                auto_label: autoLabel,
            };

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
                sizeText: sizeLabel,
                metadata,
            };
        },
        [formatDecimal, metalMap, metalPurityMap, metalToneMap],
    );

    const recalculateVariants = useCallback(
        (draft: ProductFormData) =>
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





    const addDiamondSelection = () => {
        const currentSelections = watch('diamond_selections') || [];
        setValue('diamond_selections', [...currentSelections, { diamond_id: '', count: '' }] as any);
    };

    const removeDiamondSelection = (index: number) => {
        const currentSelections = watch('diamond_selections') || [];
        setValue('diamond_selections', currentSelections.filter((_, i) => i !== index) as any);
    };

    const updateDiamondSelection = (index: number, field: 'diamond_id' | 'count', value: number | string) => {
        const currentSelections = watch('diamond_selections') || [];
        const updatedSelections = currentSelections.map((selection, i) => {
            if (i !== index) return selection;
            return {
                ...selection,
                [field]: value,
            };
        });
        setValue('diamond_selections', updatedSelections as any);
    };

    // Helper function to generate a unique key for a variant
    const getVariantUniqueKey = (v: VariantForm): string => {
        // Use ID if available (most reliable)
        if (v.id) {
            return `id:${v.id}`;
        }
        
        // Use SKU if available
        if (v.sku && v.sku.trim()) {
            return `sku:${v.sku}`;
        }
        
        // Generate composite key from distinguishing properties
        const metalsKey = JSON.stringify((v.metals || []).map(m => ({
            metal_id: m.metal_id,
            metal_purity_id: m.metal_purity_id,
            metal_tone_id: m.metal_tone_id,
        })).sort());
        
        const variantMetadata = (v.metadata ?? {}) as Record<string, any>;
        const sizeId = v.size_id ?? variantMetadata.size_id ?? null;
        const diamondOptionKey = v.diamond_option_key ?? variantMetadata.diamond_option_key ?? null;
        const colorstoneOptionKey = variantMetadata.colorstone_option_key ?? null;
        
        // Create a unique key combining all distinguishing properties
        return `composite:${metalsKey}:size:${sizeId}:diamond:${diamondOptionKey}:colorstone:${colorstoneOptionKey}:label:${v.label || ''}`;
    };

    const removeVariant = (index: number, variant?: VariantForm) => {
        // Update generatedMatrixVariants if it's being used (what's displayed in table)
        if (generatedMatrixVariants.length > 0) {
            if (generatedMatrixVariants.length === 1) {
                // Don't allow removing the last variant
                return;
            }

            setGeneratedMatrixVariants((prev) => {
                let remaining: VariantForm[];
                
                // If variant object is provided, use it to find the exact variant to remove
                // This is more reliable than using index, especially when variants are grouped
                if (variant) {
                    // Generate unique key for the variant to remove
                    const targetKey = getVariantUniqueKey(variant);
                    
                    // Filter out the variant that matches the unique key
                    remaining = prev.filter((v) => {
                        const variantKey = getVariantUniqueKey(v);
                        // Keep variants that don't match the target key
                        return variantKey !== targetKey;
                    });
                    
                    // If no match found by variant object, fall back to index
                    if (remaining.length === prev.length) {
                        remaining = prev.filter((_, idx: number) => idx !== index);
                    }
                } else {
                    // Fall back to index-based removal
                    remaining = prev.filter((_, idx: number) => idx !== index);
                }
                
                // Ensure at least one variant is marked as default
                if (remaining.every((v) => !v.is_default) && remaining.length > 0) {
                    remaining[0].is_default = true;
                }

                return remaining;
            });
        } else {
            // Update form variants if generatedMatrixVariants is not being used
            const currentVariants = watch('variants') || [];
            if (currentVariants.length <= 1) {
                return;
            }

            const remaining = currentVariants.filter((_, idx: number) => idx !== index);
            if (remaining.every((variant: any) => !variant.is_default) && remaining.length > 0) {
                remaining[0].is_default = true;
            }

            const draft: ProductFormData = {
                ...watch(),
                variants: remaining.map(v => ({
                    ...v,
                    metals: v.metals ?? [],
                    diamonds: v.diamonds ?? [],
                })) as VariantForm[],
            };

            const recalculated = recalculateVariants(draft);
            setValue('variants', recalculated.map(v => ({
                ...v,
                metals: v.metals ?? [],
                diamonds: v.diamonds ?? [],
            })) as VariantForm[]);
        }
    };

    const updateVariant = (index: number, field: keyof VariantForm, value: string | boolean | number | null) => {
        // Update generatedMatrixVariants (what's displayed in table)
        setGeneratedMatrixVariants((prev) => {
            if (prev.length === 0) return prev;
            
            const targetVariant = prev[index];
            if (!targetVariant) return prev;
            
            // If "Show all variants" is unchecked, inventory_quantity is common for all variants with same metal
            // If "Show all variants" is checked, inventory_quantity is separate for each variant
            const shouldGroupUpdate = (watch('show_all_variants_by_size') === false) 
                && (field === 'inventory_quantity');
            
            // For sku, label, is_default: group when all_sizes_available OR show_all_variants_by_size is false
            const shouldGroupOtherFields = (watch('all_sizes_available') === true || watch('show_all_variants_by_size') === false) 
                && (field === 'sku' || field === 'label' || field === 'is_default');
            
            if (shouldGroupUpdate || shouldGroupOtherFields) {
                const targetMetals = (targetVariant.metals || []).filter(
                    (m) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                );
                const targetMetalsKey = targetMetals
                    .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                    .sort()
                    .join('|');
                
                return prev.map((variant: VariantForm) => {
                    const variantMetals = (variant.metals || []).filter(
                        (m) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                    );
                    const variantMetalsKey = variantMetals
                        .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                        .sort()
                        .join('|');
                    
                    if (variantMetalsKey === targetMetalsKey) {
                        const updated = { ...variant };
                        switch (field) {
                            case 'is_default':
                                if (typeof value === 'boolean') updated.is_default = value;
                                break;
                            case 'sku':
                            case 'label':
                                if (typeof value === 'string') updated[field] = value;
                                break;
                            case 'inventory_quantity':
                                if (value === '' || value === null) {
                                    updated[field] = 0;
                                } else if (typeof value === 'string') {
                                    const numVal = parseInt(value, 10);
                                    updated[field] = isNaN(numVal) ? 0 : numVal;
                                } else if (typeof value === 'number') {
                                    updated[field] = value;
                                }
                                break;
                        }
                        return updated;
                    }
                    return variant;
                });
            }
            
            // Update single variant
            return prev.map((variant: VariantForm, idx: number) => {
                if (idx !== index) return variant;
                
                const updated = { ...variant };
                switch (field) {
                    case 'is_default':
                        if (typeof value === 'boolean') updated.is_default = value;
                        break;
                    case 'sku':
                    case 'label':
                        if (typeof value === 'string') updated[field] = value;
                        break;
                    case 'inventory_quantity':
                        if (value === '' || value === null) {
                            updated[field] = 0;
                        } else if (typeof value === 'string') {
                            const numVal = parseInt(value, 10);
                            updated[field] = isNaN(numVal) ? 0 : numVal;
                        } else if (typeof value === 'number') {
                            updated[field] = value;
                        }
                        break;
                }
                return updated;
            });
        });
        
            // Also update form data (for backward compatibility, though we regenerate on submit)
            const currentVariants = watch('variants') || [];
            if (currentVariants.length === 0) return;
            const targetVariant = currentVariants[index];
            if (!targetVariant) return;
            
            // If "Show all variants" is unchecked, inventory_quantity is common for all variants with same metal
            // If "Show all variants" is checked, inventory_quantity is separate for each variant
            const shouldGroupUpdate = (watch('show_all_variants_by_size') === false) 
                && (field === 'inventory_quantity');
            
            // For sku, label, is_default: group when all_sizes_available OR show_all_variants_by_size is false
            const shouldGroupOtherFields = (watch('all_sizes_available') === true || watch('show_all_variants_by_size') === false) 
                && (field === 'sku' || field === 'label' || field === 'is_default');
            
            let updatedVariants: any[];
            
            if (shouldGroupUpdate || shouldGroupOtherFields) {
                const targetMetals = (targetVariant.metals || []).filter(
                    (m: any) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                );
                const targetMetalsKey = targetMetals
                    .map((m: any) => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                    .sort()
                    .join('|');
                
                updatedVariants = currentVariants.map((variant: any) => {
                    const variantMetals = (variant.metals || []).filter(
                        (m: any) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                    );
                    const variantMetalsKey = variantMetals
                        .map((m: any) => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                        .sort()
                        .join('|');
                    
                    if (variantMetalsKey === targetMetalsKey) {
                        return {
                            ...variant,
                            [field]: value,
                        } as VariantForm;
                    }
                    return variant;
                });
            } else {
                updatedVariants = currentVariants.map((variant: any, idx: number) => {
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
                        case 'sku':
                        case 'label':
                            if (typeof value === 'string') {
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
            }

            const draft: ProductFormData = {
                ...watch(),
                variants: updatedVariants.map(v => ({
                    ...v,
                    metals: v.metals ?? [],
                    diamonds: v.diamonds ?? [],
                })) as VariantForm[],
            };

            const recalculated = recalculateVariants(draft);
            setValue('variants', recalculated.map(v => ({
                ...v,
                metals: v.metals ?? [],
                diamonds: v.diamonds ?? [],
            })) as VariantForm[]);
    };

    const updateVariantMetadata = (index: number, changes: Record<string, any | null>) => {
        // Update generatedMatrixVariants
        setGeneratedMatrixVariants((prev) => {
            if (prev.length === 0) return prev;
            return prev.map((variant: VariantForm, idx: number) => {
                if (idx !== index) {
                    return variant;
                }

                const metadata = { ...(variant.metadata ?? {}) } as Record<string, any>;

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
        });
        
        // Also update form data (for backward compatibility)
        const currentVariants = watch('variants') || [];
        if (currentVariants.length > 0) {
            const updatedVariants = currentVariants.map((variant: any, idx: number) => {
                if (idx !== index) {
                    return variant;
                }

                const metadata = { ...(variant.metadata ?? {}) } as Record<string, any>;

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

            const recalculated = recalculateVariants({
                ...watch(),
                variants: updatedVariants.map(v => ({
                    ...v,
                    metals: v.metals ?? [],
                    diamonds: v.diamonds ?? [],
                })) as VariantForm[],
            });

            setValue('variants', recalculated.map(v => ({
                ...v,
                metals: v.metals ?? [],
                diamonds: v.diamonds ?? [],
            })) as VariantForm[]);
        }
    };

    const markDefault = (index: number) => {
        // Update generatedMatrixVariants
        setGeneratedMatrixVariants((prev) => {
            if (prev.length === 0) return prev;
            return prev.map((variant: VariantForm, idx: number) => ({
                ...variant,
                is_default: idx === index,
            }));
        });
        
        // Also update form data (for backward compatibility)
        const currentVariants = watch('variants') || [];
        setValue('variants', currentVariants.map((variant: VariantForm, idx: number) => ({
            ...variant,
            is_default: idx === index,
            metals: variant.metals ?? [],
            diamonds: variant.diamonds ?? [],
        })) as VariantForm[]);
    };

    const addDiamondToVariant = (variantIndex: number) => {
        const prev = data;
        if (prev && prev.variants) {
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
            setValue('variants', variants.map(v => ({
                ...v,
                metals: v.metals ?? [],
                diamonds: v.diamonds ?? [],
            })) as VariantForm[]);
        }
    };

    const removeDiamondFromVariant = (variantIndex: number, diamondIndex: number) => {
        const prev = data;
        if (prev && prev.variants) {
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
            setValue('variants', variants.map(v => ({
                ...v,
                metals: v.metals ?? [],
                diamonds: v.diamonds ?? [],
            })) as VariantForm[]);
        }
    };

    const updateDiamondInVariant = (
        variantIndex: number,
        diamondIndex: number,
        field: keyof VariantDiamondForm,
        value: string | number | '',
    ) => {
        const prev = data;
        if (prev && prev.variants) {
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
            setValue('variants', variants.map(v => ({
                ...v,
                metals: v.metals ?? [],
                diamonds: v.diamonds ?? [],
            })) as VariantForm[]);
        }
    };

    const updateMetalInVariant = (
        variantIndex: number,
        metalIndex: number,
        field: keyof VariantMetalForm,
        value: string | number | '',
    ) => {
        // Update generatedMatrixVariants first (what's displayed in table)
        setGeneratedMatrixVariants((prev) => {
            if (prev.length === 0) return prev;
            
            const targetVariant = prev[variantIndex];
            if (!targetVariant) return prev;
            
            // If "Show all variants" is unchecked, weight is common for all variants with same metal
            // If "Show all variants" is checked, weight is separate for each variant
            const shouldGroupUpdate = watch('show_all_variants_by_size') === false;
            
            if (shouldGroupUpdate) {
                const targetMetals = (targetVariant.metals || []).filter(
                    (m) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                );
                const targetMetalsKey = targetMetals
                    .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                    .sort()
                    .join('|');
                
                return prev.map((variant: VariantForm) => {
                    const variantMetals = (variant.metals || []).filter(
                        (m) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                    );
                    const variantMetalsKey = variantMetals
                        .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                        .sort()
                        .join('|');
                    
                    if (variantMetalsKey === targetMetalsKey) {
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
                    }
                    return variant;
                });
            }
            
            // Update single variant
            return prev.map((variant: VariantForm, idx: number) => {
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
        });
        
        // Also update form data (for backward compatibility)
        const currentVariants = watch('variants') || [];
        const targetVariant = currentVariants[variantIndex];
        if (!targetVariant) return;
        
        // If "Show all variants" is unchecked, weight is common for all variants with same metal
        // If "Show all variants" is checked, weight is separate for each variant
        const shouldGroupUpdate = watch('show_all_variants_by_size') === false;
        
        let updatedVariants: VariantForm[];
        
        if (shouldGroupUpdate) {
            const targetMetals = (targetVariant.metals || []).filter(
                (m) => m.metal_id !== '' && m.metal_id !== null && (typeof m.metal_id === 'number' || (typeof m.metal_id === 'string' && !isNaN(Number(m.metal_id))))
            );
            const targetMetalsKey = targetMetals
                .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                .sort()
                .join('|');
            
            updatedVariants = currentVariants.map((variant: VariantForm) => {
                const variantMetals = (variant.metals || []).filter(
                    (m) => m.metal_id !== '' && m.metal_id !== null && (typeof m.metal_id === 'number' || (typeof m.metal_id === 'string' && !isNaN(Number(m.metal_id))))
                );
                const variantMetalsKey = variantMetals
                    .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                    .sort()
                    .join('|');
                
                if (variantMetalsKey === targetMetalsKey) {
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
                }
                return variant;
            });
        } else {
            updatedVariants = currentVariants.map((variant: VariantForm, idx: number) => {
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
        }
        
        setValue('variants', updatedVariants.map(v => ({
            ...v,
            metals: v.metals ?? [],
            diamonds: v.diamonds ?? [],
        })) as VariantForm[]);
    };

    const generateVariantMatrixForData = (prev: ProductFormData): ProductFormData => {
        return generateVariantMatrixUtil({
            formData: prev,
            parentCategories: parentCategories,
            product: product,
            emptyVariant: emptyVariant,
            recalculateVariants: recalculateVariants,
        });
    };

    const generateVariantMatrix = () => {
        // Validate that at least one metal is selected before generating matrix
        const selectedMetals = watch('selected_metals') || [];
        
        if (!Array.isArray(selectedMetals) || selectedMetals.length === 0) {
            setMetalSelectionError('Please select at least one metal before generating the variant matrix. Metals are required.');
            return;
        }
        
        // Validate that each selected metal has at least one purity and one tone selected
        const metalConfigurations = watch('metal_configurations') || {};
        const missingConfigurations: string[] = [];
        
        selectedMetals.forEach((metalId) => {
            const metal = metals.find(m => m.id === metalId);
            if (!metal) return;
            
            const config = metalConfigurations[metalId] || { purities: [], tones: [] };
            // Filter to only active purities and tones
            const availablePurities = metalPurities.filter(p => p.metal_id === metalId && (p.is_active !== false));
            const availableTones = metalTones.filter(t => t.metal_id === metalId && (t.is_active !== false));
            
            // Check if there are any active purities/tones available
            if (availablePurities.length === 0 && availableTones.length === 0) {
                missingConfigurations.push(`${metal.name} (no active purities and tones available)`);
                return;
            }
            
            // If no active purities available, add to missing configurations
            if (availablePurities.length === 0) {
                missingConfigurations.push(`${metal.name} (no active purities available)`);
                return;
            }
            
            // If no active tones available, add to missing configurations
            if (availableTones.length === 0) {
                missingConfigurations.push(`${metal.name} (no active tones available)`);
                return;
            }
            
            // Both purities and tones are available - require at least one of each to be selected
            const selectedPurities = config.purities || [];
            const selectedTones = config.tones || [];
            
            const missingParts: string[] = [];
            if (selectedPurities.length === 0) {
                missingParts.push('purity');
            }
            if (selectedTones.length === 0) {
                missingParts.push('tone');
            }
            
            // If either purity or tone is not selected, add to missing configurations
            if (missingParts.length > 0) {
                missingConfigurations.push(`${metal.name} (${missingParts.join(' and ')} not selected)`);
            }
        });
        
        if (missingConfigurations.length > 0) {
            const metalList = missingConfigurations.slice(0, 3).join(', ');
            const moreCount = missingConfigurations.length > 3 ? ` and ${missingConfigurations.length - 3} more` : '';
            
            // Check if any metals have no active purities/tones available
            const hasNoActiveOptions = missingConfigurations.some(m => 
                m.includes('no active purities and tones available') || 
                m.includes('no active purities available') || 
                m.includes('no active tones available')
            );
            
            let errorMessage = '';
            if (hasNoActiveOptions) {
                errorMessage = `Cannot create variants. The following metal${missingConfigurations.length > 1 ? 's' : ''} ${missingConfigurations.length > 1 ? 'do' : 'does'} not have active purities and/or tones available: ${metalList}${moreCount}. Please activate at least one purity and one tone for each metal in the Metals section, or deselect the metal${missingConfigurations.length > 1 ? 's' : ''} to create variants for other metals.`;
            } else {
                errorMessage = `Cannot create variants. The following metal${missingConfigurations.length > 1 ? 's' : ''} ${missingConfigurations.length > 1 ? 'do' : 'does'} not have at least one purity and one tone selected: ${metalList}${moreCount}. Please select at least one purity and one tone for each metal, or deselect the metal${missingConfigurations.length > 1 ? 's' : ''} to create variants for other metals.`;
            }
            
            setMetalSelectionError(errorMessage);
            return;
        }
        
        // Clear any previous error if all validations pass
        setMetalSelectionError(null);
        
        // Generate matrix but store in separate state variable, not in form data
        // Use the current form data to generate variants based on current selections
        const currentFormData = watch();
        const generatedData = generateVariantMatrixForData(currentFormData as ProductFormData);
        const generatedVariants = generatedData.variants || [];
        
        // Store the show_all_variants_by_size setting used for this generation
        // This ensures the display respects the setting at generation time, not the current checkbox state
        setGeneratedShowAllVariantsBySize(watch('show_all_variants_by_size'));
        
        // Set the generated variants - generation already handles grouping based on show_all_variants_by_size
        setGeneratedMatrixVariants(generatedVariants.map(v => ({
            ...v,
            metals: v.metals ?? [],
            diamonds: v.diamonds ?? [],
        })) as VariantForm[]);
    };

    const submit = async (productFormData: ProductFormData) => {
        // Client-side validation is handled by Zod schema
        // Additional validation for complex fields
        const validationErrors: Record<string, string> = {};

        // Variant validation
        const hasMediaUploads = (productFormData.media_uploads?.length ?? 0) > 0;
        const payload: any = { ...productFormData };
            
            // Get the current show_all_variants_by_size value from form state
            // Check both the current formState and the reactive data to ensure we get the latest checkbox value
            const showAllVariantsBySizeValue = generatedMatrixVariants.length > 0 
            ? (generatedShowAllVariantsBySize ?? false) 
            : false;

            // Only use variants if matrix has been explicitly generated (user clicked "Generate Matrix")
            // If generatedMatrixVariants is empty, don't include variants in payload
            let variantsToUse: VariantForm[] = [];
            if (generatedMatrixVariants.length > 0) {
                // Use generatedMatrixVariants (contains user edits from Generate Matrix button)
                // Filter out empty/invalid variants (no metals, no label, no sku)
                variantsToUse = generatedMatrixVariants.filter((variant: any) => {
                    // Check if variant has at least one metal
                    const metals = variant.metals || [];
                    const metalId = variant.metal_id;
                    
                    const hasValidMetal = 
                        (Array.isArray(metals) && metals.length > 0 && metals.some((m: any) => 
                            m.metal_id !== '' && m.metal_id !== null && m.metal_id !== undefined && typeof m.metal_id === 'number' && m.metal_id > 0
                        )) ||
                        (metalId !== '' && metalId !== null && metalId !== undefined && typeof metalId === 'number' && metalId > 0);
                    
                    // Variant is valid if it has a metal and at least a label or sku
                    return hasValidMetal && (variant.label || variant.sku);
                });
            }
            // If generatedMatrixVariants is empty or all variants are invalid, variantsToUse remains empty array (no variants in payload)

            // Validate that at least one valid variant is required
            if (variantsToUse.length === 0) {
                validationErrors.variants = 'At least one product variant is required. Please generate the variant matrix before saving.';
            }

        // If there are validation errors, display them and stop submission
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setProcessing(false);
            
            // Trigger React Hook Form validation to show errors and focus
            await trigger();
            
            // Scroll to first error field
            setTimeout(() => {
                const firstErrorField = Object.keys(validationErrors)[0];
                if (firstErrorField) {
                    // Try to find the input field by name or id
                    const errorElement = document.querySelector(`[name="${firstErrorField}"], #${firstErrorField}, input[id="${firstErrorField}"], select[id="${firstErrorField}"]`) as HTMLElement;
                    if (errorElement) {
                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        errorElement.focus();
                    } else {
                        // Fallback: scroll to first error message
                        const errorMessage = document.querySelector('.text-rose-500, .text-red-600') as HTMLElement;
                        if (errorMessage) {
                            errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                }
            }, 100);
            return;
        }

            // Handle media: include existing media (excluding removed) + new uploads
            if (product?.id && product?.media) {
                // Get existing media that are NOT being removed
                const removedMediaIds = productFormData.removed_media_ids ?? [];
                const existingMediaToKeep = product.media
                    .filter((mediaItem) => !removedMediaIds.includes(mediaItem.id))
                    .map((mediaItem) => ({
                        id: mediaItem.id,
                        type: mediaItem.type,
                        url: mediaItem.url,
                        display_order: mediaItem.display_order,
                        metadata: mediaItem.metadata || {},
                    }));
                
                // Only include media field if there are existing media to keep
                if (existingMediaToKeep.length > 0) {
                    payload.media = existingMediaToKeep;
                }
            }
            
            // Add new file uploads
            if (productFormData.media_uploads && Array.isArray(productFormData.media_uploads) && productFormData.media_uploads.length > 0) {
                payload.media_uploads = productFormData.media_uploads;
            }
            
            payload.sku = productFormData.sku || '';
            payload.name = productFormData.name || '';
            payload.titleline = productFormData.titleline || null;
            payload.collection = productFormData.collection || null;
            payload.producttype = productFormData.producttype || null;
            payload.gender = productFormData.gender || null;
            payload.description = productFormData.description || '';

            // Set brand_id (already validated above)
            const brandIdValue = productFormData.brand_id;
            const brandIdNum = Number(brandIdValue);
            payload.brand_id = brandIdNum;

            // Set category_id (already validated above)
            const categoryIdValue = productFormData.category_id;
            const categoryIdNum = Number(categoryIdValue);
            payload.category_id = categoryIdNum;

            // Handle style_ids (multi-select) - must be array
            const styleIds = productFormData.style_ids || [];
            payload.style_ids = Array.isArray(styleIds) ? styleIds : [];

            // Handle making_charge_types (must be array) - already validated above
            const makingChargeTypes = productFormData.making_charge_types || [];

            if (makingChargeTypes.includes('fixed')) {
                const makingChargeValue = productFormData.making_charge_amount;
                if (makingChargeValue === '' || makingChargeValue === null || makingChargeValue === undefined) {
                    payload.making_charge_amount = 0;
                } else {
                    const numValue = Number(makingChargeValue);
                    payload.making_charge_amount = isNaN(numValue) ? 0 : numValue;
                }
            } else {
                payload.making_charge_amount = 0;
            }

            if (makingChargeTypes.includes('percentage')) {
                const makingChargePercentageValue = productFormData.making_charge_percentage;
                if (makingChargePercentageValue === '' || makingChargePercentageValue === null || makingChargePercentageValue === undefined) {
                    payload.making_charge_percentage = null;
                } else {
                    const numValue = Number(makingChargePercentageValue);
                    payload.making_charge_percentage = isNaN(numValue) ? null : numValue;
                }
            } else {
                payload.making_charge_percentage = null;
            }

            const toNullableNumber = (value: string | number | null | undefined) => {
                if (value === null || value === undefined || value === '') {
                    return null;
                }

                return typeof value === 'number' ? value : Number(value);
            };

            payload.is_active = productFormData.is_active ?? true;

            // Prepare metadata object with show_all_variants_by_size
            // Always set show_all_variants_by_size in metadata, using the current value from form data
            // This ensures the checkbox state is saved even if "Generate Matrix" wasn't clicked
            // Metadata must always be an object (not null) for backend validation
            const metadata: Record<string, any> = {};
            metadata.show_all_variants_by_size = showAllVariantsBySizeValue;
                payload.metadata = metadata;
            
            // Handle catalog_ids (must be array)
            const catalogIds = productFormData.catalog_ids || [];
            payload.catalog_ids = Array.isArray(catalogIds) ? catalogIds : [];
            
            // Handle subcategory_ids (must be array)
            const subcategoryIds = productFormData.subcategory_ids || [];
            payload.subcategory_ids = Array.isArray(subcategoryIds) ? subcategoryIds : [];
            
            if (!payload.media_uploads || (Array.isArray(payload.media_uploads) && payload.media_uploads.length === 0)) {
                delete payload.media_uploads;
            }
            if (!payload.removed_media_ids || (Array.isArray(payload.removed_media_ids) && payload.removed_media_ids.length === 0)) {
                delete payload.removed_media_ids;
            }

            // Ensure required string fields are not empty
            if (!payload.sku) payload.sku = '';
            if (!payload.name) payload.name = '';
            
            // Ensure making_charge_amount is a number (default to 0)
            if (payload.making_charge_amount === undefined) payload.making_charge_amount = 0;

            // Use variants for submission (from generatedMatrixVariants if available, otherwise newly generated)
            if (variantsToUse && Array.isArray(variantsToUse) && variantsToUse.length > 0) {
                const diamondSelections = productFormData.diamond_selections || [];
                
                // Validate that each variant has at least one metal (required)
                const variantsWithoutMetals: string[] = [];
                variantsToUse.forEach((variant: any, index: number) => {
                    const metals = variant.metals || [];
                    const metalId = variant.metal_id;
                    
                    // Check if metals array has at least one valid metal
                    let hasValidMetal = false;
                    if (Array.isArray(metals) && metals.length > 0) {
                        hasValidMetal = metals.some((m: any) => 
                            m.metal_id !== '' && m.metal_id !== null && m.metal_id !== undefined && typeof m.metal_id === 'number' && m.metal_id > 0
                        );
                    }
                    
                    // Also check if metal_id is set directly on variant (legacy support)
                    if (!hasValidMetal && metalId !== '' && metalId !== null && metalId !== undefined && typeof metalId === 'number' && metalId > 0) {
                        hasValidMetal = true;
                    }
                    
                    if (!hasValidMetal) {
                        const variantLabel = variant.label || variant.sku || `Variant #${index + 1}`;
                        variantsWithoutMetals.push(variantLabel);
                    }
                });
                
                if (variantsWithoutMetals.length > 0) {
                    const variantList = variantsWithoutMetals.slice(0, 3).join(', ');
                    const moreCount = variantsWithoutMetals.length > 3 ? ` and ${variantsWithoutMetals.length - 3} more` : '';
                    setErrors({ variants: `The following variant${variantsWithoutMetals.length > 1 ? 's' : ''} must have at least one metal: ${variantList}${moreCount}. Metals are required for all variants.` });
                    setProcessing(false);
                    return;
                }
                
                // Create a deep copy of variants to avoid mutating the original
                // Ensure diamond id is preserved as a number if it exists
                let processedVariants = variantsToUse.map((variant: any) => ({
                    ...variant,
                    metals: variant.metals ? variant.metals.map((m: any) => ({ ...m })) : [],
                    diamonds: variant.diamonds ? variant.diamonds.map((d: any) => {
                        const diamondCopy: any = { ...d };
                        // Ensure id is preserved as a number if it exists
                        if (d.id !== undefined && d.id !== null && d.id !== '' && d.id !== 0) {
                            diamondCopy.id = typeof d.id === 'number' ? d.id : Number(d.id);
                        }
                        return diamondCopy;
                    }) : [],
                }));
                
                // If "Show all variants" is unchecked, apply weight and inventory_quantity to all variants with same metal
                if (productFormData.show_all_variants_by_size === false) {
                    // Group variants by metal configuration
                    const variantGroups = new Map<string, any[]>();
                    
                    processedVariants.forEach((variant: any) => {
                        const variantMetals = (variant.metals || []).filter(
                            (m: any) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                        );
                        const metalsKey = variantMetals
                            .map((m: any) => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                            .sort()
                            .join('|');
                        
                        if (!variantGroups.has(metalsKey)) {
                            variantGroups.set(metalsKey, []);
                        }
                        variantGroups.get(metalsKey)!.push(variant);
                    });
                    
                    // For each group, apply weight and inventory_quantity from first variant to all variants
                    variantGroups.forEach((group) => {
                        if (group.length > 1) {
                            // Get weight and inventory_quantity from first variant in group
                            const firstVariant = group[0];
                            const firstVariantMetals = (firstVariant.metals || []).filter(
                                (m: any) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                            );
                            
                            // Create a map of metal weights by metal configuration
                            const metalWeightsMap = new Map<string, string>();
                            firstVariantMetals.forEach((metal: any) => {
                                const metalKey = `${metal.metal_id}-${metal.metal_purity_id || 'null'}-${metal.metal_tone_id || 'null'}`;
                                metalWeightsMap.set(metalKey, metal.metal_weight || '');
                            });
                            
                            const commonInventory = firstVariant.inventory_quantity !== undefined && firstVariant.inventory_quantity !== null && firstVariant.inventory_quantity !== ''
                                ? firstVariant.inventory_quantity
                                : 0;
                            
                            // Apply to all variants in the group
                            group.forEach((variant: any) => {
                                // Apply weight to matching metals in the variant
                                if (variant.metals && Array.isArray(variant.metals) && variant.metals.length > 0) {
                                    variant.metals = variant.metals.map((metal: any) => {
                                        const metalKey = `${metal.metal_id}-${metal.metal_purity_id || 'null'}-${metal.metal_tone_id || 'null'}`;
                                        const weight = metalWeightsMap.get(metalKey) || '';
                                        return {
                                            ...metal,
                                            metal_weight: weight,
                                        };
                                    });
                                }
                                
                                // Apply inventory_quantity
                                variant.inventory_quantity = commonInventory;
                            });
                        }
                    });
                }
                
                payload.variants = processedVariants.map((variant: any) => {
                    const formattedVariant: any = {
                        label: variant.label || '',
                        sku: variant.sku || '',
                        size_id: variant.size_id !== null && variant.size_id !== undefined ? Number(variant.size_id) : undefined,
                        is_default: variant.is_default ?? false,
                        inventory_quantity: variant.inventory_quantity !== undefined && variant.inventory_quantity !== null
                            ? (typeof variant.inventory_quantity === 'number' 
                                ? variant.inventory_quantity 
                                : (variant.inventory_quantity === '' ? 0 : parseInt(String(variant.inventory_quantity), 10)))
                            : 0,
                        metadata: variant.metadata || {},
                    };
                    
                    // Add id if editing existing variant
                    if (variant.id !== undefined && variant.id !== null) {
                        formattedVariant.id = Number(variant.id);
                    }
                    
                    // Preserve diamonds from variant with their IDs intact before processing
                    formattedVariant.diamonds = variant.diamonds || [];
                    
                    // Format metals array with proper types
                    formattedVariant.metals = (variant.metals || []).map((metal: any) => {
                        const metalId = metal.metal_id !== '' && metal.metal_id !== null && metal.metal_id !== undefined
                            ? (typeof metal.metal_id === 'number' ? metal.metal_id : Number(metal.metal_id))
                            : null;
                        
                        if (metalId === null || isNaN(metalId)) {
                            return null; // Skip invalid metals
                        }
                        
                        const formattedMetal: any = {
                            metal_id: metalId,
                        };
                        
                        // Add id if editing existing metal
                        if (metal.id !== undefined && metal.id !== null) {
                            formattedMetal.id = Number(metal.id);
                        }
                        
                        // Add optional purity
                        if (metal.metal_purity_id !== '' && metal.metal_purity_id !== null && metal.metal_purity_id !== undefined) {
                            const purityId = typeof metal.metal_purity_id === 'number' 
                                ? metal.metal_purity_id 
                                : Number(metal.metal_purity_id);
                            if (!isNaN(purityId)) {
                                formattedMetal.metal_purity_id = purityId;
                            }
                        }
                        
                        // Add optional tone
                        if (metal.metal_tone_id !== '' && metal.metal_tone_id !== null && metal.metal_tone_id !== undefined) {
                            const toneId = typeof metal.metal_tone_id === 'number' 
                                ? metal.metal_tone_id 
                                : Number(metal.metal_tone_id);
                            if (!isNaN(toneId)) {
                                formattedMetal.metal_tone_id = toneId;
                            }
                        }
                        
                        // Add weight (required, but can be 0)
                        if (metal.metal_weight !== undefined && metal.metal_weight !== null && metal.metal_weight !== '') {
                            const weight = typeof metal.metal_weight === 'number' 
                                ? metal.metal_weight 
                                : parseFloat(String(metal.metal_weight));
                            formattedMetal.metal_weight = isNaN(weight) ? 0 : weight;
                        } else {
                            formattedMetal.metal_weight = 0;
                        }
                        
                        // Add metadata if present
                        if (metal.metadata && Object.keys(metal.metadata).length > 0) {
                            formattedMetal.metadata = metal.metadata;
                        }
                        
                        return formattedMetal;
                    }).filter((m: any) => m !== null); // Remove null entries
                    
                    // Ensure at least one metal exists
                    if (formattedVariant.metals.length === 0) {
                        return null; // Skip variants without metals
                    }
                    
                    let variantDiamonds: any[] = [];
                    
                    // Use diamonds from formattedVariant (which was set from variant.diamonds above)
                    if (formattedVariant.diamonds && Array.isArray(formattedVariant.diamonds) && formattedVariant.diamonds.length > 0) {
                        variantDiamonds = formattedVariant.diamonds
                            .map((diamond: any) => {
                                const diamondId = diamond.diamond_id !== '' && 
                                                 diamond.diamond_id !== null && 
                                                 diamond.diamond_id !== undefined
                                    ? (typeof diamond.diamond_id === 'number' 
                                        ? diamond.diamond_id 
                                        : Number(diamond.diamond_id))
                                    : null;
                                
                                if (diamondId === null || diamondId === 0 || isNaN(diamondId)) {
                                    return null; // Skip diamonds without valid diamond_id
                                }
                                
                                const diamondsCount = diamond.diamonds_count !== '' && 
                                                     diamond.diamonds_count !== null && 
                                                     diamond.diamonds_count !== undefined
                                    ? (typeof diamond.diamonds_count === 'number' 
                                        ? diamond.diamonds_count 
                                        : Number(diamond.diamonds_count))
                                    : null;
                                
                                if (diamondsCount === null || isNaN(diamondsCount)) {
                                    return null; // Skip diamonds without valid count
                                }
                                
                                // When editing (productId exists), diamonds MUST have a valid id
                                // The backend uses UpdateVariantDiamondDto which requires id
                                if (productId) {
                                    // Check if this is an existing diamond (has id) - required for updates
                                    const existingDiamondId = diamond.id !== undefined && 
                                                             diamond.id !== null && 
                                                             diamond.id !== '' &&
                                                             diamond.id !== 0 &&
                                                             !isNaN(Number(diamond.id))
                                        ? Number(diamond.id)
                                        : null;
                                    
                                    // If editing and no valid id, skip this diamond (can't update without id)
                                    // New diamonds should be added through a different mechanism or variant recreation
                                    if (existingDiamondId === null || existingDiamondId <= 0) {
                                        return null; // Skip diamonds without valid id when editing
                                    }
                                    
                                    // Build the diamond object with required id for updates
                                    const formattedDiamond: any = {
                                        id: existingDiamondId,
                                        diamond_id: diamondId,
                                        diamonds_count: diamondsCount,
                                    };
                                    
                                    // Add metadata if present
                                    if (diamond.metadata && Object.keys(diamond.metadata).length > 0) {
                                        formattedDiamond.metadata = diamond.metadata;
                                    }
                                    
                                    return formattedDiamond;
                                } else {
                                    // New product - no id needed, use create DTO
                                    const formattedDiamond: any = {
                                        diamond_id: diamondId,
                                        diamonds_count: diamondsCount,
                                    };
                                    
                                    // Add metadata if present
                                    if (diamond.metadata && Object.keys(diamond.metadata).length > 0) {
                                        formattedDiamond.metadata = diamond.metadata;
                                    }
                                    
                                    return formattedDiamond;
                                }
                            })
                            .filter((d: any) => d !== null);
                    }
                    
                    if (variantDiamonds.length === 0 && diamondSelections.length > 0) {
                        variantDiamonds = diamondSelections
                            .map((selection: any) => {
                                const diamondId = selection.diamond_id !== '' && 
                                                 selection.diamond_id !== null && 
                                                 selection.diamond_id !== undefined
                                    ? (typeof selection.diamond_id === 'number' 
                                        ? selection.diamond_id 
                                        : Number(selection.diamond_id))
                                    : null;
                                
                                if (diamondId === null || diamondId === 0 || isNaN(diamondId)) {
                                    return null;
                                }
                                
                                const diamondsCount = selection.count !== '' && 
                                                     selection.count !== null && 
                                                     selection.count !== undefined
                                    ? (typeof selection.count === 'number' 
                                        ? selection.count 
                                        : Number(selection.count))
                                    : null;
                                
                                // Don't include id for new products - only for editing existing diamonds
                                const formattedDiamond: any = {
                                    diamond_id: diamondId,
                                    diamonds_count: diamondsCount,
                                };
                                
                                // Only add id if editing existing diamond (shouldn't happen from diamond_selections, but just in case)
                                if (productId && selection.id !== undefined && selection.id !== null && selection.id !== '') {
                                    formattedDiamond.id = Number(selection.id);
                                }
                                
                                // Add metadata if present
                                if (selection.metadata && Object.keys(selection.metadata).length > 0) {
                                    formattedDiamond.metadata = selection.metadata;
                                } else {
                                    formattedDiamond.metadata = {};
                                }
                                
                                return formattedDiamond;
                            })
                            .filter((d: any) => d !== null);
                    }
                    
                    // Set diamonds array (can be empty)
                    formattedVariant.diamonds = variantDiamonds;
                    
                    return formattedVariant;
                }).filter((v: any) => v !== null); // Remove null entries (variants without metals)
            } else {
                payload.variants = [];
            }

            // Remove fields that shouldn't be sent to backend
            delete payload.uses_diamond;
            delete payload.diamond_selections;
            delete payload.metal_selections;
            delete payload.selected_metals;
            delete payload.metal_configurations;
            delete payload.selected_sizes;
            delete payload.all_sizes_available;
            delete payload.show_all_variants_by_size; // This is in metadata, not top-level
            delete payload._method;

        // Create browser FormData with proper type conversion
        const browserFormData = new FormData();
        
        // Helper to append values with proper type conversion
        const appendToFormData = (key: string, value: any) => {
            // For required fields, we should not skip null/undefined
            // But for optional fields, we can skip
            const requiredFields = ['brand_id', 'category_id', 'name', 'sku', 'variants'];
            const isRequired = requiredFields.includes(key);
            
            if (value === null || value === undefined) {
                if (isRequired) {
                    // For required fields, send empty string or default value
                    if (key === 'variants') {
                        browserFormData.append(key, JSON.stringify([]));
                    } else {
                        browserFormData.append(key, '');
                    }
                }
                return; // Skip null/undefined for optional fields
            }
            
            if (key === 'media_uploads' && Array.isArray(value)) {
                // Files are handled separately
                value.forEach((file) => {
                    if (file instanceof File) {
                        browserFormData.append('media_uploads', file);
                    }
                });
            } else if (Array.isArray(value)) {
                // Arrays need to be JSON stringified for multipart/form-data
                browserFormData.append(key, JSON.stringify(value));
            } else if (typeof value === 'object' && value !== null) {
                // Objects need to be JSON stringified
                browserFormData.append(key, JSON.stringify(value));
            } else if (typeof value === 'boolean') {
                // Booleans should be sent as strings 'true' or 'false'
                browserFormData.append(key, value ? 'true' : 'false');
            } else if (typeof value === 'number') {
                // Numbers should be sent as strings
                browserFormData.append(key, String(value));
            } else {
                // Strings and other primitives
                browserFormData.append(key, String(value));
            }
        };
        
        // Add all payload fields to FormData in the correct order
        // Required fields first
        appendToFormData('name', payload.name);
        appendToFormData('sku', payload.sku);
        appendToFormData('brand_id', payload.brand_id);
        appendToFormData('category_id', payload.category_id);
        
        // Optional string fields
        if (payload.titleline) appendToFormData('titleline', payload.titleline);
        if (payload.description) appendToFormData('description', payload.description);
        if (payload.collection) appendToFormData('collection', payload.collection);
        if (payload.producttype) appendToFormData('producttype', payload.producttype);
        if (payload.gender) appendToFormData('gender', payload.gender);
        
        // Array fields (must be arrays, even if empty)
        appendToFormData('style_ids', payload.style_ids || []);
        appendToFormData('catalog_ids', payload.catalog_ids || []);
        appendToFormData('subcategory_ids', payload.subcategory_ids || []);
        
        // Number fields
        if (payload.making_charge_amount !== undefined) {
            appendToFormData('making_charge_amount', payload.making_charge_amount);
        }
        if (payload.making_charge_percentage !== undefined && payload.making_charge_percentage !== null) {
            appendToFormData('making_charge_percentage', payload.making_charge_percentage);
        }
        
        // Boolean field
        appendToFormData('is_active', payload.is_active ?? true);
        
        // Object field (metadata) - must always be an object (not null)
        if (payload.metadata) {
            appendToFormData('metadata', payload.metadata);
        } else {
            // Ensure metadata is always an object
            appendToFormData('metadata', {});
        }
        
        // Variants array (required)
        appendToFormData('variants', payload.variants || []);
        
        // Optional array fields
        if (payload.removed_media_ids && Array.isArray(payload.removed_media_ids) && payload.removed_media_ids.length > 0) {
            appendToFormData('removed_media_ids', payload.removed_media_ids);
        }
        
        // Existing media to keep (when updating product)
        if (payload.media && Array.isArray(payload.media) && payload.media.length > 0) {
            appendToFormData('media', payload.media);
        }
        
        // Media uploads (files)
        if (payload.media_uploads && Array.isArray(payload.media_uploads)) {
            appendToFormData('media_uploads', payload.media_uploads);
        }

        setProcessing(true);
        setErrors({});

        try {
            if (product?.id) {
                // Update existing product
                await adminService.updateProduct(product.id, browserFormData);
                toastSuccess('Product updated successfully!');
                
                // Refresh the page data to show updated product (including removed images)
                router.refresh();
                
                // Also manually reload product data to ensure UI updates immediately
                try {
                    const productResponse = await adminService.getProduct(product.id);
                    const productData = productResponse.data;
                    setProduct(productData);
                    
                    // Clear removed media IDs from form state since they've been processed
                    setDataField('removed_media_ids', []);
                    // Clear media uploads from form state since they've been processed
                    setDataField('media_uploads', []);
                } catch (reloadError) {
                    console.error('Failed to reload product after update:', reloadError);
                    // If manual reload fails, still refresh the router
                    router.push(`/admin/products/${product.id}/edit`);
                }
            } else {
                // Create new product
                const response = await adminService.createProduct(browserFormData);
                const newProductId = response.data.id;
                toastSuccess('Product created successfully!');
                router.push(`/admin/products/${newProductId}/edit`);
            }
        } catch (error: any) {
            console.error('Failed to save product:', error);
            if (error.response?.data?.errors) {
                // Laravel validation errors can be arrays - convert to strings
                const laravelErrors: Record<string, string> = {};
                Object.entries(error.response.data.errors).forEach(([key, value]) => {
                    // If error is an array, take the first message (Laravel style)
                    if (Array.isArray(value)) {
                        laravelErrors[key] = value[0] as string;
                    } else if (typeof value === 'string') {
                        laravelErrors[key] = value;
                    }
                });
                setErrors(laravelErrors);
                
                // Scroll to first error field
                const firstErrorField = Object.keys(laravelErrors)[0];
                if (firstErrorField) {
                    const errorElement = document.querySelector(`[name="${firstErrorField}"], input[data-field="${firstErrorField}"]`);
                    if (errorElement) {
                        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            } else {
                toastError(error.response?.data?.message || 'Failed to save product. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };


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

        return [...product.media].sort((a, b) => a.display_order - b.display_order);
    }, [product?.media]);


    const toggleRemoveMedia = (id: number) => {
        const current = watch('removed_media_ids') ?? [];
        const exists = current.includes(id);
        const updated = exists ? current.filter((mediaId: number) => mediaId !== id) : [...current, id];
        setValue('removed_media_ids', updated);
    };

    const handleMediaSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
        if (selectedFiles.length === 0) {
            return;
        }

        // Get existing files to avoid duplicates
        const existingFiles = watch('media_uploads') ?? [];
        
        // Filter out duplicates based on file name and size
        const newFiles = selectedFiles.filter((newFile) => {
            return !existingFiles.some(
                (existingFile: File) =>
                    existingFile.name === newFile.name &&
                    existingFile.size === newFile.size
            );
        });

        if (newFiles.length === 0) {
            // All files are duplicates, but still allow selection
            return;
        }

        // Add new files to existing media_uploads array
        const updatedFiles = [...existingFiles, ...newFiles];
        
        setValue('media_uploads', updatedFiles);
        
        // Reset input to allow selecting the same files again if needed
        event.target.value = '';
    };

    const removePendingUpload = (index: number) => {
        setValue(
            'media_uploads',
            (watch('media_uploads') ?? []).filter((_: File, uploadIndex: number) => uploadIndex !== index),
        );
    };

    const isMarkedForRemoval = (id: number) => {
        return (watch('removed_media_ids') ?? []).includes(id);
    };

    return (
        <>
            <Head title={product?.id ? `Edit ${product.name}` : 'New Product'} />

            <form onSubmit={handleSubmit(submit)} className="space-y-4 px-2 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-10 lg:px-8">
                <div className="space-y-4 sm:space-y-6">
                        <BasicInfoSection
                            control={control}
                            watch={watch}
                            setValue={setValue}
                            clearErrors={clearErrors}
                            errors={errors}
                            formErrors={formErrors}
                            brands={brands}
                            parentCategories={parentCategories}
                            subcategories={subcategories || []}
                            catalogs={catalogs}
                            productId={product?.id}
                            processing={processing}
                        />

                        <ProductDescriptionSection
                            description={localDescription}
                            onDescriptionChange={handleDescriptionChange}
                            error={typeof errors.description === 'string' 
                                ? errors.description 
                                : errors.description?.message}
                        />

                        <MediaSection
                            watch={watch}
                            setValue={setValue}
                            product={product}
                        />

                        <VariantConfigurationSection
                            watch={watch}
                            setValue={setValue}
                            errors={errors}
                            formErrors={formErrors}
                            parentCategories={parentCategories}
                            product={product}
                            metals={metals}
                            metalPurities={metalPurities}
                            metalTones={metalTones}
                            diamonds={diamonds}
                            onGenerateMatrix={generateVariantMatrix}
                            metalSelectionError={metalSelectionError}
                            setMetalSelectionError={setMetalSelectionError}
                        />

                        <div className="rounded-2xl sm:rounded-3xl bg-white p-3 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 sm:gap-4 border-b border-slate-200 pb-4 sm:pb-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900">Variant Matrix</h2>
                            <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs lg:text-sm text-slate-500">
                                Configure product variants with metals and diamonds. The default variant powers the customer catalogue card pricing.
                            </p>
                        </div>
                            {/* <button
                                type="button"
                                onClick={generateVariantMatrix}
                                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-slate-900 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                Generate Matrix
                            </button> */}
                        </div>


                        <div className="mt-4 sm:mt-8 overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                                    <thead className="bg-slate-50 text-[10px] sm:text-xs text-slate-500">
                                        <tr>
                                            <th className="px-2 py-2 sm:px-5 sm:py-3 text-left min-w-[120px] sm:min-w-[150px]">SKU</th>
                                            <th className="px-2 py-2 sm:px-5 sm:py-3 text-left min-w-[200px] sm:min-w-[300px]">Variant Label</th>
                                            <th className="px-2 py-2 sm:px-5 sm:py-3 text-left min-w-[100px] sm:min-w-[150px]">Metal</th>
                                            <th className="px-2 py-2 sm:px-5 sm:py-3 text-left min-w-[80px] sm:min-w-[120px]">Purity</th>
                                            <th className="px-2 py-2 sm:px-5 sm:py-3 text-left min-w-[80px] sm:min-w-[120px]">Tone</th>
                                            <th className="px-2 py-2 sm:px-5 sm:py-3 text-left min-w-[80px] sm:min-w-[120px]">Weight (g)</th>
                                            <th className="px-2 py-2 sm:px-5 sm:py-3 text-left min-w-[80px] sm:min-w-[120px]">Size</th>
                                            <th className="px-2 py-2 sm:px-5 sm:py-3 text-left min-w-[100px]">Inventory</th>
                                            <th className="px-2 py-2 sm:px-5 sm:py-3 text-left min-w-[70px]">Status</th>
                                            <th className="px-2 py-2 sm:px-5 sm:py-3 text-left min-w-[70px]">Default</th>
                                            <th className="px-2 py-2 sm:px-5 sm:py-3 text-right min-w-[60px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                {useMemo(() => {
                                    const allVariants = generatedMatrixVariants;
                                    
                                    if (allVariants.length === 0) {
                                        return [];
                                    }
                                    
                                    // Use the show_all_variants_by_size setting from when the matrix was generated
                                    // This ensures the display respects the setting at generation time, not the current checkbox state
                                    const showAllVariants = generatedShowAllVariantsBySize !== undefined 
                                        ? generatedShowAllVariantsBySize 
                                        : (watch('show_all_variants_by_size') !== undefined ? watch('show_all_variants_by_size') : true);
                                    
                                    // Note: When show_all_variants_by_size === false, variants are already generated 
                                    // with only one per metal combination in generateVariantMatrixUtil
                                    // So we just need to display them as-is
                                    
                                    // Group by metal when user chose "No" to show all variants at generation time
                                    // This allows grouping in both "All sizes available" and "Select specific sizes" modes
                                    // When user chose "Yes", show all variants individually
                                    // Only group if there are actually multiple variants with the same metal but different sizes
                                    if (showAllVariants === false && allVariants.length > 0) {
                                        const groupedVariants = new Map<string, typeof allVariants>();
                                        
                                        allVariants.forEach((variant) => {
                                            const variantMetals = (variant.metals || []).filter(
                                                (m) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                                            );
                                            
                                            const metalsKey = variantMetals
                                                .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                                                .sort()
                                                .join('|');
                                            
                                            if (!groupedVariants.has(metalsKey)) {
                                                groupedVariants.set(metalsKey, []);
                                            }
                                            groupedVariants.get(metalsKey)!.push(variant);
                                        });
                                        
                                        // Check if there are multiple variants per metal combination (indicating multiple sizes)
                                        const hasMultipleSizes = Array.from(groupedVariants.values()).some(group => group.length > 1);
                                        
                                        if (hasMultipleSizes) {
                                            // Return one variant per metal combination group for display
                                            return Array.from(groupedVariants.values()).map((variantGroup) => {
                                                const displayVariant = variantGroup[0]; // Use first variant as representative
                                                const originalIndex = allVariants.findIndex(v => v === displayVariant);
                                                return { variant: displayVariant, index: originalIndex, group: variantGroup };
                                            });
                                        }
                                    }
                                    
                                    // Show all variants individually when:
                                    // - User chose "Yes" to show all variants by size at generation time
                                    // - Or no grouping needed (show_all_variants_by_size is undefined or true)
                                    // - Or when variants were already generated grouped (one per metal) when "No" was selected
                                    return allVariants.map((variant, index) => ({ variant, index, group: [variant] }));
                                }, [generatedMatrixVariants, watch('variants'), generatedShowAllVariantsBySize]).map(({ variant, index, group }) => {
                                    // Generate unique key for this variant
                                    const variantKey = variant.id ?? `variant-${index}-${variant.sku ?? ''}-${JSON.stringify(variant.metals?.map(m => `${m.metal_id}-${m.metal_purity_id}-${m.metal_tone_id}`) ?? [])}`;
                                    const meta = buildVariantMeta(variant, watch() as ProductFormData);
                                    const metalLabel = meta.metalTone || '—';

                                    const variantMetals = (variant.metals || []).filter(
                                        (m) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                                    );

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

                                    const metalNames: string[] = [];
                                    const purityNames: string[] = [];
                                    const toneNames: string[] = [];

                                    metalsByMetalId.forEach((metalsInGroup, metalId) => {
                                        const metalName = metalMap[metalId] || '';
                                        if (metalName) {
                                            metalNames.push(metalName);
                                        }

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

                                    let variantDiamonds: Array<{ diamond_id: number | null; diamonds_count: string }> = [];

                                    const diamondsWithId = (variant.diamonds || [])
                                        .filter((d) => d.diamond_id !== '' && d.diamond_id !== null && d.diamond_id !== undefined)
                                        .map((d) => ({
                                            diamond_id: typeof d.diamond_id === 'number' ? d.diamond_id : Number(d.diamond_id),
                                            diamonds_count: d.diamonds_count || '',
                                        }));

                                    if (diamondsWithId.length > 0) {
                                        variantDiamonds = diamondsWithId;
                                    } else if ((variant.diamonds || []).length > 0) {
                                        variantDiamonds = (variant.diamonds || []).map((d) => ({
                                            diamond_id: null,
                                            diamonds_count: d.diamonds_count || '',
                                        }));
                                    } else if ((watch('diamond_selections') || []).length > 0) {
                                        variantDiamonds = (watch('diamond_selections') || [])
                                            .filter((selection: any) => selection.diamond_id !== '' && selection.diamond_id !== null && selection.diamond_id !== undefined)
                                            .map((selection: any) => ({
                                                diamond_id: typeof selection.diamond_id === 'number' ? selection.diamond_id : Number(selection.diamond_id),
                                                diamonds_count: selection.count || '',
                                            }));
                                    }


                                    const variantMetadata = (variant.metadata ?? {}) as Record<string, any>;
                                    
                                    const variantSizeId = (variant as any).size_id;
                                    let sizeDisplay = '—';
                                    if (variantSizeId !== null && variantSizeId !== undefined) {
                                        const categoryId = watch('category_id') ? Number(watch('category_id')) : null;
                                        const selectedCategory = categoryId ? parentCategories.find(cat => cat.id === categoryId) : null;
                                        const categorySizes = (selectedCategory && 'sizes' in selectedCategory && selectedCategory.sizes) || 
                                                              (product?.category?.sizes || []);
                                        const sizeObj = categorySizes.find((s: any) => {
                                            const sId = typeof s.id === 'number' ? s.id : Number(s.id);
                                            const vId = typeof variantSizeId === 'number' ? variantSizeId : Number(variantSizeId);
                                            return sId === vId;
                                        });
                                        if (sizeObj) {
                                            sizeDisplay = sizeObj.name || sizeObj.value || String(variantSizeId);
                                        } else {
                                            sizeDisplay = String(variantSizeId);
                                        }
                                    }
                                    
                                    const variantStatus =
                                        typeof variantMetadata.status === 'string' && variantMetadata.status.trim().length > 0
                                            ? String(variantMetadata.status)
                                            : 'enabled';
                                    const suggestedLabel = meta.autoLabel;

                                    return (
                                        <React.Fragment key={variantKey}>
                                        <tr
                                            className={`hover:bg-slate-50 ${variantStatus === 'disabled' ? 'opacity-70' : ''} ${variant.is_default ? 'bg-sky-50/30' : ''}`}
                                        >
                                            <td className="px-2 py-2 sm:px-5 sm:py-3 align-middle min-w-[120px] sm:min-w-[150px]">
                                                <input
                                                    type="text"
                                                    value={variant.sku}
                                                    onChange={(event) => updateVariant(index, 'sku', event.target.value)}
                                                    className="w-full min-w-[100px] sm:min-w-[120px] rounded-lg sm:rounded-xl border border-slate-200 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    placeholder="Variant SKU"
                                                />
                                                {errors[`variants.${index}.sku`] && (
                                                    <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-rose-500">
                                                        {typeof errors[`variants.${index}.sku`] === 'string' 
                                                            ? errors[`variants.${index}.sku`] 
                                                            : errors[`variants.${index}.sku`]?.message || 'Invalid value'}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 sm:px-5 sm:py-3 align-middle min-w-[200px] sm:min-w-[300px]">
                                                <input
                                                    type="text"
                                                    value={variant.label}
                                                    onChange={(event) => updateVariant(index, 'label', event.target.value)}
                                                    className="w-full min-w-[180px] sm:min-w-[280px] rounded-lg sm:rounded-xl border border-slate-200 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    placeholder="Display label"
                                                />
                                                {errors[`variants.${index}.label`] && (
                                                    <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-rose-500">
                                                        {typeof errors[`variants.${index}.label`] === 'string' 
                                                            ? errors[`variants.${index}.label`] 
                                                            : errors[`variants.${index}.label`]?.message || 'Invalid value'}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 sm:px-5 sm:py-3 align-middle text-slate-700">
                                                <div className="min-w-[100px] sm:min-w-[150px]">
                                                    <span className="text-xs sm:text-sm font-semibold text-slate-800">{metalDisplay}</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 sm:px-5 sm:py-3 align-middle text-slate-700">
                                                <div className="min-w-[80px] sm:min-w-[120px]">
                                                    <span className="text-xs sm:text-sm text-slate-700">{purityDisplay}</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 sm:px-5 sm:py-3 align-middle text-slate-700">
                                                <div className="min-w-[80px] sm:min-w-[120px]">
                                                    <span className="text-xs sm:text-sm text-slate-700">{toneDisplay}</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 sm:px-5 sm:py-3 align-middle text-slate-700">
                                                <div className="flex flex-col gap-1 min-w-[80px] sm:min-w-[120px]">
                                                    {variantMetals.length > 0 ? (
                                                        variantMetals.map((metal, metalIndex) => {
                                                            const weight = metal.metal_weight || '';
                                                            return (
                                                                <div key={metalIndex} className="mb-1 last:mb-0">
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
                                                                        className={`w-full rounded-lg sm:rounded-xl border px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-slate-700 transition-colors ${
                                                                            (!weight || weight === '')
                                                                                ? 'border-rose-300 bg-rose-50 text-rose-500 focus:border-rose-400 focus:bg-white'
                                                                                : 'border-slate-200 bg-white focus:border-sky-400'
                                                                        } focus:outline-none focus:ring-2 focus:ring-sky-200`}
                                                                        placeholder="0.000"
                                                                    />
                                                                    {(!weight || weight === '') && (
                                                                        <span className="text-[9px] sm:text-[10px] text-rose-500">Required</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-xs sm:text-sm text-slate-400">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 sm:px-5 sm:py-3 align-middle text-slate-700">
                                                <div className="min-w-[80px] sm:min-w-[120px]">
                                                    {group && group.length > 1 ? (
                                                        <span className="text-xs sm:text-sm text-slate-500 italic">All selected sizes</span>
                                                    ) : (
                                                        <span className="text-xs sm:text-sm text-slate-700">{sizeDisplay}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 sm:px-5 sm:py-3 align-middle text-slate-700">
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
                                                        className={`w-full min-w-[80px] sm:min-w-[100px] rounded-lg sm:rounded-xl border px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-slate-700 transition-colors ${
                                                            (variant.inventory_quantity === undefined || variant.inventory_quantity === null || variant.inventory_quantity === '')
                                                                ? 'border-rose-300 bg-rose-50 text-rose-500 focus:border-rose-400 focus:bg-white'
                                                                : 'border-slate-200 bg-white focus:border-sky-400'
                                                        } focus:outline-none focus:ring-2 focus:ring-sky-200`}
                                                        placeholder="0"
                                                    />
                                                    {(variant.inventory_quantity === undefined || variant.inventory_quantity === null || variant.inventory_quantity === '') && (
                                                        <span className="text-[9px] sm:text-[10px] text-rose-500">Required</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 sm:px-5 sm:py-3 text-slate-700">
                                                <select
                                                    value={variantStatus}
                                                    onChange={(event) =>
                                                        updateVariantMetadata(index, {
                                                            status: event.target.value,
                                                        })
                                                    }
                                                    className={`rounded-lg sm:rounded-xl border px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                                                        variantStatus === 'enabled'
                                                            ? 'border-emerald-300 bg-emerald-50'
                                                            : 'border-amber-300 bg-amber-50'
                                                    }`}
                                                    style={{
                                                        backgroundImage: 'none',
                                                        WebkitAppearance: 'none',
                                                        MozAppearance: 'none',
                                                    }}
                                                >
                                                    <option value="enabled">Enabled</option>
                                                    <option value="disabled">Disabled</option>
                                                </select>
                                            </td>
                                            <td className="px-2 py-2 sm:px-5 sm:py-3 text-slate-700">
                                                <label className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                                                    <input
                                                        type="radio"
                                                        name="default-variant-table"
                                                        checked={variant.is_default}
                                                        onChange={() => markDefault(index)}
                                                        className="h-3 w-3 sm:h-4 sm:w-4 text-sky-600 focus:ring-sky-500"
                                                    />
                                                    <span className="whitespace-nowrap">{variant.is_default ? 'Default' : 'Set default'}</span>
                                                </label>
                                            </td>
                                            <td className="px-2 py-2 sm:px-5 sm:py-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariant(index, variant)}
                                                        className="inline-flex items-center justify-center rounded-full border border-rose-200 p-1 sm:p-1.5 text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                                                        aria-label="Remove variant"
                                                        title="Remove Variant"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3 w-3 sm:h-4 sm:w-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12m-9 3v6m6-6v6M10 4h4a1 1 0 0 1 1 1v1H9V5a1 1 0 0 1 1-1Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14l-.8 11.2A2 2 0 0 1 16.2 20H7.8a2 2 0 0 1-1.99-1.8L5 7Z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedMetalVariantIndices.has(index) && (
                                            <tr key={`${variantKey}-expanded`}>
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
                                                                                        className={`rounded-lg sm:rounded-xl border-2 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-colors ${
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
                                        {expandedDiamondVariantIndices.has(index) && (
                                            <tr>
                                                <td colSpan={13} className="px-5 py-4">
                                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-slate-900">Diamonds for this Variant</h4>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    This variant uses the shared diamond list defined above. All variants share the same diamonds.
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {variantDiamonds.length === 0 ? (
                                                            <p className="text-xs text-slate-400">
                                                                No diamonds assigned to this variant from the shared matrix.
                                                            </p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {variantDiamonds.map((diamond, diamondIndex) => (
                                                                    <div key={diamondIndex} className="rounded-xl border border-slate-200 bg-white p-4">
                                                                        <div className="mb-3 flex items-center justify-between">
                                                                            <span className="text-xs font-semibold text-slate-600">Diamond #{diamondIndex + 1}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeDiamondFromVariant(index, diamondIndex)}
                                                                                className="text-xs text-rose-500 transition hover:text-rose-700"
                                                                            >
                                                                                Remove
                                                                            </button>
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
                                        </React.Fragment>
                                    );
                                })}
                                 {(watch('variants') || []).length === 0 && generatedMatrixVariants.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={17}
                                            className="px-2 py-4 sm:px-5 sm:py-6 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <p className="text-[10px] sm:text-xs uppercase tracking-[0.1em] text-slate-400">
                                                    No variants configured. Generate matrix to create variants.
                                                </p>
                                                {(formErrors.variants || errors.variants) && (
                                                    <p className="text-xs text-rose-600 font-medium">
                                                        {formErrors.variants?.message || 
                                                         (typeof errors.variants === 'string' ? errors.variants : errors.variants?.message) || 
                                                         'Variants are required to save the product.'}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </div>
                </div>

            </form>
        </>
    );
}

