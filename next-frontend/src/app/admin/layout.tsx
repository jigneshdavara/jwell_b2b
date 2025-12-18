import React from "react";
import { AdminHeader } from "@/components/shared/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-portal min-h-screen bg-slate-50 flex">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden lg:flex flex-col sticky top-0 h-screen">
        <h2 className="text-xl font-bold mb-8 text-white">Elvee Admin</h2>
        <nav className="space-y-1 flex-1">
          <div className="px-4 py-3 rounded-lg bg-white/10 text-white font-medium cursor-pointer">Dashboard</div>
          <div className="px-4 py-3 rounded-lg text-slate-400 hover:bg-white/5 transition-colors cursor-pointer">Catalog</div>
          <div className="px-4 py-3 rounded-lg text-slate-400 hover:bg-white/5 transition-colors cursor-pointer">Orders</div>
          <div className="px-4 py-3 rounded-lg text-slate-400 hover:bg-white/5 transition-colors cursor-pointer">Customers</div>
          <div className="px-4 py-3 rounded-lg text-slate-400 hover:bg-white/5 transition-colors cursor-pointer">Settings</div>
        </nav>
      </aside>
      
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        
        <main className="p-4 md:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

