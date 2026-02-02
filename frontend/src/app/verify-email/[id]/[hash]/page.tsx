'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/services/authService';
import GuestLayout from '@/components/shared/GuestLayout';

export default function VerifyEmailLinkPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const hash = params?.hash as string;

    useEffect(() => {
        const handleVerifyEmail = async () => {
            if (!id || !hash) {
                router.push('/verify-email');
                return;
            }

            try {
                const response = await authService.verifyEmail(id, hash);
                // Redirect to login with success message
                router.push('/login?verified=1');
            } catch (error: any) {
                // Redirect to verify-email page with error
                router.push('/verify-email?error=' + encodeURIComponent(
                    error.response?.data?.message ||
                        'Invalid or expired verification link.'
                ));
            }
        };

        handleVerifyEmail();
    }, [id, hash, router]);

    return (
        <GuestLayout>
            <div className="flex justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        </GuestLayout>
    );
}

