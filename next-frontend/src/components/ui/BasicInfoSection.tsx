'use client';

import React, { useEffect } from 'react';
import { Control, Controller } from 'react-hook-form';
import TextInput from '@/components/ui/TextInput';
import InputLabel from '@/components/ui/InputLabel';
import InputError from '@/components/ui/InputError';
import Select from '@/components/ui/Select';
import SubcategoryMultiSelect from '@/components/ui/SubcategoryMultiSelect';
import CatalogMultiSelect from '@/components/ui/CatalogMultiSelect';
import StyleMultiSelect from '@/components/ui/StyleMultiSelect';
import type { ProductFormData } from '@/lib/validation/admin.schema';
import type { OptionList, OptionListItem, CatalogOption, SubcategoryOption } from '@/types/product';

type BasicInfoSectionProps = {
    control: Control<ProductFormData>;
    watch: (name?: keyof ProductFormData | (keyof ProductFormData)[]) => any;
    setValue: (name: keyof ProductFormData, value: any) => void;
    clearErrors: (name?: keyof ProductFormData | (keyof ProductFormData)[]) => void;
    errors: Record<string, any>;
    formErrors: Record<string, any>;
    brands: OptionList;
    parentCategories: OptionListItem[];
    subcategories: SubcategoryOption[];
    catalogs: CatalogOption[];
    productId?: number | null;
    processing?: boolean;
};

export default function BasicInfoSection({
    control,
    watch,
    setValue,
    clearErrors,
    errors,
    formErrors,
    brands,
    parentCategories,
    subcategories,
    catalogs,
    productId,
    processing = false,
}: BasicInfoSectionProps) {
    const makingChargeTypes = watch('making_charge_types') || [];
    const selectedCategoryId = watch('category_id');
    const selectedCategory = selectedCategoryId 
        ? parentCategories.find(cat => cat.id === (typeof selectedCategoryId === 'number' ? selectedCategoryId : Number(selectedCategoryId)))
        : null;
    const categoryStyles = selectedCategory?.styles || [];

    // Initialize making_charge_types with 'fixed' by default if empty
    useEffect(() => {
        const currentTypes = watch('making_charge_types');
        if (!currentTypes || (Array.isArray(currentTypes) && currentTypes.length === 0)) {
            setValue('making_charge_types', ['fixed']);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper function to safely extract error message
    const getErrorMessage = (error: any): string | undefined => {
        if (!error) return undefined;
        if (typeof error === 'string') return error;
        if (typeof error === 'object' && 'message' in error) return error.message;
        return undefined;
    };

    // Comprehensive error extraction helper for Controller fields
    const getFieldError = (fieldName: keyof ProductFormData, fieldState: any): string | undefined => {
        let errorMessage: string | undefined;
        
        // Try fieldState.error first (react-hook-form Controller error)
        if (fieldState.error) {
            if (typeof fieldState.error === 'string') {
                errorMessage = fieldState.error;
            } else if (fieldState.error.message) {
                errorMessage = fieldState.error.message;
            } else if (fieldState.error.type === 'required') {
                errorMessage = `The ${String(fieldName).replace(/_/g, ' ')} field is required.`;
            }
        }
        
        // Try formErrors (form validation errors)
        if (!errorMessage && formErrors[fieldName]) {
            const formError = formErrors[fieldName];
            if (typeof formError === 'string') {
                errorMessage = formError;
            } else if (formError?.message) {
                errorMessage = formError.message;
            } else if (Array.isArray(formError) && formError[0]) {
                errorMessage = typeof formError[0] === 'string' ? formError[0] : formError[0]?.message;
            }
        }
        
        // Try errors (API/other errors)
        if (!errorMessage) {
            errorMessage = getErrorMessage(errors[fieldName]);
        }
        
        return errorMessage;
    };

    return (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
                        {productId ? 'Update product' : 'Create product'}
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-slate-500">
                        Define product master information and atelier references.
                    </p>
                </div>
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 sm:px-5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? 'Saving…' : productId ? 'Save changes' : 'Create product'}
                </button>
            </div>

            <div className="mt-4 sm:mt-6 space-y-6">
                {/* Two-column layout matching the image */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* SKU */}
                    <div className="space-y-2">
                        <Controller
                            name="sku"
                            control={control}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error || formErrors.sku || errors.sku;
                                const errorMessage = getFieldError('sku', fieldState);
                                return (
                                    <div>
                                        <InputLabel htmlFor="sku" value="SKU *" />
                                        <TextInput
                                            id="sku"
                                            type="text"
                                            className={`mt-1 block w-full ${hasError ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            placeholder="Enter SKU"
                                            {...field}
                                        />
                                        {errorMessage && (
                                            <InputError message={errorMessage} className="mt-2" />
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </div>

                    {/* Product Name */}
                    <div className="space-y-2">
                        <Controller
                            name="name"
                            control={control}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error || formErrors.name || errors.name;
                                const errorMessage = getFieldError('name', fieldState);
                                return (
                                    <div>
                                        <InputLabel htmlFor="name" value="Product name *" />
                                        <TextInput
                                            id="name"
                                            type="text"
                                            className={`mt-1 block w-full ${hasError ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            placeholder="Enter product name"
                                            {...field}
                                        />
                                        {errorMessage && (
                                            <InputError message={errorMessage} className="mt-2" />
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </div>

                    {/* Product Type */}
                    <div className="space-y-2">
                        <Controller
                            name="producttype"
                            control={control}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error || formErrors.producttype || errors.producttype;
                                const errorMessage = getFieldError('producttype', fieldState);
                                return (
                                    <div>
                                        <InputLabel htmlFor="producttype" value="Product Type *" />
                                        <TextInput
                                            id="producttype"
                                            type="text"
                                            className={`mt-1 block w-full ${hasError ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            placeholder="Enter product type"
                                            {...field}
                                        />
                                        {errorMessage && (
                                            <InputError message={errorMessage} className="mt-2" />
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </div>

                    {/* Title Line */}
                    <div className="space-y-2">
                        <Controller
                            name="titleline"
                            control={control}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error || formErrors.titleline || errors.titleline;
                                const errorMessage = getFieldError('titleline', fieldState);
                                return (
                                    <div>
                                        <InputLabel htmlFor="titleline" value="Title Line *" />
                                        <TextInput
                                            id="titleline"
                                            type="text"
                                            className={`mt-1 block w-full ${hasError ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            placeholder="Enter product title line"
                                            {...field}
                                        />
                                        {errorMessage && (
                                            <InputError message={errorMessage} className="mt-2" />
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </div>

                    {/* Collection */}
                    <div className="space-y-2">
                        <Controller
                            name="collection"
                            control={control}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error || formErrors.collection || errors.collection;
                                const errorMessage = getFieldError('collection', fieldState);
                                return (
                                    <div>
                                        <InputLabel htmlFor="collection" value="Collection *" />
                                        <TextInput
                                            id="collection"
                                            type="text"
                                            className={`mt-1 block w-full ${hasError ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            placeholder="Enter collection name"
                                            {...field}
                                        />
                                        {errorMessage && (
                                            <InputError message={errorMessage} className="mt-2" />
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                        <Controller
                            name="gender"
                            control={control}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error || formErrors.gender || errors.gender;
                                const errorMessage = getFieldError('gender', fieldState);
                                return (
                                    <div>
                                        <InputLabel htmlFor="gender" value="Gender *" />
                                        <Select
                                            id="gender"
                                            className={`mt-1 block w-full ${hasError ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            value={field.value || ''}
                                            onChange={(e) => field.onChange(e.target.value)}
                                        >
                                            <option value="">Select gender</option>
                                            <option value="Men">Men</option>
                                            <option value="Women">Women</option>
                                            <option value="Unisex">Unisex</option>
                                            <option value="Kids">Kids</option>
                                        </Select>
                                        {errorMessage && (
                                            <InputError message={errorMessage} className="mt-2" />
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Brand */}
                    <div className="space-y-2">
                        <Controller
                            name="brand_id"
                            control={control}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error || formErrors.brand_id || errors.brand_id;
                                const errorMessage = getFieldError('brand_id', fieldState);
                                return (
                                    <div>
                                        <InputLabel htmlFor="brand_id" value="Brand *" />
                                        <Select
                                            id="brand_id"
                                            className={`mt-1 block w-full ${hasError ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            value={field.value ? String(field.value) : ''}
                                            onChange={(e) => field.onChange(e.target.value === '' ? '' : e.target.value)}
                                        >
                                            <option value="">Select brand</option>
                                            {Object.entries(brands).map(([id, name]) => (
                                                <option key={id} value={id}>
                                                    {name}
                                                </option>
                                            ))}
                                        </Select>
                                        {errorMessage && (
                                            <InputError message={errorMessage} className="mt-2" />
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Controller
                            name="category_id"
                            control={control}
                            render={({ field, fieldState }) => {
                                const hasError = fieldState.error || formErrors.category_id || errors.category_id;
                                const errorMessage = getFieldError('category_id', fieldState);
                                return (
                                    <div>
                                        <InputLabel htmlFor="category_id" value="Category *" />
                                        <Select
                                            id="category_id"
                                            className={`mt-1 block w-full ${hasError ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                            value={field.value || ''}
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? '' : Number(e.target.value);
                                                const previousCategoryId = field.value;
                                                const previousCategoryIdNum = previousCategoryId === '' || previousCategoryId === null || previousCategoryId === undefined 
                                                    ? null 
                                                    : (typeof previousCategoryId === 'number' ? previousCategoryId : Number(previousCategoryId));
                                                const valueNum = value === '' ? null : (typeof value === 'number' ? value : Number(value));
                                                
                                                field.onChange(value);
                                                
                                                // Clear subcategories and styles when category changes
                                                if (value === '') {
                                                    setValue('subcategory_ids', []);
                                                    setValue('style_ids', []);
                                                } else if (previousCategoryIdNum !== null && valueNum !== null && previousCategoryIdNum !== valueNum) {
                                                    // Category changed to a different one, clear dependent fields
                                                    setValue('subcategory_ids', []);
                                                    setValue('style_ids', []);
                                                }
                                                // Clear error when user selects
                                                if (errors.category_id) {
                                                    clearErrors('category_id');
                                                }
                                            }}
                                        >
                                            <option value="">Select category</option>
                                            {(parentCategories || []).map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </Select>
                                        {errorMessage && (
                                            <InputError 
                                                message={errorMessage}
                                                className="mt-2"
                                            />
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </div>

                    {/* Subcategories */}
                    <div className="space-y-2">
                        <SubcategoryMultiSelect
                            subcategories={subcategories || []}
                            selectedIds={Array.isArray(watch('subcategory_ids')) ? watch('subcategory_ids') : []}
                            parentCategoryId={!selectedCategoryId || selectedCategoryId === '' || selectedCategoryId === null || selectedCategoryId === undefined || selectedCategoryId === 0 
                                ? '' 
                                : (typeof selectedCategoryId === 'number' ? selectedCategoryId : (isNaN(Number(selectedCategoryId)) ? '' : Number(selectedCategoryId)))}
                            onChange={(selectedIds) => {
                                setValue('subcategory_ids', selectedIds);
                                // Clear error when user selects
                                if (errors.subcategory_ids) {
                                    clearErrors('subcategory_ids');
                                }
                            }}
                            error={
                                Array.isArray(errors.subcategory_ids) 
                                    ? errors.subcategory_ids[0] 
                                    : (typeof errors.subcategory_ids === 'string' 
                                        ? errors.subcategory_ids 
                                        : errors.subcategory_ids?.message)
                            }
                        />
                    </div>

                    {/* Style multi-select - appears after category selection */}
                    {selectedCategoryId && (
                        <div className="space-y-2">
                            <StyleMultiSelect
                                styles={categoryStyles}
                                selectedIds={Array.isArray(watch('style_ids')) ? watch('style_ids') : []}
                                onChange={(selectedIds) => {
                                    setValue('style_ids', selectedIds);
                                    // Clear error when user selects
                                    if (errors.style_ids) {
                                        clearErrors('style_ids');
                                    }
                                }}
                                error={
                                    Array.isArray(errors.style_ids) 
                                        ? errors.style_ids[0] 
                                        : (typeof errors.style_ids === 'string' 
                                            ? errors.style_ids 
                                            : errors.style_ids?.message)
                                }
                            />
                        </div>
                    )}

                    {/* Catalogs */}
                    <div className="space-y-2">
                        <CatalogMultiSelect
                            catalogs={catalogs || []}
                            selectedIds={Array.isArray(watch('catalog_ids')) ? watch('catalog_ids') : []}
                            onChange={(selectedIds) => {
                                setValue('catalog_ids', selectedIds);
                                // Clear error when user selects
                                if (errors.catalog_ids) {
                                    clearErrors('catalog_ids');
                                }
                            }}
                            error={
                                Array.isArray(errors.catalog_ids) 
                                    ? errors.catalog_ids[0] 
                                    : (typeof errors.catalog_ids === 'string' 
                                        ? errors.catalog_ids 
                                        : errors.catalog_ids?.message)
                            }
                        />
                    </div>

                    {/* Making Charge */}
                    <div className="flex flex-col gap-2 text-sm text-slate-600">
                        <span className="mb-2 block">Making Charge *</span>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={makingChargeTypes.length === 0 || makingChargeTypes.includes('fixed')}
                                    onChange={(e) => {
                                        const currentTypes = [...makingChargeTypes];
                                        if (e.target.checked) {
                                            if (!currentTypes.includes('fixed')) {
                                                currentTypes.push('fixed');
                                            }
                                        } else {
                                            const index = currentTypes.indexOf('fixed');
                                            if (index > -1) {
                                                currentTypes.splice(index, 1);
                                            }
                                        }
                                        setValue('making_charge_types', currentTypes);
                                    }}
                                    className="h-5 w-5 rounded border-slate-300 text-elvee-blue focus:ring-2 focus:ring-elvee-blue focus:ring-offset-0"
                                />
                                <span className="text-sm font-medium text-slate-700">Fixed Amount</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={makingChargeTypes.includes('percentage')}
                                    onChange={(e) => {
                                        const currentTypes = [...makingChargeTypes];
                                        if (e.target.checked) {
                                            if (!currentTypes.includes('percentage')) {
                                                currentTypes.push('percentage');
                                            }
                                        } else {
                                            const index = currentTypes.indexOf('percentage');
                                            if (index > -1) {
                                                currentTypes.splice(index, 1);
                                            }
                                        }
                                        setValue('making_charge_types', currentTypes);
                                    }}
                                    className="h-5 w-5 rounded border-slate-300 text-elvee-blue focus:ring-2 focus:ring-elvee-blue focus:ring-offset-0"
                                />
                                <span className="text-sm font-medium text-slate-700">Percentage</span>
                            </label>
                        </div>

                        {/* Making Charge Inputs - Conditionally displayed based on selection */}
                        <div className="mt-3 space-y-3">
                            {(makingChargeTypes.length === 0 || makingChargeTypes.includes('fixed')) && (
                                <div>
                                    <InputLabel htmlFor="making_charge_amount" value="Making Charge (₹) *" />
                                    <TextInput
                                        id="making_charge_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={watch('making_charge_amount') || ''}
                                        onChange={(e) => setValue('making_charge_amount', e.target.value)}
                                        className={`mt-1 block w-full ${(formErrors.making_charge_amount || errors.making_charge_amount) ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                        placeholder="Enter fixed making charge"
                                    />
                                    {(formErrors.making_charge_amount || errors.making_charge_amount) && (
                                        <InputError 
                                            message={
                                                getErrorMessage(formErrors.making_charge_amount) ||
                                                getErrorMessage(errors.making_charge_amount) ||
                                                'Invalid value'
                                            } 
                                            className="mt-2" 
                                        />
                                    )}
                                </div>
                            )}

                            {makingChargeTypes.includes('percentage') && (
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Making Charge Percentage (%) *</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={watch('making_charge_percentage') || ''}
                                        onChange={(e) => setValue('making_charge_percentage', e.target.value)}
                                        className={`rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 ${(formErrors.making_charge_percentage || errors.making_charge_percentage) ? '!border-red-300 focus:!border-red-400 focus:!ring-red-300' : ''}`}
                                        placeholder="Enter percentage (e.g., 10 for 10%)"
                                    />
                                    <span className="text-xs text-slate-500">
                                        Percentage will be calculated on metal cost
                                    </span>
                                    {(formErrors.making_charge_percentage || errors.making_charge_percentage) && (
                                        <InputError 
                                            message={
                                                getErrorMessage(formErrors.making_charge_percentage) ||
                                                getErrorMessage(errors.making_charge_percentage) ||
                                                'Invalid value'
                                            } 
                                            className="mt-2" 
                                        />
                                    )}
                                </label>
                            )}
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}

