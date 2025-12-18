import React from "react";

export const AdminHeader = () => {
  return (
    <header className="bg-white border-b border-slate-200 p-4 h-16 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </div>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-none">Super Admin</p>
            <p className="text-xs text-slate-500 mt-1">Management</p>
          </div>
          <div className="w-10 h-10 bg-elvee-blue rounded-full flex items-center justify-center text-white font-bold text-sm">
            SA
          </div>
        </div>
      </div>
    </header>
  );
};

