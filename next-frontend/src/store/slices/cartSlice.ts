/**
 * Cart Slice - Manages shopping cart state
 * Handles cart count and cart items
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { frontendService } from '@/services/frontendService';
import { RootState } from '../index';

interface CartItem {
  id: number;
  product_id: number;
  product_variant_id?: number | null;
  quantity: number;
  configuration?: Record<string, any>;
  price_breakdown?: Record<string, any>;
  [key: string]: any;
}

interface CartState {
  cartCount: number;
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: CartState = {
  cartCount: 0,
  items: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunk to fetch cart
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const user = state.auth.user;
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      
      // Check if KYC is approved
      const isKycApproved = user?.kyc_status === 'approved';
      const shouldSkipApiCalls = pathname === '/onboarding/kyc' || !isKycApproved;
      
      if (shouldSkipApiCalls) {
        return { items: [] };
      }

      const response = await frontendService.getCart();
      const items = response.data?.cart?.items || [];
      return { items };
    } catch (error: any) {
      if (error.response?.status === 403) {
        return { items: [] };
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartCount: (state, action: PayloadAction<number>) => {
      state.cartCount = action.payload;
    },
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.cartCount = action.payload.length;
      state.lastUpdated = Date.now();
    },
    updateCartCount: (state, action: PayloadAction<number>) => {
      state.cartCount = action.payload;
    },
    clearCart: (state) => {
      state.items = [];
      state.cartCount = 0;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.cartCount = action.payload.items.length;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.items = [];
        state.cartCount = 0;
      });
  },
});

export const { setCartCount, setCartItems, updateCartCount, clearCart } = cartSlice.actions;
export default cartSlice.reducer;


