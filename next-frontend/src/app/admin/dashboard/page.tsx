"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminService } from '@/services/adminService';

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-600",
  approved: "bg-emerald-100 text-emerald-600",
  rejected: "bg-rose-100 text-rose-600",
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
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboard();
      if (response.data) {
        setMetrics({
          pending_kyc: response.data.pending_kyc || 0,
          orders_in_production: response.data.orders_in_production || 0,
          active_offers: response.data.active_offers || 0,
        });
        setRecentPartners(response.data.recent_partners || []);
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
    <div className="space-y-8">
        <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/70 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500/80">Elvee HQ</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">Administration Control Tower</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Monitor partner onboarding, production flows, and commercial levers at a glance.
                </p>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
            {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-slate-900 p-5 text-slate-100 shadow-lg shadow-slate-900/30">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300/80">{labels[key] ?? key.replace(/_/g, ' ')}</p>
                    <p className="mt-4 text-4xl font-semibold">{value}</p>
                    <p className="mt-3 text-xs text-slate-400">Synced moments ago</p>
                </div>
            ))}
            <Link
                href="/admin/settings/payments"
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/10 transition hover:border-slate-300 hover:shadow-xl"
            >
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Gateway status</p>
                <p className="mt-4 text-2xl font-semibold text-slate-900">Stripe</p>
                <p className="mt-2 text-sm text-slate-500">Credentials &amp; test keys</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-sky-600">
                    Manage settings
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </span>
            </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Latest Partner Registrations</h2>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500/70">Approvals awaiting action</p>
                    </div>
                    <Link
                        href="/admin/customers"
                        className="text-xs font-semibold text-sky-600 hover:text-sky-500"
                    >
                        View all
                    </Link>
                </div>
                <div className="mt-6 space-y-4">
                    {recentPartners.map((partner) => (
                        <div
                            key={partner.id}
                            className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                        >
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{partner.name}</p>
                                <p className="text-xs text-slate-500">{partner.email}</p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">{partner.type}</p>
                            </div>
                            <div className="text-right">
                                <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                        statusColors[partner.kyc_status] ?? 'bg-slate-100 text-slate-700'
                                    }`}
                                >
                                    {partner.kyc_status.replace(/_/g, ' ')}
                                </span>
                                <p className="mt-2 text-xs text-slate-400">
                                    Joined {new Date(partner.joined_at).toLocaleDateString('en-IN')}
                                </p>
                            </div>
                        </div>
                    ))}
                    {recentPartners.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                            No new registrations today.
                        </div>
                    )}
                </div>
            </section>
        </div>
    </div>
  );
}

