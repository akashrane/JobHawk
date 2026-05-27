import logging
import re
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel

from api.deps import CurrentUser
from db.client import get_supabase_admin as get_supabase
from db import queries

logger = logging.getLogger(__name__)
router = APIRouter()


class RejectRequest(BaseModel):
    feedback: str = ""


class EditDraftRequest(BaseModel):
    cover_letter_edited: str | None = None
    screening_answers: list[dict] | None = None


@router.get("")
async def list_drafts(
    user: CurrentUser = None,
    status: str | None = Query(None),
):
    client = get_supabase()
    drafts = await queries.get_drafts(client, user["id"], status=status)
    return {"drafts": drafts}


@router.get("/{draft_id}")
async def get_draft(draft_id: str, user: CurrentUser = None):
    client = get_supabase()
    draft = await queries.get_draft_by_id(client, draft_id, user["id"])
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft


@router.post("/generate/{job_id}", status_code=202)
async def generate_draft(job_id: str, user: CurrentUser = None):
    """Trigger async draft generation for a job. The agent creates the draft in the background."""
    from agent.graph import trigger_draft_generation
    client = get_supabase()
    job = await queries.get_job_by_id(client, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    draft_id = await trigger_draft_generation(user["id"], job_id, client)
    return {"message": "Draft generation started", "draft_id": draft_id}


class CustomDraftRequest(BaseModel):
    job_title: str
    company_name: str = ""
    job_description: str


@router.post("/generate-custom", status_code=202)
async def generate_custom_draft(body: CustomDraftRequest, user: CurrentUser = None):
    """
    Generate a draft from a manually pasted job description.
    Creates a temporary job record with source='manual', then runs the
    same score → cover letter → resume diff pipeline.
    """
    from agent.graph import trigger_draft_generation

    if not body.job_description.strip():
        raise HTTPException(status_code=400, detail="Job description is required.")

    client = get_supabase()

    # Find or create company
    company_id = None
    if body.company_name.strip():
        name = body.company_name.strip()
        # Try to find existing company first
        existing = (
            client.table("companies")
            .select("id")
            .eq("name", name)
            .limit(1)
            .execute()
        )
        if existing.data:
            company_id = existing.data[0]["id"]
        else:
            # Insert new company
            try:
                created = client.table("companies").insert({"name": name}).execute()
                if created.data:
                    company_id = created.data[0]["id"]
            except Exception:
                # If insert fails (race condition), try select again
                fallback = (
                    client.table("companies")
                    .select("id")
                    .eq("name", name)
                    .limit(1)
                    .execute()
                )
                if fallback.data:
                    company_id = fallback.data[0]["id"]

    # Insert a manual job record
    job_result = client.table("jobs").insert({
        "title": body.job_title.strip() or "Custom Job",
        "description": body.job_description.strip(),
        "company_id": company_id,
        "source": "manual",
        "is_active": True,
    }).execute()

    if not job_result.data:
        raise HTTPException(status_code=500, detail="Failed to create job record.")

    job_id = job_result.data[0]["id"]

    draft_id = await trigger_draft_generation(user["id"], job_id, client)
    return {"message": "Draft generation started", "draft_id": draft_id}


@router.post("/{draft_id}/approve")
async def approve_draft(draft_id: str, user: CurrentUser = None):
    client = get_supabase()
    draft = await queries.get_draft_by_id(client, draft_id, user["id"])
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft["status"] not in ("pending", "edited"):
        raise HTTPException(status_code=400, detail=f"Draft is already {draft['status']}")

    # Mark draft approved
    await queries.update_draft(client, draft_id, user["id"], {
        "status": "approved",
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    })

    # Create application record
    app = await queries.insert_application(client, {
        "user_id": user["id"],
        "job_id": draft["job_id"],
        "draft_id": draft_id,
        "resume_id": draft["resume_id"],
        "stage": "saved",
        "cover_letter_used": draft.get("cover_letter_edited") or draft.get("cover_letter"),
    })

    # Log creation event
    await queries.insert_application_event(client, {
        "application_id": app["id"],
        "event": "created",
        "details": {"source": "draft_approval", "draft_id": draft_id},
    })

    # Return the apply URL so the frontend can open it
    job = await queries.get_job_by_id(client, draft["job_id"])
    apply_url = job.get("apply_url") or job.get("source_url") if job else None

    return {"application_id": app["id"], "apply_url": apply_url}


@router.post("/{draft_id}/reject")
async def reject_draft(draft_id: str, body: RejectRequest, user: CurrentUser = None):
    client = get_supabase()
    draft = await queries.get_draft_by_id(client, draft_id, user["id"])
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    await queries.update_draft(client, draft_id, user["id"], {
        "status": "rejected",
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "user_feedback": body.feedback,
    })
    return {"message": "Draft rejected"}


@router.get("/{draft_id}/resume")
async def download_tailored_resume(draft_id: str, user: CurrentUser = None):
    """
    Download the user's original DOCX resume with the draft's resume_diff
    changes applied in-place (find-and-replace). All formatting is preserved.
    Falls back to a 400 error if the stored resume is not a DOCX.
    """
    from services.resume_builder import apply_diff_to_docx
    from services.storage import download_resume

    client = get_supabase()
    draft = await queries.get_draft_by_id(client, draft_id, user["id"])
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    # Load the resume record
    resume_result = (
        client.table("resumes")
        .select("*")
        .eq("id", draft["resume_id"])
        .single()
        .execute()
    )
    if not resume_result.data:
        raise HTTPException(status_code=404, detail="Resume not found")

    resume = resume_result.data
    file_path: str = resume.get("file_path", "")
    file_name: str = resume.get("file_name", "resume.docx")

    if not file_path.endswith(".docx"):
        raise HTTPException(
            status_code=400,
            detail="Tailored download requires a DOCX resume. Please re-upload your resume as a .docx file.",
        )

    # Download the original DOCX from Supabase Storage
    docx_bytes = download_resume(client, file_path)

    # Apply the diff changes in-place
    changes = (draft.get("resume_diff") or {}).get("changes", [])
    if changes:
        docx_bytes = apply_diff_to_docx(docx_bytes, changes)

    # Build filename
    job = draft.get("jobs") or {}
    company_name = (job.get("companies") or {}).get("name", "")
    safe_company = re.sub(r"[^\w]", "_", company_name)[:20] if company_name else "Tailored"
    filename = f"Resume_{safe_company}.docx"

    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.put("/{draft_id}")
async def edit_draft(draft_id: str, body: EditDraftRequest, user: CurrentUser = None):
    client = get_supabase()
    draft = await queries.get_draft_by_id(client, draft_id, user["id"])
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    updates = body.model_dump(exclude_none=True)
    updates["status"] = "edited"
    updated = await queries.update_draft(client, draft_id, user["id"], updates)
    return updated
