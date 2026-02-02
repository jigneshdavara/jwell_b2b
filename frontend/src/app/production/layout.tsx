"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout();
    router.push('/');
  };

  return (
    <div className="production-portal min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white p-3 sm:p-4">
        <div className="container mx-auto flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center px-2 sm:px-4">
          <h1 className="text-base font-bold sm:text-lg lg:text-xl">Elvee Production</h1>
          <nav className="flex gap-3 sm:gap-4">
            <span className="text-xs sm:text-sm">Work Orders</span>
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm hover:text-feather-gold transition cursor-pointer"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-4 px-2 sm:py-6 sm:px-4 lg:py-8">
        {children}
      </main>
      
      <footer className="bg-white border-t border-slate-200 p-3 text-center text-slate-500 text-[10px] sm:p-4 sm:text-xs">
        Production Workflow Management System
      </footer>
    </div>
  );
}

