'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { kycService } from '@/services/kycService';
import { route } from '@/utils/route';
import InputError from '@/components/ui/InputError';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkKycStatus, fetchKycDocuments } from '@/store/slices/kycSlice';
import { toastSuccess, toastError } from '@/utils/toast';
import type { KycDocument, KycProfile, ConversationMessage, KycUser } from '@/types';

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

export default function KycOnboardingPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [user, setUser] = useState<KycUser | null>(null);
    const [profile, setProfile] = useState<KycProfile>({});
    const [documents, setDocuments] = useState<KycDocument[]>([]);
    const [messages, setMessages] = useState<ConversationMessage[]>([]);
    const [documentTypes, setDocumentTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    // Toast notifications are handled via RTK
    
    const [profileData, setProfileData] = useState<KycProfile>({});
    const [documentType, setDocumentType] = useState('gst_certificate');
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [deleteDocumentId, setDeleteDocumentId] = useState<number | string | null>(null);

    const fetchData = async () => {
        try {
            const [onboardingRes, documentTypesRes] = await Promise.all([
                kycService.getOnboardingData(),
                kycService.getDocumentTypes(),
            ]);
            
            const data = onboardingRes.data;
            
            // Map user data from backend response
            const userData = data.user || {};
            setUser({
                id: userData.id || 0,
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || null,
                type: userData.type || null,
                kyc_status: userData.kyc_status || 'pending',
                kyc_notes: userData.kyc_notes || null,
                kyc_comments_enabled: userData.kyc_comments_enabled !== false,
            });
            
            // Map profile data
            const profileData = data.profile || {};
            setProfile(profileData);
            setProfileData({
                business_name: profileData.business_name || '',
                business_website: profileData.business_website || '',
                gst_number: profileData.gst_number || '',
                pan_number: profileData.pan_number || '',
                registration_number: profileData.registration_number || '',
                address_line1: profileData.address_line1 || '',
                address_line2: profileData.address_line2 || '',
                city: profileData.city || '',
                state: profileData.state || '',
                postal_code: profileData.postal_code || '',
                country: profileData.country || 'India',
                contact_name: profileData.contact_name || userData.name || '',
                contact_phone: profileData.contact_phone || userData.phone || '',
            });
            
            // Map documents - use correct API URL
            const docs = data.documents || [];
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            setDocuments(docs.map((doc: any) => ({
                id: doc.id,
                type: doc.type,
                status: doc.status || 'pending',
                remarks: doc.remarks || null,
                file_path: doc.file_path || null,
                url: doc.url ? `${apiBaseUrl}${doc.url}` : null,
                download_url: doc.download_url ? `${apiBaseUrl}${doc.download_url}` : null,
                created_at: doc.created_at || null,
                uploaded_at: doc.uploaded_at || doc.created_at || null,
            })));
            
            // Map messages
            const msgs = data.messages || [];
            setMessages(msgs.map((msg: any) => ({
                id: msg.id,
                sender_type: msg.sender_type || 'customer',
                message: msg.message,
                created_at: msg.created_at || null,
                users: msg.admin || null,
            })));
            
            setDocumentTypes(documentTypesRes.data?.documentTypes || data.documentTypes || []);
        } catch (e: any) {
            console.error('Failed to fetch KYC data:', e);
            // Only show error if it's not a 403 (KYC not approved) or 401 (unauthorized)
            // These are handled by guards/middleware, don't show error on refresh
            if (e.response?.status !== 403 && e.response?.status !== 401) {
                toastError(e.response?.data?.message || 'Failed to load KYC data');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleProfileSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        try {
            await kycService.updateProfile(profileData);
            toastSuccess('Profile updated successfully');
            await fetchData();
            // Refresh KYC state in RTK
            dispatch(checkKycStatus());
        } catch (error: any) {
            const errorData = error.response?.data;
            if (errorData?.errors) {
                setErrors(errorData.errors);
            } else {
                toastError(errorData?.message || 'Failed to update profile');
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleFileUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!documentFile) return;
        setProcessing(true);
        setErrors({});
        try {
            await kycService.uploadDocument(documentType, documentFile);
            setDocumentFile(null);
            const input = document.getElementById('document_file') as HTMLInputElement;
            if (input) input.value = '';
            toastSuccess('Document uploaded successfully');
            await fetchData();
            // Refresh KYC state in RTK
            dispatch(checkKycStatus());
        } catch (error: any) {
            const errorData = error.response?.data;
            if (errorData?.errors) {
                setErrors(errorData.errors);
            } else {
                toastError(errorData?.message || 'Failed to upload document');
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user?.kyc_comments_enabled) return;
        setProcessing(true);
        try {
            await kycService.addMessage(newMessage);
            setNewMessage('');
            toastSuccess('Message sent successfully');
            await fetchData();
            // Refresh KYC state in RTK
            dispatch(checkKycStatus());
        } catch (e: any) {
            console.error('Failed to send message:', e);
            toastError(e.response?.data?.message || 'Failed to send message');
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteDocument = (documentId: number | string) => {
        setDeleteDocumentId(documentId);
    };

    const confirmDeleteDocument = async () => {
        if (!deleteDocumentId) return;
        try {
            await kycService.deleteDocument(Number(deleteDocumentId));
            toastSuccess('Document deleted successfully');
            setDeleteDocumentId(null);
            await fetchData();
            // Refresh KYC state in RTK
            dispatch(checkKycStatus());
        } catch (e: any) {
            console.error('Failed to delete document:', e);
            toastError(e.response?.data?.message || 'Failed to delete document');
        }
    };

    const handleDownloadDocument = async (documentId: number | string) => {
        try {
            const blob = await kycService.downloadDocument(documentId);
            // Get the document to determine filename
            const doc = documents.find((d) => d.id === documentId);
            
            // Determine file extension from blob type or file_path
            let extension = 'pdf'; // default
            if (doc?.file_path) {
                const match = doc.file_path.match(/\.(pdf|png|jpg|jpeg)$/i);
                if (match) {
                    extension = match[1].toLowerCase();
                }
            } else if (blob.type) {
                if (blob.type.includes('pdf')) extension = 'pdf';
                else if (blob.type.includes('png')) extension = 'png';
                else if (blob.type.includes('jpeg') || blob.type.includes('jpg')) extension = 'jpg';
            }
            
            const filename = doc 
                ? `${doc.type}-${documentId}.${extension}`
                : `document-${documentId}.${extension}`;
            
            // Create a temporary URL for the blob
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e: any) {
            console.error('Failed to download document:', e);
            toastError(e.response?.data?.message || 'Failed to download document');
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

    if (loading || !user) {
        return (
            <div className="flex justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    const statusInfo = statusLabels[user.kyc_status] ?? statusLabels.pending;
    const documentStatusTheme: Record<string, string> = {
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-rose-100 text-rose-700',
        needs_revision: 'bg-amber-100 text-amber-700',
        pending: 'bg-slate-100 text-slate-700',
    };
    const isApproved = user.kyc_status === 'approved';

    return (
        <div className="w-full space-y-6 sm:space-y-8">

            <section className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-4 text-white shadow-2xl sm:rounded-3xl sm:p-6 lg:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_40%),_radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.25),_transparent_45%)]" />
                <div className="relative z-10 flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-[10px] text-white/70 sm:text-xs">Elvee onboarding</p>
                        <h1 className="mt-1.5 text-xl font-semibold sm:mt-2 sm:text-2xl lg:text-3xl">KYC verification status</h1>
                        <p className="mt-2 max-w-2xl text-xs text-white/80 sm:mt-3 sm:text-sm">{statusInfo.description}</p>
                        {user.kyc_notes && (
                            <div className="mt-3 rounded-xl bg-white/10 p-3 text-xs text-amber-200 sm:mt-4 sm:rounded-2xl sm:p-4 sm:text-sm">
                                <p className="font-semibold text-amber-300">Reviewer notes</p>
                                <p className="mt-1.5 whitespace-pre-line sm:mt-2">{user.kyc_notes}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:gap-3 lg:items-end">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-semibold sm:px-4 sm:text-xs ${statusInfo.badge}`}>
                            {user.kyc_status === 'review' ? 'needs attention' : user.kyc_status}
                        </span>
                        {isApproved ? (
                            <button
                                onClick={() => router.push(route('frontend.dashboard'))}
                                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-lg shadow-slate-900/20 transition active:scale-[0.98] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                            >
                                Go to dashboard
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <span className="text-[10px] text-white/70 sm:text-xs">Access unlocks after approval</span>
                        )}
                    </div>
                </div>
            </section>

            <section className="grid w-full gap-6 sm:gap-8 lg:grid-cols-[1.4fr_1fr]">
                <div className="w-full space-y-6 sm:space-y-8">
                    <form
                        onSubmit={handleProfileSubmit}
                        className="w-full space-y-4 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:space-y-5 sm:p-6"
                    >
                        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Business profile</h2>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
                            >
                                {processing ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                        <div className="grid w-full grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                            <label className="flex w-full flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>Business / store name</span>
                                <input
                                    type="text"
                                    value={profileData.business_name || ''}
                                    onChange={(e) => setProfileData({...profileData, business_name: e.target.value})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                    required
                                />
                                <InputError message={errors.business_name} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>Website</span>
                                <input
                                    type="text"
                                    value={profileData.business_website || ''}
                                    onChange={(e) => setProfileData({...profileData, business_website: e.target.value})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                    placeholder="https://example.com"
                                />
                                <InputError message={errors.business_website} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>GST number</span>
                                <input
                                    type="text"
                                    value={profileData.gst_number || ''}
                                    onChange={(e) => setProfileData({...profileData, gst_number: e.target.value.toUpperCase()})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                    placeholder="Optional"
                                />
                                <InputError message={errors.gst_number} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>PAN</span>
                                <input
                                    type="text"
                                    value={profileData.pan_number || ''}
                                    onChange={(e) => setProfileData({...profileData, pan_number: e.target.value.toUpperCase()})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                    placeholder="Optional"
                                />
                                <InputError message={errors.pan_number} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>Registration number</span>
                                <input
                                    type="text"
                                    value={profileData.registration_number || ''}
                                    onChange={(e) => setProfileData({...profileData, registration_number: e.target.value})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                    placeholder="MSME / CIN"
                                />
                                <InputError message={errors.registration_number} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>Contact person</span>
                                <input
                                    type="text"
                                    value={profileData.contact_name || ''}
                                    onChange={(e) => setProfileData({...profileData, contact_name: e.target.value})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                />
                                <InputError message={errors.contact_name} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>Contact phone</span>
                                <input
                                    type="text"
                                    value={profileData.contact_phone || ''}
                                    onChange={(e) => setProfileData({...profileData, contact_phone: e.target.value})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                />
                                <InputError message={errors.contact_phone} />
                            </label>
                        </div>
                        <div className="grid w-full grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                            <label className="flex w-full flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>Address line 1</span>
                                <input
                                    type="text"
                                    value={profileData.address_line1 || ''}
                                    onChange={(e) => setProfileData({...profileData, address_line1: e.target.value})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                />
                                <InputError message={errors.address_line1} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>Address line 2</span>
                                <input
                                    type="text"
                                    value={profileData.address_line2 || ''}
                                    onChange={(e) => setProfileData({...profileData, address_line2: e.target.value})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                />
                                <InputError message={errors.address_line2} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>City</span>
                                <input
                                    type="text"
                                    value={profileData.city || ''}
                                    onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                />
                                <InputError message={errors.city} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>State</span>
                                <input
                                    type="text"
                                    value={profileData.state || ''}
                                    onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                />
                                <InputError message={errors.state} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>Postal code</span>
                                <input
                                    type="text"
                                    value={profileData.postal_code || ''}
                                    onChange={(e) => setProfileData({...profileData, postal_code: e.target.value})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                />
                                <InputError message={errors.postal_code} />
                            </label>
                            <label className="flex flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>Country</span>
                                <input
                                    type="text"
                                    value={profileData.country || 'India'}
                                    onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                />
                                <InputError message={errors.country} />
                            </label>
                        </div>
                    </form>

                    <form
                        onSubmit={handleFileUpload}
                        className="w-full space-y-4 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:space-y-5 sm:p-6"
                    >
                        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Upload supporting documents</h2>
                            <button
                                type="submit"
                                disabled={processing || !documentFile}
                                className="w-full rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
                            >
                                {processing ? 'Uploading…' : 'Upload'}
                            </button>
                        </div>
                        <div className="grid w-full grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                            <label className="flex w-full flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>Document type</span>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm capitalize text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                >
                                    {documentTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.document_type} />
                            </label>
                            <label className="flex w-full flex-col gap-1 text-xs text-slate-600 sm:text-sm">
                                <span>Attachment (PDF/JPG/PNG, max 8MB)</span>
                                <input
                                    id="document_file"
                                    type="file"
                                    accept="application/pdf,image/jpeg,image/png"
                                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:px-4"
                                    required
                                />
                                <InputError message={errors.document_file} />
                            </label>
                        </div>
                    </form>
                </div>

                <aside className="w-full space-y-4 sm:space-y-6">
                    <div className="w-full rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                        <h3 className="text-sm font-semibold text-slate-900">Messages from compliance</h3>
                        <p className="mt-1.5 text-xs text-slate-500 sm:mt-2">
                            Track clarifications sent by the compliance desk. Respond when you have the requested information.
                        </p>
                        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700 sm:mt-4 sm:space-y-3 sm:rounded-2xl sm:p-4 sm:text-sm">
                            {messages.length === 0 ? (
                                <p className="text-xs text-slate-500">No messages yet. Compliance will reach out if anything is pending.</p>
                            ) : (
                                messages.map((message) => {
                                    const isAdmin = message.sender_type === 'admin';
                                    return (
                                        <div
                                            key={String(message.id)}
                                            className={`flex flex-col gap-1 ${isAdmin ? 'items-start text-left' : 'items-end text-right'}`}
                                        >
                                            <span className="text-[10px] text-slate-400 sm:text-[11px]">
                                                {isAdmin ? (message.users?.name || 'Compliance team') : 'You'}
                                                {message.created_at ? ` · ${formatTimestamp(message.created_at)}` : ''}
                                            </span>
                                            <div
                                                className={`max-w-full rounded-xl px-3 py-2 text-xs ${
                                                    isAdmin
                                                        ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-200'
                                                        : 'bg-slate-900 text-white'
                                                } sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm`}
                                            >
                                                <p className="whitespace-pre-line">{message.message}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        {!user.kyc_comments_enabled && (
                            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500 sm:rounded-2xl sm:px-4 sm:py-3">
                                Replies are disabled by the compliance team. You can still review their updates above.
                            </p>
                        )}
                        {user.kyc_comments_enabled && (
                            <form onSubmit={handleSendMessage} className="mt-3 space-y-2 sm:mt-4">
                                <label className="flex flex-col gap-1.5 text-xs text-slate-600 sm:gap-2">
                                    <span className="font-semibold text-slate-700">Send a reply</span>
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="w-full min-h-[80px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:min-h-[90px] sm:px-4"
                                        placeholder="Share the update or clarification you have for the compliance team."
                                        disabled={processing}
                                    />
                                    <InputError message={errors.message} />
                                </label>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing || !newMessage.trim()}
                                        className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow shadow-slate-900/20 transition hover:bg-slate-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-2"
                                    >
                                        {processing ? 'Sending…' : 'Send message'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="w-full rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                        <h3 className="text-sm font-semibold text-slate-700">Submitted documents</h3>
                        <div className="mt-3 space-y-2 text-xs sm:mt-4 sm:space-y-3 sm:text-sm">
                            {documents.length === 0 && (
                                <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 sm:rounded-2xl sm:p-4 sm:text-sm">
                                    Upload your GST, PAN, trade license or store photos to speed up verification.
                                </p>
                            )}
                            {documents.map((document) => (
                                <div
                                    key={String(document.id)}
                                    className="rounded-xl border border-slate-200 p-3 shadow-sm sm:rounded-2xl sm:p-4"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-800 sm:text-sm">
                                                {document.type.replace(/_/g, ' ')}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">
                                                Uploaded {document.uploaded_at ? formatTimestamp(document.uploaded_at) : 'recently'}
                                            </p>
                                        </div>
                                        <span
                                            className={`mt-1.5 w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize sm:mt-0 sm:px-3 sm:py-1 sm:text-xs ${
                                                documentStatusTheme[document.status] ?? documentStatusTheme.pending
                                            }`}
                                        >
                                            {document.status}
                                        </span>
                                    </div>
                                    {document.remarks && (
                                        <p className="mt-2 text-xs text-rose-500">Remarks: {document.remarks}</p>
                                    )}
                                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-semibold sm:mt-3 sm:gap-3">
                                        {document.url && (
                                            <a
                                                href={document.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sky-600 transition hover:text-sky-500 active:scale-[0.98]"
                                            >
                                                View file
                                            </a>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadDocument(document.id)}
                                            className="text-slate-500 transition hover:text-slate-700 active:scale-[0.98]"
                                        >
                                            Download
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDocument(document.id)}
                                            className="text-rose-500 transition hover:text-rose-600 active:scale-[0.98]"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                        <h3 className="text-sm font-semibold text-slate-500">Need help?</h3>
                        <p className="mt-2 text-xs text-slate-600 sm:mt-3 sm:text-sm">
                            Write to <a href="mailto:compliance@elvee.in" className="font-semibold text-sky-600 transition hover:text-sky-500">compliance@elvee.in</a>{' '}
                            for expedited verification or assistance with additional paperwork.
                        </p>
                    </div>
                </aside>
            </section>

            <ConfirmationModal
                show={deleteDocumentId !== null}
                onClose={() => setDeleteDocumentId(null)}
                onConfirm={confirmDeleteDocument}
                title="Delete Document"
                message="Are you sure you want to delete this document? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
