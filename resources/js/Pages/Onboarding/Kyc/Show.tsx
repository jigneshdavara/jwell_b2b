import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ChangeEvent } from 'react';

const statusLabels: Record<string, { title: string; description: string; badge: string }> = {
    pending: {
        title: 'Awaiting compliance review',
        description: 'Our team is validating your documents. We will reach out within 24 working hours.',
        badge: 'bg-amber-100 text-amber-700',
    },
    review: {
        title: 'Action required from you',
        description: 'Please update the details below or upload the requested documents so we can proceed.',
        badge: 'bg-rose-100 text-rose-700',
    },
    rejected: {
        title: 'Application declined',
        description: 'Update your details and resubmit for another review or contact support for clarification.',
        badge: 'bg-rose-100 text-rose-700',
    },
    approved: {
        title: 'KYC approved',
        description: 'Access the catalogue, jobwork, and wholesale pricing instantly.',
        badge: 'bg-emerald-100 text-emerald-700',
    },
};

type KycDocument = {
    id: number;
    type: string;
    status: string;
    remarks?: string | null;
    url?: string | null;
    download_url?: string | null;
    uploaded_at?: string | null;
};

type KycProfile = {
    business_name: string;
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
};

type ConversationMessage = {
    id: number;
    sender_type: 'admin' | 'customer';
    message: string;
    created_at?: string | null;
    admin?: {
        id: number;
        name: string;
    } | null;
};

type KycOnboardingPageProps = PageProps<{
    user: {
        name: string;
        email: string;
        phone?: string | null;
        type?: string | null;
        kyc_status: string;
        kyc_notes?: string | null;
    };
    profile: KycProfile;
    documents: KycDocument[];
    documentTypes: string[];
    messages: ConversationMessage[];
    can_customer_reply: boolean;
}>;

export default function KycOnboardingShow() {
    const { user, profile, documents, documentTypes, messages, can_customer_reply } =
        usePage<KycOnboardingPageProps>().props;

    const profileForm = useForm({
        business_name: profile?.business_name ?? '',
        business_website: profile?.business_website ?? '',
        gst_number: profile?.gst_number ?? '',
        pan_number: profile?.pan_number ?? '',
        registration_number: profile?.registration_number ?? '',
        address_line1: profile?.address_line1 ?? '',
        address_line2: profile?.address_line2 ?? '',
        city: profile?.city ?? '',
        state: profile?.state ?? '',
        postal_code: profile?.postal_code ?? '',
        country: profile?.country ?? 'India',
        contact_name: profile?.contact_name ?? user.name,
        contact_phone: profile?.contact_phone ?? user.phone ?? '',
    });

    const documentForm = useForm<{ document_type: string; document_file: File | null }>({
        document_type: documentTypes[0] ?? 'gst_certificate',
        document_file: null,
    });

    const messageForm = useForm({
        message: '',
    });

    const statusInfo = statusLabels[user.kyc_status] ?? statusLabels.pending;
    const documentStatusTheme: Record<string, string> = {
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-rose-100 text-rose-700',
        needs_revision: 'bg-amber-100 text-amber-700',
        pending: 'bg-slate-100 text-slate-700',
    };

    const submitProfile = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        profileForm.patch(route('onboarding.kyc.profile.update'), {
            preserveScroll: true,
        });
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        documentForm.setData('document_file', file);
    };

    const submitDocument = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        documentForm.post(route('onboarding.kyc.documents.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                documentForm.reset('document_file');
                const input = document.getElementById('document_file') as HTMLInputElement | null;
                if (input) {
                    input.value = '';
                }
            },
        });
    };

    const submitMessage = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const content = messageForm.data.message.trim();

        if (!content || !can_customer_reply) {
            return;
        }

        messageForm.post(route('onboarding.kyc.messages.store'), {
            preserveScroll: true,
            onSuccess: () => messageForm.reset('message'),
        });
    };

    const formatTimestamp = (value?: string | null) => {
        if (!value) {
            return '';
        }

        return new Date(value).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const removeDocument = (documentId: number) => {
        router.delete(route('onboarding.kyc.documents.destroy', documentId), {
            preserveScroll: true,
        });
    };

    const isApproved = user.kyc_status === 'approved';

    return (
        <AuthenticatedLayout>
            <Head title="KYC onboarding" />

            <div className="space-y-8">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_40%),_radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.25),_transparent_45%)]" />
                    <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-xs text-white/70">Elvee onboarding</p>
                            <h1 className="mt-2 text-3xl font-semibold">KYC verification status</h1>
                            <p className="mt-3 max-w-2xl text-sm text-white/80">{statusInfo.description}</p>
                            {user.kyc_notes && (
                                <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm text-amber-200">
                                    <p className="font-semibold text-amber-300">Reviewer notes</p>
                                    <p className="mt-2 whitespace-pre-line">{user.kyc_notes}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-start gap-3 lg:items-end">
                            <span className={`rounded-full px-4 py-1 text-xs font-semibold ${statusInfo.badge}`}>
                                {user.kyc_status === 'review' ? 'needs attention' : user.kyc_status}
                            </span>
                            {isApproved ? (
                                <a
                                    href={route('dashboard')}
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/20"
                                >
                                    Go to dashboard
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </a>
                            ) : (
                                <span className="text-xs text-white/70">Access unlocks after approval</span>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                    <div className="space-y-8">
                        <form
                            onSubmit={submitProfile}
                            className="space-y-5 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900">Business profile</h2>
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {profileForm.processing ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>Business / store name</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.business_name}
                                        onChange={(event) => profileForm.setData('business_name', event.target.value)}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        required
                                    />
                                    <InputError message={profileForm.errors.business_name} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>Website</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.business_website}
                                        onChange={(event) => profileForm.setData('business_website', event.target.value)}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder="https://example.com"
                                    />
                                    <InputError message={profileForm.errors.business_website} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>GST number</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.gst_number}
                                        onChange={(event) => profileForm.setData('gst_number', event.target.value.toUpperCase())}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder="Optional"
                                    />
                                    <InputError message={profileForm.errors.gst_number} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>PAN</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.pan_number}
                                        onChange={(event) => profileForm.setData('pan_number', event.target.value.toUpperCase())}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder="Optional"
                                    />
                                    <InputError message={profileForm.errors.pan_number} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>Registration number</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.registration_number}
                                        onChange={(event) => profileForm.setData('registration_number', event.target.value)}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder="MSME / CIN"
                                    />
                                    <InputError message={profileForm.errors.registration_number} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>Contact person</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.contact_name}
                                        onChange={(event) => profileForm.setData('contact_name', event.target.value)}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    <InputError message={profileForm.errors.contact_name} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>Contact phone</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.contact_phone}
                                        onChange={(event) => profileForm.setData('contact_phone', event.target.value)}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    <InputError message={profileForm.errors.contact_phone} />
                                </label>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>Address line 1</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.address_line1}
                                        onChange={(event) => profileForm.setData('address_line1', event.target.value)}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    <InputError message={profileForm.errors.address_line1} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>Address line 2</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.address_line2}
                                        onChange={(event) => profileForm.setData('address_line2', event.target.value)}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    <InputError message={profileForm.errors.address_line2} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>City</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.city}
                                        onChange={(event) => profileForm.setData('city', event.target.value)}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    <InputError message={profileForm.errors.city} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>State</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.state}
                                        onChange={(event) => profileForm.setData('state', event.target.value)}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    <InputError message={profileForm.errors.state} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>Postal code</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.postal_code}
                                        onChange={(event) => profileForm.setData('postal_code', event.target.value)}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    <InputError message={profileForm.errors.postal_code} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>Country</span>
                                    <input
                                        type="text"
                                        value={profileForm.data.country}
                                        onChange={(event) => profileForm.setData('country', event.target.value)}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                    <InputError message={profileForm.errors.country} />
                                </label>
                            </div>
                        </form>

                        <form
                            onSubmit={submitDocument}
                            className="space-y-5 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-slate-900">Upload supporting documents</h2>
                                <button
                                    type="submit"
                                    disabled={documentForm.processing}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {documentForm.processing ? 'Uploading…' : 'Upload'}
                                </button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>Document type</span>
                                    <select
                                        value={documentForm.data.document_type}
                                        onChange={(event) => documentForm.setData('document_type', event.target.value)}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 capitalize focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    >
                                        {documentTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type.replace(/_/g, ' ')}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={documentForm.errors.document_type} />
                                </label>
                                <label className="flex flex-col gap-1 text-sm text-slate-600">
                                    <span>Attachment (PDF/JPG/PNG, max 8MB)</span>
                                    <input
                                        id="document_file"
                                        type="file"
                                        accept="application/pdf,image/jpeg,image/png"
                                        onChange={handleFileChange}
                                        className="rounded-2xl border border-slate-300 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        required
                                    />
                                    <InputError message={documentForm.errors.document_file} />
                                </label>
                            </div>
                        </form>
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                            <h3 className="text-sm font-semibold text-slate-900">Messages from compliance</h3>
                            <p className="mt-2 text-xs text-slate-500">
                                Track clarifications sent by the compliance desk. Respond when you have the requested information.
                            </p>
                            <div className="mt-4 space-y-3 max-h-64 overflow-y-auto rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                                {messages.length === 0 ? (
                                    <p className="text-xs text-slate-500">No messages yet. Compliance will reach out if anything is pending.</p>
                                ) : (
                                    messages.map((message) => {
                                        const isAdmin = message.sender_type === 'admin';
                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex flex-col gap-1 ${isAdmin ? 'items-start text-left' : 'items-end text-right'}`}
                                            >
                                                <span className="text-[11px] text-slate-400">
                                                    {isAdmin ? message.admin?.name ?? 'Compliance team' : 'You'}
                                                    {message.created_at ? ` · ${formatTimestamp(message.created_at)}` : ''}
                                                </span>
                                                <div
                                                    className={`max-w-full rounded-2xl px-4 py-3 text-sm ${
                                                        isAdmin
                                                            ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-200'
                                                            : 'bg-slate-900 text-white'
                                                    }`}
                                                >
                                                    <p className="whitespace-pre-line">{message.message}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            {!can_customer_reply && (
                                <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                                    Replies are disabled by the compliance team. You can still review their updates above.
                                </p>
                            )}
                            {can_customer_reply && (
                                <form onSubmit={submitMessage} className="mt-4 space-y-2">
                                    <label className="flex flex-col gap-2 text-xs text-slate-600">
                                        <span className="font-semibold text-slate-700">Send a reply</span>
                                        <textarea
                                            value={messageForm.data.message}
                                            onChange={(event) => messageForm.setData('message', event.target.value)}
                                            className="min-h-[90px] rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                            placeholder="Share the update or clarification you have for the compliance team."
                                            disabled={messageForm.processing}
                                        />
                                        <InputError message={messageForm.errors.message} />
                                    </label>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={messageForm.processing || !messageForm.data.message.trim()}
                                            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {messageForm.processing ? 'Sending…' : 'Send message'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                            <h3 className="text-sm font-semibold text-slate-700">Submitted documents</h3>
                            <div className="mt-4 space-y-3 text-sm">
                                {documents.length === 0 && (
                                    <p className="rounded-2xl bg-slate-50 p-4 text-slate-500">
                                        Upload your GST, PAN, trade license or store photos to speed up verification.
                                    </p>
                                )}
                                {documents.map((document) => (
                                    <div
                                        key={document.id}
                                        className="rounded-2xl border border-slate-200 p-4 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-800">
                                                    {document.type.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Uploaded {document.uploaded_at ? new Date(document.uploaded_at).toLocaleString('en-IN') : 'recently'}
                                                </p>
                                            </div>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                                    documentStatusTheme[document.status] ?? documentStatusTheme.pending
                                                }`}
                                            >
                                                {document.status}
                                            </span>
                                        </div>
                                        {document.remarks && (
                                            <p className="mt-2 text-xs text-rose-500">Remarks: {document.remarks}</p>
                                        )}
                                        <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
                                            {document.url && (
                                                <>
                                                    <a
                                                        href={document.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sky-600 hover:text-sky-500"
                                                    >
                                                        View file
                                                    </a>
                                                    {document.download_url && (
                                                        <a
                                                            href={document.download_url}
                                                            className="text-slate-500 hover:text-slate-700"
                                                        >
                                                            Download
                                                        </a>
                                                    )}
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeDocument(document.id)}
                                                className="text-rose-500 hover:text-rose-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                            <h3 className="text-sm font-semibold text-slate-500">Need help?</h3>
                            <p className="mt-3 text-sm text-slate-600">
                                Write to <a href="mailto:compliance@elvee.in" className="font-semibold text-sky-600">compliance@elvee.in</a>{' '}
                                for expedited verification or assistance with additional paperwork.
                            </p>
                        </div>
                    </aside>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function InputError({ message }: { message?: string }) {
    if (!message) return null;
    return <span className="text-xs text-rose-500">{message}</span>;
}
