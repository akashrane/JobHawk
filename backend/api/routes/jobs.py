from fastapi import APIRouter, HTTPException, Query

from api.deps import CurrentUser
from db.client import get_supabase_admin as get_supabase
from db import queries

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
