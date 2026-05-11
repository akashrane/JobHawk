"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { useApplication } from "@/hooks/use-applications";
import { formatDistanceToNow, format } from "date-fns";
import { stageLabel } from "@/lib/utils";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: app, isLoading } = useApplication(id);

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!app) return <div className="p-8 text-gray-500">Application not found.</div>;

  const job = app.jobs as { title: string; companies?: { name: string } } | undefined;
  const events = (app.application_events ?? []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to applications
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job?.title}</h1>
          <p className="text-gray-500 mt-1">{job?.companies?.name}</p>
        </div>
        <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
          {stageLabel(app.stage)}
        </span>
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Activity Timeline
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400">No events yet.</p>
        ) : (
          <div className="relative pl-5 border-l border-gray-200 dark:border-gray-700 space-y-4">
            {events.map((event) => (
              <div key={event.id} className="relative">
                <div className="absolute -left-[22px] w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 top-1" />
                <p className="text-sm font-medium capitalize text-gray-800 dark:text-gray-200">
                  {event.event.replace(/_/g, " ")}
                </p>
                {event.details && Object.keys(event.details).length > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {JSON.stringify(event.details)
                      .replace(/[{}"]/g, "")
                      .replace(/,/g, " · ")}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(event.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {app.notes && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mt-4">
          <h2 className="text-base font-semibold mb-2">Notes</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{app.notes}</p>
        </div>
      )}
    </div>
  );
}
