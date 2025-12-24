'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface KycLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: any; // Allow other Link props
}

/**
 * Link component that respects KYC status
 * Completely blocks navigation to protected routes when KYC is not approved
 * Prevents the blink/flash effect by blocking navigation before it happens
 */
export default function KycLink({ href, children, onClick, ...props }: KycLinkProps) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow navigation to KYC page
    if (href === '/onboarding/kyc' || href.startsWith('/onboarding/kyc')) {
      if (onClick) onClick();
      return;
    }

    // Check KYC status BEFORE navigation
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const userType = (user?.type ?? '').toLowerCase();
        const isCustomer = ['retailer', 'wholesaler', 'sales'].includes(userType);

        if (isCustomer) {
          const kycStatus = user?.kyc_status || user?.kycStatus;
          if (kycStatus !== 'approved') {
            // COMPLETELY BLOCK navigation - prevent default and stop propagation
            e.preventDefault();
            e.stopPropagation();
            // Access native event for stopImmediatePropagation
            if (e.nativeEvent && 'stopImmediatePropagation' in e.nativeEvent) {
              (e.nativeEvent as any).stopImmediatePropagation();
            }
            // Don't navigate at all - just stay on current page
            return false;
          }
        }
      }
    } catch (error) {
      // If error, allow navigation (let guard handle it)
    }

    if (onClick) onClick();
  };

  // Also prevent navigation on mouse down (catches some edge cases)
  const handleMouseDown = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow navigation to KYC page
    if (href === '/onboarding/kyc' || href.startsWith('/onboarding/kyc')) {
      return;
    }

    // Check KYC status
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const userType = (user?.type ?? '').toLowerCase();
        const isCustomer = ['retailer', 'wholesaler', 'sales'].includes(userType);

        if (isCustomer) {
          const kycStatus = user?.kyc_status || user?.kycStatus;
          if (kycStatus !== 'approved') {
            // Block navigation
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }
      }
    } catch (error) {
      // If error, allow navigation
    }
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      {...props}
    >
      {children}
    </Link>
  );
}

