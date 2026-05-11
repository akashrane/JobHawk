"""Seed the companies table with popular ATS board companies."""
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

SEED_COMPANIES = [
    # Greenhouse
    {"name": "Stripe", "slug": "stripe", "ats_platform": "greenhouse", "size_category": "enterprise"},
    {"name": "Airbnb", "slug": "airbnb", "ats_platform": "greenhouse", "size_category": "enterprise"},
    {"name": "Coinbase", "slug": "coinbase", "ats_platform": "greenhouse", "size_category": "enterprise"},
    {"name": "Notion", "slug": "notion", "ats_platform": "greenhouse", "size_category": "mid"},
    {"name": "Discord", "slug": "discord", "ats_platform": "greenhouse", "size_category": "mid"},
    {"name": "Datadog", "slug": "datadog", "ats_platform": "greenhouse", "size_category": "enterprise"},
    {"name": "Figma", "slug": "figma", "ats_platform": "greenhouse", "size_category": "mid"},
    {"name": "Ramp", "slug": "ramp", "ats_platform": "greenhouse", "size_category": "mid"},
    {"name": "Plaid", "slug": "plaid", "ats_platform": "greenhouse", "size_category": "mid"},
    {"name": "OpenAI", "slug": "openai", "ats_platform": "greenhouse", "size_category": "mid"},
    {"name": "Rippling", "slug": "rippling", "ats_platform": "greenhouse", "size_category": "mid"},
    {"name": "Scale AI", "slug": "scaleai", "ats_platform": "greenhouse", "size_category": "mid"},
    # Lever
    {"name": "Anthropic", "slug": "anthropic", "ats_platform": "lever", "size_category": "mid"},
    {"name": "Netflix", "slug": "netflix", "ats_platform": "lever", "size_category": "enterprise"},
    {"name": "Vercel", "slug": "vercel", "ats_platform": "lever", "size_category": "startup"},
    {"name": "Linear", "slug": "linear", "ats_platform": "lever", "size_category": "startup"},
    {"name": "Supabase", "slug": "supabase", "ats_platform": "lever", "size_category": "startup"},
    {"name": "Retool", "slug": "retool", "ats_platform": "lever", "size_category": "mid"},
    # Ashby
    {"name": "Sourcegraph", "slug": "sourcegraph", "ats_platform": "ashby", "size_category": "mid"},
    {"name": "Codeium", "slug": "codeium", "ats_platform": "ashby", "size_category": "startup"},
    {"name": "Anyscale", "slug": "anyscale", "ats_platform": "ashby", "size_category": "startup"},
]


def main():
    from db.client import get_supabase_admin
    client = get_supabase_admin()
    inserted = 0
    for company in SEED_COMPANIES:
        try:
            client.table("companies").upsert(company, on_conflict="slug").execute()
            inserted += 1
        except Exception as exc:
            logger.error("Failed to insert %s: %s", company["name"], exc)
    logger.info("Seeded %d/%d companies", inserted, len(SEED_COMPANIES))


if __name__ == "__main__":
    main()
