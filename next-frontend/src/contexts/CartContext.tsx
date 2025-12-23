'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { frontendService } from '@/services/frontendService';

interface CartContextType {
  cartCount: number;
  refreshCart: () => Promise<void>;
  updateCartCount: (count: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
  user?: any | null;
}

export function CartProvider({ children, user }: CartProviderProps) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  // Check if KYC is approved
  const isKycApproved = useMemo(() => {
    if (!user) return false;
    const kycStatus = user?.kyc_status || user?.kycStatus;
    return kycStatus === 'approved';
  }, [user]);

  // Don't make API calls if on onboarding page
  const shouldSkipApiCalls = useMemo(() => {
    return pathname === '/onboarding/kyc' || !isKycApproved;
  }, [pathname, isKycApproved]);

  const refreshCart = async () => {
    // Don't call API if on onboarding page or KYC is not approved
    if (shouldSkipApiCalls) {
      setCartCount(0);
      return;
    }

    try {
      const response = await frontendService.getCart();
      const items = response.data?.cart?.items || [];
      // Count is the number of cart items (matches Laravel's items_count)
      // This is the number of line items, not the sum of quantities
      setCartCount(items.length);
    } catch (error: any) {
      // Handle 403 errors gracefully (KYC not approved)
      if (error.response?.status === 403) {
        setCartCount(0);
        return;
      }
      console.error('Failed to refresh cart:', error);
      setCartCount(0);
    }
  };

  const updateCartCount = (count: number) => {
    setCartCount(count);
  };

  // Initial fetch - only if KYC is approved and not on onboarding page
  useEffect(() => {
    if (shouldSkipApiCalls) {
      setCartCount(0);
    } else {
      refreshCart();
    }
  }, [shouldSkipApiCalls]);

  return (
    <CartContext.Provider
      value={{
        cartCount,
        refreshCart,
        updateCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

