'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { kycService } from '@/services/kycService';
import Link from 'next/link';

export default function AdminKycReviewPage() {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [remarks, setRemarks] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // In a real app, you would fetch the user's KYC details here
        // For now, using mock or fetching from service if possible
        const fetchKycDetails = async () => {
            try {
                // Assuming we can fetch by ID
                const response = await kycService.getProfile(); // Mocking with current user profile for now
                setUser({
                    id,
                    name: 'Diamond Partner',
                    email: 'partner@example.com',
                    kyc_status: 'pending',
                    kyc_status_label: 'Pending',
                    kyc_profile: response.data,
                    kyc_documents: [],
                });
                setStatus('pending');
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchKycDetails();
    }, [id]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await kycService.updateStatus(id as string, status, remarks);
            alert('KYC status updated');
            router.refresh();
        } catch (e) {
            alert('Failed to update status');
        } finally {
            setProcessing(false);
        }
    };

    if (loading || !user) return <div className="flex justify-center py-20"><div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" /></div>;

    return (
        <div className="space-y-6">
            <header className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold">KYC Review - {user.name}</h1>
                    <p className="text-sm text-slate-500">Review and verify customer documents</p>
                </div>
                <Link href="/admin/dashboard" className="border px-4 py-2 rounded-full text-sm font-semibold">Back</Link>
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80 space-y-4">
                    <h2 className="text-lg font-semibold">Business Information</h2>
                    <div className="space-y-2 text-sm">
                        <p><strong>Business Name:</strong> {user.kyc_profile?.business_name}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>GST:</strong> {user.kyc_profile?.gst_number || 'N/A'}</p>
                        <p><strong>PAN:</strong> {user.kyc_profile?.pan_number || 'N/A'}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80 space-y-4">
                    <h2 className="text-lg font-semibold">Update Status</h2>
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-xl border px-4 py-2">
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="review">Review Required</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Remarks</label>
                        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full rounded-xl border px-4 py-2" placeholder="Internal notes..." />
                    </div>
                    <button type="submit" disabled={processing} className="bg-elvee-blue text-white px-6 py-2 rounded-full font-semibold">Save Status</button>
                </form>
            </div>
        </div>
    );
}

