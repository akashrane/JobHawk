"use client";

import { useApplications, useUpdateStage } from "@/hooks/use-applications";
import type { Application } from "@/lib/api";
import { stageLabel } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const STAGES = [
  "saved", "applied", "phone_screen", "technical", "onsite", "offer",
  "accepted", "rejected",
];

export default function ApplicationsPage() {
  const { data: applications = [], isLoading } = useApplications();
  const updateStage = useUpdateStage();

  const byStage = STAGES.reduce<Record<string, Application[]>>((acc, stage) => {
    acc[stage] = applications.filter((a) => a.stage === stage);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Applications</h1>
      <p className="text-gray-500 mb-6">{applications.length} total applications</p>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.filter((s) => !["accepted", "rejected"].includes(s) || byStage[s].length > 0).map((stage) => (
          <div key={stage} className="flex-shrink-0 w-64">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-t-lg px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {stageLabel(stage)}
              </span>
              <span className="text-xs bg-white dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">
                {byStage[stage].length}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-b-lg min-h-32 p-2 space-y-2 border border-gray-200 dark:border-gray-800 border-t-0">
              {byStage[stage].map((app) => {
                const job = app.jobs as { title: string; companies?: { name: string } } | undefined;
                return (
                  <Link key={app.id} href={`/applications/${app.id}`}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:border-blue-300 transition-colors cursor-pointer">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                        {job?.title ?? "Unknown role"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{job?.companies?.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(app.last_activity_at), { addSuffix: true })}
                      </p>
                      {app.next_follow_up_at && new Date(app.next_follow_up_at) <= new Date() && (
                        <span className="inline-block text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded mt-1">
                          Follow-up due
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
