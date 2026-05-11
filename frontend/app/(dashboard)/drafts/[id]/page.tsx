"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle, XCircle, ExternalLink, Download } from "lucide-react";
import { useDraft, useApproveDraft, useRejectDraft } from "@/hooks/use-drafts";
import { downloadTailoredResume } from "@/lib/api";
import { scoreColor } from "@/lib/utils";

export default function DraftReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: draft, isLoading } = useDraft(id);
  const approve = useApproveDraft();
  const reject = useRejectDraft();

  const [tab, setTab] = useState<"cover-letter" | "resume-diff">("cover-letter");
  const [feedback, setFeedback] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadTailoredResume(id);
    } catch (err) {
      alert("Download failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloading(false);
    }
  }

  async function handleApprove() {
    const result = await approve.mutateAsync(id) as { application_id: string; apply_url?: string };
    if (result.apply_url) window.open(result.apply_url, "_blank");
    router.push(`/applications/${result.application_id}`);
  }

  async function handleReject() {
    await reject.mutateAsync({ id, feedback });
    router.push("/drafts");
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!draft) return <div className="p-8 text-gray-500">Draft not found.</div>;

  const job = draft.jobs as { title: string; companies?: { name: string } } | undefined;
  const score = (draft as { scores?: { overall_score: number } }).scores?.overall_score;

  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">{job?.title}</h1>
            <p className="text-sm text-gray-500">{job?.companies?.name}</p>
          </div>
          {score !== undefined && (
            <div className={`w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-sm ${scoreColor(score)}`}>
              {score}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? "Generating..." : "Download Resume"}
          </button>
          <button
            onClick={() => setShowReject(!showReject)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={approve.isPending || draft.status === "approved"}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <ExternalLink className="w-3 h-3" />
            {approve.isPending ? "Approving..." : "Approve & Open Apply Page"}
          </button>
        </div>
      </div>

      {/* Reject panel */}
      {showReject && (
        <div className="px-6 py-3 border-b border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Optional feedback (helps the agent improve)"
              className="flex-1 px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg text-sm dark:bg-red-900"
            />
            <button
              onClick={handleReject}
              disabled={reject.isPending}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
            >
              {reject.isPending ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            {(["cover-letter", "resume-diff"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "cover-letter" ? "Cover Letter" : "Resume Diff"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-6">
            {tab === "cover-letter" && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                    {draft.cover_letter_edited ?? draft.cover_letter ?? "No cover letter generated."}
                  </pre>
                </div>
              </div>
            )}

            {tab === "resume-diff" && (
              <div className="max-w-3xl mx-auto space-y-4">
                {!draft.resume_diff?.changes?.length ? (
                  <div className="text-center py-10 text-gray-400">No resume changes suggested.</div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      {draft.resume_diff.summary_of_changes}
                    </p>
                    {draft.resume_diff.changes.map((change, i) => (
                      <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded capitalize">
                            {change.section}
                          </span>
                          {change.company && (
                            <span className="text-xs text-gray-400">@ {change.company}</span>
                          )}
                          <span className="text-xs text-gray-400">{change.field}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-1">Before</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-950 p-2 rounded border border-red-200 dark:border-red-800">
                              {change.original}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-1">After</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-950 p-2 rounded border border-green-200 dark:border-green-800">
                              {change.modified}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 italic">{change.reason}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
