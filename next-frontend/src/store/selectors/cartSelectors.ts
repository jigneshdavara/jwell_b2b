/**
 * Cart Selectors - Memoized selectors for cart state
 * Prevents unnecessary re-renders by memoizing derived state
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selectors
const selectCartState = (state: RootState) => state.cart;

// Memoized selectors
export const selectCartCount = createSelector(
  [selectCartState],
  (cart) => cart.cartCount
);

export const selectCartItems = createSelector(
  [selectCartState],
  (cart) => cart.items
);

export const selectCartLoading = createSelector(
  [selectCartState],
  (cart) => cart.isLoading
);

export const selectCartError = createSelector(
  [selectCartState],
  (cart) => cart.error
);

export const selectCartLastUpdated = createSelector(
  [selectCartState],
  (cart) => cart.lastUpdated
);

// Derived selectors
export const selectIsCartEmpty = createSelector(
  [selectCartCount],
  (count) => count === 0
);

export const selectCartTotalItems = createSelector(
  [selectCartItems],
  (items) => items.reduce((total, item) => total + (item.quantity || 1), 0)
);

