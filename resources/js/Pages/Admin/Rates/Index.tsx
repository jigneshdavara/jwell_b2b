import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

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

type AdminRatesPageProps = AppPageProps<{
    rates: Pagination<RateRow>;
    defaultCurrency: string;
    metalSummaries: {
        gold: MetalSummary;
        silver: MetalSummary;
    };
}>;

type EditableRate = {
    purity: string;
    price_per_gram: string;
};

export default function AdminRatesIndex() {
    const { rates, defaultCurrency, metalSummaries } = usePage<AdminRatesPageProps>().props;
    const [syncingMetal, setSyncingMetal] = useState<string | null>(null);

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

    const mapRatesToForm = useCallback((rates: MetalRate[]): EditableRate[] => {
        if (! rates.length) {
            return [{ purity: '', price_per_gram: '' }];
        }

        return rates.map((rate) => ({
            purity: rate.purity ?? '',
            price_per_gram:
                typeof rate.price_per_gram === 'number' && ! Number.isNaN(rate.price_per_gram)
                    ? String(rate.price_per_gram)
                    : '',
        }));
    }, []);

    const goldForm = useForm<{ currency: string; rates: EditableRate[] }>({
        currency: metalSummaries.gold.latest?.currency ?? defaultCurrency,
        rates: mapRatesToForm(metalSummaries.gold.rates),
    });

    const silverForm = useForm<{ currency: string; rates: EditableRate[] }>({
        currency: metalSummaries.silver.latest?.currency ?? defaultCurrency,
        rates: mapRatesToForm(metalSummaries.silver.rates),
    });

    useEffect(() => {
        goldForm.setData('currency', metalSummaries.gold.latest?.currency ?? defaultCurrency);
        goldForm.setData('rates', mapRatesToForm(metalSummaries.gold.rates));
    }, [defaultCurrency, goldForm, mapRatesToForm, metalSummaries.gold]);

    useEffect(() => {
        silverForm.setData('currency', metalSummaries.silver.latest?.currency ?? defaultCurrency);
        silverForm.setData('rates', mapRatesToForm(metalSummaries.silver.rates));
    }, [defaultCurrency, mapRatesToForm, metalSummaries.silver, silverForm]);

    const setRateField = useCallback(
        (metal: 'gold' | 'silver', index: number, field: keyof EditableRate, value: string) => {
            const form = metal === 'gold' ? goldForm : silverForm;
            form.setData('rates', form.data.rates.map((rate, rateIndex) => (rateIndex === index ? { ...rate, [field]: value } : rate)));
        },
        [goldForm, silverForm],
    );

    const addRateRow = useCallback(
        (metal: 'gold' | 'silver') => {
            const form = metal === 'gold' ? goldForm : silverForm;
            form.setData('rates', [...form.data.rates, { purity: '', price_per_gram: '' }]);
        },
        [goldForm, silverForm],
    );

    const removeRateRow = useCallback(
        (metal: 'gold' | 'silver', index: number) => {
            const form = metal === 'gold' ? goldForm : silverForm;
            if (form.data.rates.length === 1) {
                form.setData('rates', [{ purity: '', price_per_gram: '' }]);
                return;
            }

            form.setData(
                'rates',
                form.data.rates.filter((_, rateIndex) => rateIndex !== index),
            );
        },
        [goldForm, silverForm],
    );

    const saveMetalRates = useCallback(
        (metal: 'gold' | 'silver') => {
            const form = metal === 'gold' ? goldForm : silverForm;
            form.post(route('admin.rates.metal.store', { metal }), {
                preserveScroll: true,
            });
        },
        [goldForm, silverForm],
    );

    const syncMetal = useCallback(
        (metal: 'gold' | 'silver') => {
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
        (metal: 'gold' | 'silver') => {
            const summary = metalSummaries[metal];
            const form = metal === 'gold' ? goldForm : silverForm;
            const isProcessing = form.processing;
            const latest = summary.latest;
            const ratesArray = form.data.rates;
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

                            return (
                                <div key={`${rate.purity}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                                        <div className="flex flex-col gap-3">
                                            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                                                Purity
                                                <input
                                                    type="text"
                                                    value={rate.purity}
                                                    onChange={(event) => setRateField(metal, index, 'purity', event.target.value)}
                                                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                    placeholder="e.g. 24K"
                                                />
                                            </label>
                                            {purityError && <span className="text-xs text-rose-500">{purityError}</span>}
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
                                        <span>{form.data.currency?.toUpperCase() || defaultCurrency}</span>
                                        <button
                                            type="button"
                                            className="text-rose-500 transition hover:text-rose-600"
                                            onClick={() => removeRateRow(metal, index)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => addRateRow(metal)}
                            className="inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-400 hover:text-slate-700"
                        >
                            <span className="text-lg leading-none">+</span> Add purity
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Currency
                            <input
                                type="text"
                                value={form.data.currency}
                                onChange={(event) => form.setData('currency', event.target.value.toUpperCase())}
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
            formatCurrency,
            formatSourceLabel,
            goldForm,
            metalSummaries,
            removeRateRow,
            saveMetalRates,
            setRateField,
            silverForm,
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

                <div className="grid gap-6 xl:grid-cols-2">
                    {renderMetalCard('gold')}
                    {renderMetalCard('silver')}
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

