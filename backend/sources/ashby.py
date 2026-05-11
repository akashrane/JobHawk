"""Ashby public job board API client (no auth required)."""
import logging

import httpx
import html2text

logger = logging.getLogger(__name__)
_h2t = html2text.HTML2Text()
_h2t.ignore_links = True
_h2t.ignore_images = True

BASE_URL = "https://api.ashbyhq.com/posting-api/job-board"


def fetch_ashby_jobs(company_slug: str, company_id: str) -> list[dict]:
    url = f"{BASE_URL}/{company_slug}"
    try:
        with httpx.Client(timeout=30) as client:
            response = client.get(url)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            logger.warning("Ashby board not found for slug: %s", company_slug)
            return []
        raise

    jobs = data.get("jobs", [])
    logger.info("Ashby/%s: %d jobs fetched", company_slug, len(jobs))

    result = []
    for job in jobs:
        desc_html = (job.get("descriptionHtml") or "").strip()
        desc_text = _h2t.handle(desc_html).strip() if desc_html else ""
        if not desc_text:
            desc_text = job.get("description", "").strip()
        if not desc_text:
            continue

        location = (job.get("location") or {}).get("locationStr")

        result.append({
            "company_id": company_id,
            "source": "ashby",
            "source_id": job.get("id", ""),
            "source_url": job.get("jobUrl"),
            "apply_url": job.get("applyUrl") or job.get("jobUrl"),
            "title": job.get("title", ""),
            "description": desc_text,
            "location": location,
            "location_type": _infer_location_type(location or ""),
        })
    return result


def _infer_location_type(location: str) -> str:
    loc = location.lower()
    if "remote" in loc:
        return "remote"
    if "hybrid" in loc:
        return "hybrid"
    return "onsite"
