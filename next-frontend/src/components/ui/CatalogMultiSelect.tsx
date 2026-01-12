'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { CatalogOption } from '@/types/product';

type CatalogMultiSelectProps = {
    catalogs: CatalogOption[];
    selectedIds: number[];
    onChange: (selectedIds: number[]) => void;
    error?: string;
};

export default function CatalogMultiSelect({ catalogs, selectedIds, onChange, error }: CatalogMultiSelectProps) {
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

    // Only count active catalogs (paused catalogs are not in catalogs array)
    const activeSelectedCount = selectedCatalogs.length;

    const removeCatalog = (catalogId: number) => {
        onChange(selectedIds.filter(id => id !== catalogId));
    };

    return (
        <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center justify-between">
                <span>Catalogs</span>
                {activeSelectedCount > 0 && (
                    <span className="text-[10px] sm:text-xs font-medium text-sky-600">
                        {activeSelectedCount} selected
                    </span>
                )}
            </div>
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full rounded-lg sm:rounded-xl border ${
                        error ? 'border-rose-300' : 'border-slate-300'
                    } bg-white text-slate-900 shadow-sm px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-left focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 transition-all ${
                        isOpen ? 'border-slate-900 ring-2 ring-slate-900/20' : ''
                    }`}
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-h-[20px] flex flex-wrap gap-1.5">
                            {activeSelectedCount === 0 ? (
                                <span className="text-xs sm:text-sm text-slate-400">Select catalogs...</span>
                            ) : (
                                selectedCatalogs.map((catalog) => (
                                    <span
                                        key={catalog.id}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 border border-sky-200"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span>{catalog.name}</span>
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeCatalog(catalog.id);
                                            }}
                                            className="hover:bg-sky-100 rounded-full p-0.5 transition-colors cursor-pointer"
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    removeCatalog(catalog.id);
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

                {isOpen && (
                    <div className="absolute z-50 mt-2 w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 max-h-80 overflow-hidden">
                        {catalogs.length > 5 && (
                            <div className="border-b border-slate-100 p-2 sm:p-3">
                                <div className="relative">
                                    <svg
                                        className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400"
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
                                        className="w-full rounded-lg sm:rounded-xl border border-slate-200 bg-white pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-64 overflow-y-auto p-2">
                            {filteredCatalogs.length === 0 ? (
                                <div className="px-2.5 py-4 sm:px-3 sm:py-6 text-center text-xs sm:text-sm text-slate-400">
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
                                                className={`w-full flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5 text-left transition-colors ${
                                                    isSelected
                                                        ? 'bg-sky-50 text-sky-700'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                }`}
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
                                                            className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white"
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
                                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                                        <span className={`text-xs sm:text-sm font-medium truncate ${
                                                            isSelected ? 'text-sky-900' : 'text-slate-900'
                                                        }`}>
                                                            {catalog.name}
                                                        </span>
                                                        {catalog.code && (
                                                            <span className={`text-[10px] sm:text-xs font-mono ${
                                                                isSelected ? 'text-sky-600' : 'text-slate-500'
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

