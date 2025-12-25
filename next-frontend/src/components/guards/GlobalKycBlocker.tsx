'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { authService } from '@/services/authService';

/**
 * Global component that intercepts all link clicks and navigation
 * to prevent navigation when KYC is not approved
 * This prevents the blink/flash effect by blocking navigation before it happens
 */
export default function GlobalKycBlocker() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Fetch user data from API
    authService.me()
      .then((response) => {
        setUser(response.data);
      })
      .catch(() => {
        // If not authenticated, let auth handle it
        setUser(null);
      });
  }, []);

  useEffect(() => {
    // Helper to check if KYC is approved
    const isKycApproved = (): boolean => {
      if (!user) return true; // No user, let auth handle it

      const userType = (user?.type ?? '').toLowerCase();
      const isCustomer = ['retailer', 'wholesaler', 'sales'].includes(userType);

      // Only enforce KYC for customers
      if (!isCustomer) return true;

      const kycStatus = user?.kyc_status || user?.kycStatus;
      return kycStatus === 'approved';
    };

    // Intercept all link clicks globally
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Find the closest anchor tag
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Allow navigation to KYC page
      if (href === '/onboarding/kyc' || href.startsWith('/onboarding/kyc')) {
        return;
      }

      // Allow external links and mailto/tel links
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      // Check KYC status
      if (!isKycApproved()) {
        // COMPLETELY BLOCK navigation
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Don't navigate at all - stay on current page
        return false;
      }
    };

    // Intercept clicks on the document
    document.addEventListener('click', handleLinkClick, true); // Use capture phase

    // Also intercept popstate (browser back/forward)
    const handlePopState = (e: PopStateEvent) => {
      // Allow if on KYC page
      if (window.location.pathname === '/onboarding/kyc' || 
          window.location.pathname.startsWith('/onboarding/kyc')) {
        return;
      }

      // Check KYC status
      if (!isKycApproved()) {
        // Block back/forward navigation
        e.preventDefault();
        // Push current state back
        window.history.pushState(null, '', window.location.pathname);
        return false;
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, user]);

  return null; // This component doesn't render anything
}

