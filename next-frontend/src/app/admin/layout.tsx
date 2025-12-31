"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Collect all match patterns from navigation (memoized since adminNavigation is constant)
  const allPatterns = useMemo(() => {
    const patterns: string[] = [];
    adminNavigation.forEach((item) => {
      if (item.match) {
        patterns.push(item.match);
      }
      if (item.children) {
        item.children.forEach((child) => {
          patterns.push(child.match);
        });
      }
    });
    return patterns;
  }, []);

  const isMatch = (pattern: string) => {
    // Exact match takes priority
    if (pathname === pattern) {
      return true;
    }
    
    // For wildcard patterns, check if this is the most specific match
    if (pattern.endsWith("*")) {
      const basePath = pattern.slice(0, -1);
      if (!pathname.startsWith(basePath)) {
        return false;
      }
      
      // Check if there's a more specific pattern that also matches
      // (e.g., if we're on /admin/orders/statuses, /admin/orders* should not match
      // if /admin/orders/statuses* exists and matches)
      const moreSpecificPattern = allPatterns.find(p => {
        if (p === pattern) return false; // Don't compare with itself
        if (p.endsWith("*")) {
          const pBase = p.slice(0, -1);
          // More specific means: pBase is longer than basePath and pathname starts with pBase
          return pBase.length > basePath.length && pBase.startsWith(basePath) && pathname.startsWith(pBase);
        }
        // Exact match is always more specific than wildcard
        return pathname === p;
      });
      
      // Only match if there's no more specific pattern
      return !moreSpecificPattern;
    }
    
    return false;
  };

  // Initialize with only the active group open (accordion behavior)
  const getInitialOpenGroups = () => {
    const initial: Record<string, boolean> = {};
    adminNavigation.forEach((item) => {
      if (item.children) {
        const anyActive = item.children.some((child) => isMatch(child.match));
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
        const anyActive = item.children.some((child) => isMatch(child.match));
        // Only open the group that has an active child
        newState[item.label] = anyActive;
      }
    });
    setOpenNavGroups(newState);
  }, [pathname]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white/95 shadow-xl shadow-slate-900/10 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header section - fixed at top */}
        <div className="flex-shrink-0 px-3 py-4 lg:px-4 lg:py-6">
          {/* Mobile close button */}
          <div className="mb-4 flex items-center justify-between lg:mb-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm">
                EL
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 sm:text-sm">Elvee Admin</p>
                <p className="text-[10px] text-slate-400 sm:text-xs">Production & Retail Ops</p>
              </div>
            </div>
            <button
              onClick={closeSidebar}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              aria-label="Close menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile logo text (shown when sidebar is collapsed on mobile) */}
          <div className="mb-4 sm:hidden">
            <p className="text-xs font-semibold text-slate-900">Elvee Admin</p>
            <p className="text-[10px] text-slate-400">Production & Retail Ops</p>
          </div>
        </div>

        {/* Navigation - scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-0 space-y-2 text-sm lg:px-4 lg:pb-6 lg:pt-0 lg:space-y-3">
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
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] transition sm:rounded-xl sm:px-3 sm:text-[11px] sm:tracking-[0.18em] lg:text-[12px] ${
                      isOpen ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    }`}
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm">{icon}</span>
                      <span className={anyActive ? 'text-slate-600' : undefined}>{item.label}</span>
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-3 w-3 transition-transform sm:h-3.5 sm:w-3.5 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div className={`space-y-1 pl-1 sm:pl-2 ${isOpen ? 'mt-1.5 sm:mt-2' : 'hidden'}`}>
                    {item.children.map((child) => {
                      const isActive = isMatch(child.match);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={closeSidebar}
                          className={`ml-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition sm:ml-3 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2 lg:text-[12px] ${
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
                onClick={closeSidebar}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition sm:gap-3 sm:rounded-xl sm:px-3 lg:text-[12px] ${
                  isActive
                    ? 'bg-slate-900 text-white shadow shadow-slate-900/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-sm sm:text-base lg:text-[12px]">{icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex w-full flex-col lg:ml-0">
        <AdminHeader onMenuClick={toggleSidebar} />
        
        <main className="flex-1 px-0.5 py-4 sm:px-2 sm:py-6 lg:px-6">
          <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

