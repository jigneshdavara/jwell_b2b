/**
 * Typed Redux Hooks
 * Pre-typed hooks for use throughout the application
 *
 * RTK's useDispatch already returns a stable reference, so no need for useCallback
 */

import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./index";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
// RTK's useDispatch already provides a stable reference
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
