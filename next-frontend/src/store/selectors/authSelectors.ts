/**
 * Auth Selectors - Memoized selectors for authentication state
 * Prevents unnecessary re-renders by memoizing derived state
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selectors
const selectAuthState = (state: RootState) => state.auth;

// Memoized selectors
export const selectUser = createSelector(
  [selectAuthState],
  (auth) => auth.user
);

export const selectToken = createSelector(
  [selectAuthState],
  (auth) => auth.token
);

export const selectIsAuthenticated = createSelector(
  [selectAuthState],
  (auth) => auth.isAuthenticated
);

export const selectAuthLoading = createSelector(
  [selectAuthState],
  (auth) => auth.isLoading
);

export const selectAuthError = createSelector(
  [selectAuthState],
  (auth) => auth.error
);

// Derived selectors
export const selectUserType = createSelector(
  [selectUser],
  (user) => user?.type?.toLowerCase() || ''
);

export const selectIsCustomer = createSelector(
  [selectUserType],
  (userType) => ['retailer', 'wholesaler', 'sales'].includes(userType)
);

export const selectKycStatus = createSelector(
  [selectUser],
  (user) => user?.kyc_status || user?.kycStatus || null
);

export const selectIsKycApproved = createSelector(
  [selectKycStatus],
  (kycStatus) => kycStatus === 'approved'
);

