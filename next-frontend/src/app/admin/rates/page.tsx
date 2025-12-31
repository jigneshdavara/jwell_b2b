'use client';

import { Head } from '@/components/Head';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminService } from '@/services/adminService';
import { toastSuccess, toastError } from '@/utils/toast';

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

type EditableRate = {
    purity: string;
    price_per_gram: string;
};

export default function AdminRatesIndex() {
    const [loading, setLoading] = useState(true);
    const [rates, setRates] = useState<RateRow[]>([]);
    const [defaultCurrency, setDefaultCurrency] = useState('INR');
    const [availableMetals, setAvailableMetals] = useState<MetalOption[]>([]);
    const [metalSummaries, setMetalSummaries] = useState<Record<string, MetalSummary>>({});
    const [metalPurities, setMetalPurities] = useState<Record<string, PurityOption[]>>({});
    const [selectedMetal, setSelectedMetal] = useState<string>('all');
    const [syncingMetal, setSyncingMetal] = useState<string | null>(null);
    const [formUpdateKey, setFormUpdateKey] = useState<number>(0);

    // Forms for gold and silver
    const [goldFormData, setGoldFormData] = useState<{ currency: string; rates: EditableRate[] }>({
        currency: 'INR',
        rates: [],
    });
    const [silverFormData, setSilverFormData] = useState<{ currency: string; rates: EditableRate[] }>({
        currency: 'INR',
        rates: [],
    });

    // Dynamic metal form data
    const [dynamicMetalFormData, setDynamicMetalFormData] = useState<Record<string, { currency: string; rates: EditableRate[] }>>({});

    // Track initialization
    const goldFormInitializedRef = useRef<boolean>(false);
    const silverFormInitializedRef = useRef<boolean>(false);
    const lastSelectedMetalRef = useRef<string>('');

    useEffect(() => {
        loadRates();
    }, []);

    const loadRates = async () => {
        setLoading(true);
        try {
            const response = await adminService.getRates(1, 1000);
            const data = response.data;

            setRates((data.items || []).map((item: any) => ({
                id: Number(item.id),
                metal: item.metal,
                purity: item.purity || null,
                price_per_gram: Number(item.price_per_gram),
                currency: item.currency || 'INR',
                source: item.source || 'manual',
                effective_at: item.effective_at,
                metadata: item.metadata || null,
            })));

            setDefaultCurrency(data.defaultCurrency || 'INR');
            setAvailableMetals(data.availableMetals || []);
            setMetalPurities(data.metalPurities || {});
            setMetalSummaries(data.metalSummaries || {});

            // Initialize gold form
            if (!goldFormInitializedRef.current && (data.metalSummaries?.gold || (data.metalPurities?.gold && data.metalPurities.gold.length > 0))) {
                const availablePurities = data.metalPurities?.gold ?? [];
                if (data.metalSummaries?.gold) {
                    setGoldFormData({
                        currency: data.metalSummaries.gold.latest?.currency || data.defaultCurrency || 'INR',
                        rates: mapRatesToForm(data.metalSummaries.gold.rates, 'gold', availablePurities),
                    });
                } else if (availablePurities.length > 0) {
                    setGoldFormData({
                        currency: data.defaultCurrency || 'INR',
                        rates: mapRatesToForm([], 'gold', availablePurities),
                    });
                }
                goldFormInitializedRef.current = true;
            }

            // Initialize silver form
            if (!silverFormInitializedRef.current && (data.metalSummaries?.silver || (data.metalPurities?.silver && data.metalPurities.silver.length > 0))) {
                const availablePurities = data.metalPurities?.silver ?? [];
                if (data.metalSummaries?.silver) {
                    setSilverFormData({
                        currency: data.metalSummaries.silver.latest?.currency || data.defaultCurrency || 'INR',
                        rates: mapRatesToForm(data.metalSummaries.silver.rates, 'silver', availablePurities),
                    });
                } else if (availablePurities.length > 0) {
                    setSilverFormData({
                        currency: data.defaultCurrency || 'INR',
                        rates: mapRatesToForm([], 'silver', availablePurities),
                    });
                }
                silverFormInitializedRef.current = true;
            }

            // Initialize dynamic metal forms
            const newData: Record<string, { currency: string; rates: EditableRate[] }> = {};
            Object.keys(data.metalSummaries || {}).forEach((metalKey) => {
                if (metalKey !== 'gold' && metalKey !== 'silver') {
                    const summary = data.metalSummaries[metalKey];
                    const availablePurities = data.metalPurities[metalKey] ?? [];
                    if (summary) {
                        newData[metalKey] = {
                            currency: summary.latest?.currency || data.defaultCurrency || 'INR',
                            rates: mapRatesToForm(summary.rates, metalKey, availablePurities),
                        };
                    } else if (availablePurities.length > 0) {
                        newData[metalKey] = {
                            currency: data.defaultCurrency || 'INR',
                            rates: mapRatesToForm([], metalKey, availablePurities),
                        };
                    }
                }
            });
            setDynamicMetalFormData((prev) => ({ ...prev, ...newData }));
        } catch (error: any) {
            console.error('Failed to load rates:', error);
        } finally {
            setLoading(false);
        }
    };

    const mapRatesToForm = useCallback((rates: MetalRate[], metal: string, availablePurities: PurityOption[]): EditableRate[] => {
        if (availablePurities.length === 0) {
            if (rates.length > 0) {
                return rates.map((rate) => ({
                    purity: rate.purity ?? '',
                    price_per_gram: typeof rate.price_per_gram === 'number' && !Number.isNaN(rate.price_per_gram) ? String(rate.price_per_gram) : '',
                }));
            }
            return [{ purity: '', price_per_gram: '' }];
        }

        return availablePurities.map((purity) => {
            const existingRate = rates.find((r) => r.purity === purity.name);
            return {
                purity: purity.name,
                price_per_gram:
                    existingRate && typeof existingRate.price_per_gram === 'number' && !Number.isNaN(existingRate.price_per_gram)
                        ? String(existingRate.price_per_gram)
                        : '',
            };
        });
    }, []);

    // Update dynamic form when selected metal changes
    useEffect(() => {
        if (selectedMetal !== 'all' && selectedMetal !== 'gold' && selectedMetal !== 'silver') {
            const metalChanged = lastSelectedMetalRef.current !== selectedMetal;

            if (metalChanged) {
                const availablePurities = metalPurities[selectedMetal] ?? [];
                const formData = dynamicMetalFormData[selectedMetal];

                if (formData && formData.rates.length > 0) {
                    const ratesForAllPurities = mapRatesToForm(
                        formData.rates.map((r) => ({
                            purity: r.purity,
                            price_per_gram: parseFloat(r.price_per_gram) || 0,
                            currency: formData.currency,
                        })),
                        selectedMetal,
                        availablePurities,
                    );
                    setDynamicMetalFormData((prev) => ({
                        ...prev,
                        [selectedMetal]: {
                            currency: formData.currency,
                            rates: ratesForAllPurities,
                        },
                    }));
                } else if (availablePurities.length > 0) {
                    setDynamicMetalFormData((prev) => ({
                        ...prev,
                        [selectedMetal]: {
                            currency: defaultCurrency,
                            rates: mapRatesToForm([], selectedMetal, availablePurities),
                        },
                    }));
                }
                lastSelectedMetalRef.current = selectedMetal;
            }
        } else {
            lastSelectedMetalRef.current = '';
        }
    }, [selectedMetal, metalPurities, dynamicMetalFormData, defaultCurrency, mapRatesToForm]);

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
        if (!source) {
            return null;
        }
        return source
            .split(/[-_]/)
            .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
            .join(' ');
    }, []);

    const getFormForMetal = useCallback(
        (metal: string): { currency: string; rates: EditableRate[] } => {
            if (metal === 'gold') return goldFormData;
            if (metal === 'silver') return silverFormData;
            return dynamicMetalFormData[metal] || { currency: defaultCurrency, rates: [] };
        },
        [goldFormData, silverFormData, dynamicMetalFormData, defaultCurrency],
    );

    const setRateField = useCallback(
        (metal: string, index: number, field: keyof EditableRate, value: string) => {
            if (metal === 'gold') {
                const updatedRates = [...goldFormData.rates];
                updatedRates[index] = { ...updatedRates[index], [field]: value };
                setGoldFormData({ ...goldFormData, rates: updatedRates });
            } else if (metal === 'silver') {
                const updatedRates = [...silverFormData.rates];
                updatedRates[index] = { ...silverFormData.rates[index], [field]: value };
                setSilverFormData({ ...silverFormData, rates: updatedRates });
            } else {
                setDynamicMetalFormData((prev) => {
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
            setFormUpdateKey((prev) => prev + 1);
        },
        [goldFormData, silverFormData, defaultCurrency],
    );

    const addRateRow = useCallback(
        (metal: string) => {
            const purities = metalPurities[metal] ?? [];

            if (metal === 'gold') {
                const usedPurities = new Set(goldFormData.rates.map((r) => r.purity).filter(Boolean));
                const unusedPurity = purities.find((p) => !usedPurities.has(p.name));
                setGoldFormData({
                    ...goldFormData,
                    rates: [...goldFormData.rates, { purity: unusedPurity?.name || '', price_per_gram: '' }],
                });
            } else if (metal === 'silver') {
                const usedPurities = new Set(silverFormData.rates.map((r) => r.purity).filter(Boolean));
                const unusedPurity = purities.find((p) => !usedPurities.has(p.name));
                setSilverFormData({
                    ...silverFormData,
                    rates: [...silverFormData.rates, { purity: unusedPurity?.name || '', price_per_gram: '' }],
                });
            } else {
                setDynamicMetalFormData((prev) => {
                    const metalData = prev[metal] || { currency: defaultCurrency, rates: [] };
                    const usedPurities = new Set(metalData.rates.map((r) => r.purity).filter(Boolean));
                    const unusedPurity = purities.find((p) => !usedPurities.has(p.name));
                    const newRate = unusedPurity ? { purity: unusedPurity.name, price_per_gram: '' } : { purity: '', price_per_gram: '' };
                    return {
                        ...prev,
                        [metal]: {
                            ...metalData,
                            rates: [...metalData.rates, newRate],
                        },
                    };
                });
            }
            setFormUpdateKey((prev) => prev + 1);
        },
        [goldFormData, silverFormData, metalPurities, defaultCurrency],
    );

    const removeRateRow = useCallback(
        (metal: string, index: number) => {
            const purities = metalPurities[metal] ?? [];

            if (metal === 'gold') {
                if (purities.length > 0 && goldFormData.rates.length <= purities.length) {
                    const usedPurities = new Set(goldFormData.rates.map((r) => r.purity).filter(Boolean));
                    if (usedPurities.size === purities.length && goldFormData.rates.length === purities.length) {
                        return;
                    }
                }
                if (goldFormData.rates.length === 1) {
                    setGoldFormData({ ...goldFormData, rates: [{ purity: '', price_per_gram: '' }] });
                    return;
                }
                setGoldFormData({ ...goldFormData, rates: goldFormData.rates.filter((_, rateIndex) => rateIndex !== index) });
            } else if (metal === 'silver') {
                if (purities.length > 0 && silverFormData.rates.length <= purities.length) {
                    const usedPurities = new Set(silverFormData.rates.map((r) => r.purity).filter(Boolean));
                    if (usedPurities.size === purities.length && silverFormData.rates.length === purities.length) {
                        return;
                    }
                }
                if (silverFormData.rates.length === 1) {
                    setSilverFormData({ ...silverFormData, rates: [{ purity: '', price_per_gram: '' }] });
                    return;
                }
                setSilverFormData({ ...silverFormData, rates: silverFormData.rates.filter((_, rateIndex) => rateIndex !== index) });
            } else {
                setDynamicMetalFormData((prev) => {
                    const metalData = prev[metal] || { currency: defaultCurrency, rates: [] };
                    if (purities.length > 0 && metalData.rates.length <= purities.length) {
                        const usedPurities = new Set(metalData.rates.map((r) => r.purity).filter(Boolean));
                        if (usedPurities.size === purities.length && metalData.rates.length === purities.length) {
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
            }
            setFormUpdateKey((prev) => prev + 1);
        },
        [goldFormData, silverFormData, metalPurities, defaultCurrency],
    );

    const saveMetalRates = useCallback(
        async (metal: string) => {
            try {
                const formData = getFormForMetal(metal);
                const ratesPayload = formData.rates
                    .filter((r) => r.purity && r.price_per_gram && parseFloat(r.price_per_gram) > 0)
                    .map((r) => ({
                        purity: r.purity,
                        price_per_gram: parseFloat(r.price_per_gram),
                        currency: formData.currency,
                    }));

                await adminService.storeMetalRate(metal, {
                    currency: formData.currency,
                    rates: ratesPayload,
                });

                await loadRates();
                toastSuccess('Rates saved successfully');
            } catch (error: any) {
                console.error('Failed to save rates:', error);
                toastError(error.response?.data?.message || 'Failed to save rates. Please try again.');
            }
        },
        [getFormForMetal],
    );

    const syncMetal = useCallback(
        async (metal: string) => {
            setSyncingMetal(metal);
            try {
                await adminService.syncRates(metal);
                await loadRates();
            } catch (error: any) {
                console.error('Failed to sync rates:', error);
                toastError(error.response?.data?.message || 'Failed to sync rates. Please try again.');
            } finally {
                setSyncingMetal(null);
            }
        },
        [],
    );

    const renderMetalCard = useCallback(
        (metal: string) => {
            const summary = metalSummaries[metal];
            if (!summary) {
                return null;
            }

            const formData = getFormForMetal(metal);
            const latest = summary.latest;
            const ratesArray = formData.rates || [];
            const currency = formData.currency || defaultCurrency;

            return (
                <section key={metal} className="space-y-4 sm:space-y-5 rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <header className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base sm:text-xl font-semibold text-slate-900">{summary.label} reference rates</h2>
                                <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-slate-500">Live reference & manual control</p>
                            </div>
                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-xs"
                                onClick={() => syncMetal(metal)}
                                disabled={syncingMetal === metal}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor">
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
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
                                <p className="text-xs sm:text-sm font-medium text-slate-600">Latest live feed</p>
                                <p className="mt-1.5 sm:mt-2 text-lg sm:text-2xl font-semibold text-slate-900">
                                    {formatCurrency(latest.price_per_gram, latest.currency)}{' '}
                                    <span className="text-sm sm:text-base font-normal text-slate-500">/ gram · {latest.purity ?? '—'}</span>
                                </p>
                                {latest.source && (
                                    <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-400">{formatSourceLabel(latest.source)}</p>
                                )}
                                {latest.effective_at && (
                                    <p className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-slate-400">
                                        Updated {new Date(latest.effective_at).toLocaleString('en-IN')}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-3 sm:p-4 text-xs sm:text-sm text-slate-500">
                                No live feed synced yet. Use the sync button to fetch reference rates.
                            </div>
                        )}
                    </header>

                    <div className="space-y-3 sm:space-y-4">
                        {ratesArray.map((rate, index) => {
                            const availablePurities = metalPurities[metal] ?? [];

                            return (
                                <div key={`${metal}-${rate.purity}-${index}`} className="rounded-2xl border border-slate-200 p-3 sm:p-4">
                                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-[1fr_auto]">
                                        <div className="flex flex-col gap-2 sm:gap-3">
                                            <label className="flex flex-col gap-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                                Purity
                                                <input
                                                    type="text"
                                                    value={rate.purity}
                                                    readOnly
                                                    className="rounded-2xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium text-slate-600 cursor-not-allowed"
                                                />
                                            </label>
                                            {availablePurities.length === 0 && (
                                                <span className="text-[10px] sm:text-xs text-amber-600">
                                                    No purities available for this metal. Please add purities in Metal Purities section.
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2 sm:gap-3">
                                            <label className="flex flex-col gap-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                                Rate / gram
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={rate.price_per_gram}
                                                    onChange={(event) => setRateField(metal, index, 'price_per_gram', event.target.value)}
                                                    className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium"
                                                    placeholder="0.00"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:mt-3 flex justify-between text-[10px] sm:text-xs text-slate-500">
                                        <span>{currency?.toUpperCase() || defaultCurrency}</span>
                                        {(() => {
                                            const purities = metalPurities[metal] ?? [];
                                            if (purities.length === 0) {
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
                                            const usedPurities = new Set(ratesArray.map((r) => r.purity).filter(Boolean));
                                            const allPuritiesShown = purities.every((p) => usedPurities.has(p.name));
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
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            );
                        })}
                        {(() => {
                            const purities = metalPurities[metal] ?? [];
                            const usedPurities = new Set(ratesArray.map((r) => r.purity).filter(Boolean));
                            const unusedPurities = purities.filter((p) => !usedPurities.has(p.name));
                            if (unusedPurities.length > 0) {
                                return (
                                    <button
                                        type="button"
                                        onClick={() => addRateRow(metal)}
                                        className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-400 hover:text-slate-700 sm:px-4 sm:py-2 sm:text-xs"
                                    >
                                        <span className="text-base sm:text-lg leading-none">+</span> Add purity ({unusedPurities.length} available)
                                    </button>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <label className="flex flex-col gap-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Currency
                            <input
                                type="text"
                                value={currency}
                                onChange={(event) => {
                                    const newCurrency = event.target.value.toUpperCase();
                                    if (metal === 'gold') {
                                        setGoldFormData({ ...goldFormData, currency: newCurrency });
                                    } else if (metal === 'silver') {
                                        setSilverFormData({ ...silverFormData, currency: newCurrency });
                                    } else {
                                        setDynamicMetalFormData((prev) => ({
                                            ...prev,
                                            [metal]: {
                                                ...prev[metal],
                                                currency: newCurrency,
                                                rates: prev[metal]?.rates || ratesArray,
                                            },
                                        }));
                                    }
                                    setFormUpdateKey((prev) => prev + 1);
                                }}
                                className="w-24 sm:w-28 rounded-2xl border border-slate-200 px-3 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm font-medium uppercase text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                maxLength={10}
                            />
                        </label>

                        <button
                            type="button"
                            onClick={() => saveMetalRates(metal)}
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow shadow-slate-900/30 transition hover:bg-slate-700 sm:ml-auto sm:px-5 sm:py-2 sm:text-sm"
                        >
                            Save rates
                        </button>
                    </div>
                </section>
            );
        },
        [
            metalSummaries,
            getFormForMetal,
            defaultCurrency,
            formatCurrency,
            formatSourceLabel,
            metalPurities,
            setRateField,
            removeRateRow,
            addRateRow,
            saveMetalRates,
            syncMetal,
            syncingMetal,
            goldFormData,
            silverFormData,
        ],
    );

    if (loading) {
        return (
            <>
                <Head title="Live Rates" />
                <div className="flex h-screen items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Live Rates" />

            <div className="space-y-6 px-1 py-4 sm:space-y-8 sm:px-6 sm:py-6 lg:px-8">
                <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Reference rates</h1>
                            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">Sync live values for metals and lock in your internal calculation rates.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => syncMetal('gold')}
                                disabled={syncingMetal === 'gold'}
                                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-2 sm:text-sm"
                            >
                                {syncingMetal === 'gold' ? 'Syncing…' : 'Sync gold rate'}
                            </button>
                            <button
                                type="button"
                                onClick={() => syncMetal('silver')}
                                disabled={syncingMetal === 'silver'}
                                className="inline-flex items-center gap-2 rounded-full bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-slate-500 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-2 sm:text-sm"
                            >
                                {syncingMetal === 'silver' ? 'Syncing…' : 'Sync silver rate'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="mb-4 sm:mb-6">
                        <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                            <span>Select Metal</span>
                            <select
                                value={selectedMetal}
                                onChange={(e) => setSelectedMetal(e.target.value)}
                                className="w-full max-w-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-1.5 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
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
                        <div>{renderMetalCard(selectedMetal)}</div>
                    )}
                </div>

                <div className="overflow-x-auto rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
                        <thead className="bg-slate-50 text-[10px] sm:text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Metal</th>
                                <th className="px-3 py-2 text-left sm:px-5 sm:py-3">Purity</th>
                                <th className="px-3 py-2 text-right sm:px-5 sm:py-3">Price / g</th>
                                <th className="hidden px-3 py-2 text-left sm:table-cell sm:px-5 sm:py-3">Source</th>
                                <th className="hidden px-3 py-2 text-left md:table-cell sm:px-5 sm:py-3">Effective at</th>
                                <th className="hidden px-3 py-2 text-left lg:table-cell sm:px-5 sm:py-3">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {rates.map((rate) => (
                                <tr key={rate.id} className="hover:bg-slate-50">
                                    <td className="px-3 py-2 font-semibold text-slate-900 text-xs sm:px-5 sm:py-3 sm:text-sm">
                                        {rate.metal}
                                        {/* Mobile-only display for hidden columns */}
                                        <div className="mt-0.5 block sm:hidden text-[9px] text-slate-500">
                                            {rate.source && (
                                                <div>
                                                    <span className="font-medium">Source:</span> {rate.source}
                                                </div>
                                            )}
                                            {rate.effective_at && (
                                                <div className="mt-0.5">
                                                    <span className="font-medium">Effective:</span> {new Date(rate.effective_at).toLocaleDateString('en-IN')}
                                                </div>
                                            )}
                                            {typeof rate.metadata?.notes === 'string' && rate.metadata.notes.trim().length && (
                                                <div className="mt-0.5">
                                                    <span className="font-medium">Notes:</span> {rate.metadata.notes}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-slate-500 text-xs sm:px-5 sm:py-3 sm:text-sm">{rate.purity ?? '—'}</td>
                                    <td className="px-3 py-2 text-right text-slate-900 text-xs sm:px-5 sm:py-3 sm:text-sm">
                                        {rate.price_per_gram.toLocaleString('en-IN')} {rate.currency}
                                    </td>
                                    <td className="hidden px-3 py-2 text-slate-600 sm:table-cell sm:px-5 sm:py-3 text-xs sm:text-sm">{rate.source}</td>
                                    <td className="hidden px-3 py-2 text-slate-500 md:table-cell sm:px-5 sm:py-3 text-xs sm:text-sm">
                                        {rate.effective_at ? new Date(rate.effective_at).toLocaleString('en-IN') : '—'}
                                    </td>
                                    <td className="hidden px-3 py-2 text-slate-500 lg:table-cell sm:px-5 sm:py-3 text-xs sm:text-sm">
                                        {typeof rate.metadata?.notes === 'string' && rate.metadata.notes.trim().length ? rate.metadata.notes : '—'}
                                    </td>
                                </tr>
                            ))}
                            {rates.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-3 py-4 text-center text-xs text-slate-500 sm:px-5 sm:py-6 sm:text-sm">
                                        No rate records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
