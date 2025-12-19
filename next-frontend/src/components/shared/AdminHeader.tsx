"use client";

import React from "react";
import Link from "next/link";

export const AdminHeader = () => {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-40">
      <div className="flex flex-col gap-2">
        {/* Flash messages can be injected here */}
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900 leading-none">Admin User</p>
          <p className="text-xs text-slate-400 mt-1 font-medium">admin@gmail.com</p>
        </div>
        
        <button
          onClick={() => {
            // Logout logic should go here
            window.location.href = '/login';
          }}
          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-400 hover:text-slate-800"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

