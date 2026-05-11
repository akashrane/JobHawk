"use client";

import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { useDrafts } from "@/hooks/use-drafts";
import { formatDistanceToNow } from "date-fns";
import { scoreColor } from "@/lib/utils";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  edited: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function DraftsPage() {
  const { data: drafts = [], isLoading } = useDrafts();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Drafts</h1>
        <Link
          href="/drafts/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Draft from JD
        </Link>
      </div>
      <p className="text-gray-500 mb-6">Review AI-generated cover letters and resume tweaks before applying.</p>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No drafts yet</p>
          <p className="text-sm mt-1">Click &quot;Generate Draft&quot; on any high-scoring job to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => {
            const score = (draft as { scores?: { overall_score: number } }).scores?.overall_score;
            const job = draft.jobs as { title: string; companies?: { name: string } } | undefined;
            return (
              <Link key={draft.id} href={`/drafts/${draft.id}`}>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-blue-300 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{job?.title ?? "Unknown role"}</h3>
                      <p className="text-sm text-gray-500">{job?.companies?.name ?? "Unknown company"}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(draft.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {score !== undefined && (
                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-sm ${scoreColor(score)}`}>
                          {score}
                        </div>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${STATUS_BADGE[draft.status] ?? ""}`}>
                        {draft.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
