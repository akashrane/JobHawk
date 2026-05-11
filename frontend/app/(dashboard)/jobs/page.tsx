"use client";

import { useState } from "react";
import { Search, MapPin, Briefcase } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { formatDistanceToNow } from "date-fns";
import { formatSalary, scoreColor } from "@/lib/utils";
import Link from "next/link";

export default function JobsPage() {
  const [locationFilter, setLocationFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const params: Record<string, string> = {};
  if (locationFilter) params.location_type = locationFilter;
  if (sourceFilter) params.source = sourceFilter;

  const { data, isLoading } = useJobs(Object.keys(params).length ? params : undefined);
  const jobs = data?.data ?? [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Discovered Jobs</h1>
      <p className="text-gray-500 mb-6">{data?.total ?? 0} jobs found</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
        >
          <option value="">All locations</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">Onsite</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-800 dark:text-white"
        >
          <option value="">All sources</option>
          <option value="greenhouse">Greenhouse</option>
          <option value="lever">Lever</option>
          <option value="ashby">Ashby</option>
          <option value="jsearch">JSearch</option>
          <option value="adzuna">Adzuna</option>
          <option value="jobspy">JobSpy</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No jobs discovered yet</p>
          <p className="text-sm mt-1">The agent will discover jobs every 6 hours via cron.</p>
          <p className="text-sm mt-1">Make sure to upload a resume and configure your settings first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{job.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {(job as { companies?: { name: string } }).companies?.name ?? "Unknown company"}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </span>
                      )}
                      {(job.salary_min || job.salary_max) && (
                        <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                      )}
                      <span className="capitalize">{job.source}</span>
                      <span>{formatDistanceToNow(new Date(job.discovered_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {job.overall_score !== undefined && (
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-sm ${scoreColor(job.overall_score)}`}>
                      {job.overall_score}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
