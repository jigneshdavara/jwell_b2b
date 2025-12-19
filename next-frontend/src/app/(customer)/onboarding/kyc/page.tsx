'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { kycService } from '@/services/kycService';
import { authService } from '@/services/authService';
import InputError from '@/components/ui/InputError';
import { route } from '@/utils/route';

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
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>({});
    const [documents, setDocuments] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [profileData, setProfileData] = useState<any>({});
    const [documentType, setDocumentType] = useState('gst_certificate');
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchData = async () => {
        try {
            const [userRes, profileRes, docsRes, msgsRes] = await Promise.all([
                authService.me(),
                kycService.getProfile(),
                kycService.getDocuments(),
                kycService.getMessages(),
            ]);
            setUser(userRes.data);
            setProfile(profileRes.data);
            setDocuments(docsRes.data);
            setMessages(msgsRes.data);
            setProfileData(profileRes.data);
        } catch (e) {
            console.error(e);
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
        try {
            await kycService.updateProfile(profileData);
            alert('Profile updated successfully');
        } catch (error: any) {
            setErrors(error.response?.data?.errors || {});
        } finally {
            setProcessing(false);
        }
    };

    const handleFileUpload = async (e: FormEvent) => {
        e.preventDefault();
        if (!documentFile) return;
        setProcessing(true);
        try {
            await kycService.uploadDocument(documentType, documentFile);
            setDocumentFile(null);
            const input = document.getElementById('document_file') as HTMLInputElement;
            if (input) input.value = '';
            fetchData();
        } catch (error: any) {
            alert('Upload failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setProcessing(true);
        try {
            await kycService.addMessage(newMessage);
            setNewMessage('');
            fetchData();
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(false);
        }
    };

    if (loading || !user) return <div className="flex justify-center py-20"><div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" /></div>;

    const statusInfo = statusLabels[user.kyc_status] ?? statusLabels.pending;

    return (
        <div className="space-y-8">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white shadow-2xl">
                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold">KYC verification status</h1>
                        <p className="mt-3 max-w-2xl text-sm text-white/80">{statusInfo.description}</p>
                    </div>
                    <div className="flex flex-col items-start gap-3 lg:items-end">
                        <span className={`rounded-full px-4 py-1 text-xs font-semibold ${statusInfo.badge}`}>
                            {user.kyc_status}
                        </span>
                        {user.kyc_status === 'approved' && (
                            <button onClick={() => router.push(route('dashboard'))} className="bg-white text-slate-900 px-4 py-2 rounded-full font-semibold text-sm">Go to dashboard</button>
                        )}
                    </div>
                </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-8">
                    <form onSubmit={handleProfileSubmit} className="space-y-5 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                        <h2 className="text-lg font-semibold">Business profile</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <input type="text" value={profileData.business_name || ''} onChange={e => setProfileData({...profileData, business_name: e.target.value})} className="rounded-xl border px-4 py-2" placeholder="Business Name" required />
                            <input type="text" value={profileData.business_website || ''} onChange={e => setProfileData({...profileData, business_website: e.target.value})} className="rounded-xl border px-4 py-2" placeholder="Website" />
                        </div>
                        <button type="submit" disabled={processing} className="bg-elvee-blue text-white px-6 py-2 rounded-full font-semibold">Save changes</button>
                    </form>

                    <form onSubmit={handleFileUpload} className="space-y-5 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                        <h2 className="text-lg font-semibold">Upload documents</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <select value={documentType} onChange={e => setDocumentType(e.target.value)} className="rounded-xl border px-4 py-2">
                                <option value="gst_certificate">GST Certificate</option>
                                <option value="pan_card">PAN Card</option>
                            </select>
                            <input id="document_file" type="file" onChange={e => setDocumentFile(e.target.files?.[0] || null)} className="rounded-xl border px-4 py-2" required />
                        </div>
                        <button type="submit" disabled={processing} className="bg-elvee-blue text-white px-6 py-2 rounded-full font-semibold">Upload</button>
                    </form>
                </div>

                <aside className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                        <h3 className="font-semibold mb-4">Messages from compliance</h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto mb-4 bg-slate-50 p-4 rounded-xl">
                            {messages.map(m => (
                                <div key={m.id} className={`p-3 rounded-xl ${m.sender_type === 'admin' ? 'bg-sky-100' : 'bg-slate-900 text-white'}`}>
                                    <p className="text-sm">{m.message}</p>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 border rounded-xl px-4 py-2" placeholder="Reply..." />
                            <button type="submit" disabled={processing} className="bg-elvee-blue text-white px-4 py-2 rounded-xl">Send</button>
                        </form>
                    </div>
                </aside>
            </div>
        </div>
    );
}

