"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [flash, setFlash] = useState<{ success?: string; error?: string } | null>(null);

  useEffect(() => {
    // Fetch user from API (no localStorage)
    authService.me()
      .then((response) => {
        setUser(response.data);
      })
      .catch(() => {
        setUser(null);
      });

    // Listen for flash messages (can be set via window events or context)
    const handleFlash = (event: CustomEvent) => {
      setFlash(event.detail);
      // Auto-clear flash after 5 seconds
      setTimeout(() => setFlash(null), 5000);
    };
    
    window.addEventListener('flash-message' as any, handleFlash as EventListener);
    return () => {
      window.removeEventListener('flash-message' as any, handleFlash as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/80 px-2 py-2.5 backdrop-blur sm:px-4 sm:py-4 lg:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:h-9 sm:w-9 lg:hidden"
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 sm:h-5 sm:w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Flash Messages */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {flash?.success && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 sm:px-4 sm:py-1 sm:text-xs">
              {flash.success}
            </span>
          )}
          {flash?.error && (
            <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 sm:px-4 sm:py-1 sm:text-xs">
              {flash.error}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 sm:gap-4">
        <div className="text-right text-[10px] text-slate-500 sm:text-xs">
          <p className="text-xs font-semibold text-slate-900 sm:text-sm">{user?.name || 'Admin User'}</p>
          <p className="text-[10px] sm:text-xs">{user?.email || 'admin@gmail.com'}</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-500 transition hover:border-slate-400 hover:text-slate-800 sm:px-3 sm:py-1 sm:text-xs"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

