"use client";

import { useParams, useRouter } from "next/navigation";
import { useJob } from "@/hooks/use-jobs";
import { useGenerateDraft } from "@/hooks/use-drafts";
import { formatSalary, scoreColor } from "@/lib/utils";
import { ArrowLeft, ExternalLink, Wand2 } from "lucide-react";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: job, isLoading } = useJob(id);
  const generate = useGenerateDraft();

  async function handleGenerate() {
    const result = await generate.mutateAsync(id) as { draft_id: string };
    router.push(`/drafts/${result.draft_id}`);
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!job) return <div className="p-8 text-gray-500">Job not found.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to jobs
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
          <p className="text-gray-500 mt-1">
            {job.companies?.name} {job.location && `· ${job.location}`}
          </p>
          {(job.salary_min || job.salary_max) && (
            <p className="text-sm text-gray-500 mt-1">{formatSalary(job.salary_min, job.salary_max)}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {job.overall_score !== undefined && (
            <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center ${scoreColor(job.overall_score)}`}>
              <span className="font-bold text-lg leading-none">{job.overall_score}</span>
              <span className="text-xs opacity-70">score</span>
            </div>
          )}
          {job.source_url && (
            <a
              href={job.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View posting
            </a>
          )}
          <button
            onClick={handleGenerate}
            disabled={generate.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            {generate.isPending ? "Generating..." : "Generate Draft"}
          </button>
        </div>
      </div>

      {/* Skills */}
      {job.required_skills && job.required_skills.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-2">Required Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {job.required_skills.map((skill) => (
              <span key={skill} className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold mb-4">Job Description</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
          {job.description}
        </div>
      </div>

      {generate.isError && (
        <p className="text-red-600 text-sm mt-4">{(generate.error as Error).message}</p>
      )}
    </div>
  );
}
