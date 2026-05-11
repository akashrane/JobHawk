"""Follow-up reminder script — runs via GitHub Actions at 9am ET."""
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main():
    from config import settings
    from db.client import get_supabase_admin
    from services.email_service import send_follow_up_reminder

    if not settings.notification_email:
        logger.error("NOTIFICATION_EMAIL not configured")
        return

    client = get_supabase_admin()
    now = datetime.now(timezone.utc).isoformat()

    result = (
        client.table("applications")
        .select("id, next_follow_up_at, jobs(title, companies(name)), applied_at")
        .lte("next_follow_up_at", now)
        .not_.in_("stage", ["rejected", "withdrawn", "archived", "accepted"])
        .execute()
    )

    apps = result.data or []
    if not apps:
        logger.info("No follow-ups due today")
        return

    follow_ups = []
    app_ids = []
    for app in apps:
        job = app.get("jobs") or {}
        company = (job.get("companies") or {}).get("name", "")
        applied_at = app.get("applied_at")
        days = (
            (datetime.now(timezone.utc) - datetime.fromisoformat(applied_at)).days
            if applied_at else "?"
        )
        follow_ups.append({
            "job_title": job.get("title", "Unknown"),
            "company": company,
            "days_since_applied": days,
        })
        app_ids.append(app["id"])

    send_follow_up_reminder(settings.notification_email, follow_ups)

    # Clear the follow_up date so it doesn't retrigger
    for aid in app_ids:
        client.table("applications").update({
            "next_follow_up_at": None,
            "follow_up_count": client.rpc("follow_up_count_increment", {"row_id": aid}),
        }).eq("id", aid).execute()

    logger.info("Sent follow-up reminders for %d applications", len(apps))


if __name__ == "__main__":
    main()
