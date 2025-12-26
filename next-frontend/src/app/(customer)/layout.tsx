'use client';

import React, { useEffect } from "react";
import AuthenticatedLayout from "@/components/shared/AuthenticatedLayout";
import { tokenService } from "@/services/tokenService";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import KycGuard from "@/components/guards/KycGuard";
import GlobalKycBlocker from "@/components/guards/GlobalKycBlocker";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUser } from "@/store/slices/authSlice";
import { fetchCart } from "@/store/slices/cartSlice";
import { fetchWishlist } from "@/store/slices/wishlistSlice";
import { checkKycStatus } from "@/store/slices/kycSlice";
import { selectUser, selectIsKycApproved } from "@/store/selectors/authSelectors";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector((state) => state.auth.isLoading);
  const isKycApproved = useAppSelector(selectIsKycApproved);

  // Refresh token on page load
  useTokenRefresh();

  // Initialize RTK state on mount
  useEffect(() => {
    const initializeApp = async () => {
      // Ensure token is valid before fetching user
      if (tokenService.hasToken()) {
        await tokenService.refreshToken();
      }
      
      // Fetch user via RTK
      await dispatch(fetchUser());
    };
    
    if (!user) {
      initializeApp();
    }
  }, [dispatch, user]);

  // Check KYC status when user is available
  useEffect(() => {
    if (user) {
      dispatch(checkKycStatus());
    }
  }, [dispatch, user]);

  // Fetch cart and wishlist when user is available and KYC approved
  useEffect(() => {
    if (!user) return;
    
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const shouldSkipApiCalls = pathname === '/onboarding/kyc' || !isKycApproved;
    
    if (!shouldSkipApiCalls) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [dispatch, user, isKycApproved]);

  return (
    <>
      <GlobalKycBlocker />
      <AuthenticatedLayout>
        <KycGuard user={user} loading={loading}>
          {children}
        </KycGuard>
      </AuthenticatedLayout>
    </>
  );
}

