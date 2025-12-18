import React from "react";
import AuthenticatedLayout from "@/components/shared/AuthenticatedLayout";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  );
}

