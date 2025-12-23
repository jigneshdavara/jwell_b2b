'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { frontendService } from '@/services/frontendService';

interface CartContextType {
  cartCount: number;
  refreshCart: () => Promise<void>;
  updateCartCount: (count: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = async () => {
    try {
      const response = await frontendService.getCart();
      const items = response.data?.cart?.items || [];
      // Count is the number of cart items (matches Laravel's items_count)
      // This is the number of line items, not the sum of quantities
      setCartCount(items.length);
    } catch (error) {
      console.error('Failed to refresh cart:', error);
      setCartCount(0);
    }
  };

  const updateCartCount = (count: number) => {
    setCartCount(count);
  };


  // Initial fetch
  useEffect(() => {
    refreshCart();
  }, []);

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

