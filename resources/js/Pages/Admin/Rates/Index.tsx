import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';

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

type AdminRatesPageProps = AppPageProps<{
    rates: Pagination<RateRow>;
    metals: string[];
    defaultCurrency: string;
}>;

export default function AdminRatesIndex() {
    const { rates, metals, defaultCurrency } = usePage<AdminRatesPageProps>().props;
    const overrideForm = useForm({
        metal: metals[0] ?? '',
        purity: '',
        price_per_gram: '',
        currency: defaultCurrency,
        notes: '',
        effective_at: '',
    });

    const syncForm = useForm({});

    const submitOverride = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        overrideForm.post(route('admin.rates.override'), {
            preserveScroll: true,
            onSuccess: () => {
                overrideForm.reset('purity', 'price_per_gram', 'notes', 'effective_at');
            },
        });
    };

    const syncRates = () => {
        syncForm.post(route('admin.rates.sync'), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Live Rates" />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Live metal & diamond rates</h1>
                            <p className="text-sm text-slate-500">Feed pulled from configured sources for pricing and procurement.</p>
                        </div>
                        <button
                            type="button"
                            disabled={syncForm.processing}
                            onClick={syncRates}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/30 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0014-14" />
                            </svg>
                            Sync rates
                        </button>
                    </div>
                </div>

                <form
                    onSubmit={submitOverride}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <h2 className="text-lg font-semibold text-slate-900">Add manual override</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Metal</span>
                            <input
                                list="metal-library"
                                value={overrideForm.data.metal}
                                onChange={(event) => overrideForm.setData('metal', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                required
                            />
                            {overrideForm.errors.metal && <span className="text-xs text-rose-500">{overrideForm.errors.metal}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Purity</span>
                            <input
                                type="text"
                                value={overrideForm.data.purity}
                                onChange={(event) => overrideForm.setData('purity', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="18K / VVS / etc"
                                required
                            />
                            {overrideForm.errors.purity && <span className="text-xs text-rose-500">{overrideForm.errors.purity}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Price per gram</span>
                            <input
                                type="number"
                                step="0.01"
                                value={overrideForm.data.price_per_gram}
                                onChange={(event) => overrideForm.setData('price_per_gram', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                required
                            />
                            {overrideForm.errors.price_per_gram && (
                                <span className="text-xs text-rose-500">{overrideForm.errors.price_per_gram}</span>
                            )}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Currency</span>
                            <input
                                type="text"
                                value={overrideForm.data.currency}
                                onChange={(event) => overrideForm.setData('currency', event.target.value.toUpperCase())}
                                className="rounded-2xl border border-slate-300 px-4 py-2 uppercase focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                maxLength={10}
                            />
                            {overrideForm.errors.currency && <span className="text-xs text-rose-500">{overrideForm.errors.currency}</span>}
                        </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Effective at</span>
                            <input
                                type="datetime-local"
                                value={overrideForm.data.effective_at}
                                onChange={(event) => overrideForm.setData('effective_at', event.target.value)}
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            />
                            {overrideForm.errors.effective_at && (
                                <span className="text-xs text-rose-500">{overrideForm.errors.effective_at}</span>
                            )}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Notes</span>
                            <textarea
                                value={overrideForm.data.notes}
                                onChange={(event) => overrideForm.setData('notes', event.target.value)}
                                className="min-h-[80px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="Optional context for audit trail"
                            />
                            {overrideForm.errors.notes && <span className="text-xs text-rose-500">{overrideForm.errors.notes}</span>}
                        </label>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={overrideForm.processing}
                            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Save override
                        </button>
                    </div>
                </form>

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

            <datalist id="metal-library">
                {metals.map((metal) => (
                    <option key={metal} value={metal} />
                ))}
            </datalist>
        </AdminLayout>
    );
}

