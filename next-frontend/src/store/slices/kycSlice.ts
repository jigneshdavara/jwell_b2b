/**
 * KYC Slice - Manages KYC status and user profile
 * Handles KYC approval status, documents, and profile data
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { kycService } from '@/services/kycService';
import { RootState } from '../index';

interface KycDocument {
  id: number | string;
  type: string;
  status: string;
  remarks?: string | null;
  file_path?: string | null;
  url?: string | null;
  download_url?: string | null;
  created_at?: string | null;
  uploaded_at?: string | null;
}

interface KycProfile {
  business_name?: string;
  business_website?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  registration_number?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
}

interface KycState {
  isKycApproved: boolean | null; // null = checking, true = approved, false = not approved
  isLoading: boolean;
  documents: KycDocument[];
  profile: KycProfile | null;
  error: string | null;
}

const initialState: KycState = {
  isKycApproved: null,
  isLoading: true,
  documents: [],
  profile: null,
  error: null,
};

// Async thunk to check KYC status
export const checkKycStatus = createAsyncThunk(
  'kyc/checkStatus',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const user = state.auth.user;

      if (!user) {
        return { isApproved: false, documents: [], profile: null };
      }

      const kycStatus = user.kyc_status || user.kycStatus;
      
      // If approved, return early without fetching onboarding data
      if (kycStatus === 'approved') {
        return { isApproved: true, documents: [], profile: null };
      }

      // For non-approved users, fetch onboarding data (documents, profile)
      // This works on both KYC page and other pages
      try {
        const response = await kycService.getOnboardingData();
        const data = response.data;
        
        return {
          isApproved: kycStatus === 'approved',
          documents: data.documents || [],
          profile: data.profile || null,
        };
      } catch (onboardingError: any) {
        // If fetching onboarding data fails (e.g., 403), still return status
        return {
          isApproved: false,
          documents: [],
          profile: null,
        };
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check KYC status');
    }
  }
);

// Async thunk to fetch KYC documents
export const fetchKycDocuments = createAsyncThunk(
  'kyc/fetchDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await kycService.getOnboardingData();
      return response.data.documents || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch KYC documents');
    }
  }
);

const kycSlice = createSlice({
  name: 'kyc',
  initialState,
  reducers: {
    setKycApproved: (state, action: PayloadAction<boolean | null>) => {
      state.isKycApproved = action.payload;
    },
    setDocuments: (state, action: PayloadAction<KycDocument[]>) => {
      state.documents = action.payload;
    },
    setProfile: (state, action: PayloadAction<KycProfile | null>) => {
      state.profile = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearKyc: (state) => {
      state.isKycApproved = null;
      state.documents = [];
      state.profile = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkKycStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkKycStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isKycApproved = action.payload.isApproved;
        state.documents = action.payload.documents;
        state.profile = action.payload.profile;
        state.error = null;
      })
      .addCase(checkKycStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isKycApproved = false;
      })
      .addCase(fetchKycDocuments.fulfilled, (state, action) => {
        state.documents = action.payload;
      });
  },
});

export const {
  setKycApproved,
  setDocuments,
  setProfile,
  setLoading,
  setError,
  clearKyc,
} = kycSlice.actions;
export default kycSlice.reducer;

