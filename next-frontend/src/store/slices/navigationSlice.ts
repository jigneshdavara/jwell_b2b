/**
 * Navigation Slice - Manages navigation data
 * Handles categories, catalogs, and brands for navigation menus
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { frontendService } from '@/services/frontendService';

interface Category {
  id: number;
  name: string;
  cover_image_url?: string | null;
  [key: string]: any;
}

interface Catalog {
  id: number;
  name: string;
  [key: string]: any;
}

interface Brand {
  id: number;
  name: string;
  [key: string]: any;
}

interface NavigationState {
  categories: Category[];
  catalogs: Catalog[];
  brands: Brand[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: NavigationState = {
  categories: [],
  catalogs: [],
  brands: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunk to fetch navigation data
export const fetchNavigationData = createAsyncThunk(
  'navigation/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      // Fetch all navigation data from single endpoint
      const response = await frontendService.getNavigation();
      const data = response.data || {};

      return {
        categories: data.categories || [],
        catalogs: data.catalogs || [],
        brands: data.brands || [],
      };
    } catch (error: any) {
      // If error, return empty arrays (don't block UI)
      console.error('Failed to fetch navigation data:', error);
      return {
        categories: [],
        catalogs: [],
        brands: [],
      };
    }
  }
);

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
      state.lastUpdated = Date.now();
    },
    setCatalogs: (state, action: PayloadAction<Catalog[]>) => {
      state.catalogs = action.payload;
      state.lastUpdated = Date.now();
    },
    setBrands: (state, action: PayloadAction<Brand[]>) => {
      state.brands = action.payload;
      state.lastUpdated = Date.now();
    },
    clearNavigation: (state) => {
      state.categories = [];
      state.catalogs = [];
      state.brands = [];
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNavigationData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNavigationData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload.categories;
        state.catalogs = action.payload.catalogs;
        state.brands = action.payload.brands;
        state.lastUpdated = Date.now();
        state.error = null;
      })
      .addCase(fetchNavigationData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCategories, setCatalogs, setBrands, clearNavigation } = navigationSlice.actions;
export default navigationSlice.reducer;

