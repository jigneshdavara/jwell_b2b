'use client';

import { Head } from '@/components/Head';
import { useMemo, useState } from 'react';

type MetalPurity = {
    id: number;
    metal_id: number;
    name: string;
    description: string | null;
    is_active: boolean;
};

type MetalSummary = {
    metal: string;
    latest_rate: number | null;
    effective_at: string | null;
    purities: Array<{
        name: string;
        latest_rate: number | null;
    }>;
};

type RateRow = {
    id: number;
    metal: string;
    purity: string;
    price_per_gram: number;
    effective_at: string;
    created_at: string;
};

// Mock data
const mockMetals = ['gold', 'silver', 'platinum'];
const mockMetalSummaries: MetalSummary[] = [
    {
        metal: 'gold',
        latest_rate: 6200,
        effective_at: '2023-12-15T10:00:00Z',
        purities: [
            { name: '22K', latest_rate: 6200 },
            { name: '18K', latest_rate: 5100 },
        ],
    },
];
const mockRates: RateRow[] = [
    { id: 1, metal: 'gold', purity: '22K', price_per_gram: 6200, effective_at: '2023-12-15T10:00:00Z', created_at: '2023-12-15T10:00:00Z' },
];
const mockPurities: MetalPurity[] = [
    { id: 1, metal_id: 1, name: '22K', description: null, is_active: true },
    { id: 2, metal_id: 1, name: '18K', description: null, is_active: true },
];

export default function AdminRatesIndex() {
    const metals = mockMetals;
    const initialSummaries = mockMetalSummaries;
    const initialRates = mockRates;
    const purities = mockPurities;

    const [ratesData, setRatesData] = useState<RateRow[]>(initialRates);
    const [summaries, setSummaries] = useState<MetalSummary[]>(initialSummaries);
    const [selectedMetal, setSelectedMetal] = useState(metals[0]);
    const [formData, setFormData] = useState({
        effective_at: new Date().toISOString().slice(0, 16),
        rates: purities.map(p => ({ purity_id: p.id, purity_name: p.name, price_per_gram: '' })),
    });
    const [processing, setProcessing] = useState(false);

    const metalPurities = useMemo(() => purities, [purities]);

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setProcessing(false);
            alert('Rates updated (mock)');
        }, 1000);
    };

    const syncRates = () => {
        setProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setProcessing(false);
            alert('Rates synced (mock)');
        }, 1000);
    };

    return (
        <>
            <Head title="Metal Rates" />

            <div className="space-y-8">
                <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Reference Rates</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage daily metal prices used for dynamic catalogue pricing.</p>
                    </div>
                    <button
                        type="button"
                        onClick={syncRates}
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Sync live feeds
                    </button>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900 mb-6">Latest Reference Rates</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {summaries.map((summary) => (
                                    <div key={summary.metal} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{summary.metal}</span>
                                            <span className="text-[10px] text-slate-400">
                                                {summary.effective_at ? new Date(summary.effective_at).toLocaleString() : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {summary.purities.map((p) => (
                                                <div key={p.name} className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-600">{p.name}</span>
                                                    <span className="font-semibold text-slate-900">₹ {p.latest_rate?.toLocaleString('en-IN') ?? '—'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                            <div className="px-5 py-4 border-b border-slate-200">
                                <h3 className="font-semibold text-slate-700">Rate History</h3>
                            </div>
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3 text-left">Metal</th>
                                        <th className="px-5 py-3 text-left">Purity</th>
                                        <th className="px-5 py-3 text-right">Price/g</th>
                                        <th className="px-5 py-3 text-right">Effective At</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {ratesData.map((rate) => (
                                        <tr key={rate.id} className="hover:bg-slate-50">
                                            <td className="px-5 py-3 text-slate-900 font-semibold uppercase tracking-wider">{rate.metal}</td>
                                            <td className="px-5 py-3 text-slate-600">{rate.purity}</td>
                                            <td className="px-5 py-3 text-right font-bold text-slate-900">₹ {rate.price_per_gram.toLocaleString('en-IN')}</td>
                                            <td className="px-5 py-3 text-right text-slate-500">{new Date(rate.effective_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80 sticky top-8">
                            <h2 className="text-lg font-semibold text-slate-900 mb-6">Manual Rate Input</h2>
                            
                            <div className="space-y-6">
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Effective from</span>
                                    <input
                                        type="datetime-local"
                                        value={formData.effective_at}
                                        onChange={(e) => setFormData({ ...formData, effective_at: e.target.value })}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        required
                                    />
                                </label>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        {metals.map((m) => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setSelectedMetal(m)}
                                                className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest transition ${
                                                    selectedMetal === m ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        {formData.rates.map((rate, index) => (
                                            <label key={rate.purity_id} className="flex items-center justify-between gap-4 text-sm">
                                                <span className="text-slate-600 font-semibold">{rate.purity_name}</span>
                                                <div className="relative flex-1 max-w-[160px]">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                                    <input
                                                        type="number"
                                                        value={rate.price_per_gram}
                                                        onChange={(e) => {
                                                            const newRates = [...formData.rates];
                                                            newRates[index].price_per_gram = e.target.value;
                                                            setFormData({ ...formData, rates: newRates });
                                                        }}
                                                        className="w-full rounded-2xl border border-slate-300 pl-8 pr-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                        placeholder="0.00"
                                                        required
                                                    />
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:opacity-60"
                                >
                                    Publish Reference Rates
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
