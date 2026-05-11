from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# ─── Resume ───────────────────────────────────────────────────────────────────

class Experience(BaseModel):
    company: str
    title: str
    start_date: str
    end_date: str | None = None
    bullets: list[str] = []


class Education(BaseModel):
    institution: str
    degree: str
    field: str | None = None
    graduation_date: str | None = None
    gpa: str | None = None


class Project(BaseModel):
    name: str
    description: str | None = None
    technologies: list[str] = []
    url: str | None = None


class ParsedResume(BaseModel):
    name: str = ""
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    summary: str | None = None
    experience: list[Experience] = []
    education: list[Education] = []
    skills: list[str] = []
    projects: list[Project] = []
    certifications: list[str] = []


class ResumeRecord(BaseModel):
    id: UUID
    user_id: UUID
    label: str
    file_path: str
    file_name: str
    parsed_content: ParsedResume | None = None
    raw_text: str | None = None
    is_primary: bool = False
    created_at: datetime
    updated_at: datetime


# ─── Job ──────────────────────────────────────────────────────────────────────

class JobRecord(BaseModel):
    id: UUID
    company_id: UUID | None = None
    source: str
    source_id: str | None = None
    source_url: str | None = None
    apply_url: str | None = None
    title: str
    description: str
    location: str | None = None
    location_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str = "USD"
    employment_type: str | None = None
    seniority_level: str | None = None
    required_skills: list[str] = []
    nice_to_have_skills: list[str] = []
    requirements_summary: str | None = None
    is_active: bool = True
    posted_at: datetime | None = None
    discovered_at: datetime
    created_at: datetime


class JobListItem(BaseModel):
    """Lightweight job for list views — omits description and embedding."""
    id: UUID
    title: str
    location: str | None = None
    location_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    employment_type: str | None = None
    source: str
    discovered_at: datetime
    company_name: str | None = None
    overall_score: int | None = None


# ─── Score ────────────────────────────────────────────────────────────────────

class ScoreRecord(BaseModel):
    id: UUID
    user_id: UUID
    job_id: UUID
    resume_id: UUID
    overall_score: int
    skills_score: int | None = None
    experience_score: int | None = None
    domain_score: int | None = None
    bonus_score: int | None = None
    alignment_score: int | None = None
    matched_skills: list[str] = []
    missing_skills: list[str] = []
    matched_experience: list[str] = []
    scoring_rationale: str | None = None
    cosine_similarity: float | None = None
    created_at: datetime


# ─── Draft ────────────────────────────────────────────────────────────────────

class ResumeDiffChange(BaseModel):
    section: str
    company: str | None = None
    field: str
    original: str
    modified: str
    reason: str


class ResumeDiff(BaseModel):
    changes: list[ResumeDiffChange] = []
    summary_of_changes: str = ""


class ScreeningAnswer(BaseModel):
    question: str
    answer: str
    source_field: str | None = None
    confidence: float | None = None


class DraftRecord(BaseModel):
    id: UUID
    user_id: UUID
    job_id: UUID
    score_id: UUID | None = None
    resume_id: UUID
    status: str
    cover_letter: str | None = None
    cover_letter_edited: str | None = None
    resume_diff: ResumeDiff | None = None
    screening_answers: list[ScreeningAnswer] = []
    generation_metadata: dict[str, Any] | None = None
    reviewed_at: datetime | None = None
    user_feedback: str | None = None
    created_at: datetime


# ─── Application ──────────────────────────────────────────────────────────────

class ApplicationRecord(BaseModel):
    id: UUID
    user_id: UUID
    job_id: UUID
    draft_id: UUID | None = None
    resume_id: UUID | None = None
    stage: str
    applied_at: datetime | None = None
    last_activity_at: datetime
    notes: str | None = None
    salary_offered: int | None = None
    rejection_reason: str | None = None
    next_follow_up_at: datetime | None = None
    follow_up_count: int = 0
    created_at: datetime
    updated_at: datetime


class ApplicationEventRecord(BaseModel):
    id: UUID
    application_id: UUID
    event: str
    details: dict[str, Any] | None = None
    created_at: datetime


# ─── User Profile ─────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    id: UUID
    full_name: str | None = None
    email: str | None = None
    target_roles: list[str] = []
    target_locations: list[str] = []
    min_salary: int | None = None
    max_salary: int | None = None
    experience_years: int | None = None
    preferred_company_sizes: list[str] = []
    excluded_companies: list[str] = []
    work_authorization: str | None = None
    willing_to_relocate: bool = False
    daily_apply_cap: int = 10
    min_score_threshold: int = 75
    created_at: datetime
    updated_at: datetime


# ─── Paginated response ───────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    data: list[Any]
    total: int
    page: int
    page_size: int
    has_more: bool
