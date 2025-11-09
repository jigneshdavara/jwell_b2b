import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import { useEffect } from 'react';

type KycDocument = {
    id: number;
    type: string;
    file_path: string;
    file_url?: string | null;
    status: string;
    remarks?: string | null;
};

type AdminUser = {
    id: number;
    name: string;
    email: string;
    kyc_status: string;
    kyc_status_label: string;
    kyc_notes?: string | null;
    kyc_profile?: {
        business_name?: string | null;
        business_website?: string | null;
        gst_number?: string | null;
        pan_number?: string | null;
        registration_number?: string | null;
        address_line1?: string | null;
        address_line2?: string | null;
        city?: string | null;
        state?: string | null;
        postal_code?: string | null;
        country?: string | null;
        contact_name?: string | null;
        contact_phone?: string | null;
    } | null;
    kyc_documents: KycDocument[];
};

type StatusOption = {
    value: string;
    label: string;
};

type KycReviewPageProps = AppPageProps<{
    user: AdminUser;
    statuses: StatusOption[];
    documentStatuses: StatusOption[];
}>;

export default function KycReview() {
    const { user, statuses, documentStatuses } = usePage<KycReviewPageProps>().props;

    const { data, setData, post, processing, errors } = useForm({
        status: user.kyc_status,
        remarks: user.kyc_notes ?? '',
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('admin.users.update-kyc', user.id), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title={`KYC Review - ${user.name}`} />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                    <h1 className="text-2xl font-semibold text-slate-900">KYC Review</h1>
                    <p className="mt-2 text-sm text-slate-500">Review submitted documents and update status.</p>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
                >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">{user.name}</h2>
                            <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                            {user.kyc_status_label}
                        </span>
                    </div>

                    {user.kyc_notes && (
                        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
                            <p className="font-semibold uppercase tracking-[0.3em] text-amber-600">Partner notes</p>
                            <p className="mt-2 whitespace-pre-line">{user.kyc_notes}</p>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span className="font-semibold text-slate-800">Update status</span>
                            <select
                                className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                value={data.status}
                                onChange={(event) => setData('status', event.target.value)}
                            >
                                {statuses.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                            {errors.status && <span className="text-xs text-rose-500">{errors.status}</span>}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span className="font-semibold text-slate-800">Internal remarks</span>
                            <textarea
                                className="min-h-[120px] rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                value={data.remarks}
                                onChange={(event) => setData('remarks', event.target.value)}
                                placeholder="Add context for the customer success team (optional)"
                            />
                            {errors.remarks && <span className="text-xs text-rose-500">{errors.remarks}</span>}
                        </label>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Save decision
                        </button>
                    </div>
                </form>

                <div className="space-y-4">
                    {user.kyc_profile && (
                        <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Business information</h3>
                            <dl className="mt-4 grid gap-4 text-sm text-slate-700 md:grid-cols-2">
                                <div>
                                    <dt className="font-medium text-slate-500">Store name</dt>
                                    <dd className="mt-1 text-slate-900">{user.kyc_profile.business_name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">Website</dt>
                                    <dd className="mt-1 text-slate-900">{user.kyc_profile.business_website ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">GST</dt>
                                    <dd className="mt-1 text-slate-900">{user.kyc_profile.gst_number ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">PAN</dt>
                                    <dd className="mt-1 text-slate-900">{user.kyc_profile.pan_number ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">Registration no.</dt>
                                    <dd className="mt-1 text-slate-900">{user.kyc_profile.registration_number ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">Contact</dt>
                                    <dd className="mt-1 text-slate-900">
                                        {user.kyc_profile.contact_name ?? '—'}
                                        {user.kyc_profile.contact_phone ? ` · ${user.kyc_profile.contact_phone}` : ''}
                                    </dd>
                                </div>
                                <div className="md:col-span-2">
                                    <dt className="font-medium text-slate-500">Address</dt>
                                    <dd className="mt-1 text-slate-900">
                                        {[user.kyc_profile.address_line1, user.kyc_profile.address_line2]
                                            .filter(Boolean)
                                            .join(', ') || '—'}
                                        <br />
                                        {[user.kyc_profile.city, user.kyc_profile.state, user.kyc_profile.postal_code]
                                            .filter(Boolean)
                                            .join(', ') || ''}
                                        {user.kyc_profile.country ? `, ${user.kyc_profile.country}` : ''}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    )}

                    {user.kyc_documents.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
                            No documents uploaded yet.
                        </div>
                    ) : (
                        user.kyc_documents.map((document) => (
                            <DocumentReviewCard
                                key={document.id}
                                document={document}
                                statuses={documentStatuses}
                            />
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

type DocumentReviewCardProps = {
    document: KycDocument;
    statuses: StatusOption[];
};

function DocumentReviewCard({ document, statuses }: DocumentReviewCardProps) {
    const { data, setData, put, processing, errors } = useForm({
        status: document.status,
        remarks: document.remarks ?? '',
    });
 
     useEffect(() => {
        setData((prev) => ({
            ...prev,
            status: document.status,
            remarks: document.remarks ?? '',
        }));
    }, [document.id, document.status, document.remarks, setData]);
 
    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('admin.users.kyc.documents.update', document.id), {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-900">{document.type}</p>
                    <p className="text-xs text-slate-500 break-all">{document.file_path}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {document.status}
                </span>
            </div>

            {document.file_url && (
                <a
                    href={document.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-500"
                >
                    View document
                </a>
            )}

            <label className="flex flex-col gap-2 text-xs text-slate-600">
                <span className="font-semibold uppercase tracking-[0.2em] text-slate-500">Status</span>
                <select
                    value={data.status}
                    onChange={(event) => setData('status', event.target.value)}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm capitalize focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                    {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                            {status.label}
                        </option>
                    ))}
                </select>
                <InputError message={errors.status} />
            </label>

            <label className="flex flex-col gap-2 text-xs text-slate-600">
                <span className="font-semibold uppercase tracking-[0.2em] text-slate-500">Comment for partner</span>
                <textarea
                    value={data.remarks ?? ''}
                    onChange={(event) => setData('remarks', event.target.value)}
                    className="min-h-[100px] rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder="Explain missing pages, clarity issues, or alternate docs required"
                />
                <InputError message={errors.remarks} />
            </label>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? 'Saving…' : 'Save feedback'}
                </button>
            </div>
        </form>
    );
}

