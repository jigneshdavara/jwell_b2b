'use client';

import PrimaryButton from '@/components/ui/PrimaryButton';
import GuestLayout from '@/components/shared/GuestLayout';
import { FormEvent, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    // Fetch authenticated user's email
    useEffect(() => {
        const fetchUserEmail = async () => {
            try {
                const response = await authService.me();
                setUserEmail(response.data?.email || null);
            } catch (error) {
                // If not authenticated, redirect to login
                router.push('/login');
            }
        };
        fetchUserEmail();
    }, [router]);

    // Check for error query parameter (from verification link page)
    useEffect(() => {
        const error = searchParams.get('error');
        if (error) {
            setStatus(decodeURIComponent(error));
        }
    }, [searchParams]);

    const handleResend = async (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setStatus(null);

        if (!userEmail) {
            setStatus('Unable to determine your email address. Please log in again.');
            setProcessing(false);
            return;
        }

        try {
            const response = await authService.resendVerification(userEmail);
            setStatus(
                response.data?.message ||
                    'A new verification link has been sent to the email address you provided during registration.',
            );
        } catch (error: any) {
            setStatus(
                error.response?.data?.message ||
                    'Failed to send verification email.',
            );
        } finally {
            setProcessing(false);
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        router.push('/');
    };

    if (!userEmail) {
        return (
            <GuestLayout>
                <div className="flex justify-center py-20">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
                </div>
            </GuestLayout>
        );
    }

    return (
        <GuestLayout>
            <div className="mx-auto max-w-md space-y-6 rounded-3xl bg-white p-8 shadow-2xl shadow-elvee-blue/5 ring-1 ring-elvee-blue/10">
                <div className="mb-4 text-sm text-slate-600">
                    Thanks for signing up! Before getting started, could you verify
                    your email address by clicking on the link we just emailed to
                    you? If you didn&apos;t receive the email, we will gladly send you
                    another.
                </div>

                {status && (
                    <div
                        className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
                            status.includes('sent') ||
                            status.includes('verified') ||
                            status.includes('success')
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                : 'border-rose-200 bg-rose-50 text-rose-900'
                        }`}
                    >
                        {status}
                    </div>
                )}

                <form onSubmit={handleResend}>
                    <div className="mt-4 flex items-center justify-between">
                        <PrimaryButton disabled={processing}>
                            {processing ? 'Sending...' : 'Resend Verification Email'}
                        </PrimaryButton>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-md text-sm text-slate-600 underline hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-elvee-blue focus:ring-offset-2"
                        >
                            Log Out
                        </button>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}

