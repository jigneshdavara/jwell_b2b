'use client';

import { useLayoutEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/services/authService';

interface KycGuardProps {
    children: React.ReactNode;
    user?: any | null;
    loading?: boolean;
}

export default function KycGuard({ children, user: providedUser, loading: providedLoading }: KycGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any | null>(providedUser ?? null);
    const [loading, setLoading] = useState(providedLoading ?? true);
    const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
    const hasChecked = useRef(false);

    // Use useLayoutEffect to check BEFORE paint - prevents flash
    useLayoutEffect(() => {
        // Reset check flag when pathname changes
        hasChecked.current = false;
        
        // Immediately block rendering if not on onboarding page (will allow after check)
        if (pathname !== '/onboarding/kyc') {
            setIsAllowed(null);
        }

        const checkKycStatus = async () => {
            let currentUser = providedUser;
            let currentLoading = providedLoading;

            // Allow access to KYC onboarding page immediately
            if (pathname === '/onboarding/kyc') {
                setIsAllowed(true);
                hasChecked.current = true;
                return;
            }

            // Fetch user if not provided
            if (providedUser === undefined && !hasChecked.current) {
                currentLoading = true;
                setLoading(true);
                try {
                    const response = await authService.me();
                    currentUser = response.data;
                    setUser(currentUser);
                } catch (e) {
                    // If not authenticated, let AuthenticatedLayout handle redirect
                    currentUser = null;
                    setUser(null);
                } finally {
                    currentLoading = false;
                    setLoading(false);
                }
            } else if (providedUser !== undefined) {
                currentUser = providedUser;
                currentLoading = providedLoading ?? false;
            }

            // Don't check if still loading
            if (currentLoading) {
                setIsAllowed(null); // Keep blocked while loading
                return;
            }

            // If no user, let AuthenticatedLayout handle redirect to login
            if (!currentUser) {
                setIsAllowed(true); // Let auth guard handle it
                hasChecked.current = true;
                return;
            }

            // Check if user is a customer (retailer, wholesaler, sales)
            const userType = (currentUser?.type ?? '').toLowerCase();
            const isCustomer = ['retailer', 'wholesaler', 'sales'].includes(userType);

            // Only enforce KYC for customers
            if (!isCustomer) {
                setIsAllowed(true);
                hasChecked.current = true;
                return;
            }

            // Check KYC status (handle both snake_case and camelCase)
            const kycStatus = currentUser?.kyc_status || currentUser?.kycStatus;
            
            // If KYC is not approved, redirect to onboarding IMMEDIATELY
            if (kycStatus !== 'approved') {
                // Use replace to avoid adding to history stack
                router.replace('/onboarding/kyc');
                setIsAllowed(false); // Block rendering - prevents any API calls
                hasChecked.current = true;
                return;
            }

            // KYC approved, allow access
            setIsAllowed(true);
            hasChecked.current = true;
        };

        checkKycStatus();
    }, [providedUser, providedLoading, pathname, router]);

    // Don't render children until we've checked and confirmed access is allowed
    // This prevents the flash/blink effect - page won't render until check is complete
    if (loading || isAllowed === null || isAllowed === false) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    return <>{children}</>;
}

