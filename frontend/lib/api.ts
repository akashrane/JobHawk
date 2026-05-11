import { createClient } from "./supabase/client";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Resume ───────────────────────────────────────────────────────────────────

export async function uploadResume(file: File, label: string) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(
    `${BACKEND_URL}/api/resume?label=${encodeURIComponent(label)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${session!.access_token}` },
      body: form,
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? "Upload failed");
  }
  return res.json();
}

export const getResumes = () => apiFetch<{ resumes: Resume[] }>("/api/resume");
export const getResume = (id: string) => apiFetch<Resume>(`/api/resume/${id}`);
export const setPrimaryResume = (id: string) =>
  apiFetch(`/api/resume/${id}/primary`, { method: "POST" });
export const deleteResume = (id: string) =>
  apiFetch(`/api/resume/${id}`, { method: "DELETE" });

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const getJobs = (params?: Record<string, string>) => {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<JobsResponse>(`/api/jobs${qs}`);
};
export const getJob = (id: string) => apiFetch<Job>(`/api/jobs/${id}`);

// ─── Drafts ───────────────────────────────────────────────────────────────────

export const getDrafts = (status?: string) =>
  apiFetch<{ drafts: Draft[] }>(`/api/drafts${status ? `?status=${status}` : ""}`);
export const getDraft = (id: string) => apiFetch<Draft>(`/api/drafts/${id}`);
export const generateDraft = (jobId: string) =>
  apiFetch(`/api/drafts/generate/${jobId}`, { method: "POST" });
export const approveDraft = (id: string) =>
  apiFetch<{ application_id: string; apply_url: string | null }>(
    `/api/drafts/${id}/approve`, { method: "POST" }
  );
export const rejectDraft = (id: string, feedback: string) =>
  apiFetch(`/api/drafts/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ feedback }),
  });
export const editDraft = (id: string, data: Partial<Draft>) =>
  apiFetch(`/api/drafts/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const generateCustomDraft = (data: {
  job_title: string;
  company_name: string;
  job_description: string;
}) =>
  apiFetch<{ draft_id: string }>("/api/drafts/generate-custom", {
    method: "POST",
    body: JSON.stringify(data),
  });

export async function downloadTailoredResume(id: string): Promise<void> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const res = await fetch(`${BACKEND_URL}/api/drafts/${id}/resume`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Download failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="([^"]+)"/);
  a.download = match?.[1] ?? "Resume_Tailored.docx";
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Applications ─────────────────────────────────────────────────────────────

export const getApplications = (stage?: string) =>
  apiFetch<{ applications: Application[] }>(
    `/api/applications${stage ? `?stage=${stage}` : ""}`,
  );
export const getApplication = (id: string) =>
  apiFetch<Application>(`/api/applications/${id}`);
export const updateStage = (id: string, stage: string) =>
  apiFetch(`/api/applications/${id}/stage`, {
    method: "PUT",
    body: JSON.stringify({ stage }),
  });
export const addNote = (id: string, note: string) =>
  apiFetch(`/api/applications/${id}/note`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });

// ─── Settings ─────────────────────────────────────────────────────────────────

export const getSettings = () => apiFetch<UserSettings>("/api/settings");
export const updateSettings = (data: Partial<UserSettings>) =>
  apiFetch<UserSettings>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getAnalyticsSummary = () =>
  apiFetch<AnalyticsSummary>("/api/analytics/summary");

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Resume {
  id: string;
  label: string;
  file_name: string;
  is_primary: boolean;
  created_at: string;
  parsed_content?: ParsedResume;
  download_url?: string;
}

export interface ParsedResume {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  certifications: string[];
}

export interface Experience {
  company: string;
  title: string;
  start_date: string;
  end_date?: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  graduation_date?: string;
  gpa?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface Job {
  id: string;
  title: string;
  location?: string;
  location_type?: string;
  salary_min?: number;
  salary_max?: number;
  employment_type?: string;
  source: string;
  discovered_at: string;
  description?: string;
  required_skills?: string[];
  nice_to_have_skills?: string[];
  apply_url?: string;
  source_url?: string;
  companies?: { name: string; website?: string; logo_url?: string };
  overall_score?: number;
}

export interface JobsResponse {
  data: Job[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface Draft {
  id: string;
  job_id: string;
  resume_id: string;
  status: "pending" | "approved" | "rejected" | "edited";
  cover_letter?: string;
  cover_letter_edited?: string;
  resume_diff?: ResumeDiff;
  screening_answers?: ScreeningAnswer[];
  created_at: string;
  jobs?: { title: string; companies?: { name: string } };
  scores?: { overall_score: number };
}

export interface ResumeDiff {
  changes: DiffChange[];
  summary_of_changes: string;
}

export interface DiffChange {
  section: string;
  company?: string;
  field: string;
  original: string;
  modified: string;
  reason: string;
}

export interface ScreeningAnswer {
  question: string;
  answer: string;
  source_field?: string;
  confidence?: number;
}

export interface Application {
  id: string;
  job_id: string;
  stage: string;
  applied_at?: string;
  last_activity_at: string;
  notes?: string;
  next_follow_up_at?: string;
  follow_up_count: number;
  created_at: string;
  jobs?: { title: string; companies?: { name: string; logo_url?: string } };
  application_events?: ApplicationEvent[];
}

export interface ApplicationEvent {
  id: string;
  event: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface UserSettings {
  id: string;
  full_name?: string;
  email?: string;
  target_roles: string[];
  target_locations: string[];
  min_salary?: number;
  max_salary?: number;
  experience_years?: number;
  preferred_company_sizes: string[];
  excluded_companies: string[];
  work_authorization?: string;
  willing_to_relocate: boolean;
  daily_apply_cap: number;
  min_score_threshold: number;
}

export interface AnalyticsSummary {
  stage_counts: Record<string, number>;
  pending_drafts: number;
  new_jobs_24h: number;
  high_score_jobs: number;
  follow_ups_due: number;
  total_applications: number;
}
