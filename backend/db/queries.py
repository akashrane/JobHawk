"""Database query helpers — thin wrappers around supabase-py."""
from uuid import UUID

from supabase import Client


# ─── User profile ─────────────────────────────────────────────────────────────

async def get_user_profile(client: Client, user_id: str) -> dict | None:
    result = client.table("user_profiles").select("*").eq("id", user_id).single().execute()
    return result.data


async def upsert_user_profile(client: Client, user_id: str, data: dict) -> dict:
    data["id"] = user_id
    result = client.table("user_profiles").upsert(data).execute()
    return result.data[0]


# ─── Resumes ──────────────────────────────────────────────────────────────────

async def get_resumes(client: Client, user_id: str) -> list[dict]:
    result = (
        client.table("resumes")
        .select("id, label, file_name, is_primary, created_at, updated_at, parsed_content")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


async def get_resume_by_id(client: Client, resume_id: str, user_id: str) -> dict | None:
    result = (
        client.table("resumes")
        .select("*")
        .eq("id", resume_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return result.data


async def insert_resume(client: Client, data: dict) -> dict:
    result = client.table("resumes").insert(data).execute()
    return result.data[0]


async def set_primary_resume(client: Client, resume_id: str, user_id: str) -> None:
    # Clear all primaries first
    client.table("resumes").update({"is_primary": False}).eq("user_id", user_id).execute()
    client.table("resumes").update({"is_primary": True}).eq("id", resume_id).execute()


async def delete_resume(client: Client, resume_id: str, user_id: str) -> None:
    client.table("resumes").delete().eq("id", resume_id).eq("user_id", user_id).execute()


# ─── Jobs ─────────────────────────────────────────────────────────────────────

async def get_jobs(
    client: Client,
    user_id: str,
    page: int = 1,
    page_size: int = 20,
    min_score: int | None = None,
    location_type: str | None = None,
    source: str | None = None,
) -> tuple[list[dict], int]:
    query = (
        client.table("jobs")
        .select(
            "id, title, location, location_type, salary_min, salary_max, employment_type, source, discovered_at, "
            "companies(name), scores!left(overall_score)",
            count="exact",
        )
        .eq("is_active", True)
    )
    if location_type:
        query = query.eq("location_type", location_type)
    if source:
        query = query.eq("source", source)

    offset = (page - 1) * page_size
    result = query.range(offset, offset + page_size - 1).order("discovered_at", desc=True).execute()
    return result.data or [], result.count or 0


async def get_job_by_id(client: Client, job_id: str) -> dict | None:
    result = (
        client.table("jobs")
        .select("*, companies(name, website, logo_url, ats_platform)")
        .eq("id", job_id)
        .single()
        .execute()
    )
    return result.data


# ─── Scores ───────────────────────────────────────────────────────────────────

async def get_score(client: Client, user_id: str, job_id: str, resume_id: str) -> dict | None:
    result = (
        client.table("scores")
        .select("*")
        .eq("user_id", user_id)
        .eq("job_id", job_id)
        .eq("resume_id", resume_id)
        .single()
        .execute()
    )
    return result.data


async def upsert_score(client: Client, data: dict) -> dict:
    result = client.table("scores").upsert(data, on_conflict="user_id,job_id,resume_id").execute()
    return result.data[0]


# ─── Drafts ───────────────────────────────────────────────────────────────────

async def get_drafts(client: Client, user_id: str, status: str | None = None) -> list[dict]:
    query = (
        client.table("drafts")
        .select("id, job_id, resume_id, status, created_at, jobs(title, companies(name)), scores(overall_score)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
    )
    if status:
        query = query.eq("status", status)
    result = query.execute()
    return result.data or []


async def get_draft_by_id(client: Client, draft_id: str, user_id: str) -> dict | None:
    result = (
        client.table("drafts")
        .select("*, jobs(*, companies(*)), scores(*)")
        .eq("id", draft_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return result.data


async def insert_draft(client: Client, data: dict) -> dict:
    result = client.table("drafts").insert(data).execute()
    return result.data[0]


async def update_draft(client: Client, draft_id: str, user_id: str, data: dict) -> dict:
    result = (
        client.table("drafts")
        .update(data)
        .eq("id", draft_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0]


# ─── Applications ─────────────────────────────────────────────────────────────

async def get_applications(
    client: Client, user_id: str, stage: str | None = None
) -> list[dict]:
    query = (
        client.table("applications")
        .select("*, jobs(title, companies(name, logo_url))")
        .eq("user_id", user_id)
        .order("last_activity_at", desc=True)
    )
    if stage:
        query = query.eq("stage", stage)
    result = query.execute()
    return result.data or []


async def get_application_by_id(client: Client, app_id: str, user_id: str) -> dict | None:
    result = (
        client.table("applications")
        .select("*, jobs(*, companies(*)), application_events(*)")
        .eq("id", app_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return result.data


async def insert_application(client: Client, data: dict) -> dict:
    result = client.table("applications").insert(data).execute()
    return result.data[0]


async def update_application(client: Client, app_id: str, user_id: str, data: dict) -> dict:
    result = (
        client.table("applications")
        .update(data)
        .eq("id", app_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0]


async def insert_application_event(client: Client, data: dict) -> dict:
    result = client.table("application_events").insert(data).execute()
    return result.data[0]
