import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min?: number, max?: number, currency = "USD"): string {
  if (!min && !max) return "Salary not listed";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

export function scoreColor(score: number): string {
  if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
  if (score >= 75) return "text-yellow-700 bg-yellow-50 border-yellow-200";
  if (score >= 60) return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-red-600 bg-red-50 border-red-200";
}

export function scoreBg(score: number): string {
  if (score >= 90) return "bg-green-500";
  if (score >= 75) return "bg-yellow-500";
  if (score >= 60) return "bg-orange-500";
  return "bg-red-500";
}

export function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    saved: "Saved",
    applied: "Applied",
    screening: "Screening",
    phone_screen: "Phone Screen",
    technical: "Technical",
    onsite: "Onsite",
    offer: "Offer",
    accepted: "Accepted",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    archived: "Archived",
  };
  return labels[stage] ?? stage;
}
