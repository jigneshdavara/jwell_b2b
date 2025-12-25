"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export const AdminHeader = () => {
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
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
      <div className="flex flex-col gap-2">
        {flash?.success && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-600">
            {flash.success}
          </span>
        )}
        {flash?.error && (
          <span className="inline-flex items-center rounded-full bg-rose-50 px-4 py-1 text-xs font-semibold text-rose-600">
            {flash.error}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right text-xs text-slate-500">
          <p className="text-sm font-semibold text-slate-900">{user?.name || 'Admin User'}</p>
          <p>{user?.email || 'admin@gmail.com'}</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-400 hover:text-slate-800"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

