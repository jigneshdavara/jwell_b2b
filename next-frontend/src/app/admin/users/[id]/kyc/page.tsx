'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminService } from '@/services/adminService';
import Link from 'next/link';
import { Head } from '@/components/Head';
import Modal from '@/components/ui/Modal';
import { toastError, toastWarning } from '@/utils/toast';

const statusColors: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  needs_revision: 'bg-amber-100 text-amber-700',
  review: 'bg-amber-100 text-amber-700',
};

const kycStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  review: 'bg-amber-100 text-amber-700',
};

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'review', label: 'Review Required' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminKycReviewPage() {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [remarks, setRemarks] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [documentModalOpen, setDocumentModalOpen] = useState<number | null>(null);
    const [documentAction, setDocumentAction] = useState<'approve' | 'reject' | null>(null);
    const [documentRemarks, setDocumentRemarks] = useState('');
    const [documentProcessing, setDocumentProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [messageProcessing, setMessageProcessing] = useState(false);

    useEffect(() => {
        fetchKycDetails();
    }, [id]);

    const fetchKycDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await adminService.getCustomer(Number(id));
            
            if (response.data) {
                const customerData = response.data;
                setUser({
                    id: customerData.id,
                    name: customerData.name,
                    email: customerData.email,
                    phone: customerData.phone,
                    type: customerData.type,
                    kyc_status: customerData.kyc_status,
                    kyc_notes: customerData.kyc_notes,
                    kyc_comments_enabled: customerData.kyc_comments_enabled ?? true,
                    kyc_profile: customerData.kyc_profile,
                    kyc_documents: customerData.kyc_documents || [],
                    kyc_messages: customerData.kyc_messages || [],
                    customer_group: customerData.customer_group,
                    created_at: customerData.created_at,
                    updated_at: customerData.updated_at,
                });
                setStatus(customerData.kyc_status || 'pending');
                setRemarks(customerData.kyc_notes || '');
            }
        } catch (e: any) {
            console.error('Failed to load KYC details:', e);
            setError(e.response?.data?.message || 'Failed to load customer KYC details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await adminService.updateCustomerKycStatus(Number(id), status, remarks);
            await fetchKycDetails(); // Reload data
        } catch (e: any) {
            console.error('Failed to update KYC status:', e);
            toastError(e.response?.data?.message || 'Failed to update KYC status');
        } finally {
            setProcessing(false);
        }
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        
        setMessageProcessing(true);
        try {
            await adminService.addKycMessage(Number(id), message);
            setMessage('');
            await fetchKycDetails(); // Reload data
        } catch (e: any) {
            console.error('Failed to send message:', e);
            toastError(e.response?.data?.message || 'Failed to send message');
        } finally {
            setMessageProcessing(false);
        }
    };

    const handleToggleComments = async () => {
        try {
            await adminService.toggleKycComments(Number(id), !user.kyc_comments_enabled);
            await fetchKycDetails(); // Reload data
        } catch (e: any) {
            console.error('Failed to toggle comments:', e);
            toastError(e.response?.data?.message || 'Failed to update settings');
        }
    };

    const openDocumentModal = (documentId: number, action: 'approve' | 'reject') => {
        const document = user.kyc_documents.find((d: any) => d.id === documentId);
        if (document) {
            setDocumentModalOpen(documentId);
            setDocumentAction(action);
            setDocumentRemarks(document.remarks || '');
        }
    };

    const closeDocumentModal = () => {
        setDocumentModalOpen(null);
        setDocumentAction(null);
        setDocumentRemarks('');
    };

    const handleDocumentSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!documentModalOpen || !documentAction) return;
        if (documentAction === 'reject' && !documentRemarks.trim()) {
            toastWarning('Rejection reason is required');
            return;
        }

        setDocumentProcessing(true);
        try {
            await adminService.updateKycDocumentStatus(
                Number(id),
                documentModalOpen,
                documentAction === 'approve' ? 'approved' : 'rejected',
                documentRemarks || undefined
            );
            closeDocumentModal();
            await fetchKycDetails(); // Reload data
        } catch (e: any) {
            console.error('Failed to update document status:', e);
            toastError(e.response?.data?.message || 'Failed to update document status');
        } finally {
            setDocumentProcessing(false);
        }
    };

    const formatTimestamp = (value?: string | null) => {
        if (!value) return '';
        return new Date(value).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        return statusColors[status] || statusColors.pending;
    };

    const selectedDocument = documentModalOpen
        ? user?.kyc_documents.find((d: any) => d.id === documentModalOpen)
        : null;

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <Head title="KYC Review - Error" />
                <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                    <h1 className="text-xl sm:text-2xl font-semibold text-rose-600">Error Loading KYC Details</h1>
                    <p className="mt-2 text-xs sm:text-sm text-slate-500">{error || 'Customer not found'}</p>
                    <Link href="/admin/users" className="mt-4 inline-block rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:px-4 sm:py-2 sm:text-sm">
                        Back to Users
                    </Link>
                </div>
            </div>
        );
    }

    const getFileUrl = (filePath: string) => {
        const { env } = require('@/config/env');
        const cleanBase = env.backendBaseUrl || '';
        return `${cleanBase}/uploads/${filePath}`;
    };

    return (
        <div className="space-y-6 px-1 py-6 sm:px-6 lg:px-8">
            <Head title={`KYC Review - ${user.name}`} />

            {/* Header */}
            <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">KYC Review</h1>
                        <p className="mt-1 text-xs sm:text-sm text-slate-500">Review and verify customer documents</p>
                    </div>
                    <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold sm:px-4 sm:py-1.5 ${
                            kycStatusColors[user.kyc_status] || kycStatusColors.pending
                        }`}
                    >
                        {user.kyc_status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                </div>
            </div>

            {/* Business Information */}
            <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                <h2 className="mb-4 text-base sm:text-lg font-semibold text-slate-900">Business Information</h2>
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                        <div className="space-y-3 sm:space-y-4">
                            <div>
                                <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Customer Name</dt>
                                <dd className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{user.name}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Email</dt>
                                <dd className="mt-1 text-xs sm:text-sm text-slate-700 break-words">{user.email}</dd>
                            </div>
                            {user.phone && (
                                <div>
                                    <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Phone</dt>
                                    <dd className="mt-1 text-xs sm:text-sm text-slate-700">{user.phone}</dd>
                                </div>
                            )}
                            {user.type && (
                                <div>
                                    <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Customer Type</dt>
                                    <dd className="mt-1 text-xs sm:text-sm text-slate-700">{user.type}</dd>
                                </div>
                            )}
                            <div>
                                <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Business Name</dt>
                                <dd className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{user.kyc_profile.business_name ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Website</dt>
                                <dd className="mt-1 text-xs sm:text-sm text-slate-700 break-words">
                                    {user.kyc_profile.business_website ? (
                                        <a
                                            href={user.kyc_profile.business_website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-elvee-blue hover:text-feather-gold break-all"
                                        >
                                            {user.kyc_profile.business_website}
                                        </a>
                                    ) : (
                                        '—'
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">GST Number</dt>
                                <dd className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{user.kyc_profile.gst_number ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">PAN Number</dt>
                                <dd className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{user.kyc_profile.pan_number ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Registration Number</dt>
                                <dd className="mt-1 text-xs sm:text-sm font-semibold text-slate-900">{user.kyc_profile.registration_number ?? '—'}</dd>
                            </div>
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                            <div>
                                <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Contact Person</dt>
                                <dd className="mt-1 text-xs sm:text-sm text-slate-700">{user.kyc_profile.contact_name ?? '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Contact Phone</dt>
                                <dd className="mt-1 text-xs sm:text-sm text-slate-700">{user.kyc_profile.contact_phone ?? '—'}</dd>
                            </div>
                            <div className="md:col-span-2">
                                <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Address</dt>
                                <dd className="mt-1 text-xs sm:text-sm text-slate-700">
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
                            {user.created_at && (
                                <div>
                                    <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Account Created</dt>
                                    <dd className="mt-1 text-xs sm:text-sm text-slate-700">
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
                                    <dt className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Account Updated</dt>
                                    <dd className="mt-1 text-xs sm:text-sm text-slate-700">
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

            {/* Documents Table */}
            <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                <h2 className="mb-4 text-base sm:text-lg font-semibold text-slate-900">Documents</h2>
                {user.kyc_documents.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center text-slate-500">
                        <p className="text-xs sm:text-sm">No documents uploaded yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                            <thead className="border-b-2 border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600 sm:px-4 sm:py-3">Document Type</th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600 sm:px-4 sm:py-3">File</th>
                                    <th className="px-3 py-2 text-center text-[10px] sm:text-xs font-semibold text-slate-600 sm:px-4 sm:py-3 hidden sm:table-cell">Status</th>
                                    <th className="px-3 py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600 sm:px-4 sm:py-3 hidden md:table-cell">Remarks</th>
                                    <th className="px-3 py-2 text-center text-[10px] sm:text-xs font-semibold text-slate-600 sm:px-4 sm:py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {user.kyc_documents.map((document: any) => (
                                    <tr key={document.id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-3 py-3 sm:px-4 sm:py-4">
                                            <span className="font-semibold text-slate-900 text-xs sm:text-sm">{document.type}</span>
                                            <div className="mt-1 sm:hidden">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadge(document.status)}`}
                                                >
                                                    {document.status.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 sm:px-4 sm:py-4">
                                            {document.file_path ? (
                                                <a
                                                    href={getFileUrl(document.file_path)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-elvee-blue hover:text-feather-gold"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:h-3.5 sm:w-3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                    </svg>
                                                    <span className="hidden sm:inline">View Document</span>
                                                    <span className="sm:hidden">View</span>
                                                </a>
                                            ) : (
                                                <span className="text-[10px] sm:text-xs text-slate-400">No file</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-center sm:px-4 sm:py-4 hidden sm:table-cell">
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold sm:px-3 sm:py-1 ${getStatusBadge(document.status)}`}
                                            >
                                                {document.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 sm:px-4 sm:py-4 hidden md:table-cell">
                                            <p className="text-[10px] sm:text-xs text-slate-600">{document.remarks || '—'}</p>
                                        </td>
                                        <td className="px-3 py-3 sm:px-4 sm:py-4">
                                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openDocumentModal(document.id, 'approve')}
                                                    className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100 sm:px-3 sm:py-1.5 sm:text-xs"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:h-3.5 sm:w-3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                    <span className="hidden sm:inline">Approve</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openDocumentModal(document.id, 'reject')}
                                                    className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full border border-rose-300 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 sm:px-3 sm:py-1.5 sm:text-xs"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:h-3.5 sm:w-3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    <span className="hidden sm:inline">Reject</span>
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

            {/* Update KYC Status */}
            <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                <h2 className="mb-4 text-base sm:text-lg font-semibold text-slate-900">Update KYC Status</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">Status</span>
                        <select
                            className="rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-2 text-xs sm:text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">Internal Notes</span>
                        <textarea
                            className="min-h-[100px] rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Add internal notes (optional)"
                        />
                    </label>
                </div>
                {user.kyc_notes && (
                    <div className="mt-4 rounded-xl bg-amber-50 p-3 sm:p-4 text-xs sm:text-sm text-amber-700">
                        <p className="font-semibold text-amber-800">Previous Notes</p>
                        <p className="mt-1 whitespace-pre-line">{user.kyc_notes}</p>
                    </div>
                )}
                <div className="mt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-2 sm:text-sm"
                    >
                        {processing ? 'Saving...' : 'Save Status'}
                    </button>
                </div>
            </form>

            {/* Conversation */}
            <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl ring-1 ring-slate-200/80">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900">Conversation</h2>
                        <p className="mt-1 text-[10px] sm:text-xs text-slate-500">Communicate with the customer about their KYC submission.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleToggleComments}
                        className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 mt-2 sm:mt-0"
                    >
                        {user.kyc_comments_enabled ? 'Disable customer replies' : 'Enable customer replies'}
                    </button>
                </div>

                <div className="mt-4 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-3 sm:p-4 text-xs sm:text-sm text-slate-700 max-h-64">
                    {user.kyc_messages.length === 0 ? (
                        <p className="text-[10px] sm:text-xs text-slate-500">No messages yet. Send a note to start the conversation.</p>
                    ) : (
                        user.kyc_messages.map((msg: any) => {
                            const isAdmin = msg.is_admin;
                            const meta = isAdmin ? 'Compliance team' : user.name;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col gap-1 ${isAdmin ? 'items-end text-right' : 'items-start text-left'}`}
                                >
                                    <span className="text-[10px] sm:text-[11px] text-slate-400">
                                        {meta}
                                        {msg.created_at ? ` · ${formatTimestamp(msg.created_at)}` : ''}
                                    </span>
                                    <div
                                        className={`max-w-full rounded-2xl px-3 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm ${
                                            isAdmin
                                                ? 'bg-slate-900 text-white'
                                                : 'bg-white text-slate-700 shadow ring-1 ring-slate-200/70'
                                        }`}
                                    >
                                        <p className="whitespace-pre-line">{msg.message}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {!user.kyc_comments_enabled && (
                    <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[10px] sm:px-4 sm:py-3 sm:text-xs text-slate-500">
                        Customer replies are disabled. They will still see all messages you send.
                    </p>
                )}

                <form onSubmit={handleSendMessage} className="mt-4 space-y-2">
                    <label className="flex flex-col gap-2 text-[10px] sm:text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Send Message</span>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[90px] rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                            placeholder="Share clarifications, request missing documents, or confirm approval."
                            disabled={messageProcessing}
                        />
                    </label>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={messageProcessing || !message.trim()}
                            className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2 sm:text-xs"
                        >
                            {messageProcessing ? 'Sending…' : 'Send Message'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Document Action Modal */}
            <Modal show={documentModalOpen !== null} maxWidth="2xl" onClose={closeDocumentModal}>
                <div className="flex min-h-0 flex-col">
                    <div className="flex-shrink-0 border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
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
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
                        <form onSubmit={handleDocumentSubmit} className="space-y-4">
                            {selectedDocument && (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Document</p>
                                    <p className="mt-1.5 text-xs sm:text-sm font-semibold text-slate-900">{selectedDocument.type}</p>
                                    {selectedDocument.file_path && (
                                        <a
                                            href={getFileUrl(selectedDocument.file_path)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-elvee-blue hover:text-feather-gold"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:h-3.5 sm:w-3.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                            </svg>
                                            View Document
                                        </a>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-xs sm:text-sm font-semibold text-slate-700">
                                    {documentAction === 'approve' ? 'Approval Comment (Optional)' : 'Rejection Reason (Required)'}
                                </label>
                                <textarea
                                    value={documentRemarks}
                                    onChange={(e) => setDocumentRemarks(e.target.value)}
                                    className="w-full min-h-[120px] rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 px-3 py-2 text-xs sm:px-4 sm:py-2 sm:text-sm"
                                    placeholder={
                                        documentAction === 'approve'
                                            ? 'Add any notes about this approval...'
                                            : 'Explain why this document is being rejected and what needs to be corrected...'
                                    }
                                    required={documentAction === 'reject'}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeDocumentModal}
                                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 sm:px-4 sm:py-2 sm:text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={documentProcessing || (documentAction === 'reject' && !documentRemarks.trim())}
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:py-2 sm:text-sm ${
                                        documentAction === 'approve'
                                            ? 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-500'
                                            : 'bg-rose-600 shadow-rose-600/30 hover:bg-rose-500'
                                    }`}
                                >
                                    {documentProcessing
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
        </div>
    );
}
