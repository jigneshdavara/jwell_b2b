'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

type StyleMultiSelectProps = {
    styles: Array<{ id: number; name: string }>;
    selectedIds: number[];
    onChange: (selectedIds: number[]) => void;
    error?: string;
};

export default function StyleMultiSelect({ styles, selectedIds, onChange, error }: StyleMultiSelectProps) {
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

    // Filter out invalid style IDs that don't exist in current category's styles
    const validSelectedIds = useMemo(() => {
        return selectedIds.filter(id => styles.some(style => style.id === id));
    }, [selectedIds, styles]);

    // Update parent if invalid IDs were filtered out
    useEffect(() => {
        if (validSelectedIds.length !== selectedIds.length) {
            onChange(validSelectedIds);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [validSelectedIds.length, selectedIds.length]);

    return (
        <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center justify-between">
                <span>Style</span>
                {validSelectedIds.length > 0 && (
                    <span className="text-[10px] sm:text-xs font-medium text-sky-600">
                        {validSelectedIds.length} selected
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
                            {validSelectedIds.length === 0 ? (
                                <span className="text-xs sm:text-sm text-slate-400">Select styles...</span>
                            ) : (
                                selectedStyles.map((style) => (
                                    <span
                                        key={style.id}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 border border-sky-200"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span>{style.name}</span>
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeStyle(style.id);
                                            }}
                                            className="hover:bg-sky-100 rounded-full p-0.5 transition-colors cursor-pointer"
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    removeStyle(style.id);
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
                        {styles.length > 5 && (
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
                                        placeholder="Search styles..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-white pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-64 overflow-y-auto p-2">
                            {filteredStyles.length === 0 ? (
                                <div className="px-2.5 py-4 sm:px-3 sm:py-6 text-center text-xs sm:text-sm text-slate-400">
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
                                                    <span className={`text-xs sm:text-sm font-medium truncate ${
                                                        isSelected ? 'text-sky-900' : 'text-slate-900'
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

