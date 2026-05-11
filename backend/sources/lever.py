"""Lever public job board API client (no auth required)."""
import logging

import httpx

logger = logging.getLogger(__name__)
BASE_URL = "https://api.lever.co/v0/postings"


def fetch_lever_jobs(company_slug: str, company_id: str) -> list[dict]:
    url = f"{BASE_URL}/{company_slug}?mode=json"
    try:
        with httpx.Client(timeout=30) as client:
            response = client.get(url)
            response.raise_for_status()
            jobs = response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (404, 410):
            logger.warning("Lever board not found for slug: %s", company_slug)
            return []
        raise

    logger.info("Lever/%s: %d jobs fetched", company_slug, len(jobs))

    result = []
    for job in jobs:
        desc = (job.get("descriptionPlain") or job.get("description") or "").strip()
        if not desc:
            desc = job.get("text", "")
        if not desc:
            continue

        categories = job.get("categories", {})
        location = categories.get("location", "")
        commitment = categories.get("commitment", "")

        result.append({
            "company_id": company_id,
            "source": "lever",
            "source_id": job.get("id", ""),
            "source_url": job.get("hostedUrl"),
            "apply_url": job.get("applyUrl"),
            "title": job.get("text", ""),
            "description": desc,
            "location": location or None,
            "location_type": _infer_location_type(location or ""),
            "employment_type": _map_commitment(commitment),
        })
    return result


def _infer_location_type(location: str) -> str:
    loc = location.lower()
    if "remote" in loc:
        return "remote"
    if "hybrid" in loc:
        return "hybrid"
    return "onsite"


def _map_commitment(commitment: str) -> str | None:
    mapping = {
        "full-time": "full_time",
        "part-time": "part_time",
        "contract": "contract",
        "internship": "internship",
    }
    return mapping.get(commitment.lower())
