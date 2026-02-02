/**
 * Navigation Selectors - Memoized selectors for navigation data
 * Prevents unnecessary re-renders by memoizing derived state
 */

import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../index";

// Base selectors
const selectNavigationState = (state: RootState) => state.navigation;

// Memoized selectors
export const selectCategories = createSelector(
    [selectNavigationState],
    (navigation) => navigation.categories
);

export const selectCatalogs = createSelector(
    [selectNavigationState],
    (navigation) => navigation.catalogs
);

export const selectBrands = createSelector(
    [selectNavigationState],
    (navigation) => navigation.brands
);

// Combined navigation data selector (memoized)
export const selectNavigationData = createSelector(
    [selectCategories, selectCatalogs, selectBrands],
    (categories, catalogs, brands) => ({
        categories,
        catalogs,
        brands,
    })
);

// Loading and error selectors
export const selectNavigationLoading = createSelector(
    [selectNavigationState],
    (navigation) => navigation.isLoading
);

export const selectNavigationError = createSelector(
    [selectNavigationState],
    (navigation) => navigation.error
);

export const selectNavigationLastUpdated = createSelector(
    [selectNavigationState],
    (navigation) => navigation.lastUpdated
);
