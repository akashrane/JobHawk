import { createClient } from "@/lib/supabase/server";
import { StatsCards } from "@/components/stats-cards";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Good morning{user?.email ? `, ${user.email.split("@")[0]}` : ""}!
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your job search.</p>
      </div>

      <StatsCards />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/resume"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-2xl">📄</span>
              <div>
                <p className="font-medium text-sm">Upload Resume</p>
                <p className="text-xs text-gray-500">Parse and embed your resume</p>
              </div>
            </a>
            <a
              href="/settings"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-2xl">⚙️</span>
              <div>
                <p className="font-medium text-sm">Configure Preferences</p>
                <p className="text-xs text-gray-500">Set target roles, salary, and locations</p>
              </div>
            </a>
            <a
              href="/jobs"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-2xl">🔍</span>
              <div>
                <p className="font-medium text-sm">Browse Discovered Jobs</p>
                <p className="text-xs text-gray-500">See AI-scored matches</p>
              </div>
            </a>
            <a
              href="/drafts"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-2xl">✏️</span>
              <div>
                <p className="font-medium text-sm">Review Drafts</p>
                <p className="text-xs text-gray-500">Approve cover letters and resume tweaks</p>
              </div>
            </a>
            <a
              href="/drafts/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-2xl">⚡</span>
              <div>
                <p className="font-medium text-sm">Generate Draft from JD</p>
                <p className="text-xs text-gray-500">Paste any job description, get instant drafts</p>
              </div>
            </a>
          </div>
        </div>

        {/* Getting started */}
        <div className="bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <h2 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
            Getting Started
          </h2>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
            Follow these steps to start receiving job matches:
          </p>
          <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="font-bold min-w-[20px]">1.</span>
              <span>Upload your resume in the <a href="/resume" className="underline font-medium">Resume</a> page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold min-w-[20px]">2.</span>
              <span>Set your job preferences in <a href="/settings" className="underline font-medium">Settings</a></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold min-w-[20px]">3.</span>
              <span>The agent discovers and scores jobs every 6 hours via cron</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold min-w-[20px]">4.</span>
              <span>Review AI-generated drafts and approve to apply</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
