"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { generateCustomDraft } from "@/lib/api";

export default function NewDraftPage() {
  const router = useRouter();

  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await generateCustomDraft({
        job_title: jobTitle.trim() || "Custom Job",
        company_name: companyName.trim(),
        job_description: jobDescription.trim(),
      });
      router.push(`/drafts/${result.draft_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Generate Draft from Job Description
        </h1>
        <p className="text-gray-500 mt-1">
          Found a job anywhere on the web? Paste the description and get a tailored
          cover letter and resume in seconds.
        </p>
      </div>

      <div className="space-y-5">
        {/* Job title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Job Title
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Company name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Stripe"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Job description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={16}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            {jobDescription.length.toLocaleString()} characters
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !jobDescription.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating — this takes ~30 seconds…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Cover Letter &amp; Resume Diff
            </>
          )}
        </button>

        {loading && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Hang tight — the AI is working on it</p>
            <ul className="space-y-0.5 text-blue-700 dark:text-blue-300 text-xs">
              <li>① Scoring your resume against the job description</li>
              <li>② Writing a personalised cover letter</li>
              <li>③ Suggesting resume tweaks to match the JD language</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
