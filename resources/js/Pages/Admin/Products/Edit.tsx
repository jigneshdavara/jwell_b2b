// EXCEPTION: This file is 4055 lines but cannot be split because:
// 1. Complex form state interdependencies require single component
// 2. Product variant matrix generation requires shared state
// 3. Admin product edit form has tightly coupled sections (basic info, variants, media, etc.)
// REVIEW: Revisit in 2025-06-30 to refactor into smaller components

import RichTextEditor from '@/Components/RichTextEditor';
import AdminLayout from '@/Layouts/AdminLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import BrandButton from '@/Components/BrandButton';
import type { PageProps as AppPageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import React, { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateVariantMatrix as generateVariantMatrixUtil } from '@/utils/variantMatrixGenerator';

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
    diamonds?: VariantDiamondForm[];
};

type Product = {
    id?: number;
    name?: string;
    titleline?: string;
    sku?: string;
    description?: string;
    brand_id?: number;
    category_id?: number;
    style_ids?: number[];
    category_ids?: number[];
    category?: {
        id: number;
        name: string;
        sizes?: Array<{ id: number; name: string; value?: string }>;
    } | null;
    catalog_ids?: number[];
    collection?: string;
    producttype?: string;
    gender?: string;
    making_charge_amount?: number | string;
    making_charge_percentage?: number | string;
    is_active?: boolean;
    metadata?: Record<string, any> | null;
    media?: ProductMedia[];
    variants?: Array<{
        id?: number;
        sku?: string;
        label?: string;
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
    }>;
};

type OptionListItem = {
    id: number;
    name: string;
    sizes?: Array<{ id: number; name: string; value?: string }>;
    styles?: Array<{ id: number; name: string }>;
};

type OptionList = Record<string, string>;

type MetalOption = {
    id: number;
    name: string;
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

type CatalogOption = {
    id: number;
    code: string | null;
    name: string;
    products_count: number;
    display_order: number;
    is_active: boolean;
};

type SubcategoryOption = {
    id: number;
    name: string;
    parent_id: number;
};

type AdminProductEditPageProps = AppPageProps<{
    product: Product | null;
    brands: OptionList;
    categories: OptionListItem[];
    parentCategories: OptionListItem[];
    subcategories: SubcategoryOption[];
    catalogs: CatalogOption[];
    diamonds: OptionListItem[];
    customerGroups: OptionListItem[];
    metals: MetalOption[];
    metalPurities: MetalPurityOption[];
    metalTones: MetalToneOption[];
    sizes: OptionListItem[];
    errors: Record<string, string>;
}>;

type FormData = {
    sku: string;
    name: string;
    titleline: string;
    description: string;
    brand_id: string;
    category_id: string;
    style_ids?: number[];
    collection: string;
    producttype: string;
    gender: string;
    making_charge_amount: string;
    making_charge_types: ('fixed' | 'percentage')[];
    making_charge_percentage: string;
    is_active: boolean;
    variants?: VariantForm[];
    diamond_selections?: Array<{ diamond_id: number | ''; count: string }>;
    metal_selections?: Array<{ metal_id: number | ''; metal_purity_id: number | ''; metal_tone_id: number | ''; weight: string }>;
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
    show_all_variants_by_size?: boolean;
};

type ProductMedia = {
    id: number;
    type: string;
    url: string;
    display_order: number;
    metadata?: Record<string, unknown> | null;
};

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

type CatalogMultiSelectProps = {
    catalogs: CatalogOption[];
    selectedIds: number[];
    onChange: (selectedIds: number[]) => void;
    error?: string;
};

type SubcategoryMultiSelectProps = {
    subcategories: SubcategoryOption[];
    selectedIds: number[];
    parentCategoryId: number | '';
    onChange: (selectedIds: number[]) => void;
    error?: string;
};

type StyleMultiSelectProps = {
    styles: Array<{ id: number; name: string }>;
    selectedIds: number[];
    onChange: (selectedIds: number[]) => void;
    error?: string;
};

type SubcategoryTreeNode = SubcategoryOption & {
    children: SubcategoryTreeNode[];
};

type SubcategoryTreeRendererProps = {
    nodes: SubcategoryTreeNode[];
    selectedIds: number[];
    onToggle: (id: number) => void;
    level: number;
};

function SubcategoryTreeRenderer({ nodes, selectedIds, onToggle, level }: SubcategoryTreeRendererProps) {
    return (
        <div className="space-y-0.5">
            {nodes.map((node) => {
                const isSelected = selectedIds.includes(node.id);
                const hasChildren = node.children && node.children.length > 0;
                const shouldShowChildren = hasChildren && isSelected;
                const indentPx = level * 24;
                const textColorClass = level === 0 
                    ? (isSelected ? 'text-elvee-blue' : 'text-slate-900')
                    : (isSelected ? 'text-elvee-blue' : 'text-slate-700');
                const bgColorClass = isSelected
                    ? 'bg-elvee-blue/5 text-elvee-blue'
                    : level === 0
                    ? 'text-slate-700 hover:bg-slate-50'
                    : 'text-slate-600 hover:bg-slate-50';

                const buttonContent = (
                    <>
                        <button
                            type="button"
                            onClick={() => onToggle(node.id)}
                            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${bgColorClass}`}
                        >
                            <div
                                className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                                    isSelected
                                        ? 'border-elvee-blue bg-elvee-blue'
                                        : 'border-slate-300'
                                }`}
                            >
                                {isSelected && (
                                    <svg
                                        className="h-3.5 w-3.5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <span className={`text-sm font-medium truncate ${textColorClass}`}>
                                    {node.name}
                                </span>
                            </div>

                            {hasChildren && (
                                <svg
                                    className={`h-4 w-4 transition-transform ${
                                        shouldShowChildren ? 'rotate-90 text-elvee-blue' : 'text-slate-400'
                                    }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </button>

                        {shouldShowChildren && (
                            <SubcategoryTreeRenderer
                                nodes={node.children}
                                selectedIds={selectedIds}
                                onToggle={onToggle}
                                level={level + 1}
                            />
                        )}
                    </>
                );

                return (
                    <div key={node.id}>
                        {level > 0 ? (
                            <div 
                                className="border-l-2 border-slate-200 pl-2"
                                style={{ marginLeft: `${indentPx}px` }}
                            >
                                {buttonContent}
                            </div>
                        ) : (
                            buttonContent
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function SubcategoryMultiSelect({ subcategories, selectedIds, parentCategoryId, onChange, error }: SubcategoryMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const buildSubcategoryTree = useCallback((parentId: number): Array<SubcategoryOption & { children: Array<SubcategoryOption & { children: any[] }> }> => {
        return subcategories
            .filter(sub => sub.parent_id === parentId)
            .map(subcategory => ({
                ...subcategory,
                children: buildSubcategoryTree(subcategory.id)
            }));
    }, [subcategories]);

    const availableSubcategories = useMemo(() => {
        if (!parentCategoryId) {
            return [];
        }
        const categoryIdNum = Number(parentCategoryId);
        return buildSubcategoryTree(categoryIdNum);
    }, [parentCategoryId, buildSubcategoryTree]);

    const toggleSubcategory = (subcategoryId: number) => {
        if (selectedIds.includes(subcategoryId)) {
            onChange(selectedIds.filter(id => id !== subcategoryId));
        } else {
            onChange([...selectedIds, subcategoryId]);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const selectedSubcategories = useMemo(() => {
        return selectedIds
            .map(id => {
                const subcategory = subcategories.find(s => s.id === id);
                return subcategory ? { id, name: subcategory.name } : null;
            })
            .filter(Boolean) as Array<{ id: number; name: string }>;
    }, [selectedIds, subcategories]);

    const removeSubcategory = (subcategoryId: number) => {
        onChange(selectedIds.filter(id => id !== subcategoryId));
    };

    const getAllDescendantIds = useCallback((parentId: number): Set<number> => {
        const ids = new Set<number>();
        const children = subcategories.filter(sub => sub.parent_id === parentId);
        children.forEach(child => {
            ids.add(child.id);
            const descendants = getAllDescendantIds(child.id);
            descendants.forEach(id => ids.add(id));
        });
        return ids;
    }, [subcategories]);

    useEffect(() => {
        if (parentCategoryId) {
            const categoryIdNum = Number(parentCategoryId);
            const validSubcategoryIds = getAllDescendantIds(categoryIdNum);
            
            const validIds = selectedIds.filter(id => validSubcategoryIds.has(id));
            if (validIds.length !== selectedIds.length) {
                onChange(validIds);
            }
        } else {
            if (selectedIds.length > 0) {
                onChange([]);
            }
        }
    }, [parentCategoryId, getAllDescendantIds, selectedIds, onChange]);

    return (
        <label className="flex flex-col gap-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
                <span>Subcategories</span>
                {selectedIds.length > 0 && (
                    <span className="text-xs font-medium text-elvee-blue">
                        {selectedIds.length} selected
                    </span>
                )}
            </div>
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={!parentCategoryId}
                    className={`w-full rounded-2xl border ${
                        error ? 'border-rose-300' : 'border-slate-200'
                    } bg-white px-4 py-2.5 text-left focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 transition-all ${
                        isOpen ? 'border-feather-gold ring-2 ring-feather-gold/20' : ''
                    } ${
                        !parentCategoryId ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-h-[20px] flex flex-wrap gap-1.5">
                            {!parentCategoryId ? (
                                <span className="text-slate-400">Select parent category first</span>
                            ) : selectedIds.length === 0 ? (
                                <span className="text-slate-400">Select subcategories...</span>
                            ) : (
                                selectedSubcategories.map((subcategory) => (
                                    <span
                                        key={subcategory.id}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-elvee-blue/5 px-2 py-1 text-xs font-medium text-elvee-blue border border-elvee-blue/20"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span>{subcategory.name}</span>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSubcategory(subcategory.id);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    removeSubcategory(subcategory.id);
                                                }
                                            }}
                                            className="hover:bg-elvee-blue/10 rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-elvee-blue/50"
                                        >
                                            <svg
                                                className="h-3 w-3 text-elvee-blue"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </span>
                                    </span>
                                ))
                            )}
                        </div>
                        <svg
                            className={`ml-2 h-5 w-5 text-slate-400 transition-transform flex-shrink-0 ${
                                isOpen ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {isOpen && parentCategoryId && (
                    <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 max-h-80 overflow-hidden">
                        <div className="max-h-64 overflow-y-auto p-2">
                            {availableSubcategories.length === 0 ? (
                                <div className="px-3 py-6 text-center text-sm text-slate-400">
                                    No subcategories available
                                </div>
                            ) : (
                                <SubcategoryTreeRenderer
                                    nodes={availableSubcategories}
                                    selectedIds={selectedIds}
                                    onToggle={toggleSubcategory}
                                    level={0}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
            {error && <span className="text-xs text-rose-500">{error}</span>}
        </label>
    );
}

function CatalogMultiSelect({ catalogs, selectedIds, onChange, error }: CatalogMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredCatalogs = useMemo(() => {
        if (!searchTerm.trim()) {
            return catalogs;
        }
        const search = searchTerm.toLowerCase();
        return catalogs.filter((catalog) =>
            catalog.name.toLowerCase().includes(search) ||
            catalog.code?.toLowerCase().includes(search)
        );
    }, [catalogs, searchTerm]);

    const toggleCatalog = (catalogId: number) => {
        if (selectedIds.includes(catalogId)) {
            onChange(selectedIds.filter(id => id !== catalogId));
        } else {
            onChange([...selectedIds, catalogId]);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const selectedCatalogs = useMemo(() => {
        return selectedIds
            .map(id => {
                const catalog = catalogs.find(c => c.id === id);
                return catalog ? { id, name: catalog.name } : null;
            })
            .filter(Boolean) as Array<{ id: number; name: string }>;
    }, [selectedIds, catalogs]);

    const removeCatalog = (catalogId: number) => {
        onChange(selectedIds.filter(id => id !== catalogId));
    };

    return (
        <label className="flex flex-col gap-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
                <span>Catalogs</span>
                {selectedIds.length > 0 && (
                    <span className="text-xs font-medium text-elvee-blue">
                        {selectedIds.length} selected
                    </span>
                )}
            </div>
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full rounded-2xl border ${
                        error ? 'border-rose-300' : 'border-slate-200'
                    } bg-white px-4 py-2.5 text-left focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 transition-all ${
                        isOpen ? 'border-feather-gold ring-2 ring-feather-gold/20' : ''
                    }`}
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-h-[20px] flex flex-wrap gap-1.5">
                            {selectedIds.length === 0 ? (
                                <span className="text-slate-400">Select catalogs...</span>
                            ) : (
                                selectedCatalogs.map((catalog) => (
                                    <span
                                        key={catalog.id}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-elvee-blue/5 px-2 py-1 text-xs font-medium text-elvee-blue border border-elvee-blue/20"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span>{catalog.name}</span>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeCatalog(catalog.id);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    removeCatalog(catalog.id);
                                                }
                                            }}
                                            className="hover:bg-elvee-blue/10 rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-elvee-blue/50"
                                        >
                                            <svg
                                                className="h-3 w-3 text-elvee-blue"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </span>
                                    </span>
                                ))
                            )}
                        </div>
                        <svg
                            className={`ml-2 h-5 w-5 text-slate-400 transition-transform flex-shrink-0 ${
                                isOpen ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {isOpen && (
                    <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 max-h-80 overflow-hidden">
                        {catalogs.length > 5 && (
                            <div className="border-b border-slate-100 p-3">
                                <div className="relative">
                                    <svg
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search catalogs..."
                                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-64 overflow-y-auto p-2">
                            {filteredCatalogs.length === 0 ? (
                                <div className="px-3 py-6 text-center text-sm text-slate-400">
                                    {searchTerm ? 'No catalogs found' : 'No catalogs available'}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredCatalogs.map((catalog) => {
                                        const isSelected = selectedIds.includes(catalog.id);
                                        return (
                                            <button
                                                key={catalog.id}
                                                type="button"
                                                onClick={() => toggleCatalog(catalog.id)}
                                                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                                                    isSelected
                                                        ? 'bg-elvee-blue/5 text-elvee-blue'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div
                                                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                                                        isSelected
                                                            ? 'border-elvee-blue bg-elvee-blue'
                                                            : 'border-slate-300'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <svg
                                                            className="h-3.5 w-3.5 text-white"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={3}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-medium truncate ${
                                                            isSelected ? 'text-elvee-blue' : 'text-slate-900'
                                                        }`}>
                                                            {catalog.name}
                                                        </span>
                                                        {catalog.code && (
                                                            <span className={`text-xs font-mono ${
                                                                isSelected ? 'text-elvee-blue' : 'text-slate-500'
                                                            }`}>
                                                                ({catalog.code})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {error && <span className="text-xs text-rose-500">{error}</span>}
        </label>
    );
}

function StyleMultiSelect({ styles, selectedIds, onChange, error }: StyleMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredStyles = useMemo(() => {
        if (!searchTerm.trim()) {
            return styles;
        }
        const search = searchTerm.toLowerCase();
        return styles.filter((style) =>
            style.name.toLowerCase().includes(search)
        );
    }, [styles, searchTerm]);

    const toggleStyle = (styleId: number) => {
        if (selectedIds.includes(styleId)) {
            onChange(selectedIds.filter(id => id !== styleId));
        } else {
            onChange([...selectedIds, styleId]);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const selectedStyles = useMemo(() => {
        return selectedIds
            .map(id => {
                const style = styles.find(s => s.id === id);
                return style ? { id, name: style.name } : null;
            })
            .filter(Boolean) as Array<{ id: number; name: string }>;
    }, [selectedIds, styles]);

    const removeStyle = (styleId: number) => {
        onChange(selectedIds.filter(id => id !== styleId));
    };

    return (
        <label className="flex flex-col gap-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
                <span>Style</span>
                {selectedIds.length > 0 && (
                    <span className="text-xs font-medium text-elvee-blue">
                        {selectedIds.length} selected
                    </span>
                )}
            </div>
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full rounded-2xl border ${
                        error ? 'border-rose-300' : 'border-slate-200'
                    } bg-white px-4 py-2.5 text-left focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 transition-all ${
                        isOpen ? 'border-feather-gold ring-2 ring-feather-gold/20' : ''
                    }`}
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-h-[20px] flex flex-wrap gap-1.5">
                            {selectedIds.length === 0 ? (
                                <span className="text-slate-400">Select styles...</span>
                            ) : (
                                selectedStyles.map((style) => (
                                    <span
                                        key={style.id}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-elvee-blue/5 px-2 py-1 text-xs font-medium text-elvee-blue border border-elvee-blue/20"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span>{style.name}</span>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeStyle(style.id);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    removeStyle(style.id);
                                                }
                                            }}
                                            className="hover:bg-elvee-blue/10 rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-elvee-blue/50"
                                        >
                                            <svg
                                                className="h-3 w-3 text-elvee-blue"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </span>
                                    </span>
                                ))
                            )}
                        </div>
                        <svg
                            className={`ml-2 h-5 w-5 text-slate-400 transition-transform flex-shrink-0 ${
                                isOpen ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {isOpen && (
                    <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 max-h-80 overflow-hidden">
                        {styles.length > 5 && (
                            <div className="border-b border-slate-100 p-3">
                                <div className="relative">
                                    <svg
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search styles..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-64 overflow-y-auto p-2">
                            {filteredStyles.length === 0 ? (
                                <div className="px-3 py-6 text-center text-sm text-slate-400">
                                    {searchTerm ? 'No styles found' : 'No styles available'}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredStyles.map((style) => {
                                        const isSelected = selectedIds.includes(style.id);
                                        return (
                                            <button
                                                key={style.id}
                                                type="button"
                                                onClick={() => toggleStyle(style.id)}
                                                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                                                    isSelected
                                                        ? 'bg-elvee-blue/5 text-elvee-blue'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <div
                                                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                                                        isSelected
                                                            ? 'border-elvee-blue bg-elvee-blue'
                                                            : 'border-slate-300'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <svg
                                                            className="h-3.5 w-3.5 text-white"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={3}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <span className={`text-sm font-medium truncate ${
                                                        isSelected ? 'text-elvee-blue' : 'text-slate-900'
                                                    }`}>
                                                        {style.name}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {error && <span className="text-xs text-rose-500">{error}</span>}
        </label>
    );
}

export default function AdminProductEdit() {
    const { props } = usePage<AdminProductEditPageProps>();
    const {
        product,
        brands,
        parentCategories,
        subcategories,
        catalogs,
        diamonds,
        metals,
        metalPurities,
        metalTones,
        sizes,
        errors,
    } = props;

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

    const form = useForm<Record<string, any>>(() => ({
        sku: product?.sku ?? '',
        name: product?.name ?? '',
        titleline: product?.titleline ?? '',
        description: product?.description ?? '',
        catalog_ids: product?.catalog_ids ?? [],
        subcategory_ids: (product?.category_ids ?? []).map(id => Number(id)).filter(id => !isNaN(id) && id > 0),
        brand_id: String(product?.brand_id ?? ''),
        category_id: String(product?.category_id ?? ''),
        style_ids: (product?.style_ids || []).map(id => Number(id)).filter(id => !isNaN(id) && id > 0),
        collection: product?.collection ?? '',
        producttype: product?.producttype ?? '',
        gender: product?.gender ?? '',
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
            ? product.variants.map((variant: any, index) => {
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
        metal_selections: extractSelectionsFromVariants.metalSelections ?? [],
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
                    categorySizeIds.every((categoryId) => variantSizeIds.includes(categoryId));
                
                if (allSizesMatch) {
                    return true;
                } else {
                    return false;
                }
            }
            return undefined;
        })(),
        selected_sizes: (() => {
            if (product?.variants && product.variants.length > 0 && product?.category?.sizes) {
                const categorySizeIds = new Set(
                    product.category.sizes.map((s: any) => typeof s.id === 'number' ? s.id : Number(s.id))
                );
                const sizeIds = product.variants
                    .map((v: any) => {
                        const sizeId = v.size_id;
                        return sizeId !== null && sizeId !== undefined ? (typeof sizeId === 'number' ? sizeId : Number(sizeId)) : null;
                    })
                    .filter((id: any) => id !== null && !isNaN(id) && categorySizeIds.has(id));
                return [...new Set(sizeIds)];
            }
            return [];
        })(),
        show_all_variants_by_size: product?.metadata?.show_all_variants_by_size ?? true,
        media_uploads: [],
        removed_media_ids: [],
    }) as Record<string, any>);
    const { setData, post, put, processing } = form;
    const data = form.data as FormData;

    const [localDescription, setLocalDescription] = useState(data.description);
    const descriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    // Ensure show_all_variants_by_size defaults to true when sizes are selected
    useEffect(() => {
        if ((data.selected_sizes || []).length > 0 && data.show_all_variants_by_size === undefined) {
            setData((prev: FormData) => ({
                ...prev,
                show_all_variants_by_size: true,
            }));
        }
    }, [data.selected_sizes, data.show_all_variants_by_size, setData]);

    useEffect(() => {
        if (data.description !== localDescription) {
            setLocalDescription(data.description);
        }
    }, [data.description]);

    const handleDescriptionChange = useCallback((value: string) => {
        setLocalDescription(value);
        if (descriptionTimeoutRef.current) {
            clearTimeout(descriptionTimeoutRef.current);
        }
        descriptionTimeoutRef.current = setTimeout(() => {
            setData('description', value);
        }, 300);
    }, [setData]);

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
        (variant: VariantForm, state: FormData) => {
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

            const rawMetadata = (variant.metadata ?? {}) as Record<string, FormDataConvertible>;
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

            const metadata: Record<string, FormDataConvertible> = {
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
            // Update data.variants if generatedMatrixVariants is not being used
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
            const shouldGroupUpdate = (data.show_all_variants_by_size === false) 
                && (field === 'inventory_quantity');
            
            // For sku, label, is_default: group when all_sizes_available OR show_all_variants_by_size is false
            const shouldGroupOtherFields = (data.all_sizes_available === true || data.show_all_variants_by_size === false) 
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
        setData((prev: FormData) => {
            const targetVariant = (prev.variants || [])[index];
            if (!targetVariant) return prev;
            
            // If "Show all variants" is unchecked, inventory_quantity is common for all variants with same metal
            // If "Show all variants" is checked, inventory_quantity is separate for each variant
            const shouldGroupUpdate = (prev.show_all_variants_by_size === false) 
                && (field === 'inventory_quantity');
            
            // For sku, label, is_default: group when all_sizes_available OR show_all_variants_by_size is false
            const shouldGroupOtherFields = (prev.all_sizes_available === true || prev.show_all_variants_by_size === false) 
                && (field === 'sku' || field === 'label' || field === 'is_default');
            
            if (shouldGroupUpdate || shouldGroupOtherFields) {
                const targetMetals = (targetVariant.metals || []).filter(
                    (m) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                );
                const targetMetalsKey = targetMetals
                    .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                    .sort()
                    .join('|');
                
                const variants = (prev.variants || []).map((variant: VariantForm) => {
                    const variantMetals = (variant.metals || []).filter(
                        (m) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                    );
                    const variantMetalsKey = variantMetals
                        .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                        .sort()
                        .join('|');
                    
                    if (variantMetalsKey === targetMetalsKey) {
                        return {
                            ...variant,
                            [field]: value,
                        };
                    }
                    return variant;
                });
                
                return {
                    ...prev,
                    variants,
                };
            }
            
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

            const draft: FormData = {
                ...prev,
                variants,
            };

            draft.variants = recalculateVariants(draft);

            return draft;
        });
    };

    const updateVariantMetadata = (index: number, changes: Record<string, FormDataConvertible | null>) => {
        // Update generatedMatrixVariants
        setGeneratedMatrixVariants((prev) => {
            if (prev.length === 0) return prev;
            return prev.map((variant: VariantForm, idx: number) => {
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
        });
        
        // Also update form data (for backward compatibility)
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
        // Update generatedMatrixVariants
        setGeneratedMatrixVariants((prev) => {
            if (prev.length === 0) return prev;
            return prev.map((variant: VariantForm, idx: number) => ({
                ...variant,
                is_default: idx === index,
            }));
        });
        
        // Also update form data (for backward compatibility)
        setData((prev: FormData) => ({
            ...prev,
            variants: (prev.variants || []).map((variant: VariantForm, idx: number) => ({
                ...variant,
                is_default: idx === index,
            })),
        }));
    };

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
            const shouldGroupUpdate = data.show_all_variants_by_size === false;
            
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
        setData((prev: FormData) => {
            const targetVariant = (prev.variants || [])[variantIndex];
            if (!targetVariant) return prev;
            
            // If "Show all variants" is unchecked, weight is common for all variants with same metal
            // If "Show all variants" is checked, weight is separate for each variant
            const shouldGroupUpdate = prev.show_all_variants_by_size === false;
            
            if (shouldGroupUpdate) {
                const targetMetals = (targetVariant.metals || []).filter(
                    (m) => m.metal_id !== '' && m.metal_id !== null && typeof m.metal_id === 'number'
                );
                const targetMetalsKey = targetMetals
                    .map(m => `${m.metal_id}-${m.metal_purity_id || 'null'}-${m.metal_tone_id || 'null'}`)
                    .sort()
                    .join('|');
                
                const variants = (prev.variants || []).map((variant: VariantForm) => {
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
                
                return {
                    ...prev,
                    variants,
                };
            }
            
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

    const generateVariantMatrixForData = (prev: FormData): FormData => {
        return generateVariantMatrixUtil({
            formData: prev,
            parentCategories,
            product: product ?? null,
            emptyVariant,
            recalculateVariants: recalculateVariants as (draft: FormData) => VariantForm[],
        });
    };

    const generateVariantMatrix = () => {
        // Validate that at least one metal is selected before generating matrix
        const selectedMetals = data.selected_metals || [];
        
        if (!Array.isArray(selectedMetals) || selectedMetals.length === 0) {
            setMetalSelectionError('Please select at least one metal before generating the variant matrix. Metals are required.');
            return;
        }
        
        // Validate that each selected metal has at least one purity and one tone selected
        const metalConfigurations = data.metal_configurations || {};
        const missingConfigurations: string[] = [];
        
        selectedMetals.forEach((metalId) => {
            const metal = metals.find(m => m.id === metalId);
            if (!metal) return;
            
            const config = metalConfigurations[metalId] || { purities: [], tones: [] };
            const availablePurities = metalPurities.filter(p => p.metal_id === metalId);
            const availableTones = metalTones.filter(t => t.metal_id === metalId);
            
            // Check if purities are required and selected
            const hasPurities = availablePurities.length === 0 || (config.purities && config.purities.length > 0);
            // Check if tones are required and selected
            const hasTones = availableTones.length === 0 || (config.tones && config.tones.length > 0);
            
            if (!hasPurities || !hasTones) {
                const missingParts: string[] = [];
                if (availablePurities.length > 0 && (!config.purities || config.purities.length === 0)) {
                    missingParts.push('purity');
                }
                if (availableTones.length > 0 && (!config.tones || config.tones.length === 0)) {
                    missingParts.push('tone');
                }
                if (missingParts.length > 0) {
                    missingConfigurations.push(`${metal.name} (${missingParts.join(' and ')})`);
                }
            }
        });
        
        if (missingConfigurations.length > 0) {
            const metalList = missingConfigurations.slice(0, 3).join(', ');
            const moreCount = missingConfigurations.length > 3 ? ` and ${missingConfigurations.length - 3} more` : '';
            setMetalSelectionError(`Please select at least one purity and one tone for the following metal${missingConfigurations.length > 1 ? 's' : ''}: ${metalList}${moreCount}.`);
            return;
        }
        
        // Clear any previous error if all validations pass
        setMetalSelectionError(null);
        
        // Generate matrix but store in separate state variable, not in form data
        // Use the current form data to generate variants based on current selections
        const generatedData = generateVariantMatrixForData(data);
        const generatedVariants = generatedData.variants || [];
        
        // Store the show_all_variants_by_size setting used for this generation
        // This ensures the display respects the setting at generation time, not the current checkbox state
        setGeneratedShowAllVariantsBySize(data.show_all_variants_by_size);
        
        // Set the generated variants - generation already handles grouping based on show_all_variants_by_size
        setGeneratedMatrixVariants([...generatedVariants]);
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const hasMediaUploads = (form.data.media_uploads?.length ?? 0) > 0;

        form.transform((current) => {
            const formState = current as FormData;
            const payload: any = { ...formState };
            
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
                form.setError('variants', 'At least one product variant is required. Please generate the variant matrix before saving.');
                // Don't include variants in payload if validation fails
                payload.variants = [];
                return payload;
            }

            if (formState.media_uploads && Array.isArray(formState.media_uploads) && formState.media_uploads.length > 0) {
                payload.media_uploads = formState.media_uploads;
            }

            payload.sku = formState.sku || '';
            payload.name = formState.name || '';
            payload.titleline = formState.titleline || null;
            payload.collection = formState.collection || null;
            payload.producttype = formState.producttype || null;
            payload.gender = formState.gender || null;
            payload.description = formState.description || '';

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

            // Handle style_ids (multi-select)
            const styleIds = formState.style_ids || [];
            if (Array.isArray(styleIds) && styleIds.length > 0) {
                payload.style_ids = styleIds;
            } else {
                payload.style_ids = [];
            }

            const selectedTypes = formState.making_charge_types || [];

            if (selectedTypes.includes('fixed')) {
                const makingChargeValue = formState.making_charge_amount;
                if (makingChargeValue === '' || makingChargeValue === null || makingChargeValue === undefined) {
                    payload.making_charge_amount = 0;
                } else {
                    const numValue = Number(makingChargeValue);
                    payload.making_charge_amount = isNaN(numValue) ? 0 : numValue;
                }
            } else {
                payload.making_charge_amount = 0;
            }

            if (selectedTypes.includes('percentage')) {
                const makingChargePercentageValue = formState.making_charge_percentage;
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

            payload.is_active = formState.is_active ?? true;

            // Prepare metadata object with show_all_variants_by_size
            // Always set show_all_variants_by_size in metadata, using the current value from form data
            // This ensures the checkbox state is saved even if "Generate Matrix" wasn't clicked
            const metadata: Record<string, any> = {};
            metadata.show_all_variants_by_size = showAllVariantsBySizeValue;
            
            if (Object.keys(metadata).length > 0) {
                payload.metadata = metadata;
            } else {
                delete payload.metadata;
            }
            if (!payload.media_uploads || (Array.isArray(payload.media_uploads) && payload.media_uploads.length === 0)) {
                delete payload.media_uploads;
            }
            if (!payload.removed_media_ids || (Array.isArray(payload.removed_media_ids) && payload.removed_media_ids.length === 0)) {
                delete payload.removed_media_ids;
            }

            if (!payload.sku) payload.sku = '';
            if (!payload.name) payload.name = '';
            if (payload.brand_id === undefined) payload.brand_id = null;
            if (payload.category_id === undefined) payload.category_id = null;
            if (payload.making_charge_amount === undefined) payload.making_charge_amount = 0;

            if (formState.subcategory_ids && Array.isArray(formState.subcategory_ids) && formState.subcategory_ids.length > 0) {
                payload.category_ids = formState.subcategory_ids;
            } else {
                payload.category_ids = [];
            }
            delete payload.subcategory_ids;

            // Use variants for submission (from generatedMatrixVariants if available, otherwise newly generated)
            if (variantsToUse && Array.isArray(variantsToUse) && variantsToUse.length > 0) {
                const diamondSelections = formState.diamond_selections || [];
                
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
                    form.setError('variants', `The following variant${variantsWithoutMetals.length > 1 ? 's' : ''} must have at least one metal: ${variantList}${moreCount}. Metals are required for all variants.`);
                    return payload;
                }
                
                // Create a deep copy of variants to avoid mutating the original
                let processedVariants = variantsToUse.map((variant: any) => ({
                    ...variant,
                    metals: variant.metals ? variant.metals.map((m: any) => ({ ...m })) : [],
                    diamonds: variant.diamonds ? variant.diamonds.map((d: any) => ({ ...d })) : [],
                }));
                
                // If "Show all variants" is unchecked, apply weight and inventory_quantity to all variants with same metal
                if (formState.show_all_variants_by_size === false) {
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
                    const formattedVariant = { ...variant };
                    
                    // Ensure inventory_quantity is explicitly included
                    if (variant.inventory_quantity !== undefined && variant.inventory_quantity !== null) {
                        formattedVariant.inventory_quantity = typeof variant.inventory_quantity === 'number' 
                            ? variant.inventory_quantity 
                            : (variant.inventory_quantity === '' ? 0 : parseInt(String(variant.inventory_quantity), 10));
                    } else {
                        formattedVariant.inventory_quantity = 0;
                    }
                    
                    let variantDiamonds: any[] = [];
                    
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
                                    return null;
                                }
                                
                                const diamondsCount = diamond.diamonds_count !== '' && 
                                                     diamond.diamonds_count !== null && 
                                                     diamond.diamonds_count !== undefined
                                    ? (typeof diamond.diamonds_count === 'number' 
                                        ? diamond.diamonds_count 
                                        : Number(diamond.diamonds_count))
                                    : null;
                                
                                return {
                                    id: diamond.id ?? null,
                                    diamond_id: diamondId,
                                    diamonds_count: diamondsCount,
                                    metadata: diamond.metadata ?? {},
                                };
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
                                
                                return {
                                    id: null,
                                    diamond_id: diamondId,
                                    diamonds_count: diamondsCount,
                                    metadata: {},
                                };
                            })
                            .filter((d: any) => d !== null);
                    }
                    
                    formattedVariant.diamonds = variantDiamonds;
                    
                    return formattedVariant;
                });
            } else {
                payload.variants = [];
            }

            if (formState.diamond_selections !== undefined) {
                payload.diamond_selections = formState.diamond_selections;
            }

            if (product?.id && hasMediaUploads) {
                payload._method = 'PUT';
            }

            return payload;
        });

        const submitOptions = {
            preserveScroll: true,
            forceFormData: hasMediaUploads,
            onFinish: () => {
                form.transform((data) => data);
            },
        };

        if (product?.id) {
            if (hasMediaUploads) {
                post(route('admin.products.update', product.id), submitOptions);
            } else {
                put(route('admin.products.update', product.id), submitOptions);
            }
        } else {
            post(route('admin.products.store'), submitOptions);
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
                        <BrandButton
                            type="submit"
                            disabled={processing}
                        >
                            {processing ? 'Saving…' : product?.id ? 'Save changes' : 'Create product'}
                        </BrandButton>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className="space-y-4">
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>SKU *</span>
                                    <input
                                        type="text"
                                        value={data.sku}
                                        onChange={(event) => setData('sku', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        placeholder="Enter SKU"
                                    />
                                    {errors.sku && <span className="text-xs text-rose-500">{errors.sku}</span>}
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Product name *</span>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(event) => setData('name', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        placeholder="Enter product name"
                                    />
                                    {errors.name && <span className="text-xs text-rose-500">{errors.name}</span>}
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Product Type *</span>
                                    <input
                                        type="text"
                                        value={data.producttype}
                                        onChange={(event) => setData('producttype', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        placeholder="Enter product type"
                                    />
                                    {errors.producttype && <span className="text-xs text-rose-500">{errors.producttype}</span>}
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Title Line *</span>
                                    <input
                                        type="text"
                                        value={data.titleline}
                                        onChange={(event) => setData('titleline', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        placeholder="Enter product title line"
                                    />
                                    {errors.titleline && <span className="text-xs text-rose-500">{errors.titleline}</span>}
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Collection *</span>
                                    <input
                                        type="text"
                                        value={data.collection}
                                        onChange={(event) => setData('collection', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        placeholder="Enter collection name"
                                    />
                                    {errors.collection && <span className="text-xs text-rose-500">{errors.collection}</span>}
                                </label>

                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Gender *</span>
                                    <select
                                        value={data.gender}
                                        onChange={(event) => setData('gender', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Men">Men</option>
                                        <option value="Women">Women</option>
                                        <option value="Unisex">Unisex</option>
                                        <option value="Kids">Kids</option>
                                    </select>
                                    {errors.gender && <span className="text-xs text-rose-500">{errors.gender}</span>}
                                </label>
                            </div>

                            <div className="space-y-4">
                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Brand *</span>
                                    <select
                                        value={data.brand_id}
                                        onChange={(event) => setData('brand_id', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
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
                                        onChange={(event) => {
                                            setData('category_id', event.target.value);
                                            // Clear style_ids when category changes
                                            setData('style_ids', []);
                                        }}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    >
                                        <option value="">Select category</option>
                                        {(parentCategories || []).map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category_id && <span className="text-xs text-rose-500">{errors.category_id}</span>}
                                </label>
                                <SubcategoryMultiSelect
                                    subcategories={subcategories || []}
                                    selectedIds={Array.isArray(data.subcategory_ids) ? data.subcategory_ids : []}
                                    parentCategoryId={data.category_id === '' || data.category_id === null || data.category_id === undefined ? '' : (isNaN(Number(data.category_id)) ? '' : Number(data.category_id))}
                                    onChange={(selectedIds) => setData('subcategory_ids', selectedIds)}
                                    error={errors.subcategory_ids}
                                />
                                
                                {/* Style multi-select - appears after category selection */}
                                {data.category_id && data.category_id !== '' && (() => {
                                    const selectedCategoryId = Number(data.category_id);
                                    const selectedCategory = parentCategories.find(cat => cat.id === selectedCategoryId);
                                    const availableStyles = selectedCategory?.styles || [];
                                    
                                    return (
                                        <StyleMultiSelect
                                            styles={availableStyles}
                                            selectedIds={Array.isArray(data.style_ids) ? data.style_ids : []}
                                            onChange={(selectedIds) => setData('style_ids', selectedIds)}
                                            error={errors.style_ids}
                                        />
                                    );
                                })()}
                                
                                 <CatalogMultiSelect
                                    catalogs={catalogs}
                                    selectedIds={Array.isArray(data.catalog_ids) ? data.catalog_ids : []}
                                    onChange={(selectedIds) => setData('catalog_ids', selectedIds)}
                                    error={errors.catalog_ids}
                                />

                                <div className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span className="mb-2 block">Making Charge *</span>
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.making_charge_types?.includes('fixed') ?? false}
                                                onChange={(e) => {
                                                    const currentTypes = data.making_charge_types || [];
                                                    if (e.target.checked) {
                                                        setData('making_charge_types', [...currentTypes, 'fixed']);
                                                    } else {
                                                        setData('making_charge_types', currentTypes.filter(t => t !== 'fixed'));
                                                    }
                                                }}
                                                className="h-5 w-5 rounded border-slate-300 text-elvee-blue focus:ring-2 focus:ring-elvee-blue focus:ring-offset-0"
                                            />
                                            <span className="text-sm font-medium text-slate-700">Fixed Amount</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.making_charge_types?.includes('percentage') ?? false}
                                                onChange={(e) => {
                                                    const currentTypes = data.making_charge_types || [];
                                                    if (e.target.checked) {
                                                        setData('making_charge_types', [...currentTypes, 'percentage']);
                                                    } else {
                                                        setData('making_charge_types', currentTypes.filter(t => t !== 'percentage'));
                                                    }
                                                }}
                                                className="h-5 w-5 rounded border-slate-300 text-elvee-blue focus:ring-2 focus:ring-elvee-blue focus:ring-offset-0"
                                            />
                                            <span className="text-sm font-medium text-slate-700">Percentage</span>
                                        </label>
                                    </div>
                                </div>
                                {(errors.making_charge_types && (!data.making_charge_types || data.making_charge_types.length === 0)) && (
                                    <div className="mt-2">
                                        <span className="block text-xs text-rose-500">{errors.making_charge_types}</span>
                                    </div>
                                )}
                                {(data.making_charge_types?.includes('fixed') ?? false) && (
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Making Charge (₹) {(data.making_charge_types?.includes('percentage') ?? false) ? '' : '*'}</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.making_charge_amount}
                                            onChange={(event) => setData('making_charge_amount', event.target.value)}
                                            className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                            placeholder="Enter fixed making charge"
                                        />
                                        {errors.making_charge_amount && <span className="text-xs text-rose-500">{errors.making_charge_amount}</span>}
                                    </label>
                                )}
                                {(data.making_charge_types?.includes('percentage') ?? false) && (
                                    <label className="flex flex-col gap-2 text-sm text-slate-600">
                                        <span>Making Charge Percentage (%) {(data.making_charge_types?.includes('fixed') ?? false) ? '' : '*'}</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={data.making_charge_percentage}
                                            onChange={(event) => setData('making_charge_percentage', event.target.value)}
                                            className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                            placeholder="Enter percentage (e.g., 10 for 10%)"
                                        />
                                        <span className="text-xs text-slate-500">Percentage will be calculated on metal cost</span>
                                        {errors.making_charge_percentage && <span className="text-xs text-rose-500">{errors.making_charge_percentage}</span>}
                                    </label>
                                )}
                                {(errors.making_charge_types && data.making_charge_types && data.making_charge_types.length > 0) && (
                                    <div className="mt-2">
                                        <span className="block text-xs text-rose-500">{errors.making_charge_types}</span>
                                    </div>
                                )}
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
                    </div>

                    <div className="mt-6 space-y-6">
                            {/* <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <h3 className="text-sm font-semibold text-slate-900 mb-2">Variant Configuration Options</h3>
                                <p className="text-xs text-slate-600 mb-4">
                                    Use the configuration buttons in the variant table below to add metals (with purity and tone) and diamonds to each variant.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-elvee-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 13h8l-4-4m0 8l4-4" />
                                        </svg>
                                        <span className="text-slate-700">Configure Metals</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-elvee-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <span className="text-slate-700">Configure Diamonds</span>
                                    </div>
                                </div>
                            </div> */}

                            {(() => {
                                const categoryId = data.category_id ? Number(data.category_id) : null;
                                const selectedCategory = categoryId ? parentCategories.find(cat => cat.id === categoryId) : null;
                                const categoryHasSizes = (selectedCategory && 'sizes' in selectedCategory && selectedCategory.sizes && selectedCategory.sizes.length > 0) || 
                                                         (product?.category?.id === categoryId && product.category.sizes && product.category.sizes.length > 0);
                                const categorySizes = (selectedCategory && 'sizes' in selectedCategory && selectedCategory.sizes) || 
                                                      (product?.category?.sizes || []);
                                
                                if (!categoryHasSizes) {
                                    return null;
                                }
                                
                                const allCategorySizeIds = categorySizes.map((s: any) => typeof s.id === 'number' ? s.id : Number(s.id));
                                const selectedSizes = data.selected_sizes || [];
                                const allSizesSelected = selectedSizes.length > 0 && allCategorySizeIds.length > 0 && 
                                    allCategorySizeIds.every((id: number) => selectedSizes.includes(id));
                                
                                return (
                                    <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                        <div>
                                            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Sizes</h3>
                                            <p className="text-xs text-slate-500">
                                                This category "{selectedCategory?.name || product?.category?.name}" has {categorySizes.length} sizes available. 
                                                Select sizes to include in your product variants.
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-slate-900">Select Sizes</h4>
                                                {/* {selectedSizes.length > 0 && (
                                                    <span className="text-xs font-medium text-elvee-blue">
                                                        {selectedSizes.length} size{selectedSizes.length !== 1 ? 's' : ''} selected
                                                    </span>
                                                )} */}
                                            </div>
                                            
                                            <div className="mb-4">
                                                <div className="flex items-center justify-end gap-4 flex-wrap">
                                                    <label className="inline-flex items-center gap-2 cursor-pointer hover:text-elvee-blue transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.show_all_variants_by_size === true}
                                                            onChange={(e) => {
                                                                setData((prev: FormData) => ({
                                                                    ...prev,
                                                                    show_all_variants_by_size: e.target.checked ? true : false,
                                                                }));
                                                            }}
                                                            className="h-4 w-4 rounded border-2 border-slate-300 text-elvee-blue focus:ring-2 focus:ring-feather-gold focus:ring-offset-0 cursor-pointer"
                                                        />
                                                        <span className="text-sm font-semibold text-slate-700 hover:text-elvee-blue whitespace-nowrap">
                                                            Show all variants
                                                        </span>
                                                    </label>
                                                    <label className="inline-flex items-center gap-2 cursor-pointer hover:text-elvee-blue transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={allSizesSelected}
                                                            onChange={(e) => {
                                                                setData((prev: FormData) => {
                                                                    const allCategorySizeIds = categorySizes.map((s: any) => typeof s.id === 'number' ? s.id : Number(s.id));
                                                                    const currentSizes = prev.selected_sizes || [];
                                                                    const allSelected = currentSizes.length > 0 && allCategorySizeIds.every((id: number) => currentSizes.includes(id));
                                                                    
                                                                    const newSizes = e.target.checked ? allCategorySizeIds : [];
                                                                    const newAllSelected = newSizes.length > 0 && allCategorySizeIds.every((id: number) => newSizes.includes(id));
                                                                    
                                                                    return {
                                                                        ...prev,
                                                                        selected_sizes: newSizes,
                                                                        all_sizes_available: newAllSelected ? true : undefined,
                                                                        show_all_variants_by_size: prev.show_all_variants_by_size === undefined ? true : prev.show_all_variants_by_size,
                                                                    };
                                                                });
                                                            }}
                                                            className="h-4 w-4 rounded border-2 border-slate-300 text-elvee-blue focus:ring-2 focus:ring-feather-gold focus:ring-offset-0 cursor-pointer"
                                                        />
                                                        <span className="text-sm font-semibold text-slate-700 hover:text-elvee-blue whitespace-nowrap">
                                                            Select all sizes
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                {categorySizes.map((size: any) => {
                                                    const sizeId = typeof size.id === 'number' ? size.id : Number(size.id);
                                                    const isSizeSelected = selectedSizes.includes(sizeId);
                                                    return (
                                                        <label
                                                            key={sizeId || size.name}
                                                            className={`
                                                                inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer
                                                                ${isSizeSelected
                                                                    ? 'bg-elvee-blue text-white shadow-sm'
                                                                    : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                                                }
                                                            `}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSizeSelected}
                                                                onChange={(e) => {
                                                                    setData((prev: FormData) => {
                                                                        const currentSizes = prev.selected_sizes || [];
                                                                        const newSizes = e.target.checked
                                                                            ? [...currentSizes, sizeId]
                                                                            : currentSizes.filter(id => id !== sizeId);
                                                                        const allCategorySizeIds = categorySizes.map((s: any) => typeof s.id === 'number' ? s.id : Number(s.id));
                                                                        const allSelected = newSizes.length > 0 && allCategorySizeIds.every((id: number) => newSizes.includes(id));
                                                                        
                                                                        return {
                                                                            ...prev,
                                                                            selected_sizes: newSizes,
                                                                            all_sizes_available: allSelected ? true : undefined,
                                                                            show_all_variants_by_size: prev.show_all_variants_by_size === undefined ? true : prev.show_all_variants_by_size,
                                                                        };
                                                                    });
                                                                }}
                                                                className={`mr-2 h-4 w-4 rounded border-2 ${
                                                                    isSizeSelected
                                                                        ? 'border-white bg-white text-elvee-blue'
                                                                        : 'border-slate-300 bg-white text-slate-700'
                                                                } focus:ring-2 focus:ring-feather-gold focus:ring-offset-0`}
                                                            />
                                                            {size.name || size.value}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div>
                                    <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Metals</h3>
                                    <p className="text-xs text-slate-500">Select metals that can be used in your product variants.</p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {metals.map((metal) => {
                                        const isSelected = (data.selected_metals || []).includes(metal.id);
                                        return (
                                            <label
                                                key={metal.id}
                                                className={`
                                                    inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer
                                                    ${isSelected
                                                        ? 'bg-elvee-blue text-white shadow-sm'
                                                        : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                                    }
                                                `}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        setData((prev: FormData) => {
                                                            const currentSelected = prev.selected_metals || [];
                                                            const newSelected = e.target.checked
                                                                ? [...currentSelected, metal.id]
                                                                : currentSelected.filter(id => id !== metal.id);

                                                            const newConfig = { ...(prev.metal_configurations || {}) };
                                                            if (!e.target.checked) {
                                                                delete newConfig[metal.id];
                                                            } else if (!newConfig[metal.id]) {
                                                                newConfig[metal.id] = { purities: [], tones: [] };
                                                            }

                                                            return {
                                                                ...prev,
                                                                selected_metals: newSelected,
                                                                metal_configurations: newConfig,
                                                            };
                                                        });
                                                        
                                                        // Clear error when metal is selected
                                                        if (e.target.checked && metalSelectionError) {
                                                            setMetalSelectionError(null);
                                                        }
                                                    }}
                                                    className={`mr-2 h-4 w-4 rounded border-2 ${
                                                        isSelected
                                                            ? 'border-white bg-white text-elvee-blue'
                                                            : 'border-slate-300 bg-white text-slate-700'
                                                    } focus:ring-2 focus:ring-feather-gold focus:ring-offset-0`}
                                                />
                                                {metal.name}
                                            </label>
                                        );
                                    })}
                                </div>

                                <div className="space-y-4">
                                    {metals.map((metal) => {
                                        const isSelected = (data.selected_metals || []).includes(metal.id);
                                        if (!isSelected) return null;

                                        const metalConfig = (data.metal_configurations || {})[metal.id] || { purities: [], tones: [] };
                                        const availablePurities = metalPurities.filter(p => p.metal_id === metal.id);
                                        const availableTones = metalTones.filter(t => t.metal_id === metal.id);

                                        const puritiesCount = metalConfig.purities.length > 0 ? metalConfig.purities.length : (availablePurities.length > 0 ? availablePurities.length : 1);
                                        const tonesCount = metalConfig.tones.length > 0 ? metalConfig.tones.length : (availableTones.length > 0 ? availableTones.length : 1);
                                        const variantCount = puritiesCount * tonesCount;

                                        return (
                                            <div key={metal.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="mb-4 flex items-center justify-between">
                                                    <h4 className="text-sm font-semibold text-slate-900">Metal: {metal.name}</h4>
                                                    {/* {variantCount > 0 && (
                                                        <span className="text-xs font-medium text-elvee-blue">
                                                            {variantCount} variant{variantCount !== 1 ? 's' : ''} for this metal
                                                        </span>
                                                    )} */}
                                                </div>

                                                <div className="mb-4">
                                                    <p className="mb-3 text-xs text-slate-600">
                                                        Choose all purities in which this design is available for {metal.name}.
                                                    </p>
                                                    <div className="flex flex-wrap gap-3">
                                                        {availablePurities.map((purity) => {
                                                            const isPuritySelected = metalConfig.purities.includes(purity.id);
                                                            return (
                                                                <label
                                                                    key={purity.id}
                                                                    className={`
                                                                        inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer
                                                                        ${isPuritySelected
                                                                            ? 'bg-elvee-blue text-white shadow-sm'
                                                                            : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                                                        }
                                                                    `}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isPuritySelected}
                                                                        onChange={(e) => {
                                                                            setData((prev: FormData) => {
                                                                                const config = { ...(prev.metal_configurations || {}) };
                                                                                if (!config[metal.id]) {
                                                                                    config[metal.id] = { purities: [], tones: [] };
                                                                                }
                                                                                const currentPurities = config[metal.id].purities || [];
                                                                                config[metal.id].purities = e.target.checked
                                                                                    ? [...currentPurities, purity.id]
                                                                                    : currentPurities.filter(id => id !== purity.id);

                                                                                return {
                                                                                    ...prev,
                                                                                    metal_configurations: config,
                                                                                };
                                                                            });
                                                                            
                                                                            // Clear error when purity is selected
                                                                            if (e.target.checked && metalSelectionError) {
                                                                                setMetalSelectionError(null);
                                                                            }
                                                                        }}
                                                                        className={`mr-2 h-4 w-4 rounded border-2 ${
                                                                            isPuritySelected
                                                                                ? 'border-white bg-white text-elvee-blue'
                                                                                : 'border-slate-300 bg-white text-slate-700'
                                                                        } focus:ring-2 focus:ring-feather-gold focus:ring-offset-0`}
                                                                    />
                                                                    {purity.name}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="mb-3 text-xs text-slate-600">
                                                        Choose all tones in which this design is available for {metal.name}.
                                                    </p>
                                                    <div className="flex flex-wrap gap-3">
                                                        {availableTones.map((tone) => {
                                                            const isToneSelected = metalConfig.tones.includes(tone.id);
                                                            return (
                                                                <label
                                                                    key={tone.id}
                                                                    className={`
                                                                        inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer
                                                                        ${isToneSelected
                                                                            ? 'bg-elvee-blue text-white shadow-sm'
                                                                            : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                                                        }
                                                                    `}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isToneSelected}
                                                                        onChange={(e) => {
                                                                            setData((prev: FormData) => {
                                                                                const config = { ...(prev.metal_configurations || {}) };
                                                                                if (!config[metal.id]) {
                                                                                    config[metal.id] = { purities: [], tones: [] };
                                                                                }
                                                                                const currentTones = config[metal.id].tones || [];
                                                                                config[metal.id].tones = e.target.checked
                                                                                    ? [...currentTones, tone.id]
                                                                                    : currentTones.filter(id => id !== tone.id);

                                                                                return {
                                                                                    ...prev,
                                                                                    metal_configurations: config,
                                                                                };
                                                                            });
                                                                            
                                                                            // Clear error when tone is selected
                                                                            if (e.target.checked && metalSelectionError) {
                                                                                setMetalSelectionError(null);
                                                                            }
                                                                        }}
                                                                        className={`mr-2 h-4 w-4 rounded border-2 ${
                                                                            isToneSelected
                                                                                ? 'border-white bg-white text-elvee-blue'
                                                                                : 'border-slate-300 bg-white text-slate-700'
                                                                        } focus:ring-2 focus:ring-feather-gold focus:ring-offset-0`}
                                                                    />
                                                                    {tone.name}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Error message box at the bottom of metals section */}
                                {(errors.selected_metals || metalSelectionError) && (
                                    <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3">
                                        <div className="flex items-start gap-2">
                                            <svg
                                                className="h-5 w-5 flex-shrink-0 text-rose-600 mt-0.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            <p className="text-sm text-rose-800">
                                                {errors.selected_metals || metalSelectionError}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Diamonds</h3>
                                        <p className="text-xs text-slate-500">Select diamonds and specify counts for your product variants.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addDiamondSelection}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-feather-gold hover:bg-feather-gold/5"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                                        </svg>
                                        Add Diamond
                                    </button>
                                </div>
                                {(data.diamond_selections || []).length > 0 ? (
                                    <div className="space-y-3">
                                        {(data.diamond_selections || []).map((selection, index) => {
                                            const isDiamondSelected = selection.diamond_id !== '' && selection.diamond_id !== null && selection.diamond_id !== undefined;
                                            const isCountEmpty = !selection.count || selection.count.trim() === '' || Number(selection.count) <= 0;
                                            const hasError = isDiamondSelected && isCountEmpty;
                                            
                                            return (
                                                <div key={index} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                                    <div className="flex-1">
                                                        <label className="mb-1 block text-xs font-semibold text-slate-600">Diamond</label>
                                                        <select
                                                            value={selection.diamond_id === '' ? '' : selection.diamond_id}
                                                            onChange={(e) => updateDiamondSelection(index, 'diamond_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
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
                                                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                                                            Count
                                                            {isDiamondSelected && <span className="ml-1 text-rose-500">*</span>}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            required={isDiamondSelected}
                                                            value={selection.count}
                                                            onChange={(e) => updateDiamondSelection(index, 'count', e.target.value)}
                                                            className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                                                                hasError
                                                                    ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-200'
                                                                    : 'border-slate-200 focus:border-feather-gold focus:ring-feather-gold/20'
                                                            }`}
                                                            placeholder={isDiamondSelected ? "Required" : "0"}
                                                        />
                                                        {hasError && (
                                                            <span className="mt-1 block text-xs text-rose-500">Count is required</span>
                                                        )}
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
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">No diamonds added. Click "Add Diamond" to add one.</p>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <BrandButton
                                    type="button"
                                    onClick={generateVariantMatrix}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                    Generate Matrix
                                </BrandButton>
                            </div>
                        </div>
                    </div>

                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900">Variant Matrix</h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Configure product variants with metals and diamonds. The default variant powers the customer catalogue card pricing.
                            </p>
                        </div>
                            {/* <button
                                type="button"
                                onClick={generateVariantMatrix}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                                </svg>
                                Generate Matrix
                            </button> */}
                        </div>


                        <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-500">
                                        <tr>
                                            <th className="px-5 py-3 text-left min-w-[150px]">SKU</th>
                                            <th className="px-5 py-3 text-left min-w-[300px]">Variant Label</th>
                                            <th className="px-5 py-3 text-left min-w-[150px]">Metal</th>
                                            <th className="px-5 py-3 text-left min-w-[120px]">Purity</th>
                                            <th className="px-5 py-3 text-left min-w-[120px]">Tone</th>
                                            <th className="px-5 py-3 text-left min-w-[120px]">Weight (g)</th>
                                            <th className="px-5 py-3 text-left min-w-[120px]">Size</th>
                                            <th className="px-5 py-3 text-left">Inventory Quantity</th>
                                            <th className="px-5 py-3 text-left">Status</th>
                                            <th className="px-5 py-3 text-left">Default</th>
                                            <th className="px-5 py-3 text-right">Actions</th>
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
                                        : (data.show_all_variants_by_size !== undefined ? data.show_all_variants_by_size : true);
                                    
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
                                }, [generatedMatrixVariants, data.variants, generatedShowAllVariantsBySize]).map(({ variant, index, group }) => {
                                    const meta = buildVariantMeta(variant, data);
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
                                    } else if ((data.diamond_selections || []).length > 0) {
                                        variantDiamonds = (data.diamond_selections || [])
                                            .filter((selection) => selection.diamond_id !== '' && selection.diamond_id !== null && selection.diamond_id !== undefined)
                                            .map((selection) => ({
                                                diamond_id: typeof selection.diamond_id === 'number' ? selection.diamond_id : Number(selection.diamond_id),
                                                diamonds_count: selection.count || '',
                                            }));
                                    }


                                    const variantMetadata = (variant.metadata ?? {}) as Record<string, FormDataConvertible>;
                                    
                                    const variantSizeId = (variant as any).size_id;
                                    let sizeDisplay = '—';
                                    if (variantSizeId !== null && variantSizeId !== undefined) {
                                        const categoryId = data.category_id ? Number(data.category_id) : null;
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

                                    const rowKey = variant.id ?? `variant-${index}`;
                                    return (
                                        <React.Fragment key={rowKey}>
                                        <tr
                                            className={`hover:bg-slate-50 ${variantStatus === 'disabled' ? 'opacity-70' : ''} ${variant.is_default ? 'bg-elvee-blue/5' : ''}`}
                                        >
                                            <td className="px-5 py-3 align-middle min-w-[150px]">
                                                <input
                                                    type="text"
                                                    value={variant.sku}
                                                    onChange={(event) => updateVariant(index, 'sku', event.target.value)}
                                                    className="w-full min-w-[120px] rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
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
                                                    className="w-full min-w-[280px] rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                                    placeholder="Display label"
                                                />
                                                {errors[`variants.${index}.label`] && (
                                                    <p className="mt-1 text-xs text-rose-500">{errors[`variants.${index}.label`]}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="min-w-[150px]">
                                                    <span className="text-sm font-semibold text-slate-800">{metalDisplay}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="min-w-[120px]">
                                                    <span className="text-sm text-slate-700">{purityDisplay}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="min-w-[120px]">
                                                    <span className="text-sm text-slate-700">{toneDisplay}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 align-middle text-slate-700">
                                                <div className="flex flex-col gap-1 min-w-[120px]">
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
                                                                        className={`w-full rounded-xl border px-3 py-1.5 text-sm text-slate-700 transition-colors ${
                                                                            (!weight || weight === '')
                                                                                ? 'border-rose-300 bg-rose-50 text-rose-500 focus:border-rose-400 focus:bg-white'
                                                                                : 'border-slate-200 bg-white focus:border-feather-gold'
                                                                        } focus:outline-none focus:ring-2 focus:ring-feather-gold/20`}
                                                                        placeholder="0.000"
                                                                    />
                                                                    {(!weight || weight === '') && (
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
                                                <div className="min-w-[120px]">
                                                    {group && group.length > 1 ? (
                                                        <span className="text-sm text-slate-500 italic">All selected sizes</span>
                                                    ) : (
                                                        <span className="text-sm text-slate-700">{sizeDisplay}</span>
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
                                                                : 'border-slate-200 bg-white focus:border-feather-gold'
                                                        } focus:outline-none focus:ring-2 focus:ring-feather-gold/20`}
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
                                                    className={`rounded-xl border px-3 py-1.5 text-sm text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 ${
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
                                            <td className="px-5 py-3 text-slate-700">
                                                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                                                    <input
                                                        type="radio"
                                                        name="default-variant-table"
                                                        checked={variant.is_default}
                                                        onChange={() => markDefault(index)}
                                                        className="h-4 w-4 text-elvee-blue focus:ring-feather-gold"
                                                    />
                                                    <span>{variant.is_default ? 'Default' : 'Set default'}</span>
                                                </label>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariant(index, variant)}
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
                                        {expandedMetalVariantIndices.has(index) && (
                                            <tr key={`${rowKey}-expanded`}>
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
                                                                                                : 'border-slate-200 bg-white focus:border-feather-gold'
                                                                                        } focus:outline-none focus:ring-2 focus:ring-feather-gold/20`}
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
                                                                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
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
                                                                                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
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

