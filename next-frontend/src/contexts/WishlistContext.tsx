'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { frontendService } from '@/services/frontendService';

interface WishlistContextType {
  wishlistCount: number;
  wishlistProductIds: number[];
  refreshWishlist: () => Promise<void>;
  updateWishlistCount: (count: number) => void;
  addProductId: (productId: number) => void;
  removeProductId: (productId: number) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

interface WishlistProviderProps {
  children: ReactNode;
  user?: any | null;
}

export function WishlistProvider({ children, user }: WishlistProviderProps) {
  const pathname = usePathname();
  const [wishlistProductIds, setWishlistProductIds] = useState<number[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]); // Store full items from API

  // Derive count from items array (most accurate) or productIds for optimistic updates
  const wishlistCount = useMemo(() => {
    // Use items length if available (from API), otherwise use productIds length (optimistic)
    return wishlistItems.length > 0 ? wishlistItems.length : wishlistProductIds.length;
  }, [wishlistItems.length, wishlistProductIds.length]);

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

  const refreshWishlist = async () => {
    // Don't call API if on onboarding page or KYC is not approved
    if (shouldSkipApiCalls) {
      setWishlistProductIds([]);
      setWishlistItems([]);
      return;
    }

    try {
      const response = await frontendService.getWishlist();
      const items = response.data?.items || [];
      const productIds: number[] = items.map((item: any) => {
        const productId = typeof item.product_id === 'string' ? parseInt(item.product_id) : item.product_id;
        return Number(productId);
      }).filter((id: number) => !isNaN(id));
      
      setWishlistProductIds([...new Set(productIds)]);
      setWishlistItems(items); // Store items for accurate count
    } catch (error: any) {
      // Handle 403 errors gracefully (KYC not approved)
      if (error.response?.status === 403) {
        setWishlistProductIds([]);
        setWishlistItems([]);
        return;
      }
      console.error('Failed to refresh wishlist:', error);
      setWishlistProductIds([]);
      setWishlistItems([]);
    }
  };

  const updateWishlistCount = (count: number) => {
    // Refresh to get accurate data from API (only if KYC approved and not on onboarding page)
    if (!shouldSkipApiCalls) {
      refreshWishlist();
    }
  };

  const addProductId = (productId: number) => {
    setWishlistProductIds(prev => {
      if (!prev.includes(productId)) {
        return [...prev, productId];
      }
      return prev;
    });
  };

  const removeProductId = (productId: number) => {
    setWishlistProductIds(prev => prev.filter(id => id !== productId));
    // Also remove from items array for accurate count
    setWishlistItems(prev => prev.filter((item: any) => {
      const pid = typeof item.product_id === 'string' ? parseInt(item.product_id) : item.product_id;
      return Number(pid) !== productId;
    }));
  };

  // Initial fetch - only if KYC is approved and not on onboarding page
  useEffect(() => {
    if (shouldSkipApiCalls) {
      setWishlistProductIds([]);
      setWishlistItems([]);
    } else {
      refreshWishlist();
    }
  }, [shouldSkipApiCalls]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistCount,
        wishlistProductIds,
        refreshWishlist,
        updateWishlistCount,
        addProductId,
        removeProductId,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

