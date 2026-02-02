'use client';

import { useRouter as useNextRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { authService } from '@/services/authService';

/**
 * Custom router hook that respects KYC status
 * Blocks navigation when KYC is not approved
 */
export function useKycRouter() {
  const router = useNextRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Fetch user data from API
    authService.me()
      .then((response) => {
        setUser(response.data);
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  // Helper to check if KYC is approved
  const isKycApproved = useCallback((): boolean => {
    if (!user) return true; // No user, let auth handle it

    const userType = (user?.type ?? '').toLowerCase();
    const isCustomer = ['retailer', 'wholesaler', 'sales'].includes(userType);

    // Only enforce KYC for customers
    if (!isCustomer) return true;

    const kycStatus = user?.kyc_status || user?.kycStatus;
    return kycStatus === 'approved';
  }, [user]);

  // Wrapped push that checks KYC
  const push = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      // Allow navigation to KYC page
      if (href === '/onboarding/kyc' || href.startsWith('/onboarding/kyc')) {
        return router.push(href, options);
      }

      // Check KYC before navigation
      if (!isKycApproved()) {
        // Block navigation completely - don't navigate at all
        console.warn('Navigation blocked: KYC approval required');
        return;
      }

      return router.push(href, options);
    },
    [router, isKycApproved]
  );

  // Wrapped replace that checks KYC
  const replace = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      // Allow navigation to KYC page
      if (href === '/onboarding/kyc' || href.startsWith('/onboarding/kyc')) {
        return router.replace(href, options);
      }

      // Check KYC before navigation
      if (!isKycApproved()) {
        // Block navigation completely - don't navigate at all
        console.warn('Navigation blocked: KYC approval required');
        return;
      }

      return router.replace(href, options);
    },
    [router, isKycApproved]
  );

  return {
    ...router,
    push,
    replace,
  };
}

