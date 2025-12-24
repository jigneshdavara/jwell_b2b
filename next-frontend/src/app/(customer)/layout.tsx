'use client';

import React, { useEffect, useState } from "react";
import AuthenticatedLayout from "@/components/shared/AuthenticatedLayout";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CartProvider } from "@/contexts/CartContext";
import { authService } from "@/services/authService";
import KycGuard from "@/components/guards/KycGuard";
import GlobalKycBlocker from "@/components/guards/GlobalKycBlocker";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await authService.me();
        setUser(response.data);
      } catch (e) {
        // If not authenticated, AuthenticatedLayout will handle redirect
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  return (
    <WishlistProvider user={user}>
      <CartProvider user={user}>
        <GlobalKycBlocker />
        <AuthenticatedLayout>
          <KycGuard user={user} loading={loading}>
            {children}
          </KycGuard>
        </AuthenticatedLayout>
      </CartProvider>
    </WishlistProvider>
  );
}

