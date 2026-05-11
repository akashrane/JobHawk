"""Daily digest email — runs via GitHub Actions at 8am ET."""
import logging
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main():
    from config import settings
    from db.client import get_supabase_admin
    from services.email_service import send_daily_digest

    if not settings.notification_email:
        logger.error("NOTIFICATION_EMAIL not configured")
        return

    client = get_supabase_admin()
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

    # New high-score jobs
    new_jobs_result = (
        client.table("scores")
        .select("overall_score, jobs(title, location, companies(name))")
        .gte("created_at", since)
        .gte("overall_score", 75)
        .order("overall_score", desc=True)
        .limit(10)
        .execute()
    )
    new_jobs = [
        {
            "title": (r.get("jobs") or {}).get("title", ""),
            "company": ((r.get("jobs") or {}).get("companies") or {}).get("name", ""),
            "score": r.get("overall_score", 0),
            "location": (r.get("jobs") or {}).get("location", ""),
        }
        for r in (new_jobs_result.data or [])
    ]

    # Pending drafts
    drafts_result = (
        client.table("drafts")
        .select("id, jobs(title, companies(name)), scores(overall_score)")
        .eq("status", "pending")
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    pending_drafts = [
        {
            "job_title": (r.get("jobs") or {}).get("title", ""),
            "company": ((r.get("jobs") or {}).get("companies") or {}).get("name", ""),
            "score": (r.get("scores") or {}).get("overall_score", 0),
        }
        for r in (drafts_result.data or [])
    ]

    # Follow-ups due
    now = datetime.now(timezone.utc).isoformat()
    followup_result = (
        client.table("applications")
        .select("next_follow_up_at, jobs(title, companies(name))")
        .lte("next_follow_up_at", now)
        .not_.in_("stage", ["rejected", "withdrawn", "archived", "accepted"])
        .limit(10)
        .execute()
    )
    follow_ups = [
        {
            "job_title": (r.get("jobs") or {}).get("title", ""),
            "company": ((r.get("jobs") or {}).get("companies") or {}).get("name", ""),
            "due": r.get("next_follow_up_at", ""),
        }
        for r in (followup_result.data or [])
    ]

    success = send_daily_digest(settings.notification_email, new_jobs, pending_drafts, follow_ups)
    logger.info("Digest sent: %s", success)


if __name__ == "__main__":
    main()
