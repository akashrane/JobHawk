"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnalyticsSummary, type AnalyticsSummary } from "@/lib/api";
import { Briefcase, FileText, Bell, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sublabel?: string;
}

function StatCard({ label, value, icon: Icon, color, sublabel }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

export function StatsCards() {
  const { data, isLoading } = useQuery<AnalyticsSummary>({
    queryKey: ["analytics-summary"],
    queryFn: getAnalyticsSummary,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="New Jobs (24h)"
        value={data?.new_jobs_24h ?? 0}
        icon={Briefcase}
        color="bg-blue-500"
        sublabel="Discovered today"
      />
      <StatCard
        label="Pending Drafts"
        value={data?.pending_drafts ?? 0}
        icon={FileText}
        color="bg-yellow-500"
        sublabel="Awaiting your review"
      />
      <StatCard
        label="Active Applications"
        value={data?.total_applications ?? 0}
        icon={TrendingUp}
        color="bg-green-500"
        sublabel="Total tracked"
      />
      <StatCard
        label="Follow-ups Due"
        value={data?.follow_ups_due ?? 0}
        icon={Bell}
        color="bg-red-500"
        sublabel="Action required"
      />
    </div>
  );
}
