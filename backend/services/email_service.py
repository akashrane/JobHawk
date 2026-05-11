"""Resend email notifications."""
import logging

import resend

from config import settings

logger = logging.getLogger(__name__)

resend.api_key = settings.resend_api_key


def send_daily_digest(
    to_email: str,
    new_jobs: list[dict],
    pending_drafts: list[dict],
    follow_ups: list[dict],
) -> bool:
    """Send the daily digest email. Returns True on success."""
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not configured; skipping email")
        return False

    html = _build_digest_html(new_jobs, pending_drafts, follow_ups)
    try:
        resend.Emails.send({
            "from": "JobHawk <notifications@jobhawk.app>",
            "to": [to_email],
            "subject": f"JobHawk Daily Digest — {len(new_jobs)} new matches, {len(pending_drafts)} drafts pending",
            "html": html,
        })
        logger.info("Digest sent to %s", to_email)
        return True
    except Exception as exc:
        logger.error("Failed to send digest: %s", exc)
        return False


def send_follow_up_reminder(to_email: str, applications: list[dict]) -> bool:
    if not settings.resend_api_key:
        return False
    rows = "".join(
        f"<tr><td>{a['job_title']}</td><td>{a['company']}</td><td>{a['days_since_applied']}d ago</td></tr>"
        for a in applications
    )
    html = f"""
    <h2>Follow-up Reminders</h2>
    <table border="1" cellpadding="6">
      <thead><tr><th>Role</th><th>Company</th><th>Applied</th></tr></thead>
      <tbody>{rows}</tbody>
    </table>
    <p>Log in to JobHawk to send your follow-ups.</p>
    """
    try:
        resend.Emails.send({
            "from": "JobHawk <notifications@jobhawk.app>",
            "to": [to_email],
            "subject": f"JobHawk — {len(applications)} follow-up(s) due today",
            "html": html,
        })
        return True
    except Exception as exc:
        logger.error("Failed to send follow-up reminder: %s", exc)
        return False


def _build_digest_html(new_jobs: list[dict], pending_drafts: list[dict], follow_ups: list[dict]) -> str:
    job_rows = "".join(
        f"<tr><td>{j['title']}</td><td>{j['company']}</td><td>{j['score']}</td><td>{j['location']}</td></tr>"
        for j in new_jobs
    )
    draft_rows = "".join(
        f"<tr><td>{d['job_title']}</td><td>{d['company']}</td><td>{d['score']}</td></tr>"
        for d in pending_drafts
    )
    followup_rows = "".join(
        f"<tr><td>{f['job_title']}</td><td>{f['company']}</td><td>{f['due']}</td></tr>"
        for f in follow_ups
    )

    return f"""
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px;">
  <h1 style="color: #2563eb;">JobHawk Daily Digest</h1>

  <h2>🆕 New High-Score Matches ({len(new_jobs)})</h2>
  <table border="1" cellpadding="6" width="100%">
    <thead><tr><th>Role</th><th>Company</th><th>Score</th><th>Location</th></tr></thead>
    <tbody>{job_rows or "<tr><td colspan='4'>No new matches today</td></tr>"}</tbody>
  </table>

  <h2>📝 Drafts Awaiting Review ({len(pending_drafts)})</h2>
  <table border="1" cellpadding="6" width="100%">
    <thead><tr><th>Role</th><th>Company</th><th>Score</th></tr></thead>
    <tbody>{draft_rows or "<tr><td colspan='3'>No pending drafts</td></tr>"}</tbody>
  </table>

  <h2>🔔 Follow-up Reminders ({len(follow_ups)})</h2>
  <table border="1" cellpadding="6" width="100%">
    <thead><tr><th>Role</th><th>Company</th><th>Due</th></tr></thead>
    <tbody>{followup_rows or "<tr><td colspan='3'>No follow-ups due</td></tr>"}</tbody>
  </table>

  <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
    JobHawk — AI-powered job application agent
  </p>
</body>
</html>
"""
