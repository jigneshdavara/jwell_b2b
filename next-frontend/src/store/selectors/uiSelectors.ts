/**
 * UI Selectors - Memoized selectors for UI state
 * Prevents unnecessary re-renders by memoizing derived state
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selectors
const selectUiState = (state: RootState) => state.ui;

// Memoized selectors
export const selectMobileMenuOpen = createSelector(
  [selectUiState],
  (ui) => ui.mobileMenuOpen
);

export const selectAccountMenuOpen = createSelector(
  [selectUiState],
  (ui) => ui.accountMenuOpen
);

export const selectSearchOpen = createSelector(
  [selectUiState],
  (ui) => ui.searchOpen
);

export const selectSearchTerm = createSelector(
  [selectUiState],
  (ui) => ui.searchTerm
);

export const selectLanguage = createSelector(
  [selectUiState],
  (ui) => ui.language
);

export const selectOpenMenu = createSelector(
  [selectUiState],
  (ui) => ui.openMenu
);

export const selectModals = createSelector(
  [selectUiState],
  (ui) => ui.modals
);

// Derived selectors
export const selectIsModalOpen = createSelector(
  [selectModals],
  (modals) => (modalName: string) => modals[modalName] || false
);

