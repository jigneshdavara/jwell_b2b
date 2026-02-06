'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { selectUser, selectIsKycApproved, selectIsCustomer } from '@/store/selectors/authSelectors';

/**
 * Global navigation guard - handles both:
 * 1. KYC: When pending, ONLY /onboarding/kyc accessible for customers
 * 2. Role: Cross-panel blocking - admin/customer/production can only access their panel routes
 */
export default function GlobalKycBlocker() {
  const pathname = usePathname();
  const user = useSelector((state: RootState) => selectUser(state));
  const isKycApproved = useSelector((state: RootState) => selectIsKycApproved(state));
  const isCustomer = useSelector((state: RootState) => selectIsCustomer(state));

  useEffect(() => {
    const isKycApprovedCheck = (): boolean => {
      if (!user) return true;
      if (!isCustomer) return true;
      return isKycApproved;
    };

    const isAdminPath = (path: string) => path.startsWith('/admin');
    const isProductionPath = (path: string) => path.startsWith('/production');
    const isCustomerPath = (path: string) =>
      !isAdminPath(path) && !isProductionPath(path) && path !== '/' &&
      !path.startsWith('/login') && !path.startsWith('/register') &&
      !path.startsWith('/forgot-password') && !path.startsWith('/reset-password') &&
      !path.startsWith('/verify-email') && !path.startsWith('/confirm-password');

    const handleLinkClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const pathToCheck = href.split('?')[0];

      // Allow KYC document view/download links
      if (href.includes('/storage/kyc/') || href.includes('/onboarding/kyc/documents/') || href.includes('/api/onboarding/kyc/documents/')) {
        return;
      }

      if (user) {
        const userType = (user?.type ?? '').toLowerCase();
        const isAdmin = ['admin', 'super-admin'].includes(userType);
        const isProd = userType === 'production';

        // Role-based: block cross-panel navigation
        if (isCustomer && (isAdminPath(pathToCheck) || isProductionPath(pathToCheck))) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        if (isAdmin && (isCustomerPath(pathToCheck) || isProductionPath(pathToCheck))) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        if (isProd && (isAdminPath(pathToCheck) || isCustomerPath(pathToCheck))) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }

      // KYC: when pending, block all except /onboarding/kyc
      if (href !== '/onboarding/kyc' && !href.startsWith('/onboarding/kyc')) {
        if (!isKycApprovedCheck()) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    };

    document.addEventListener('click', handleLinkClick, true);

    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/onboarding/kyc' || currentPath.startsWith('/onboarding/kyc')) return;
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

  return null;
}

