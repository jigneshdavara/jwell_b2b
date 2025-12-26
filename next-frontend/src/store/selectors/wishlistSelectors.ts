/**
 * Wishlist Selectors - Memoized selectors for wishlist state
 * Prevents unnecessary re-renders by memoizing derived state
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selectors
const selectWishlistState = (state: RootState) => state.wishlist;

// Memoized selectors
export const selectWishlistCount = createSelector(
  [selectWishlistState],
  (wishlist) => wishlist.wishlistCount
);

export const selectWishlistProductIds = createSelector(
  [selectWishlistState],
  (wishlist) => wishlist.productIds
);

export const selectWishlistItems = createSelector(
  [selectWishlistState],
  (wishlist) => wishlist.items
);

export const selectWishlistLoading = createSelector(
  [selectWishlistState],
  (wishlist) => wishlist.isLoading
);

export const selectWishlistError = createSelector(
  [selectWishlistState],
  (wishlist) => wishlist.error
);

export const selectWishlistLastUpdated = createSelector(
  [selectWishlistState],
  (wishlist) => wishlist.lastUpdated
);

// Derived selectors
export const selectIsWishlistEmpty = createSelector(
  [selectWishlistCount],
  (count) => count === 0
);

export const selectIsProductInWishlist = createSelector(
  [selectWishlistProductIds],
  (productIds) => (productId: number) => productIds.includes(productId)
);

