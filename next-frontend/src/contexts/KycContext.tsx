'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

interface KycContextType {
    isKycApproved: boolean | null; // null = checking, true = approved, false = not approved
    isLoading: boolean;
    user: any | null;
    checkKycStatus: () => Promise<void>;
}

const KycContext = createContext<KycContextType | undefined>(undefined);

export function KycProvider({ children, initialUser, initialLoading }: { children: ReactNode; initialUser?: any | null; initialLoading?: boolean }) {
    const [isKycApproved, setIsKycApproved] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(initialLoading ?? true);
    const [user, setUser] = useState<any | null>(initialUser ?? null);
    const pathname = usePathname();
    const router = useRouter();

    const checkKycStatus = async () => {
        // Allow access to KYC onboarding page
        if (pathname === '/onboarding/kyc' || pathname.startsWith('/onboarding/kyc')) {
            setIsKycApproved(true);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            
            // Fetch user if not provided
            let currentUser = user;
            if (!currentUser) {
                try {
                    // authService.me() always fetches fresh data and updates localStorage
                    const response = await authService.me();
                    currentUser = response.data;
                    setUser(currentUser);
                    // localStorage (user and auth_token) is already updated in authService.me()
                } catch (e) {
                    // If not authenticated, let auth guard handle it
                    currentUser = null;
                    setUser(null);
                    setIsKycApproved(true); // Let auth guard handle redirect
                    setIsLoading(false);
                    return;
                }
            }

            // Check if user is a customer
            const userType = (currentUser?.type ?? '').toLowerCase();
            const isCustomer = ['retailer', 'wholesaler', 'sales'].includes(userType);

            // Only enforce KYC for customers
            if (!isCustomer) {
                setIsKycApproved(true);
                setIsLoading(false);
                return;
            }

            // Check KYC status
            const kycStatus = currentUser?.kyc_status || currentUser?.kycStatus;
            
            if (kycStatus === 'approved') {
                setIsKycApproved(true);
            } else {
                setIsKycApproved(false);
                // Redirect to KYC page if not already there
                if (pathname !== '/onboarding/kyc' && !pathname.startsWith('/onboarding/kyc')) {
                    router.replace('/onboarding/kyc');
                }
            }
        } catch (error) {
            console.error('Failed to check KYC status:', error);
            setIsKycApproved(false);
            // Redirect to KYC page on error
            if (pathname !== '/onboarding/kyc' && !pathname.startsWith('/onboarding/kyc')) {
                router.replace('/onboarding/kyc');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkKycStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, user]);

    // Update user when initialUser changes
    useEffect(() => {
        if (initialUser !== undefined) {
            setUser(initialUser);
            // Update localStorage atomically - both user and token together
            if (initialUser) {
                // Preserve existing token if user object doesn't have one
                const existingToken = localStorage.getItem("auth_token");
                
                localStorage.setItem('user', JSON.stringify(initialUser));
                
                // Update token if provided in user object, otherwise preserve existing
                if (initialUser.access_token) {
                    localStorage.setItem('auth_token', initialUser.access_token);
                } else if (existingToken) {
                    // Preserve existing token to keep user and token in sync
                    localStorage.setItem('auth_token', existingToken);
                }
            }
        }
    }, [initialUser]);

    return (
        <KycContext.Provider value={{ isKycApproved, isLoading, user, checkKycStatus }}>
            {children}
        </KycContext.Provider>
    );
}

export function useKyc() {
    const context = useContext(KycContext);
    if (context === undefined) {
        // Return a safe default instead of throwing, so it can be used conditionally
        return {
            isKycApproved: true, // Default to approved if no context (for admin pages)
            isLoading: false,
            user: null,
            checkKycStatus: async () => {},
        };
    }
    return context;
}

