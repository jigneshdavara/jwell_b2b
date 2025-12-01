import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

type RateRow = {
    id: number;
    metal: string;
    purity?: string | null;
    price_per_gram: number;
    currency: string;
    source: string;
    effective_at?: string | null;
    metadata?: Record<string, unknown> | null;
};

type Pagination<T> = {
    data: T[];
};

type MetalRate = {
    purity: string;
    price_per_gram: number;
    currency: string;
};

type MetalSummary = {
    metal: string;
    label: string;
    latest: {
        purity: string | null;
        price_per_gram: number;
        currency: string;
        effective_at?: string | null;
        source?: string | null;
    } | null;
    rates: MetalRate[];
};

type MetalOption = {
    id: number;
    name: string;
    slug: string;
    value: string;
};

type PurityOption = {
    id: number;
    name: string;
    slug: string;
};

type AdminRatesPageProps = AppPageProps<{
    rates: Pagination<RateRow>;
    defaultCurrency: string;
    availableMetals: MetalOption[];
    metalSummaries: Record<string, MetalSummary>;
    metalPurities: Record<string, PurityOption[]>; // Purities grouped by metal slug
}>;

type EditableRate = {
    purity: string;
    price_per_gram: string;
};

export default function AdminRatesIndex() {
    const { rates, defaultCurrency, availableMetals, metalSummaries, metalPurities } = usePage<AdminRatesPageProps>().props;
    const [syncingMetal, setSyncingMetal] = useState<string | null>(null);
    const [selectedMetal, setSelectedMetal] = useState<string>('all');
    const [formUpdateKey, setFormUpdateKey] = useState<number>(0); // Force re-renders when form data changes

    const formatCurrency = useCallback((value: number, currency: string) => {
        try {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency,
                maximumFractionDigits: 2,
            }).format(value);
        } catch (error) {
            return `${value.toLocaleString('en-IN')} ${currency}`;
        }
    }, []);

    const formatSourceLabel = useCallback((source?: string | null) => {
        if (! source) {
            return null;
        }

        return source
            .split(/[-_]/)
            .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
            .join(' ');
    }, []);

    const mapRatesToForm = useCallback((rates: MetalRate[], metal: string, availablePurities: PurityOption[]): EditableRate[] => {
        // If no purities available, return empty rate or existing rates
        if (availablePurities.length === 0) {
            if (rates.length > 0) {
                return rates.map((rate) => ({
                    purity: rate.purity ?? '',
                    price_per_gram:
                        typeof rate.price_per_gram === 'number' && ! Number.isNaN(rate.price_per_gram)
                            ? String(rate.price_per_gram)
                            : '',
                }));
            }
            return [{ purity: '', price_per_gram: '' }];
        }

        // Create rate rows for ALL purities, preserving existing values
        return availablePurities.map((purity) => {
            const existingRate = rates.find(r => r.purity === purity.name);
            return {
                purity: purity.name,
                price_per_gram:
                    existingRate && typeof existingRate.price_per_gram === 'number' && ! Number.isNaN(existingRate.price_per_gram)
                        ? String(existingRate.price_per_gram)
                        : '',
            };
        });
    }, []);

    // Create forms for gold and silver at the top level
    const goldForm = useForm<{ currency: string; rates: EditableRate[] }>({
        currency: metalSummaries.gold?.latest?.currency ?? defaultCurrency,
        rates: mapRatesToForm(metalSummaries.gold?.rates ?? [], 'gold', metalPurities.gold ?? []),
    });

    const silverForm = useForm<{ currency: string; rates: EditableRate[] }>({
        currency: metalSummaries.silver?.latest?.currency ?? defaultCurrency,
        rates: mapRatesToForm(metalSummaries.silver?.rates ?? [], 'silver', metalPurities.silver ?? []),
    });
    
    // Store form data for dynamic metals in state
    const [dynamicMetalFormData, setDynamicMetalFormData] = useState<Record<string, { currency: string; rates: EditableRate[] }>>({});
    
    // Initialize dynamic metal form data with all purities
    useEffect(() => {
        const newData: Record<string, { currency: string; rates: EditableRate[] }> = {};
        Object.keys(metalSummaries).forEach((metalKey) => {
            if (metalKey !== 'gold' && metalKey !== 'silver') {
                const summary = metalSummaries[metalKey];
                const availablePurities = metalPurities[metalKey] ?? [];
                if (summary) {
                    newData[metalKey] = {
                        currency: summary.latest?.currency ?? defaultCurrency,
                        rates: mapRatesToForm(summary.rates, metalKey, availablePurities),
                    };
                } else if (availablePurities.length > 0) {
                    // Even if no summary exists, create rates for all purities
                    newData[metalKey] = {
                        currency: defaultCurrency,
                        rates: mapRatesToForm([], metalKey, availablePurities),
                    };
                }
            }
        });
        setDynamicMetalFormData(prev => ({ ...prev, ...newData }));
    }, [defaultCurrency, mapRatesToForm, metalPurities, metalSummaries]);
    
    // Create a single dynamic form that gets updated based on selected metal
    const dynamicForm = useForm<{ currency: string; rates: EditableRate[] }>({
        currency: defaultCurrency,
        rates: [{ purity: '', price_per_gram: '' }],
    });
    
    // Track the last selected metal to detect changes
    const lastSelectedMetalRef = useRef<string>('');
    
    // Update dynamic form when selected metal changes - auto-populate with all purities
    // IMPORTANT: Only run when selectedMetal changes, NOT when form data changes
    useEffect(() => {
        if (selectedMetal !== 'all' && selectedMetal !== 'gold' && selectedMetal !== 'silver') {
            const metalChanged = lastSelectedMetalRef.current !== selectedMetal;
            
            // Only reinitialize if metal actually changed
            if (metalChanged) {
                const availablePurities = metalPurities[selectedMetal] ?? [];
                const formData = dynamicMetalFormData[selectedMetal];
                
                if (formData && formData.rates.length > 0) {
                    // Ensure all purities are represented in the form
                    const ratesForAllPurities = mapRatesToForm(
                        formData.rates.map(r => ({ purity: r.purity, price_per_gram: parseFloat(r.price_per_gram) || 0, currency: formData.currency })),
                        selectedMetal,
                        availablePurities
                    );
                    dynamicForm.setData('currency', formData.currency);
                    dynamicForm.setData('rates', ratesForAllPurities);
                } else if (availablePurities.length > 0) {
                    // Initialize with all purities if no data exists
                    dynamicForm.setData('currency', defaultCurrency);
                    dynamicForm.setData('rates', mapRatesToForm([], selectedMetal, availablePurities));
                }
                lastSelectedMetalRef.current = selectedMetal;
            }
        } else {
            // Reset when "all" is selected
            lastSelectedMetalRef.current = '';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMetal]); // Only depend on selectedMetal to avoid resetting on form updates
    
    // Get form for a specific metal
    const getFormForMetal = useCallback((metal: string) => {
        if (metal === 'gold') return goldForm;
        if (metal === 'silver') return silverForm;
        return dynamicForm;
    }, [dynamicForm, goldForm, silverForm]);
    
    // Track if forms have been initialized to prevent infinite loops
    const goldFormInitializedRef = useRef<boolean>(false);
    const silverFormInitializedRef = useRef<boolean>(false);
    
    // Update forms when metal summaries change - auto-populate with all purities
    // Only initialize once, not on every render
    useEffect(() => {
        if (!goldFormInitializedRef.current && (metalSummaries.gold || (metalPurities.gold && metalPurities.gold.length > 0))) {
            const availablePurities = metalPurities.gold ?? [];
            if (metalSummaries.gold) {
                goldForm.setData('currency', metalSummaries.gold.latest?.currency ?? defaultCurrency);
                goldForm.setData('rates', mapRatesToForm(metalSummaries.gold.rates, 'gold', availablePurities));
            } else if (availablePurities.length > 0) {
                // Even if no summary, show all purities
                goldForm.setData('currency', defaultCurrency);
                goldForm.setData('rates', mapRatesToForm([], 'gold', availablePurities));
            }
            goldFormInitializedRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultCurrency, mapRatesToForm, metalPurities.gold, metalSummaries.gold]);

    useEffect(() => {
        if (!silverFormInitializedRef.current && (metalSummaries.silver || (metalPurities.silver && metalPurities.silver.length > 0))) {
            const availablePurities = metalPurities.silver ?? [];
            if (metalSummaries.silver) {
                silverForm.setData('currency', metalSummaries.silver.latest?.currency ?? defaultCurrency);
                silverForm.setData('rates', mapRatesToForm(metalSummaries.silver.rates, 'silver', availablePurities));
            } else if (availablePurities.length > 0) {
                // Even if no summary, show all purities
                silverForm.setData('currency', defaultCurrency);
                silverForm.setData('rates', mapRatesToForm([], 'silver', availablePurities));
            }
            silverFormInitializedRef.current = true;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultCurrency, mapRatesToForm, metalPurities.silver, metalSummaries.silver]);
    
    // Update dynamic metal form data when summaries change - but don't overwrite user input
    useEffect(() => {
        const updatedData: Record<string, { currency: string; rates: EditableRate[] }> = {};
        Object.keys(metalSummaries).forEach((metalKey) => {
            if (metalKey !== 'gold' && metalKey !== 'silver') {
                const summary = metalSummaries[metalKey];
                const availablePurities = metalPurities[metalKey] ?? [];
                if (summary) {
                    updatedData[metalKey] = {
                        currency: summary.latest?.currency ?? defaultCurrency,
                        rates: mapRatesToForm(summary.rates, metalKey, availablePurities),
                    };
                } else if (availablePurities.length > 0) {
                    // Even if no summary exists, create rates for all purities
                    updatedData[metalKey] = {
                        currency: defaultCurrency,
                        rates: mapRatesToForm([], metalKey, availablePurities),
                    };
                } else {
                    // If no purities exist, still initialize with empty data structure
                    updatedData[metalKey] = {
                        currency: defaultCurrency,
                        rates: [],
                    };
                }
            }
        });
        // Always update to ensure all metals have their data initialized
        setDynamicMetalFormData(prev => {
            const merged: Record<string, { currency: string; rates: EditableRate[] }> = { ...prev };
            Object.keys(updatedData).forEach(key => {
                // If data doesn't exist, add it. If it exists but has no rates and purities are available, update it
                const availablePurities = metalPurities[key] ?? [];
                if (!prev[key] || (prev[key].rates.length === 0 && availablePurities.length > 0)) {
                    merged[key] = updatedData[key];
                }
            });
            return merged;
        });
    }, [defaultCurrency, mapRatesToForm, metalPurities, metalSummaries]);

    const setRateField = useCallback(
        (metal: string, index: number, field: keyof EditableRate, value: string) => {
            if (metal === 'gold' || metal === 'silver') {
                const form = getFormForMetal(metal);
                // Create a new array with a new object for the updated rate to ensure React detects the change
                const updatedRates = [...form.data.rates];
                updatedRates[index] = { ...updatedRates[index], [field]: value };
                form.setData('rates', updatedRates);
            } else {
                // For dynamic metals, update dynamicMetalFormData
                setDynamicMetalFormData(prev => {
                    const metalData = prev[metal] || { currency: defaultCurrency, rates: [] };
                    const updatedRates = [...metalData.rates];
                    updatedRates[index] = { ...updatedRates[index], [field]: value };
                    return {
                        ...prev,
                        [metal]: {
                            ...metalData,
                            rates: updatedRates,
                        },
                    };
                });
            }
            // Force re-render by updating the key
            setFormUpdateKey(prev => prev + 1);
        },
        [defaultCurrency, getFormForMetal],
    );

    const addRateRow = useCallback(
        (metal: string) => {
            const purities = metalPurities[metal] ?? [];
            
            if (metal === 'gold' || metal === 'silver') {
                const form = getFormForMetal(metal);
                const usedPurities = new Set(form.data.rates.map(r => r.purity).filter(Boolean));
                const unusedPurity = purities.find(p => !usedPurities.has(p.name));
                
                if (unusedPurity) {
                    form.setData('rates', [...form.data.rates, { purity: unusedPurity.name, price_per_gram: '' }]);
                } else {
                    form.setData('rates', [...form.data.rates, { purity: '', price_per_gram: '' }]);
                }
            } else {
                // For dynamic metals, update dynamicMetalFormData
                setDynamicMetalFormData(prev => {
                    const metalData = prev[metal] || { currency: defaultCurrency, rates: [] };
                    const usedPurities = new Set(metalData.rates.map(r => r.purity).filter(Boolean));
                    const unusedPurity = purities.find(p => !usedPurities.has(p.name));
                    
                    const newRate = unusedPurity 
                        ? { purity: unusedPurity.name, price_per_gram: '' }
                        : { purity: '', price_per_gram: '' };
                    
                    return {
                        ...prev,
                        [metal]: {
                            ...metalData,
                            rates: [...metalData.rates, newRate],
                        },
                    };
                });
                setFormUpdateKey(prev => prev + 1);
            }
        },
        [defaultCurrency, getFormForMetal, metalPurities],
    );

    const removeRateRow = useCallback(
        (metal: string, index: number) => {
            const purities = metalPurities[metal] ?? [];
            
            if (metal === 'gold' || metal === 'silver') {
                const form = getFormForMetal(metal);
                
                // Don't allow removing if this would leave fewer rows than available purities
                if (purities.length > 0 && form.data.rates.length <= purities.length) {
                    const usedPurities = new Set(form.data.rates.map(r => r.purity).filter(Boolean));
                    if (usedPurities.size === purities.length && form.data.rates.length === purities.length) {
                        // All purities are shown, don't allow removing
                        return;
                    }
                }
                
                if (form.data.rates.length === 1) {
                    form.setData('rates', [{ purity: '', price_per_gram: '' }]);
                    return;
                }

                form.setData('rates', form.data.rates.filter((_, rateIndex) => rateIndex !== index));
            } else {
                // For dynamic metals, update dynamicMetalFormData
                setDynamicMetalFormData(prev => {
                    const metalData = prev[metal] || { currency: defaultCurrency, rates: [] };
                    
                    // Don't allow removing if this would leave fewer rows than available purities
                    if (purities.length > 0 && metalData.rates.length <= purities.length) {
                        const usedPurities = new Set(metalData.rates.map(r => r.purity).filter(Boolean));
                        if (usedPurities.size === purities.length && metalData.rates.length === purities.length) {
                            // All purities are shown, don't allow removing
                            return prev;
                        }
                    }
                    
                    if (metalData.rates.length === 1) {
                        return {
                            ...prev,
                            [metal]: {
                                ...metalData,
                                rates: [{ purity: '', price_per_gram: '' }],
                            },
                        };
                    }
                    
                    return {
                        ...prev,
                        [metal]: {
                            ...metalData,
                            rates: metalData.rates.filter((_, rateIndex) => rateIndex !== index),
                        },
                    };
                });
                setFormUpdateKey(prev => prev + 1);
            }
        },
        [defaultCurrency, getFormForMetal, metalPurities],
    );

    const saveMetalRates = useCallback(
        (metal: string) => {
            if (metal === 'gold' || metal === 'silver') {
                const form = getFormForMetal(metal);
                form.post(route('admin.rates.metal.store', { metal }), {
                    preserveScroll: true,
                });
            } else {
                // For dynamic metals, use dynamicMetalFormData to create form data
                const metalData = dynamicMetalFormData[metal] || { currency: defaultCurrency, rates: [] };
                // Use router.post directly with the form data
                router.post(
                    route('admin.rates.metal.store', { metal }),
                    {
                        currency: metalData.currency,
                        rates: metalData.rates,
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            setFormUpdateKey(prev => prev + 1);
                        },
                    }
                );
            }
        },
        [defaultCurrency, dynamicMetalFormData, getFormForMetal],
    );

    const syncMetal = useCallback(
        (metal: string) => {
            setSyncingMetal(metal);
            router.post(
                route('admin.rates.sync', { metal }),
                {},
                {
                    preserveScroll: true,
                    onFinish: () => setSyncingMetal(null),
                },
            );
        },
        [],
    );

    const renderMetalCard = useCallback(
        (metal: string) => {
            const summary = metalSummaries[metal];
            if (!summary) {
                return null;
            }
            
            const form = getFormForMetal(metal);
            const isProcessing = form.processing;
            const latest = summary.latest;
            
            // For dynamic metals (not gold/silver), use dynamicMetalFormData instead of shared dynamicForm
            // This ensures each metal has its own data when viewing "All Metals"
            let ratesArray: EditableRate[] = [];
            let currency = defaultCurrency;
            
            if (metal === 'gold' || metal === 'silver') {
                // Gold and silver use their dedicated forms
                ratesArray = form.data.rates || [];
                currency = form.data.currency || defaultCurrency;
            } else {
                // Dynamic metals use their own data from dynamicMetalFormData
                const metalData = dynamicMetalFormData[metal];
                if (metalData) {
                    ratesArray = metalData.rates || [];
                    currency = metalData.currency || defaultCurrency;
                } else {
                    // If no data exists, initialize with available purities
                    const availablePurities = metalPurities[metal] ?? [];
                    if (availablePurities.length > 0) {
                        ratesArray = mapRatesToForm([], metal, availablePurities);
                    }
                }
            }
            
            const errors = form.errors as Record<string, string | string[]>;

            return (
                <section className="space-y-5 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <header className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">{summary.label} reference rates</h2>
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                                    Live reference & manual control
                                </p>
                            </div>
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => syncMetal(metal)}
                                disabled={syncingMetal === metal}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M3.172 7a4 4 0 015.656-5.656l1.172 1.172a.75.75 0 101.06-1.06L9.89.516a5.5 5.5 0 00-7.778 7.778l.354.353a.75.75 0 001.06-1.06L3.172 7zm13.657 6a4 4 0 01-5.657 5.657l-1.172-1.172a.75.75 0 10-1.06 1.06l1.17 1.172a5.5 5.5 0 007.778-7.778l-.353-.354a.75.75 0 10-1.06 1.06l.354.355z"
                                        clipRule="evenodd"
                                    />
                                    <path d="M6.75 6.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5zM9.25 12a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" />
                                </svg>
                                {syncingMetal === metal ? 'Syncing…' : `Sync ${summary.label}`}
                            </button>
                        </div>
                        {latest ? (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <p className="text-sm font-medium text-slate-600">Latest live feed</p>
                                <p className="mt-2 text-2xl font-semibold text-slate-900">
                                    {formatCurrency(latest.price_per_gram, latest.currency)}{' '}
                                    <span className="text-base font-normal text-slate-500">/ gram · {latest.purity ?? '—'}</span>
                                </p>
                                {latest.source && (
                                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                                        {formatSourceLabel(latest.source)}
                                    </p>
                                )}
                                {latest.effective_at && (
                                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                                        Updated {new Date(latest.effective_at).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                                No live feed synced yet. Use the sync button to fetch reference rates.
                            </div>
                        )}
                    </header>

                    <div className="space-y-4">
                        {ratesArray.map((rate, index) => {
                            const purityErrorRaw = errors[`rates.${index}.purity`];
                            const purityError = Array.isArray(purityErrorRaw) ? purityErrorRaw[0] : purityErrorRaw;
                            const priceErrorRaw = errors[`rates.${index}.price_per_gram`];
                            const priceError = Array.isArray(priceErrorRaw) ? priceErrorRaw[0] : priceErrorRaw;
                            
                            // Get available purities for this metal (only from metal_purities table)
                            const availablePurities = metalPurities[metal] ?? [];

                            return (
                                <div key={`${rate.purity}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                                        <div className="flex flex-col gap-3">
                                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                                Purity
                                                <input
                                                    type="text"
                                                    value={rate.purity}
                                                    readOnly
                                                    className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 cursor-not-allowed"
                                                />
                                            </label>
                                            {purityError && <span className="text-xs text-rose-500">{purityError}</span>}
                                            {availablePurities.length === 0 && (
                                                <span className="text-xs text-amber-600">
                                                    No purities available for this metal. Please add purities in Metal Purities section.
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                                Rate / gram
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={rate.price_per_gram}
                                                    onChange={(event) => setRateField(metal, index, 'price_per_gram', event.target.value)}
                                                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    placeholder="0.00"
                                                />
                                            </label>
                                            {priceError && <span className="text-xs text-rose-500">{priceError}</span>}
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-between text-xs text-slate-500">
                                        <span>{currency?.toUpperCase() || defaultCurrency}</span>
                                        {(() => {
                                            const purities = metalPurities[metal] ?? [];
                                            if (purities.length === 0) {
                                                // No purities defined, allow removing
                                                return (
                                                    <button
                                                        type="button"
                                                        className="text-rose-500 transition hover:text-rose-600"
                                                        onClick={() => removeRateRow(metal, index)}
                                                    >
                                                        Remove
                                                    </button>
                                                );
                                            }
                                            
                                            // Check if all purities are currently shown
                                            const usedPurities = new Set(ratesArray.map(r => r.purity).filter(Boolean));
                                            const allPuritiesShown = purities.every(p => usedPurities.has(p.name));
                                            
                                            // Only show remove if not all purities are shown (i.e., there are extra/duplicate rows)
                                            if (!allPuritiesShown || ratesArray.length > purities.length) {
                                                return (
                                                    <button
                                                        type="button"
                                                        className="text-rose-500 transition hover:text-rose-600"
                                                        onClick={() => removeRateRow(metal, index)}
                                                    >
                                                        Remove
                                                    </button>
                                                );
                                            }
                                            // All purities are shown and fixed - don't show remove button
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            );
                        })}
                        {(() => {
                            const purities = metalPurities[metal] ?? [];
                            const usedPurities = new Set(ratesArray.map(r => r.purity).filter(Boolean));
                            const unusedPurities = purities.filter(p => !usedPurities.has(p.name));
                            
                            // Only show "Add purity" button if there are unused purities
                            // This allows adding back removed purities
                            if (unusedPurities.length > 0) {
                                return (
                                    <button
                                        type="button"
                                        onClick={() => addRateRow(metal)}
                                        className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-400 hover:text-slate-700"
                                    >
                                        <span className="text-lg leading-none">+</span> Add purity ({unusedPurities.length} available)
                                    </button>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Currency
                            <input
                                type="text"
                                value={currency}
                                onChange={(event) => {
                                    const newCurrency = event.target.value.toUpperCase();
                                    if (metal === 'gold' || metal === 'silver') {
                                        form.setData('currency', newCurrency);
                                    } else {
                                        // Update dynamic metal form data
                                        setDynamicMetalFormData(prev => ({
                                            ...prev,
                                            [metal]: {
                                                ...prev[metal],
                                                currency: newCurrency,
                                                rates: prev[metal]?.rates || ratesArray,
                                            },
                                        }));
                                        setFormUpdateKey(prev => prev + 1);
                                    }
                                }}
                                className="w-28 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium uppercase text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                maxLength={10}
                            />
                        </label>

                        <button
                            type="button"
                            onClick={() => saveMetalRates(metal)}
                            disabled={isProcessing}
                            className="ml-auto inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/30 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isProcessing ? 'Saving…' : 'Save rates'}
                        </button>
                    </div>
                </section>
            );
        },
        [
            addRateRow,
            defaultCurrency,
            dynamicMetalFormData, // Include to trigger re-renders when dynamic metal data changes
            formatCurrency,
            formatSourceLabel,
            formUpdateKey, // Include form update key to trigger re-renders
            getFormForMetal,
            mapRatesToForm,
            metalPurities,
            metalSummaries,
            removeRateRow,
            saveMetalRates,
            setRateField,
            syncMetal,
            syncingMetal,
        ],
    );

    return (
        <AdminLayout>
            <Head title="Live Rates" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Reference rates</h1>
                            <p className="text-sm text-slate-500">
                                Sync live values for metals and lock in your internal calculation rates.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => syncMetal('gold')}
                                disabled={syncingMetal === 'gold'}
                                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {syncingMetal === 'gold' ? 'Syncing…' : 'Sync gold rate'}
                            </button>
                            <button
                                type="button"
                                onClick={() => syncMetal('silver')}
                                disabled={syncingMetal === 'silver'}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {syncingMetal === 'silver' ? 'Syncing…' : 'Sync silver rate'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="mb-6">
                        <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                            <span>Select Metal</span>
                            <select
                                value={selectedMetal}
                                onChange={(e) => setSelectedMetal(e.target.value)}
                                className="w-full max-w-xs rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                                <option value="all">All Metals</option>
                                {availableMetals.map((metal) => (
                                    <option key={metal.id} value={metal.value}>
                                        {metal.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {selectedMetal === 'all' ? (
                        <div className="grid gap-6 xl:grid-cols-2">
                            {Object.keys(metalSummaries).map((metalKey) => {
                                const card = renderMetalCard(metalKey);
                                return card ? <div key={metalKey}>{card}</div> : null;
                            })}
                        </div>
                    ) : (
                        <div>
                            {renderMetalCard(selectedMetal)}
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-5 py-3 text-left">Metal</th>
                                <th className="px-5 py-3 text-left">Purity</th>
                                <th className="px-5 py-3 text-right">Price / g</th>
                                <th className="px-5 py-3 text-left">Source</th>
                                <th className="px-5 py-3 text-left">Effective at</th>
                                <th className="px-5 py-3 text-left">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {rates.data.map((rate) => (
                                <tr key={rate.id} className="hover:bg-slate-50">
                                    <td className="px-5 py-3 font-semibold text-slate-900">{rate.metal}</td>
                                    <td className="px-5 py-3 text-slate-500">{rate.purity ?? '—'}</td>
                                    <td className="px-5 py-3 text-right text-slate-900">
                                        {rate.price_per_gram.toLocaleString('en-IN')} {rate.currency}
                                    </td>
                                    <td className="px-5 py-3 text-slate-600">{rate.source}</td>
                                    <td className="px-5 py-3 text-slate-500">
                                        {rate.effective_at ? new Date(rate.effective_at).toLocaleString('en-IN') : '—'}
                                    </td>
                                    <td className="px-5 py-3 text-slate-500">
                                        {typeof rate.metadata?.notes === 'string' && rate.metadata.notes.trim().length
                                            ? rate.metadata.notes
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                            {rates.data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-slate-500">
                                        No rate records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}

