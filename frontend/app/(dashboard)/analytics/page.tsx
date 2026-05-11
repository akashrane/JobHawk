"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnalyticsSummary } from "@/lib/api";
import { stageLabel } from "@/lib/utils";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
  });

  const stages = [
    "saved", "applied", "phone_screen", "technical", "onsite", "offer", "accepted",
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Analytics</h1>
      <p className="text-gray-500 mb-8">Your job search funnel at a glance.</p>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Applications", value: data?.total_applications ?? 0 },
              { label: "High-Score Jobs", value: data?.high_score_jobs ?? 0 },
              { label: "Pending Drafts", value: data?.pending_drafts ?? 0 },
              { label: "Follow-ups Due", value: data?.follow_ups_due ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-base font-semibold mb-4">Application Funnel</h2>
            <div className="space-y-3">
              {stages.map((stage) => {
                const count = (data?.stage_counts ?? {})[stage] ?? 0;
                const total = data?.total_applications || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{stageLabel(stage)}</span>
                      <span className="text-gray-500 font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
