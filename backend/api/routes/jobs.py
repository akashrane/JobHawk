from fastapi import APIRouter, HTTPException, Query

from api.deps import CurrentUser
from db.client import get_supabase_admin as get_supabase
from db import queries
from sources.jobspy_scraper import fetch_jobspy_jobs
from sources.dedup import is_duplicate, make_description_hash
import logging

logger = logging.getLogger(__name__)

def is_us_location(location: str | None) -> bool:
    if not location:
        return False
    loc = location.lower()
    us_terms = ["united states", "usa", " us ", ", us", "us remote"]
    if any(term in loc for term in us_terms): return True
    if loc == "us" or loc.startswith("us ") or loc.endswith(" us") or loc == "remote us" or loc == "remote - us": return True
    us_states = {"al", "ak", "az", "ar", "ca", "co", "ct", "de", "fl", "ga", "hi", "id", "il", "in", "ia", "ks", "ky", "la", "me", "md", "ma", "mi", "mn", "ms", "mo", "mt", "ne", "nv", "nh", "nj", "nm", "ny", "nc", "nd", "oh", "ok", "or", "pa", "ri", "sc", "sd", "tn", "tx", "ut", "vt", "va", "wa", "wv", "wi", "wy"}
    parts = [p.strip() for p in loc.replace("-", ",").split(",")]
    for part in parts:
        words = part.split()
        if words and words[-1] in us_states: return True
    return False

router = APIRouter()


@router.get("")
async def list_jobs(
    user: CurrentUser = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    min_score: int | None = Query(None, ge=0, le=100),
    location_type: str | None = None,
    source: str | None = None,
):
    client = get_supabase()
    jobs, total = await queries.get_jobs(
        client,
        user["id"],
        page=page,
        page_size=page_size,
        min_score=min_score,
        location_type=location_type,
        source=source,
    )
    return {
        "data": jobs,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": (page * page_size) < total,
    }


@router.get("/{job_id}")
async def get_job(job_id: str, user: CurrentUser = None):
    client = get_supabase()
    job = await queries.get_job_by_id(client, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/discover")
async def discover_jobs(user: CurrentUser):
    client = get_supabase()
    
    # 1. Fetch user's target roles and locations
    profile_res = client.table("user_profiles").select("target_roles,target_locations").eq("id", user["id"]).execute()
    profile = profile_res.data[0] if profile_res.data else {}
    
    roles = profile.get("target_roles") or ["Software Engineer"]
    locations = profile.get("target_locations") or ["Remote"]
    
    logger.info("Manual Discovery triggered for %s in %s", roles, locations)
    
    # 2. Scrape jobs
    try:
        scraped_jobs = fetch_jobspy_jobs(client, roles, locations)
    except Exception as e:
        logger.error("JobSpy failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
        
    # 3. Filter, dedup, and insert
    new_jobs = []
    for job in scraped_jobs:
        if not is_us_location(job.get("location")):
            continue
            
        company_name = job.pop("company_name", "")
        h = make_description_hash(company_name, job["title"], job["description"])
        
        if is_duplicate(client, job["source"], job.get("source_id"), h):
            continue
            
        job["description_hash"] = h
        new_jobs.append(job)
        
    if new_jobs:
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
                
    return {"status": "success", "discovered": len(scraped_jobs), "new": len(new_jobs)}

