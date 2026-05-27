"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnalyticsSummary, type AnalyticsSummary } from "@/lib/api";
import { Briefcase, FileText, Bell, TrendingUp } from "lucide-react";

const STATS = [
  {
    key: "new_jobs_24h" as const,
    label: "New Jobs Today",
    icon: Briefcase,
    iconBg: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
    valueColor: "text-blue-700 dark:text-blue-300",
  },
  {
    key: "pending_drafts" as const,
    label: "Pending Drafts",
    icon: FileText,
    iconBg: "bg-yellow-50 dark:bg-yellow-950",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    valueColor: "text-yellow-700 dark:text-yellow-300",
  },
  {
    key: "total_applications" as const,
    label: "Applications",
    icon: TrendingUp,
    iconBg: "bg-green-50 dark:bg-green-950",
    iconColor: "text-green-600 dark:text-green-400",
    valueColor: "text-green-700 dark:text-green-300",
  },
  {
    key: "follow_ups_due" as const,
    label: "Follow-ups Due",
    icon: Bell,
    iconBg: "bg-red-50 dark:bg-red-950",
    iconColor: "text-red-600 dark:text-red-400",
    valueColor: "text-red-700 dark:text-red-300",
  },
];

export function StatsCards() {
  const { data, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map(({ key, label, icon: Icon, iconBg, iconColor, valueColor }) => (
        <div
          key={key}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-sm transition-shadow"
        >
          <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <p className={`text-3xl font-bold ${valueColor}`}>{data?.[key] ?? 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
