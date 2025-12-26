/**
 * KYC Selectors - Memoized selectors for KYC state
 * Prevents unnecessary re-renders by memoizing derived state
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selectors
const selectKycState = (state: RootState) => state.kyc;

// Memoized selectors
export const selectIsKycApproved = createSelector(
  [selectKycState],
  (kyc) => kyc.isKycApproved
);

export const selectKycLoading = createSelector(
  [selectKycState],
  (kyc) => kyc.isLoading
);

export const selectKycDocuments = createSelector(
  [selectKycState],
  (kyc) => kyc.documents
);

export const selectKycProfile = createSelector(
  [selectKycState],
  (kyc) => kyc.profile
);

export const selectKycError = createSelector(
  [selectKycState],
  (kyc) => kyc.error
);

// Derived selectors
export const selectIsKycChecking = createSelector(
  [selectIsKycApproved],
  (isApproved) => isApproved === null
);

export const selectIsKycRejected = createSelector(
  [selectIsKycApproved],
  (isApproved) => isApproved === false
);

