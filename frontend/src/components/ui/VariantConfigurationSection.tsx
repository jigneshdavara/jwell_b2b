'use client';

import React, { useState } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import type { ProductFormData } from '@/lib/validation/admin.schema';
import type { OptionListItem, MetalOption, MetalPurityOption, MetalToneOption, AdminProduct as Product } from '@/types/product';

type VariantConfigurationSectionProps = {
    watch: UseFormWatch<ProductFormData>;
    setValue: UseFormSetValue<ProductFormData>;
    errors: Record<string, any>;
    formErrors: Record<string, any>;
    parentCategories: OptionListItem[];
    product: Product | null;
    metals: MetalOption[];
    metalPurities: MetalPurityOption[];
    metalTones: MetalToneOption[];
    diamonds: OptionListItem[];
    onGenerateMatrix: () => void;
    metalSelectionError: string | null;
    setMetalSelectionError: (error: string | null) => void;
};

export default function VariantConfigurationSection({
    watch,
    setValue,
    errors,
    formErrors,
    parentCategories,
    product,
    metals,
    metalPurities,
    metalTones,
    diamonds,
    onGenerateMatrix,
    metalSelectionError,
    setMetalSelectionError,
}: VariantConfigurationSectionProps) {
    const data = watch();

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

    const categoryId = watch('category_id') ? Number(watch('category_id')) : null;
    const selectedCategory = categoryId ? parentCategories.find(cat => cat.id === categoryId) : null;
    
    const categorySizes = (() => {
        if (selectedCategory && 'sizes' in selectedCategory && Array.isArray(selectedCategory.sizes) && selectedCategory.sizes.length > 0) {
            return selectedCategory.sizes;
        }
        if (product?.category?.id === categoryId && product.category.sizes && Array.isArray(product.category.sizes) && product.category.sizes.length > 0) {
            return product.category.sizes;
        }
        return [];
    })();
    
    const categoryHasSizes = categorySizes.length > 0;
    const allCategorySizeIds = categoryHasSizes ? categorySizes.map((s: any) => typeof s.id === 'number' ? s.id : Number(s.id)) : [];
    const selectedSizes = watch('selected_sizes') || [];
    const allSizesSelected = selectedSizes.length > 0 && allCategorySizeIds.length > 0 && 
        allCategorySizeIds.every((id: number) => selectedSizes.includes(id));

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:pb-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900">Variant configuration</h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Decide whether this product uses a single price or multiple combinations across metals and diamonds.
                    </p>
                </div>
            </div>

            <div className="mt-6 space-y-6">
                {/* Sizes Section - Only show if category has sizes */}
                {categoryHasSizes && (
                <div className="space-y-3 sm:space-y-4 rounded-2xl border border-slate-200 p-3 sm:p-4">
                    <div>
                        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Sizes</h3>
                        <p className="text-xs text-slate-500">
                            This category &quot;{selectedCategory?.name || product?.category?.name}&quot; has {categorySizes.length} sizes available. 
                            Select sizes to include in your product variants.
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-900">Select Sizes</h4>
                        </div>
                        
                        <div className="mb-3 sm:mb-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-end gap-2 sm:gap-4">
                                <label className="inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:text-sky-600 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={watch('show_all_variants_by_size') === true}
                                        onChange={(e) => {
                                            setValue('show_all_variants_by_size', e.target.checked ? true : false);
                                        }}
                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-2 border-slate-300 text-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
                                    />
                                    <span className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 whitespace-nowrap">
                                        Show all variants
                                    </span>
                                </label>
                                <label className="inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer hover:text-sky-600 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={allSizesSelected}
                                        onChange={(e) => {
                                            const allCategorySizeIds = categorySizes.map((s: any) => typeof s.id === 'number' ? s.id : Number(s.id));
                                            const currentSizes = data?.selected_sizes || [];
                                            
                                            const newSizes = e.target.checked ? allCategorySizeIds : [];
                                            const newAllSelected = newSizes.length > 0 && allCategorySizeIds.every((id: number) => newSizes.includes(id));
                                            
                                            setValue('selected_sizes', newSizes);
                                            setValue('all_sizes_available', newAllSelected ? true : undefined);
                                            if (data?.show_all_variants_by_size === undefined) {
                                                setValue('show_all_variants_by_size', true);
                                            }
                                        }}
                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-2 border-slate-300 text-sky-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
                                    />
                                    <span className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 whitespace-nowrap">
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
                                            inline-flex items-center justify-center rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer
                                            ${isSizeSelected
                                                ? 'bg-sky-600 text-white shadow-sm'
                                                : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSizeSelected}
                                            onChange={(e) => {
                                                const currentSizes = watch('selected_sizes') || [];
                                                const newSizes = e.target.checked
                                                    ? [...currentSizes, sizeId]
                                                    : currentSizes.filter(id => id !== sizeId);
                                                const allCategorySizeIds = categorySizes.map((s: any) => typeof s.id === 'number' ? s.id : Number(s.id));
                                                const allSelected = newSizes.length > 0 && allCategorySizeIds.every((id: number) => newSizes.includes(id));
                                                
                                                setValue('selected_sizes', newSizes);
                                                setValue('all_sizes_available', allSelected ? true : undefined);
                                                if (watch('show_all_variants_by_size') === undefined) {
                                                    setValue('show_all_variants_by_size', true);
                                                }
                                            }}
                                            className={`mr-2 h-4 w-4 rounded border-2 ${
                                                isSizeSelected
                                                    ? 'border-white bg-white text-sky-600'
                                                    : 'border-slate-300 bg-white text-slate-700'
                                            } focus:ring-2 focus:ring-sky-500 focus:ring-offset-0`}
                                        />
                                        {size.name || size.value}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
                )}

                {/* Metals Section */}
                <div className="space-y-3 sm:space-y-4 rounded-2xl border border-slate-200 p-3 sm:p-4">
                    <div>
                        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Metals</h3>
                        <p className="text-xs text-slate-500">Select metals that can be used in your product variants.</p>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {metals.map((metal) => {
                            const isSelected = (watch('selected_metals') || []).includes(metal.id);
                            return (
                                <label
                                    key={metal.id}
                                    className={`
                                        inline-flex items-center justify-center rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer
                                        ${isSelected
                                            ? 'bg-sky-600 text-white shadow-sm'
                                            : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                        }
                                    `}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                            const currentSelected = watch('selected_metals') || [];
                                            const newSelected = e.target.checked
                                                ? [...currentSelected, metal.id]
                                                : currentSelected.filter(id => id !== metal.id);

                                            const newConfig = { ...(watch('metal_configurations') || {}) };
                                            if (!e.target.checked) {
                                                delete newConfig[metal.id];
                                            } else if (!newConfig[metal.id]) {
                                                newConfig[metal.id] = { purities: [], tones: [] };
                                            }

                                            setValue('selected_metals', newSelected);
                                            setValue('metal_configurations', newConfig);
                                            
                                            if (e.target.checked && metalSelectionError) {
                                                setMetalSelectionError(null);
                                            }
                                        }}
                                        className={`mr-2 h-4 w-4 rounded border-2 ${
                                            isSelected
                                                ? 'border-white bg-white text-sky-600'
                                                : 'border-slate-300 bg-white text-slate-700'
                                        } focus:ring-2 focus:ring-sky-500 focus:ring-offset-0`}
                                    />
                                    {metal.name}
                                </label>
                            );
                        })}
                    </div>

                    <div className="space-y-4">
                        {metals.map((metal) => {
                            const isSelected = (watch('selected_metals') || []).includes(metal.id);
                            if (!isSelected) return null;

                            const metalConfig = (watch('metal_configurations') || {})[metal.id] || { purities: [], tones: [] };
                            const availablePurities = metalPurities.filter(p => p.metal_id === metal.id && (p.is_active !== false));
                            const availableTones = metalTones.filter(t => t.metal_id === metal.id && (t.is_active !== false));

                            return (
                                <div key={metal.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900">Metal: {metal.name}</h4>
                                    </div>

                                    <div className="mb-4">
                                        <p className="mb-3 text-xs text-slate-600">
                                            Choose all purities in which this design is available for {metal.name}.
                                        </p>
                                        {availablePurities.length === 0 ? (
                                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                                No active purities available for {metal.name}. Please activate at least one purity for this metal.
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                                {availablePurities.map((purity) => {
                                                    const isPuritySelected = metalConfig.purities.includes(purity.id);
                                                    return (
                                                        <label
                                                            key={purity.id}
                                                            className={`
                                                                inline-flex items-center justify-center rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer
                                                                ${isPuritySelected
                                                                    ? 'bg-sky-600 text-white shadow-sm'
                                                                    : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                                                }
                                                            `}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isPuritySelected}
                                                                onChange={(e) => {
                                                                    const config = { ...(watch('metal_configurations') || {}) };
                                                                    if (!config[metal.id]) {
                                                                        config[metal.id] = { purities: [], tones: [] };
                                                                    }
                                                                    const currentPurities = config[metal.id].purities || [];
                                                                    config[metal.id].purities = e.target.checked
                                                                        ? [...currentPurities, purity.id]
                                                                        : currentPurities.filter(id => id !== purity.id);

                                                                    setValue('metal_configurations', config);
                                                                    
                                                                    if (e.target.checked && metalSelectionError) {
                                                                        setMetalSelectionError(null);
                                                                    }
                                                                }}
                                                                className={`mr-2 h-4 w-4 rounded border-2 ${
                                                                    isPuritySelected
                                                                        ? 'border-white bg-white text-sky-600'
                                                                        : 'border-slate-300 bg-white text-slate-700'
                                                                } focus:ring-2 focus:ring-sky-500 focus:ring-offset-0`}
                                                            />
                                                            {purity.name}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <p className="mb-3 text-xs text-slate-600">
                                            Choose all tones in which this design is available for {metal.name}.
                                        </p>
                                        {availableTones.length === 0 ? (
                                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                                No active tones available for {metal.name}. Please activate at least one tone for this metal.
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                                {availableTones.map((tone) => {
                                                    const isToneSelected = metalConfig.tones.includes(tone.id);
                                                    return (
                                                        <label
                                                            key={tone.id}
                                                            className={`
                                                                inline-flex items-center justify-center rounded-full px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer
                                                                ${isToneSelected
                                                                    ? 'bg-sky-600 text-white shadow-sm'
                                                                    : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                                                }
                                                            `}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isToneSelected}
                                                                onChange={(e) => {
                                                                    const config = { ...(watch('metal_configurations') || {}) };
                                                                    if (!config[metal.id]) {
                                                                        config[metal.id] = { purities: [], tones: [] };
                                                                    }
                                                                    const currentTones = config[metal.id].tones || [];
                                                                    config[metal.id].tones = e.target.checked
                                                                        ? [...currentTones, tone.id]
                                                                        : currentTones.filter(id => id !== tone.id);

                                                                    setValue('metal_configurations', config);
                                                                    
                                                                    if (e.target.checked && metalSelectionError) {
                                                                        setMetalSelectionError(null);
                                                                    }
                                                                }}
                                                                className={`mr-2 h-4 w-4 rounded border-2 ${
                                                                    isToneSelected
                                                                        ? 'border-white bg-white text-sky-600'
                                                                        : 'border-slate-300 bg-white text-slate-700'
                                                                } focus:ring-2 focus:ring-sky-500 focus:ring-offset-0`}
                                                            />
                                                            {tone.name}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
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
                                    {typeof errors.selected_metals === 'string' 
                                        ? errors.selected_metals 
                                        : errors.selected_metals?.message || metalSelectionError}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Diamonds Section */}
                <div className="space-y-3 sm:space-y-4 rounded-2xl border border-slate-200 p-3 sm:p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Diamonds</h3>
                            <p className="text-xs text-slate-500">Select diamonds and specify counts for your product variants.</p>
                        </div>
                        <button
                            type="button"
                            onClick={addDiamondSelection}
                            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-slate-300 bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-slate-700 transition hover:border-sky-400 hover:bg-sky-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                            </svg>
                            Add Diamond
                        </button>
                    </div>
                    {(watch('diamond_selections') || []).length > 0 ? (
                        <div className="space-y-3">
                            {(watch('diamond_selections') || []).map((selection: any, index: number) => {
                                const isDiamondSelected = selection.diamond_id !== '' && selection.diamond_id !== null && selection.diamond_id !== undefined;
                                const isCountEmpty = !selection.count || selection.count.trim() === '' || Number(selection.count) <= 0;
                                const hasError = isDiamondSelected && isCountEmpty;
                                
                                return (
                                    <div key={index} className="flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3">
                                        <div className="flex-1 min-w-0">
                                            <label className="mb-1 block text-xs font-semibold text-slate-600">Diamond</label>
                                            <select
                                                value={selection.diamond_id === '' ? '' : selection.diamond_id}
                                                onChange={(e) => updateDiamondSelection(index, 'diamond_id', e.target.value === '' ? '' : Number(e.target.value))}
                                                className="w-full rounded-lg sm:rounded-xl border border-slate-200 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            >
                                                <option value="">Select diamond</option>
                                                {diamonds
                                                    .filter((diamond) => {
                                                        const otherSelectedIds = (watch('diamond_selections') || [])
                                                            .map((sel: any, idx: number) => idx !== index && sel.diamond_id ? Number(sel.diamond_id) : null)
                                                            .filter((id): id is number => id !== null);
                                                        return !otherSelectedIds.includes(diamond.id) || selection.diamond_id === diamond.id;
                                                    })
                                                    .map((diamond) => (
                                                        <option key={diamond.id} value={diamond.id}>
                                                            {diamond.name}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div className="w-10 sm:w-24 flex-shrink-0">
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
                                                className={`w-full rounded-lg sm:rounded-xl border px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                                                    hasError
                                                        ? 'border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-200'
                                                        : 'border-slate-200 focus:border-sky-400 focus:ring-sky-200'
                                                }`}
                                                placeholder={isDiamondSelected ? "Required" : "0"}
                                            />
                                            {hasError && (
                                                <span className="mt-1 block text-[10px] sm:text-xs text-rose-500">Count is required</span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeDiamondSelection(index)}
                                            className="mt-6 rounded-full border border-rose-200 p-1 sm:p-1.5 text-rose-600 transition hover:border-rose-300 hover:text-rose-700 flex-shrink-0"
                                            aria-label="Remove diamond"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400">No diamonds added. Click &quot;Add Diamond&quot; to add one.</p>
                    )}
                </div>

                {/* Generate Matrix Button */}
                <div className="space-y-2">
                    {(formErrors.variants || errors.variants) && (
                        <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-3">
                            <div className="flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-semibold text-rose-800">Variants Required</p>
                                    <p className="text-xs text-rose-700 mt-1">
                                        {formErrors.variants?.message || 
                                         (typeof errors.variants === 'string' 
                                            ? errors.variants 
                                            : errors.variants?.message) || 
                                         'At least one product variant is required. Please generate the variant matrix before saving.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onGenerateMatrix}
                            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-slate-900 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            Generate Matrix
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

