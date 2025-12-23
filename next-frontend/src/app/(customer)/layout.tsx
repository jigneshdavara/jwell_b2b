'use client';

import React from "react";
import AuthenticatedLayout from "@/components/shared/AuthenticatedLayout";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CartProvider } from "@/contexts/CartContext";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WishlistProvider>
      <CartProvider>
        <AuthenticatedLayout>
          {children}
        </AuthenticatedLayout>
      </CartProvider>
    </WishlistProvider>
  );
}

