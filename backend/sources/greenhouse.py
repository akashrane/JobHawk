"""Greenhouse public job board API client (no auth required)."""
import logging

import httpx
import html2text

logger = logging.getLogger(__name__)
_h2t = html2text.HTML2Text()
_h2t.ignore_links = True
_h2t.ignore_images = True

BASE_URL = "https://boards-api.greenhouse.io/v1/boards"


def fetch_greenhouse_jobs(company_slug: str, company_id: str) -> list[dict]:
    url = f"{BASE_URL}/{company_slug}/jobs?content=true"
    try:
        with httpx.Client(timeout=30) as client:
            response = client.get(url)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            logger.warning("Greenhouse board not found for slug: %s", company_slug)
            return []
        raise

    jobs = data.get("jobs", [])
    logger.info("Greenhouse/%s: %d jobs fetched", company_slug, len(jobs))

    result = []
    for job in jobs:
        desc_html = (job.get("content") or "").strip()
        desc_text = _h2t.handle(desc_html).strip() if desc_html else ""
        if not desc_text:
            continue

        location = None
        if isinstance(job.get("location"), dict):
            location = job["location"].get("name")

        result.append({
            "company_id": company_id,
            "source": "greenhouse",
            "source_id": str(job.get("id", "")),
            "source_url": job.get("absolute_url"),
            "apply_url": job.get("absolute_url"),
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
