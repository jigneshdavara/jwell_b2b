'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { selectUser, selectIsKycApproved, selectIsCustomer } from '@/store/selectors/authSelectors';

/**
 * When KYC is pending, ONLY /onboarding/kyc is accessible - block ALL other internal navigation
 * Uses Redux for synchronous KYC check - no async delay, blocks immediately
 */
export default function GlobalKycBlocker() {
  const pathname = usePathname();
  const user = useSelector((state: RootState) => selectUser(state));
  const isKycApproved = useSelector((state: RootState) => selectIsKycApproved(state));
  const isCustomer = useSelector((state: RootState) => selectIsCustomer(state));

  useEffect(() => {
    // Helper to check if KYC is approved - use Redux state (synchronous)
    const isKycApprovedCheck = (): boolean => {
      if (!user) return true; // No user, let auth handle it
      if (!isCustomer) return true; // Only enforce for customers
      return isKycApproved;
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

      // Allow KYC document view/download links (storage URLs and download endpoints)
      if (href.includes('/storage/kyc/') || 
          href.includes('/onboarding/kyc/documents/') ||
          href.includes('/api/onboarding/kyc/documents/')) {
        return;
      }

      // When KYC is pending, block ALL internal navigation except /onboarding/kyc (already allowed above)
      if (!isKycApprovedCheck()) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    // Intercept clicks on the document
    document.addEventListener('click', handleLinkClick, true); // Use capture phase

    // Intercept popstate (browser back/forward) - redirect to KYC if user navigated to any blocked path
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/onboarding/kyc' || currentPath.startsWith('/onboarding/kyc')) {
        return;
      }
      if (!isKycApprovedCheck()) {
        window.location.replace('/onboarding/kyc');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, user, isKycApproved, isCustomer]);

  return null; // This component doesn't render anything
}

