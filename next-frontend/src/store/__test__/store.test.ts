/**
 * RTK Store Verification Test
 * This file verifies that the Redux store is properly configured
 * Run: npm run build (TypeScript will catch any errors)
 */

import { store } from "../index";
import type { RootState } from "../index";

// Verify store is created
if (!store) {
    throw new Error("Store is not initialized");
}

// Verify store has all reducers
const state: RootState = store.getState();

// Verify all slices exist
if (!state.auth) {
    throw new Error("Auth slice is missing");
}

if (!state.cart) {
    throw new Error("Cart slice is missing");
}

if (!state.wishlist) {
    throw new Error("Wishlist slice is missing");
}

if (!state.kyc) {
    throw new Error("KYC slice is missing");
}

if (!state.navigation) {
    throw new Error("Navigation slice is missing");
}

if (!state.ui) {
    throw new Error("UI slice is missing");
}

// Verify initial state structure
// Store verification complete - all slices are properly configured

export {};
