"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/components/shared/AdminHeader";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation, iconMap } from "@/constants/adminNavigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Initialize with only the active group open (accordion behavior)
  const getInitialOpenGroups = () => {
    const initial: Record<string, boolean> = {};
    adminNavigation.forEach((item) => {
      if (item.children) {
        const anyActive = item.children.some((child) => {
          if (child.match.endsWith("*")) {
            return pathname.startsWith(child.match.slice(0, -1));
          }
          return pathname === child.match;
        });
        // Only set to true if this group has an active child (accordion: only one open)
        initial[item.label] = anyActive;
      }
    });
    return initial;
  };

  const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>(getInitialOpenGroups);

  // Update open groups when pathname changes (accordion behavior)
  useEffect(() => {
    const newState: Record<string, boolean> = {};
    adminNavigation.forEach((item) => {
      if (item.children) {
        const anyActive = item.children.some((child) => {
          if (child.match.endsWith("*")) {
            return pathname.startsWith(child.match.slice(0, -1));
          }
          return pathname === child.match;
        });
        // Only open the group that has an active child
        newState[item.label] = anyActive;
      }
    });
    setOpenNavGroups(newState);
  }, [pathname]);

  const isMatch = (pattern: string) => {
    if (pattern.endsWith("*")) {
      return pathname.startsWith(pattern.slice(0, -1));
    }
    return pathname === pattern;
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white/95 px-4 py-6 shadow-lg shadow-slate-900/5 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            EL
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Elvee Admin</p>
            <p className="text-xs text-slate-400">Production & Retail Ops</p>
          </div>
        </div>

        <nav className="mt-8 space-y-3 text-sm">
          {adminNavigation.map((item) => {
            if (item.children) {
              const anyActive = item.children.some((child) => isMatch(child.match));
              const icon = item.icon ? iconMap[item.icon] : null;
              const isOpen = openNavGroups[item.label] ?? anyActive;
              const toggleGroup = () => {
                // Accordion behavior: close all other groups and toggle the clicked one
                setOpenNavGroups((previous) => {
                  const newState: Record<string, boolean> = {};
                  // Close all groups first
                  adminNavigation.forEach((navItem) => {
                    if (navItem.children) {
                      newState[navItem.label] = false;
                    }
                  });
                  // Open only the clicked group if it wasn't already open
                  if (!isOpen) {
                    newState[item.label] = true;
                  }
                  return newState;
                });
              };

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={toggleGroup}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                      isOpen ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    }`}
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-2">
                      {icon}
                      <span className={anyActive ? 'text-slate-600' : undefined}>{item.label}</span>
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div className={`space-y-1 pl-2 ${isOpen ? 'mt-2' : 'hidden'}`}>
                    {item.children.map((child) => {
                      const isActive = isMatch(child.match);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`ml-3 flex items-center gap-2 rounded-xl px-3 py-2 font-medium transition ${
                            isActive
                              ? 'bg-slate-900 text-white shadow shadow-slate-900/20'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const isActive = isMatch(item.match);
            const icon = item.icon ? iconMap[item.icon] : null;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow shadow-slate-900/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex w-full flex-col">
        <AdminHeader />
        
        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

