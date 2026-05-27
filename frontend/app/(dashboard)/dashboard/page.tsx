import { createClient } from "@/lib/supabase/server";
import { StatsCards } from "@/components/stats-cards";
import Link from "next/link";
import { Sparkles, FileText, Briefcase, FilePlus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const firstName = user?.email?.split("@")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s your job search at a glance.</p>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Action cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/drafts/new" className="group">
          <div className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-2xl p-5 text-white h-full">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="font-semibold">Generate from JD</p>
            <p className="text-blue-200 text-sm mt-1">Paste any job description</p>
          </div>
        </Link>

        <Link href="/jobs" className="group">
          <div className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors rounded-2xl p-5 h-full">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center mb-4">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">Browse Jobs</p>
            <p className="text-gray-500 text-sm mt-1">View AI-scored matches</p>
          </div>
        </Link>

        <Link href="/drafts" className="group">
          <div className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors rounded-2xl p-5 h-full">
            <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-950 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">Review Drafts</p>
            <p className="text-gray-500 text-sm mt-1">Approve cover letters</p>
          </div>
        </Link>

        <Link href="/resume" className="group">
          <div className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors rounded-2xl p-5 h-full">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-950 rounded-xl flex items-center justify-center mb-4">
              <FilePlus className="w-5 h-5 text-green-600" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">Upload Resume</p>
            <p className="text-gray-500 text-sm mt-1">PDF or DOCX</p>
          </div>
        </Link>
      </div>

      {/* Getting started */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-2xl border border-blue-100 dark:border-blue-900 p-6">
        <h2 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-3">Getting Started</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { step: "1", text: "Upload your resume", href: "/resume" },
            { step: "2", text: "Set job preferences", href: "/settings" },
            { step: "3", text: "Agent discovers & scores jobs every 6h", href: "/jobs" },
            { step: "4", text: "Review drafts and apply", href: "/drafts" },
          ].map(({ step, text, href }) => (
            <Link key={step} href={href}>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step}
                </span>
                <p className="text-sm text-blue-800 dark:text-blue-200">{text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
