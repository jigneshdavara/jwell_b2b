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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 shadow-xl shadow-slate-950/40 sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 sm:tracking-[0.4em] sm:text-xs">
                Ops Console
              </p>
              <h1 className="mt-1.5 text-xl font-semibold text-white sm:mt-2 sm:text-2xl lg:text-3xl">
                Production Control Room
              </h1>
              <p className="mt-1.5 text-xs text-slate-400 sm:mt-2 sm:text-sm">
                Track throughput, QC queues, and dispatch readiness in real
                time.
              </p>
            </div>
            <a
              href="mailto:production@elvee.in"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-[10px] font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white sm:mt-0 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"
            >
              Escalate an issue
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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

        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          {Object.entries(metrics).map(([key, value]) => (
            <div
              key={key}
              className="rounded-xl border border-slate-800/60 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/50 sm:rounded-2xl sm:p-5"
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 sm:tracking-[0.35em] sm:text-xs">
                {labels[key] ?? key.replace(/_/g, " ")}
              </p>
              <p className="mt-3 text-2xl font-semibold text-white sm:mt-4 sm:text-3xl lg:text-4xl">{value}</p>
              <p className="mt-2 text-[10px] text-slate-500 sm:mt-3 sm:text-xs">Live feed synced</p>
            </div>
          ))}
        </div>
      </div>
  );
}

