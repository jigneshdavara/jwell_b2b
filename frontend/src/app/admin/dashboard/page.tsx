"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminService } from '@/services/adminService';

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  submitted: "bg-slate-100 text-slate-700",
  in_progress: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const labels: Record<string, string> = {
  pending_kyc: "Pending KYC",
  orders_in_production: "Orders in Production",
  active_offers: "Active Offers",
};

type Partner = {
  id: number;
  name: string;
  email: string;
  type: string;
  kyc_status: string;
  joined_at: string;
};

export default function AdminDashboardOverview() {
  const [metrics, setMetrics] = useState<Record<string, number>>({
    pending_kyc: 0,
    orders_in_production: 0,
    active_offers: 0,
  });
  const [recentPartners, setRecentPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set page title (like Laravel's Head component)
    document.title = 'Admin Command Centre';
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboard();
      
      if (response.data) {
        // Backend returns: { metrics: {...}, recentPartners: [...] }
        const metricsData = response.data.metrics || response.data;
        const partnersData = response.data.recentPartners || response.data.recent_partners || [];
        
        setMetrics({
          pending_kyc: metricsData.pending_kyc || 0,
          orders_in_production: metricsData.orders_in_production || 0,
          active_offers: metricsData.active_offers || 0,
        });
        
        // Map partners to ensure correct structure
        const mappedPartners = partnersData.map((partner: any) => ({
          id: Number(partner.id),
          name: partner.name || '',
          email: partner.email || '',
          type: partner.type || '',
          kyc_status: partner.kyc_status || 'pending',
          joined_at: partner.joined_at || partner.created_at || new Date().toISOString(),
        }));
        
        setRecentPartners(mappedPartners);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8">
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-3 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500/80 sm:text-xs">Elvee HQ</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">Administration Control Tower</h1>
                <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                    Monitor partner onboarding, production flows, and commercial levers at a glance.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="rounded-xl bg-slate-900 p-3 text-slate-100 shadow-lg shadow-slate-900/30 sm:rounded-2xl sm:p-5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300/80 sm:text-[11px]">{labels[key] ?? key.replace(/_/g, ' ')}</p>
                    <p className="mt-3 text-3xl font-semibold sm:mt-4 sm:text-4xl">{value}</p>
                    <p className="mt-2 text-[10px] text-slate-400 sm:mt-3 sm:text-xs">Synced moments ago</p>
                </div>
            ))}
            <Link
                href="/admin/settings/payments"
                className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-900/10 transition hover:border-slate-300 hover:shadow-xl sm:rounded-2xl sm:p-5"
            >
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-[11px]">Gateway status</p>
                <p className="mt-3 text-xl font-semibold text-slate-900 sm:mt-4 sm:text-2xl">Stripe</p>
                <p className="mt-2 text-xs text-slate-500 sm:text-sm">Credentials &amp; test keys</p>
                <span className="mt-3 inline-flex items-center gap-2 text-[10px] font-semibold text-sky-600 sm:mt-4 sm:text-xs">
                    Manage settings
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </span>
            </Link>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <section className="rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200/70 sm:rounded-3xl sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Latest Partner Registrations</h2>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500/70 sm:text-[11px]">Approvals awaiting action</p>
                    </div>
                    <Link
                        href="/admin/users"
                        className="text-[10px] font-semibold text-sky-600 hover:text-sky-500 sm:text-xs"
                    >
                        View all
                    </Link>
                </div>
                <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
                    {recentPartners.map((partner) => (
                        <div
                            key={partner.id}
                            className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:p-4"
                        >
                            <div className="flex-1">
                                <p className="text-xs font-semibold text-slate-800 sm:text-sm">{partner.name}</p>
                                <p className="text-[10px] text-slate-500 sm:text-xs">{partner.email}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:text-[11px]">{partner.type}</p>
                            </div>
                            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right">
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold sm:px-3 sm:text-xs ${
                                        statusColors[partner.kyc_status] ?? 'bg-slate-100 text-slate-700'
                                    }`}
                                >
                                    {partner.kyc_status.replace(/_/g, ' ')}
                                </span>
                                <p className="text-[10px] text-slate-400 sm:mt-2 sm:text-xs">
                                    {new Date(partner.joined_at).toLocaleDateString('en-IN', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {recentPartners.length === 0 && (
                        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 sm:rounded-2xl sm:p-6 sm:text-sm">
                            No new registrations today.
                        </div>
                    )}
                </div>
            </section>
        </div>
    </div>
  );
}

