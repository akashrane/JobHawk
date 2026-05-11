import logging
from uuid import uuid4

from fastapi import APIRouter, HTTPException, UploadFile, status
from pydantic import BaseModel

from api.deps import CurrentUser
from db.client import get_supabase, get_supabase_admin
from db import queries
from services.resume_parser import parse_resume
from services.storage import delete_resume, get_resume_url, upload_resume

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_FILE_SIZE_MB = 5
ALLOWED_MIME = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class SetPrimaryRequest(BaseModel):
    resume_id: str


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_resume_endpoint(
    file: UploadFile,
    label: str = "My Resume",
    user: CurrentUser = None,
):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_FILE_SIZE_MB}MB limit.")

    # Parse resume (supports PDF and DOCX)
    try:
        parsed, raw_text = parse_resume(content, mime_type=file.content_type or "application/pdf")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # Upload to Supabase Storage using admin client (bypasses storage RLS)
    admin_client = get_supabase_admin()
    file_path = upload_resume(admin_client, user["id"], file.filename or "resume.pdf", content)

    # Persist to DB — use admin client; user is already authenticated via JWT in middleware
    client = get_supabase_admin()
    record = await queries.insert_resume(client, {
        "user_id": user["id"],
        "label": label,
        "file_path": file_path,
        "file_name": file.filename or "resume.pdf",
        "parsed_content": parsed.model_dump(),
        "raw_text": raw_text,
        "is_primary": False,
    })

    return {"id": record["id"], "label": record["label"], "parsed": parsed.model_dump()}


@router.get("")
async def list_resumes(user: CurrentUser = None):
    client = get_supabase_admin()
    resumes = await queries.get_resumes(client, user["id"])
    return {"resumes": resumes}


@router.get("/{resume_id}")
async def get_resume(resume_id: str, user: CurrentUser = None):
    client = get_supabase_admin()
    resume = await queries.get_resume_by_id(client, resume_id, user["id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    signed_url = get_resume_url(get_supabase_admin(), resume["file_path"])
    return {**resume, "download_url": signed_url}


@router.post("/{resume_id}/primary")
async def set_primary(resume_id: str, user: CurrentUser = None):
    client = get_supabase_admin()
    await queries.set_primary_resume(client, resume_id, user["id"])
    return {"message": "Primary resume updated"}


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume_endpoint(resume_id: str, user: CurrentUser = None):
    client = get_supabase_admin()
    resume = await queries.get_resume_by_id(client, resume_id, user["id"])
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    delete_resume(get_supabase_admin(), resume["file_path"])
    await queries.delete_resume(client, resume_id, user["id"])
