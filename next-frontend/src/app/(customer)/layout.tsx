'use client';

import React from "react";
import AuthenticatedLayout from "@/components/shared/AuthenticatedLayout";
import { WishlistProvider } from "@/contexts/WishlistContext";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WishlistProvider>
      <AuthenticatedLayout>
        {children}
      </AuthenticatedLayout>
    </WishlistProvider>
  );
}

