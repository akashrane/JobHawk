from fastapi import APIRouter

from api.deps import CurrentUser
from db.client import get_supabase_admin as get_supabase

router = APIRouter()


@router.get("/summary")
async def get_summary(user: CurrentUser = None):
    client = get_supabase()
    uid = user["id"]

    # Counts per application stage
    stage_result = (
        client.table("applications")
        .select("stage", count="exact")
        .eq("user_id", uid)
        .execute()
    )

    # Aggregate by stage in Python (supabase-py doesn't support GROUP BY directly)
    stage_counts: dict[str, int] = {}
    for row in (stage_result.data or []):
        stage_counts[row["stage"]] = stage_counts.get(row["stage"], 0) + 1

    # Pending drafts
    drafts_result = (
        client.table("drafts")
        .select("id", count="exact")
        .eq("user_id", uid)
        .eq("status", "pending")
        .execute()
    )

    # Jobs discovered in last 24h
    from datetime import datetime, timedelta, timezone
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    new_jobs_result = (
        client.table("jobs")
        .select("id", count="exact")
        .gte("discovered_at", since)
        .execute()
    )

    # High-score jobs (≥75) for this user
    high_score_result = (
        client.table("scores")
        .select("id", count="exact")
        .eq("user_id", uid)
        .gte("overall_score", 75)
        .execute()
    )

    # Upcoming follow-ups
    now = datetime.now(timezone.utc).isoformat()
    followup_result = (
        client.table("applications")
        .select("id", count="exact")
        .eq("user_id", uid)
        .lte("next_follow_up_at", now)
        .not_.in_("stage", ["rejected", "withdrawn", "archived", "accepted"])
        .execute()
    )

    return {
        "stage_counts": stage_counts,
        "pending_drafts": drafts_result.count or 0,
        "new_jobs_24h": new_jobs_result.count or 0,
        "high_score_jobs": high_score_result.count or 0,
        "follow_ups_due": followup_result.count or 0,
        "total_applications": sum(stage_counts.values()),
    }


@router.get("/by-source")
async def get_by_source(user: CurrentUser = None):
    client = get_supabase()
    result = (
        client.table("applications")
        .select("jobs(source)")
        .eq("user_id", user["id"])
        .execute()
    )
    source_counts: dict[str, int] = {}
    for row in (result.data or []):
        source = (row.get("jobs") or {}).get("source", "unknown")
        source_counts[source] = source_counts.get(source, 0) + 1
    return {"by_source": source_counts}
