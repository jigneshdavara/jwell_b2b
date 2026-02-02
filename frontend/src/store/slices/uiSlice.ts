/**
 * UI Slice - Manages UI state
 * Handles modals, menus, search, and other UI interactions
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  // Mobile menu
  mobileMenuOpen: boolean;
  
  // Account menu
  accountMenuOpen: boolean;
  
  // Search
  searchOpen: boolean;
  searchTerm: string;
  
  // Language
  language: string;
  
  // Open menu (for dropdowns)
  openMenu: string | null;
  
  // Modals
  modals: Record<string, boolean>;
}

const initialState: UiState = {
  mobileMenuOpen: false,
  accountMenuOpen: false,
  searchOpen: false,
  searchTerm: '',
  language: 'en',
  openMenu: null,
  modals: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    setAccountMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.accountMenuOpen = action.payload;
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.searchOpen = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setOpenMenu: (state, action: PayloadAction<string | null>) => {
      state.openMenu = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    toggleAccountMenu: (state) => {
      state.accountMenuOpen = !state.accountMenuOpen;
    },
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = false;
    },
    toggleModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = !state.modals[action.payload];
    },
    closeAllModals: (state) => {
      state.modals = {};
    },
    resetUi: (state) => {
      state.mobileMenuOpen = false;
      state.accountMenuOpen = false;
      state.searchOpen = false;
      state.searchTerm = '';
      state.openMenu = null;
      state.modals = {};
    },
  },
});

export const {
  setMobileMenuOpen,
  setAccountMenuOpen,
  setSearchOpen,
  setSearchTerm,
  setLanguage,
  setOpenMenu,
  toggleMobileMenu,
  toggleAccountMenu,
  toggleSearch,
  openModal,
  closeModal,
  toggleModal,
  closeAllModals,
  resetUi,
} = uiSlice.actions;
export default uiSlice.reducer;

