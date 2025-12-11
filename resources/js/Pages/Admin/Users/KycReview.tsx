import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { useState } from 'react';

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
    phone?: string | null;
    type?: string | null;
    kyc_status: string;
    kyc_status_label: string;
    kyc_notes?: string | null;
    comments_enabled: boolean;
    created_at?: string | null;
    updated_at?: string | null;
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
        created_at?: string | null;
        updated_at?: string | null;
    } | null;
    kyc_documents: KycDocument[];
};

type StatusOption = {
    value: string;
    label: string;
};

type KycMessage = {
    id: number;
    sender_type: 'admin' | 'customer';
    message: string;
    created_at?: string | null;
    admin?: {
        id: number;
        name: string;
    } | null;
};

type KycReviewPageProps = AppPageProps<{
    user: AdminUser;
    statuses: StatusOption[];
    documentStatuses: StatusOption[];
    messages: KycMessage[];
}>;

export default function KycReview() {
    const { user, statuses, messages } = usePage<KycReviewPageProps>().props;
    const [documentModalOpen, setDocumentModalOpen] = useState<number | null>(null);
    const [documentAction, setDocumentAction] = useState<'approve' | 'reject' | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        status: user.kyc_status,
        remarks: user.kyc_notes ?? '',
    });
    const messageForm = useForm({
        message: '',
    });
    const documentForm = useForm({
        status: 'pending',
        remarks: '',
    });

    const sendMessage = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const content = messageForm.data.message.trim();
        if (!content) {
            return;
        }

        messageForm.post(route('admin.customers.kyc.messages.store', user.id), {
            preserveScroll: true,
            onSuccess: () => messageForm.reset('message'),
        });
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('admin.customers.update-kyc', user.id), {
            preserveScroll: true,
        });
    };

    const toggleCustomerReplies = () => {
        router.post(
            route('admin.customers.kyc.comments.update', user.id),
            { allow_replies: !user.comments_enabled },
            { preserveScroll: true },
        );
    };

    const openDocumentModal = (documentId: number, action: 'approve' | 'reject') => {
        const document = user.kyc_documents.find((d) => d.id === documentId);
        if (document) {
            setDocumentModalOpen(documentId);
            setDocumentAction(action);
            documentForm.setData({
                status: action === 'approve' ? 'approved' : 'rejected',
                remarks: document.remarks ?? '',
            });
        }
    };

    const closeDocumentModal = () => {
        setDocumentModalOpen(null);
        setDocumentAction(null);
        documentForm.reset();
    };

    const submitDocument = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!documentModalOpen) return;

        documentForm.put(route('admin.customers.kyc.documents.update', documentModalOpen), {
            preserveScroll: true,
            onSuccess: () => {
                closeDocumentModal();
            },
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

    const getStatusBadge = (status: string) => {
        const statusTheme: Record<string, string> = {
            approved: 'bg-emerald-100 text-emerald-700',
            rejected: 'bg-rose-100 text-rose-700',
            needs_revision: 'bg-amber-100 text-amber-700',
            pending: 'bg-slate-100 text-slate-700',
        };
        return statusTheme[status] ?? statusTheme.pending;
    };

    const selectedDocument = documentModalOpen
        ? user.kyc_documents.find((d) => d.id === documentModalOpen)
        : null;

    return (
        <AdminLayout>
            <Head title={`KYC Review - ${user.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">KYC Review</h1>
                            <p className="mt-1 text-sm text-slate-500">Review and verify customer documents</p>
                        </div>
                        <span
                            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ${
                                user.kyc_status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : user.kyc_status === 'rejected'
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                            {user.kyc_status_label}
                        </span>
                    </div>
                </div>

                {/* Business Information - First Section */}
                {user.kyc_profile && (
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900">Business Information</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Customer Name</dt>
                                    <dd className="mt-1.5 text-sm font-semibold text-slate-900">{user.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Email</dt>
                                    <dd className="mt-1.5 text-sm text-slate-700">{user.email}</dd>
                                </div>
                                {user.phone && (
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Phone</dt>
                                        <dd className="mt-1.5 text-sm text-slate-700">{user.phone}</dd>
                                    </div>
                                )}
                                {user.type && (
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Customer Type</dt>
                                        <dd className="mt-1.5 text-sm text-slate-700">{user.type}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Business Name</dt>
                                    <dd className="mt-1.5 text-sm font-semibold text-slate-900">{user.kyc_profile.business_name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Website</dt>
                                    <dd className="mt-1.5 text-sm text-slate-700">
                                        {user.kyc_profile.business_website ? (
                                            <a
                                                href={user.kyc_profile.business_website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-elvee-blue hover:text-feather-gold"
                                            >
                                                {user.kyc_profile.business_website}
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">GST Number</dt>
                                    <dd className="mt-1.5 text-sm font-semibold text-slate-900">{user.kyc_profile.gst_number ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">PAN Number</dt>
                                    <dd className="mt-1.5 text-sm font-semibold text-slate-900">{user.kyc_profile.pan_number ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Registration Number</dt>
                                    <dd className="mt-1.5 text-sm font-semibold text-slate-900">{user.kyc_profile.registration_number ?? '—'}</dd>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Contact Person</dt>
                                    <dd className="mt-1.5 text-sm text-slate-700">{user.kyc_profile.contact_name ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Contact Phone</dt>
                                    <dd className="mt-1.5 text-sm text-slate-700">{user.kyc_profile.contact_phone ?? '—'}</dd>
                                </div>
                                <div className="md:col-span-2">
                                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Address</dt>
                                    <dd className="mt-1.5 text-sm text-slate-700">
                                        {[user.kyc_profile.address_line1, user.kyc_profile.address_line2]
                                            .filter(Boolean)
                                            .join(', ') || '—'}
                                        <br />
                                        {[user.kyc_profile.city, user.kyc_profile.state, user.kyc_profile.postal_code]
                                            .filter(Boolean)
                                            .join(', ')}
                                        {user.kyc_profile.country ? `, ${user.kyc_profile.country}` : ''}
                                    </dd>
                                </div>
                                {user.kyc_profile.created_at && (
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Profile Created</dt>
                                        <dd className="mt-1.5 text-sm text-slate-700">
                                            {new Date(user.kyc_profile.created_at).toLocaleString('en-IN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </dd>
                                    </div>
                                )}
                                {user.kyc_profile.updated_at && (
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Profile Updated</dt>
                                        <dd className="mt-1.5 text-sm text-slate-700">
                                            {new Date(user.kyc_profile.updated_at).toLocaleString('en-IN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </dd>
                                    </div>
                                )}
                                {user.created_at && (
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Account Created</dt>
                                        <dd className="mt-1.5 text-sm text-slate-700">
                                            {new Date(user.created_at).toLocaleString('en-IN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </dd>
                                    </div>
                                )}
                                {user.updated_at && (
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Account Updated</dt>
                                        <dd className="mt-1.5 text-sm text-slate-700">
                                            {new Date(user.updated_at).toLocaleString('en-IN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </dd>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents Table */}
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Documents</h2>
                    {user.kyc_documents.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
                            <p className="text-sm">No documents uploaded yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b-2 border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Document Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">File</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Remarks</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {user.kyc_documents.map((document) => (
                                        <tr key={document.id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-4 py-4">
                                                <span className="font-semibold text-slate-900">{document.type}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {document.file_url ? (
                                                    <a
                                                        href={document.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-elvee-blue hover:text-feather-gold"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                        </svg>
                                                        View Document
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-slate-400">No file</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(document.status)}`}
                                                >
                                                    {document.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-xs text-slate-600">{document.remarks || '—'}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openDocumentModal(document.id, 'approve')}
                                                        className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDocumentModal(document.id, 'reject')}
                                                        className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Overall KYC Status Update */}
                <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900">Update KYC Status</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span className="font-semibold text-slate-800">Status</span>
                            <select
                                className="rounded-xl border border-slate-200 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                value={data.status}
                                onChange={(event) => setData('status', event.target.value)}
                            >
                                {statuses.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                            {errors.status && <InputError message={errors.status} />}
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span className="font-semibold text-slate-800">Internal Notes</span>
                            <textarea
                                className="min-h-[100px] rounded-xl border border-slate-200 px-4 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                value={data.remarks}
                                onChange={(event) => setData('remarks', event.target.value)}
                                placeholder="Add internal notes (optional)"
                            />
                            {errors.remarks && <InputError message={errors.remarks} />}
                        </label>
                    </div>
                    {user.kyc_notes && (
                        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                            <p className="font-semibold text-amber-800">Previous Notes</p>
                            <p className="mt-1 whitespace-pre-line">{user.kyc_notes}</p>
                        </div>
                    )}
                    <div className="mt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Saving...' : 'Save Status'}
                        </button>
                    </div>
                </form>

                {/* Conversation */}
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Conversation</h2>
                            <p className="mt-1 text-xs text-slate-500">Communicate with the customer about their KYC submission.</p>
                        </div>
                        <button
                            type="button"
                            onClick={toggleCustomerReplies}
                            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                            {user.comments_enabled ? 'Disable customer replies' : 'Enable customer replies'}
                        </button>
                    </div>

                    <div className="mt-4 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 max-h-64">
                        {messages.length === 0 ? (
                            <p className="text-xs text-slate-500">No messages yet. Send a note to start the conversation.</p>
                        ) : (
                            messages.map((message) => {
                                const isAdmin = message.sender_type === 'admin';
                                const meta = isAdmin ? message.admin?.name ?? 'Compliance team' : user.name;
                                return (
                                    <div
                                        key={message.id}
                                        className={`flex flex-col gap-1 ${isAdmin ? 'items-end text-right' : 'items-start text-left'}`}
                                    >
                                        <span className="text-[11px] text-slate-400">
                                            {meta}
                                            {message.created_at ? ` · ${formatTimestamp(message.created_at)}` : ''}
                                        </span>
                                        <div
                                            className={`max-w-full rounded-2xl px-4 py-3 text-sm ${
                                                isAdmin
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-white text-slate-700 shadow ring-1 ring-slate-200/70'
                                            }`}
                                        >
                                            <p className="whitespace-pre-line">{message.message}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {!user.comments_enabled && (
                        <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                            Customer replies are disabled. They will still see all messages you send.
                        </p>
                    )}

                    <form onSubmit={sendMessage} className="mt-4 space-y-2">
                        <label className="flex flex-col gap-2 text-xs text-slate-600">
                            <span className="font-semibold text-slate-700">Send Message</span>
                            <textarea
                                value={messageForm.data.message}
                                onChange={(event) => messageForm.setData('message', event.target.value)}
                                className="min-h-[90px] rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                placeholder="Share clarifications, request missing documents, or confirm approval."
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
                                {messageForm.processing ? 'Sending…' : 'Send Message'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Document Action Modal */}
            <Modal show={documentModalOpen !== null} maxWidth="2xl" onClose={closeDocumentModal}>
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {documentAction === 'approve' ? 'Approve Document' : 'Reject Document'}
                            </h3>
                            <button
                                type="button"
                                onClick={closeDocumentModal}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={submitDocument} className="space-y-4">
                            {selectedDocument && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Document</p>
                                    <p className="mt-1.5 text-sm font-semibold text-slate-900">{selectedDocument.type}</p>
                                    {selectedDocument.file_url && (
                                        <a
                                            href={selectedDocument.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-elvee-blue hover:text-feather-gold"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                            </svg>
                                            View Document
                                        </a>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    {documentAction === 'approve' ? 'Approval Comment (Optional)' : 'Rejection Reason (Required)'}
                                </label>
                                <textarea
                                    value={documentForm.data.remarks}
                                    onChange={(event) => documentForm.setData('remarks', event.target.value)}
                                    className="w-full min-h-[120px] rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    placeholder={
                                        documentAction === 'approve'
                                            ? 'Add any notes about this approval...'
                                            : 'Explain why this document is being rejected and what needs to be corrected...'
                                    }
                                    required={documentAction === 'reject'}
                                />
                                <InputError message={documentForm.errors.remarks} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeDocumentModal}
                                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={documentForm.processing || (documentAction === 'reject' && !documentForm.data.remarks.trim())}
                                    className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70 ${
                                        documentAction === 'approve'
                                            ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-500'
                                            : 'bg-rose-600 shadow-rose-600/30 hover:bg-rose-500'
                                    }`}
                                >
                                    {documentForm.processing
                                        ? 'Processing...'
                                        : documentAction === 'approve'
                                          ? 'Approve Document'
                                          : 'Reject Document'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
