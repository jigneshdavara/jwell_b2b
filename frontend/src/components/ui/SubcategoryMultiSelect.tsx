'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { SubcategoryOption } from '@/types/product';

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
                    ? (isSelected ? 'text-sky-900' : 'text-slate-900')
                    : (isSelected ? 'text-sky-900' : 'text-slate-700');
                const bgColorClass = isSelected
                    ? 'bg-sky-50 text-sky-700'
                    : level === 0
                    ? 'text-slate-700 hover:bg-slate-50'
                    : 'text-slate-600 hover:bg-slate-50';

                const buttonContent = (
                    <>
                        <button
                            type="button"
                            onClick={() => onToggle(node.id)}
                            className={`w-full flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5 text-left transition-colors ${bgColorClass}`}
                        >
                            <div
                                className={`flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded border-2 transition-all ${
                                    isSelected
                                        ? 'border-sky-500 bg-sky-500'
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
                                <span className={`text-xs sm:text-sm font-medium truncate ${textColorClass}`}>
                                    {node.name}
                                </span>
                            </div>

                            {hasChildren && (
                                <svg
                                    className={`h-4 w-4 transition-transform ${
                                        shouldShowChildren ? 'rotate-90 text-sky-500' : 'text-slate-400'
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

type SubcategoryMultiSelectProps = {
    subcategories: SubcategoryOption[];
    selectedIds: number[];
    parentCategoryId: number | '';
    onChange: (selectedIds: number[]) => void;
    error?: string;
};

export default function SubcategoryMultiSelect({ subcategories, selectedIds, parentCategoryId, onChange, error }: SubcategoryMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const buildSubcategoryTree = useCallback((parentId: number): SubcategoryTreeNode[] => {
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
        <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center justify-between">
                <span>Subcategories</span>
                {selectedIds.length > 0 && (
                    <span className="text-[10px] sm:text-xs font-medium text-sky-600">
                        {selectedIds.length} selected
                    </span>
                )}
            </div>
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={!parentCategoryId}
                    className={`w-full rounded-lg sm:rounded-xl border ${
                        error ? 'border-rose-300' : 'border-slate-300'
                    } bg-white text-slate-900 shadow-sm px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-left focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition-all ${
                        isOpen ? 'border-slate-900 ring-2 ring-slate-900/20' : ''
                    } ${
                        !parentCategoryId ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-h-[20px] flex flex-wrap gap-1.5">
                            {!parentCategoryId ? (
                                <span className="text-xs sm:text-sm text-slate-400">Select parent category first</span>
                            ) : selectedIds.length === 0 ? (
                                <span className="text-xs sm:text-sm text-slate-400">Select subcategories...</span>
                            ) : (
                                selectedSubcategories.map((subcategory) => (
                                    <span
                                        key={subcategory.id}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 border border-sky-200"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span>{subcategory.name}</span>
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSubcategory(subcategory.id);
                                            }}
                                            className="hover:bg-sky-100 rounded-full p-0.5 transition-colors cursor-pointer"
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    removeSubcategory(subcategory.id);
                                                }
                                            }}
                                        >
                                            <svg
                                                className="h-3 w-3 text-sky-600"
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
                            className={`ml-2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 transition-transform flex-shrink-0 ${
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
                    <div className="absolute z-50 mt-2 w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 max-h-80 overflow-hidden">
                        <div className="max-h-64 overflow-y-auto p-2">
                            {availableSubcategories.length === 0 ? (
                                <div className="px-2.5 py-4 sm:px-3 sm:py-6 text-center text-xs sm:text-sm text-slate-400">
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

