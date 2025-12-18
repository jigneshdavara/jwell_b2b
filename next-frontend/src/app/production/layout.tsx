import React from "react";

export default function ProductionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="production-portal min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Elvee Production</h1>
          <nav className="flex gap-4">
            <span className="text-sm">Work Orders</span>
            <span className="text-sm">Logout</span>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto py-8">
        {children}
      </main>
      
      <footer className="bg-white border-t border-slate-200 p-4 text-center text-slate-500 text-xs">
        Production Workflow Management System
      </footer>
    </div>
  );
}

