"use client";

import { useEffect, useState } from "react";
import { Plus, X, Save } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import type { UserSettings } from "@/lib/api";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState<Partial<UserSettings>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  async function handleSave() {
    await update.mutateAsync(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (isLoading) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your job search preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={update.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {update.isPending ? "Saving..." : saved ? "Saved!" : "Save changes"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic info */}
        <Section title="Profile">
          <Field label="Full name">
            <input
              type="text"
              value={form.full_name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              placeholder="Jane Doe"
              className={inputCls}
            />
          </Field>
        </Section>

        {/* Target roles */}
        <Section title="Target Roles">
          <p className="text-sm text-gray-500 mb-2">Job titles you want to be matched against</p>
          <TagInput
            tags={form.target_roles ?? []}
            onChange={(tags) => setForm((f) => ({ ...f, target_roles: tags }))}
            placeholder="Add a role (e.g. Software Engineer)"
          />
        </Section>

        {/* Target locations */}
        <Section title="Target Locations">
          <p className="text-sm text-gray-500 mb-2">Add &quot;Remote&quot; to include remote roles</p>
          <TagInput
            tags={form.target_locations ?? []}
            onChange={(tags) => setForm((f) => ({ ...f, target_locations: tags }))}
            placeholder="Add a location (e.g. Remote, New York, NY)"
          />
        </Section>

        {/* Salary */}
        <Section title="Salary Expectations (USD / year)">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Minimum">
              <input
                type="number"
                value={form.min_salary ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, min_salary: Number(e.target.value) || undefined }))}
                placeholder="80000"
                className={inputCls}
              />
            </Field>
            <Field label="Maximum">
              <input
                type="number"
                value={form.max_salary ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, max_salary: Number(e.target.value) || undefined }))}
                placeholder="150000"
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        {/* Experience */}
        <Section title="Experience">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Years of experience">
              <input
                type="number"
                value={form.experience_years ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, experience_years: Number(e.target.value) || undefined }))}
                placeholder="5"
                className={inputCls}
              />
            </Field>
            <Field label="Work authorization">
              <select
                value={form.work_authorization ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, work_authorization: e.target.value }))}
                className={inputCls}
              >
                <option value="">Select...</option>
                <option>US Citizen</option>
                <option>Green Card</option>
                <option>H1B</option>
                <option>OPT/STEM OPT</option>
                <option>TN Visa</option>
                <option>Other</option>
              </select>
            </Field>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              id="relocate"
              checked={form.willing_to_relocate ?? false}
              onChange={(e) => setForm((f) => ({ ...f, willing_to_relocate: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="relocate" className="text-sm text-gray-700 dark:text-gray-300">
              Willing to relocate
            </label>
          </div>
        </Section>

        {/* Company size */}
        <Section title="Preferred Company Sizes">
          <div className="flex flex-wrap gap-2">
            {["startup", "mid", "enterprise"].map((size) => {
              const active = (form.preferred_company_sizes ?? []).includes(size);
              return (
                <button
                  key={size}
                  onClick={() => {
                    const current = form.preferred_company_sizes ?? [];
                    setForm((f) => ({
                      ...f,
                      preferred_company_sizes: active
                        ? current.filter((s) => s !== size)
                        : [...current, size],
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                    active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400"
                  }`}
                >
                  {size === "mid" ? "Mid-size" : size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Excluded companies */}
        <Section title="Excluded Companies">
          <p className="text-sm text-gray-500 mb-2">Companies you don&apos;t want to apply to</p>
          <TagInput
            tags={form.excluded_companies ?? []}
            onChange={(tags) => setForm((f) => ({ ...f, excluded_companies: tags }))}
            placeholder="Add company name"
          />
        </Section>

        {/* Agent settings */}
        <Section title="Agent Behavior">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Daily application cap">
              <input
                type="number"
                value={form.daily_apply_cap ?? 10}
                onChange={(e) => setForm((f) => ({ ...f, daily_apply_cap: Number(e.target.value) }))}
                min={1}
                max={50}
                className={inputCls}
              />
            </Field>
            <Field label="Minimum score threshold">
              <input
                type="number"
                value={form.min_score_threshold ?? 75}
                onChange={(e) => setForm((f) => ({ ...f, min_score_threshold: Number(e.target.value) }))}
                min={0}
                max={100}
                className={inputCls}
              />
              <p className="text-xs text-gray-400 mt-1">Jobs below this score won&apos;t get drafts</p>
            </Field>
          </div>
        </Section>
      </div>

      {update.isError && (
        <p className="text-red-600 text-sm mt-4">{(update.error as Error).message}</p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="text-base font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  );
}

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput("");
  }

  function remove(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            {tag}
            <button
              onClick={() => remove(tag)}
              className="hover:text-red-500 ml-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className={`${inputCls} flex-1 max-w-xs`}
        />
        <button
          onClick={add}
          className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
