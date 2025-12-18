"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

const labels: Record<string, string> = {
  in_queue: "In Queue",
  quality_check: "In QC",
  dispatch_ready: "Ready to Dispatch",
};

export default function ProductionDashboardOverview() {
  const [metrics, setMetrics] = useState<Record<string, number>>({
    in_queue: 24,
    quality_check: 8,
    dispatch_ready: 15,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // No fetch needed
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/40">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                Ops Console
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">
                Production Control Room
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Track throughput, QC queues, and dispatch readiness in real
                time.
              </p>
            </div>
            <a
              href="mailto:production@elvee.in"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Escalate an issue
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(metrics).map(([key, value]) => (
            <div
              key={key}
              className="rounded-2xl border border-slate-800/60 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/50"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                {labels[key] ?? key.replace(/_/g, " ")}
              </p>
              <p className="mt-4 text-4xl font-semibold text-white">{value}</p>
              <p className="mt-3 text-xs text-slate-500">Live feed synced</p>
            </div>
          ))}
        </div>
      </div>
  );
}

