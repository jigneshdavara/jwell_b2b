import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type QuotationRow = {
    id: number;
    mode: 'purchase' | 'jobwork';
    status: string;
    jobwork_status?: string | null;
    approved_at?: string | null;
    admin_notes?: string | null;
    quantity: number;
    notes?: string | null;
    selections?: Record<string, string | number | boolean | null | undefined> | null;
    product: {
        id: number;
        name: string;
        sku: string;
        thumbnail?: string | null;
    };
    variant?: {
        id: number;
        label: string;
        metadata?: Record<string, string | number | boolean | null | undefined> | null;
    } | null;
    order?: {
        id: number;
        reference: string;
        status: string;
        history?: Array<{
            id: number;
            status: string;
            created_at: string;
        }>;
    } | null;
    messages: Array<{
        id: number;
        sender: 'customer' | 'admin';
        message: string;
        created_at?: string | null;
    }>;
    created_at?: string | null;
};

type QuotationsPageProps = PageProps<{
    quotations: QuotationRow[];
}>;

const statusLabels: Record<string, { label: string; style: string }> = {
    pending: { label: 'Pending review', style: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', style: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Rejected', style: 'bg-rose-100 text-rose-700' },
    invoiced: { label: 'Awaiting payment', style: 'bg-sky-100 text-sky-700' },
    converted: { label: 'Converted to order', style: 'bg-slate-200 text-slate-700' },
    pending_customer_confirmation: { label: 'Waiting for you', style: 'bg-amber-100 text-amber-700' },
    customer_confirmed: { label: 'You approved', style: 'bg-emerald-100 text-emerald-700' },
    customer_declined: { label: 'You declined', style: 'bg-rose-100 text-rose-700' },
};

const jobworkStageLabels: Record<string, { label: string; style: string }> = {
    material_sending: { label: 'Material sending', style: 'bg-slate-100 text-slate-600' },
    material_received: { label: 'Material received', style: 'bg-sky-100 text-sky-700' },
    under_preparation: { label: 'Under preparation', style: 'bg-indigo-100 text-indigo-700' },
    completed: { label: 'Completed', style: 'bg-emerald-100 text-emerald-700' },
    awaiting_billing: { label: 'Awaiting billing', style: 'bg-amber-100 text-amber-700' },
    billing_confirmed: { label: 'Billing confirmed', style: 'bg-emerald-100 text-emerald-700' },
    ready_to_ship: { label: 'Ready to ship', style: 'bg-slate-900 text-white' },
};

export default function QuotationsIndex() {
    const { quotations } = usePage<QuotationsPageProps>().props;
    const [modeFilter, setModeFilter] = useState<'all' | 'purchase' | 'jobwork'>('all');
    const [viewQuotation, setViewQuotation] = useState<QuotationRow | null>(null);
    const messageForm = useForm({ message: '' });

    const filteredQuotations = useMemo(() => {
        if (modeFilter === 'all') {
            return quotations;
        }

        return quotations.filter((quotation) => quotation.mode === modeFilter);
    }, [quotations, modeFilter]);

    const formatDate = (input?: string | null) =>
        input
            ? new Date(input).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
              })
            : 'N/A';

    const formatSelectionValue = (value: string | number | boolean | null | undefined): string => {
        if (value === null || value === undefined || value === '') {
            return '—';
        }

        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }

        return String(value);
    };

    useEffect(() => {
        if (!viewQuotation) {
            return;
        }

        const latest = quotations.find((quotation) => quotation.id === viewQuotation.id);
        if (latest) {
            setViewQuotation(latest);
        }
        // we intentionally ignore setViewQuotation in deps to avoid looping
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quotations]);

    const submitMessage = (quotationId: number) => {
        if (!messageForm.data.message.trim()) {
            return;
        }

        messageForm.post(route('frontend.quotations.messages.store', quotationId), {
            onSuccess: () => messageForm.reset('message'),
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Quotations" />

            <div className="space-y-10">
                <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-900">Quotation requests</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Track jewellery purchase and jobwork quotations. We’ll notify you as soon as our merchandising desk replies.
                            </p>
                        </div>
                        <Link
                            href={route('frontend.catalog.index')}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-slate-900/30 transition hover:bg-slate-700"
                        >
                            Browse catalogue
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </header>

                <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                    <div className="mb-6 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => setModeFilter('all')}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                modeFilter === 'all'
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                        >
                            All quotations
                        </button>
                        <button
                            type="button"
                            onClick={() => setModeFilter('purchase')}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                modeFilter === 'purchase'
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                        >
                            Jewellery
                        </button>
                        <button
                            type="button"
                            onClick={() => setModeFilter('jobwork')}
                            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                                modeFilter === 'jobwork'
                                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            }`}
                        >
                            Jobwork
                        </button>
                    </div>

                    {filteredQuotations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-16 text-sm text-slate-500">
                            <p>No quotation requests yet.</p>
                            <Link
                                href={route('frontend.catalog.index')}
                                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500"
                            >
                                Start a quotation
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredQuotations.map((quotation) => {
                                const statusMeta = statusLabels[quotation.status] ?? {
                                    label: quotation.status,
                                    style: 'bg-slate-200 text-slate-700',
                                };

                                return (
                                    <article
                                        key={quotation.id}
                                        className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 md:flex-row md:items-center md:justify-between"
                                    >
                                        <div className="flex flex-1 items-start gap-4">
                                            {quotation.product.thumbnail && (
                                                <img
                                                    src={quotation.product.thumbnail}
                                                    alt={quotation.product.name}
                                                    className="h-20 w-20 rounded-xl object-cover shadow"
                                                />
                                            )}
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{quotation.product.name}</p>
                                                <p className="text-xs text-slate-400">
                                                    SKU {quotation.product.sku}
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                                                        {quotation.mode === 'jobwork' ? 'Jobwork' : 'Jewellery'}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${statusMeta.style}`}
                                                    >
                                                        {statusMeta.label}
                                                    </span>
                                                </div>
                                                {quotation.variant && (
                                                    <p className="mt-2 text-xs font-medium text-slate-500">
                                                        Variant: {(quotation.variant.metadata?.auto_label as string | undefined) ?? quotation.variant.label}
                                                    </p>
                                                )}
                                                {quotation.jobwork_status && (
                                                    <div className="mt-2">
                                                        <span
                                                            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                                                                jobworkStageLabels[quotation.jobwork_status]?.style ??
                                                                'bg-slate-200 text-slate-600'
                                                            }`}
                                                        >
                                                            {jobworkStageLabels[quotation.jobwork_status]?.label ??
                                                                quotation.jobwork_status.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                )}
                                                {quotation.selections && (
                                                    <ul className="mt-2 text-xs text-slate-500">
                                                        {Object.entries(quotation.selections).map(([key, value]) => (
                                                            <li key={key}>
                                                                <span className="capitalize text-slate-400">{key.replace(/_/g, ' ')}:</span>{' '}
                                                                <span className="text-slate-700">{formatSelectionValue(value)}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                {quotation.order && (
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Linked order {quotation.order.reference} · Status {quotation.order.status}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-start gap-3 md:items-end">
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                                                    Qty: {quotation.quantity}
                                                </span>
                                                {quotation.created_at && (
                                                    <span className="text-xs text-slate-400">
                                                        Requested {new Date(quotation.created_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewQuotation(quotation)}
                                                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                                >
                                                    View details
                                                </button>
                                                {quotation.notes && (
                                                    <p className="max-w-sm rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                                        {quotation.notes}
                                                    </p>
                                                )}
                                                {quotation.status === 'pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (
                                                                window.confirm(
                                                                    'Cancel this quotation request? This action cannot be undone.',
                                                                )
                                                            ) {
                                                                router.delete(route('frontend.quotations.destroy', quotation.id), {
                                                                    preserveScroll: true,
                                                                });
                                                            }
                                                        }}
                                                        className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                                                    >
                                                        Cancel request
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            {viewQuotation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
                    <div className="w-full max-w-3xl space-y-5 rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-slate-400">Quotation</p>
                                <h2 className="text-2xl font-semibold text-slate-900">{viewQuotation.product.name}</h2>
                                <p className="mt-1 text-xs text-slate-500">SKU {viewQuotation.product.sku}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewQuotation(null)}
                                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-400 hover:text-slate-800"
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 text-sm text-slate-600">
                                <p>
                                    <span className="font-semibold text-slate-800">Mode:</span> {viewQuotation.mode === 'jobwork' ? 'Jobwork' : 'Jewellery'}
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-800">Status:</span> {viewQuotation.status}
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-800">Quantity:</span> {viewQuotation.quantity}
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-800">Requested on:</span> {formatDate(viewQuotation.created_at)}
                                </p>
                                {viewQuotation.approved_at && (
                                    <p>
                                        <span className="font-semibold text-slate-800">Approved on:</span> {formatDate(viewQuotation.approved_at)}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2 text-sm text-slate-600">
                                {viewQuotation.jobwork_status && (
                                    <p>
                                        <span className="font-semibold text-slate-800">Jobwork stage:</span> {jobworkStageLabels[viewQuotation.jobwork_status]?.label ?? viewQuotation.jobwork_status.replace(/_/g, ' ')}
                                    </p>
                                )}
                                {viewQuotation.order && (
                                    <p>
                                        <span className="font-semibold text-slate-800">Order:</span> {viewQuotation.order.reference} ({viewQuotation.order.status})
                                    </p>
                                )}
                                {viewQuotation.order?.history?.length ? (
                                    <div className="mt-2 space-y-2">
                                        <p className="text-xs font-semibold text-slate-400">Status timeline</p>
                                        <ul className="space-y-1">
                                            {viewQuotation.order.history.map((entry) => (
                                                <li key={entry.id} className="rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-500">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-700">{entry.status.replace(/_/g, ' ')}</span>
                                                        <span>{formatDate(entry.created_at)}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                <h3 className="text-xs font-semibold text-slate-400">Your notes</h3>
                                <p className="mt-2 whitespace-pre-line">{viewQuotation.notes || '—'}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                <h3 className="text-xs font-semibold text-slate-400">Admin response</h3>
                                <p className="mt-2 whitespace-pre-line">{viewQuotation.admin_notes || 'Awaiting response'}</p>
                            </div>
                        </div>

                        {viewQuotation.selections && Object.keys(viewQuotation.selections).length > 0 && (
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                <h3 className="text-xs font-semibold text-slate-400">Selections</h3>
                                <ul className="mt-2 space-y-1">
                                    {Object.entries(viewQuotation.selections).map(([key, value]) => (
                                        <li key={key}>
                                            <span className="font-semibold text-slate-700">{key.replace(/_/g, ' ')}:</span>{' '}
                                            {formatSelectionValue(value)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="space-y-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                            <h3 className="text-xs font-semibold text-slate-400">Conversation</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                {viewQuotation.messages.length === 0 && (
                                    <p className="text-xs text-slate-400">No messages yet. Start the conversation below.</p>
                                )}
                                {viewQuotation.messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex flex-col gap-1 rounded-2xl border px-3 py-2 ${
                                            message.sender === 'admin'
                                                ? 'border-slate-200 bg-white'
                                                : 'border-sky-200 bg-sky-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                                            <span>{message.sender === 'admin' ? 'Admin' : 'You'}</span>
                                            <span>{formatDate(message.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 whitespace-pre-line">{message.message}</p>
                                    </div>
                                ))}
                            </div>

                            {viewQuotation.status !== 'rejected' && (
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        submitMessage(viewQuotation.id);
                                    }}
                                    className="space-y-2"
                                >
                                    <textarea
                                        value={messageForm.data.message}
                                        onChange={(event) => messageForm.setData('message', event.target.value)}
                                        className="w-full min-h-[90px] rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder="Share more details or ask a question..."
                                        disabled={messageForm.processing}
                                    />
                                    {messageForm.errors.message && (
                                        <p className="text-xs text-rose-500">{messageForm.errors.message}</p>
                                    )}
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={messageForm.processing || !messageForm.data.message.trim()}
                                            className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {messageForm.processing ? 'Sending…' : 'Send message'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

