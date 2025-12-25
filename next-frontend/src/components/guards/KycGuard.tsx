'use client';

import { useLayoutEffect, useState, useRef, useEffect } from 'react';
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
    const redirectingRef = useRef(false);

    // Helper function to check if KYC is approved
    const checkKycApproval = (currentUser: any): boolean => {
        if (!currentUser) return true; // Let auth handle it

        // Check if user is a customer (retailer, wholesaler, sales)
        const userType = (currentUser?.type ?? '').toLowerCase();
        const isCustomer = ['retailer', 'wholesaler', 'sales'].includes(userType);

        // Only enforce KYC for customers
        if (!isCustomer) return true;

        // Check KYC status (handle both snake_case and camelCase)
        const kycStatus = currentUser?.kyc_status || currentUser?.kycStatus;
        return kycStatus === 'approved';
    };

    // Monitor route changes - fetch fresh data only if needed
    useEffect(() => {
        // Only fetch fresh data if we've already checked and user is approved
        // This prevents duplicate calls on initial load
        if (hasChecked.current && pathname && pathname !== '/onboarding/kyc' && !pathname.startsWith('/onboarding/kyc')) {
            // Fetch fresh user data to check latest KYC status (background refresh)
            authService.me()
                .then((response) => {
                    const freshUser = response.data;
                    setUser(freshUser);
                    const isApproved = checkKycApproval(freshUser);
                    if (!isApproved) {
                        // Block rendering if not approved
                        setIsAllowed(false);
                        if (!redirectingRef.current) {
                            redirectingRef.current = true;
                            router.replace('/onboarding/kyc');
                        }
                    } else {
                        // KYC is approved - ensure access is allowed
                        setIsAllowed(true);
                    }
                })
                .catch(() => {
                    // If error, don't block - might be network issue
                    // Keep current state
                });
        }
    }, [pathname, router]);

    // Use useLayoutEffect to check BEFORE paint - prevents flash
    useLayoutEffect(() => {
        // Reset check flag when pathname changes
        hasChecked.current = false;
        redirectingRef.current = false;

        const checkKycStatus = async () => {
            let currentUser = providedUser;
            let currentLoading = providedLoading;

            // Allow access to KYC onboarding page immediately
            if (pathname === '/onboarding/kyc' || pathname.startsWith('/onboarding/kyc')) {
                setIsAllowed(true);
                hasChecked.current = true;
                setLoading(false);
                return;
            }

            // If user is provided from parent, use it immediately
            if (providedUser !== undefined) {
                currentUser = providedUser;
                currentLoading = providedLoading ?? false;
                
                // If we have user data, we can check KYC immediately (don't wait for loading)
                if (currentUser) {
                    setLoading(false); // Stop loading since we have user data
                    currentLoading = false;
                } else if (!currentLoading) {
                    // No user and not loading - parent finished but no user
                    setLoading(false);
                }
                
                // Continue to KYC check below (don't return early)
            }

            // If we don't have user data yet, fetch it
            if (!currentUser && providedUser === undefined && !hasChecked.current) {
                // Immediately block rendering if not on onboarding page (will allow after check)
                if (pathname !== '/onboarding/kyc') {
                    setIsAllowed(null);
                }
                
                currentLoading = true;
                setLoading(true);
                try {
                    // authService.me() always fetches fresh data from API (no localStorage)
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
            } else if (!currentUser && pathname !== '/onboarding/kyc') {
                // No user and not on KYC page - block rendering
                setIsAllowed(null);
            }

            // If we have user data, check KYC immediately (don't wait for loading to finish)
            // This prevents loader from showing when user data is already available
            if (currentUser) {
                // Check KYC approval
                const isApproved = checkKycApproval(currentUser);
                
                // If KYC is not approved, block rendering and redirect ONLY if not already on KYC page
                if (!isApproved) {
                    setIsAllowed(false); // Block rendering - prevents any API calls
                    hasChecked.current = true;
                    setLoading(false); // Stop loading since we have result
                    
                    // Only redirect if not already on KYC page (prevents unnecessary navigation)
                    if (pathname !== '/onboarding/kyc' && !pathname.startsWith('/onboarding/kyc')) {
                        if (!redirectingRef.current) {
                            redirectingRef.current = true;
                            // Use replace to avoid adding to history stack
                            router.replace('/onboarding/kyc');
                        }
                    }
                    return;
                }

                // KYC approved, allow access immediately
                setIsAllowed(true);
                hasChecked.current = true;
                setLoading(false); // Stop loading since we have result
                return;
            }

            // Don't check if still loading AND we don't have user data yet
            if (currentLoading && !currentUser) {
                setIsAllowed(null); // Keep blocked while loading
                return;
            }

            // If no user and not loading, let AuthenticatedLayout handle redirect to login
            if (!currentUser) {
                setIsAllowed(true); // Let auth guard handle it
                hasChecked.current = true;
                setLoading(false);
                return;
            }
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

