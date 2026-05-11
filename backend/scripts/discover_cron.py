"""
Standalone job discovery script — runs via GitHub Actions every 6 hours.
Usage: python backend/scripts/discover_cron.py
"""
import json
import logging
import sys
import time
from pathlib import Path

# Ensure backend package is importable when run as a script
sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main():
    from config import settings
    from db.client import get_supabase_admin
    from sources.greenhouse import fetch_greenhouse_jobs
    from sources.lever import fetch_lever_jobs
    from sources.ashby import fetch_ashby_jobs
    from sources.dedup import is_duplicate, make_description_hash

    client = get_supabase_admin()
    start = time.monotonic()
    stats = {"discovered": 0, "new": 0, "skipped": 0, "errors": 0}

    # 1. Fetch seeded companies
    companies_result = client.table("companies").select("*").execute()
    companies = companies_result.data or []
    logger.info("Loaded %d companies", len(companies))

    # Fetch all user settings to know what to search for
    profiles_result = client.table("user_profiles").select("target_roles,target_locations").execute()
    profiles = profiles_result.data or []
    all_roles = list({role for p in profiles for role in (p.get("target_roles") or [])})
    all_locations = list({loc for p in profiles for loc in (p.get("target_locations") or [])})
    logger.info("Searching for roles: %s in locations: %s", all_roles, all_locations)

    new_jobs: list[dict] = []

    # 2. Fetch from ATS boards
    for company in companies:
        slug = company.get("slug")
        platform = company.get("ats_platform")
        if not slug:
            continue
        try:
            if platform == "greenhouse":
                jobs = fetch_greenhouse_jobs(slug, company["id"])
            elif platform == "lever":
                jobs = fetch_lever_jobs(slug, company["id"])
            elif platform == "ashby":
                jobs = fetch_ashby_jobs(slug, company["id"])
            else:
                continue
            stats["discovered"] += len(jobs)
            for job in jobs:
                h = make_description_hash(company.get("name", ""), job["title"], job["description"])
                if is_duplicate(client, job["source"], job.get("source_id"), h):
                    stats["skipped"] += 1
                    continue
                job["description_hash"] = h
                new_jobs.append(job)
                stats["new"] += 1
        except Exception as exc:
            logger.error("Error fetching %s/%s: %s", platform, slug, exc)
            stats["errors"] += 1

    # 3. Insert new jobs in batches (embeddings omitted until pgvector enabled in Phase 2)
    BATCH = 32
    for i in range(0, len(new_jobs), BATCH):
        batch = new_jobs[i:i + BATCH]
        try:
            client.table("jobs").upsert(
                batch,
                on_conflict="source,source_id",
                ignore_duplicates=False,
            ).execute()
        except Exception as exc:
            logger.error("DB insert batch failed: %s", exc)
            stats["errors"] += len(batch)

    elapsed = time.monotonic() - start
    logger.info(
        "Discovery complete in %.1fs | discovered=%d new=%d skipped=%d errors=%d",
        elapsed, stats["discovered"], stats["new"], stats["skipped"], stats["errors"],
    )


if __name__ == "__main__":
    main()
