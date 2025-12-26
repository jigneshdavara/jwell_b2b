/**
 * Redux Toolkit Store Configuration
 * Centralized state management for the application
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import wishlistReducer from "./slices/wishlistSlice";
import kycReducer from "./slices/kycSlice";
import navigationReducer from "./slices/navigationSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
        wishlist: wishlistReducer,
        kyc: kycReducer,
        navigation: navigationReducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
            },
        }),
    // DevTools automatically enabled in development, disabled in production
    devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
