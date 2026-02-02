/**
 * Wishlist Slice - Manages wishlist state
 * Handles wishlist count, product IDs, and items
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { frontendService } from '@/services/frontendService';
import { RootState } from '../index';

interface WishlistItem {
  id: number;
  product_id: number;
  [key: string]: any;
}

interface WishlistState {
  wishlistCount: number;
  productIds: number[];
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: WishlistState = {
  wishlistCount: 0,
  productIds: [],
  items: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunk to fetch wishlist
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const user = state.auth.user;
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      
      // Check if KYC is approved
      const isKycApproved = user?.kyc_status === 'approved';
      const shouldSkipApiCalls = pathname === '/onboarding/kyc' || !isKycApproved;
      
      if (shouldSkipApiCalls) {
        return { items: [], productIds: [] };
      }

      const response = await frontendService.getWishlist();
      const items = response.data?.items || [];
      const productIds: number[] = items.map((item: any) => {
        const productId = typeof item.product_id === 'string' ? parseInt(item.product_id) : item.product_id;
        return Number(productId);
      }).filter((id: number) => !isNaN(id));
      
      return { items, productIds: [...new Set(productIds)] };
    } catch (error: any) {
      if (error.response?.status === 403) {
        return { items: [], productIds: [] };
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlistCount: (state, action: PayloadAction<number>) => {
      state.wishlistCount = action.payload;
    },
    setWishlistItems: (state, action: PayloadAction<WishlistItem[]>) => {
      state.items = action.payload;
      state.wishlistCount = action.payload.length;
      state.lastUpdated = Date.now();
    },
    setProductIds: (state, action: PayloadAction<number[]>) => {
      state.productIds = action.payload;
    },
    addProductId: (state, action: PayloadAction<number>) => {
      if (!state.productIds.includes(action.payload)) {
        state.productIds.push(action.payload);
      }
    },
    removeProductId: (state, action: PayloadAction<number>) => {
      state.productIds = state.productIds.filter(id => id !== action.payload);
      state.items = state.items.filter(item => {
        const pid = typeof item.product_id === 'string' ? parseInt(item.product_id) : item.product_id;
        return Number(pid) !== action.payload;
      });
      state.wishlistCount = state.items.length > 0 ? state.items.length : state.productIds.length;
    },
    updateWishlistCount: (state, action: PayloadAction<number>) => {
      state.wishlistCount = action.payload;
    },
    clearWishlist: (state) => {
      state.items = [];
      state.productIds = [];
      state.wishlistCount = 0;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.productIds = action.payload.productIds;
        state.wishlistCount = action.payload.items.length > 0 
          ? action.payload.items.length 
          : action.payload.productIds.length;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.items = [];
        state.productIds = [];
        state.wishlistCount = 0;
      });
  },
});

export const {
  setWishlistCount,
  setWishlistItems,
  setProductIds,
  addProductId,
  removeProductId,
  updateWishlistCount,
  clearWishlist,
} = wishlistSlice.actions;
export default wishlistSlice.reducer;


