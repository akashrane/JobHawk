"use client";

import { useState } from "react";
import { MapPin, Briefcase, Building2, Clock, DollarSign } from "lucide-react";
import { useJobs } from "@/hooks/use-jobs";
import { formatDistanceToNow } from "date-fns";
import { formatSalary, scoreColor } from "@/lib/utils";
import Link from "next/link";

const LOCATION_TYPE_BADGE: Record<string, string> = {
  remote: "bg-green-50 text-green-700 border-green-200",
  hybrid: "bg-yellow-50 text-yellow-700 border-yellow-200",
  onsite: "bg-blue-50 text-blue-700 border-blue-200",
};

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discovered Jobs</h1>
        <p className="text-gray-500 mt-1">
          {data?.total ?? 0} jobs matched · updated every 6 hours
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: "", label: "All locations" },
          { value: "remote", label: "Remote" },
          { value: "hybrid", label: "Hybrid" },
          { value: "onsite", label: "On-site" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setLocationFilter(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              locationFilter === value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300"
            }`}
          >
            {label}
          </button>
        ))}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-full text-sm dark:bg-gray-900 dark:text-gray-400 text-gray-600 focus:outline-none focus:border-blue-400"
        >
          <option value="">All sources</option>
          <option value="greenhouse">Greenhouse</option>
          <option value="lever">Lever</option>
          <option value="ashby">Ashby</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7 opacity-40" />
          </div>
          <p className="font-semibold text-gray-600 dark:text-gray-300">No jobs discovered yet</p>
          <p className="text-sm mt-2 max-w-xs mx-auto">The agent discovers jobs every 6 hours. Make sure your resume and settings are configured.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const company = (job as { companies?: { name: string } }).companies;
            const score = job.overall_score;
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {job.title}
                        </h3>
                        {job.location_type && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${LOCATION_TYPE_BADGE[job.location_type] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                            {job.location_type}
                          </span>
                        )}
                      </div>

                      {/* Company + location */}
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                          {company?.name ?? "Unknown company"}
                        </span>
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            {job.location}
                          </span>
                        )}
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        {(job.salary_min || job.salary_max) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatSalary(job.salary_min, job.salary_max)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(job.discovered_at), { addSuffix: true })}
                        </span>
                        <span className="capitalize bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                          {job.source}
                        </span>
                      </div>
                    </div>

                    {/* Score badge */}
                    {score !== undefined && (
                      <div className={`flex-shrink-0 w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center font-bold ${scoreColor(score)}`}>
                        <span className="text-lg leading-none">{score}</span>
                        <span className="text-[10px] opacity-60 font-normal">match</span>
                      </div>
                    )}
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
