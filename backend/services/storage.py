"""Supabase Storage wrapper for resume PDFs and tailored resume files."""
import logging
from uuid import uuid4

from supabase import Client

logger = logging.getLogger(__name__)

RESUME_BUCKET = "resumes"
DRAFTS_BUCKET = "drafts"


MIME_BY_EXT = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def upload_resume(client: Client, user_id: str, filename: str, content: bytes) -> str:
    """Upload a resume file (PDF or DOCX) to Supabase Storage. Returns the storage path."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "pdf"
    content_type = MIME_BY_EXT.get(ext, "application/octet-stream")
    path = f"{user_id}/{uuid4()}.{ext}"
    client.storage.from_(RESUME_BUCKET).upload(
        path,
        content,
        file_options={"content-type": content_type, "upsert": "false"},
    )
    logger.info("Uploaded resume to %s/%s", RESUME_BUCKET, path)
    return path


def download_resume(client: Client, path: str) -> bytes:
    """Download a resume file from Supabase Storage. Returns raw bytes."""
    return client.storage.from_(RESUME_BUCKET).download(path)


def get_resume_url(client: Client, path: str, expires_in: int = 3600) -> str:
    """Return a signed URL for a resume file (1-hour expiry by default)."""
    result = client.storage.from_(RESUME_BUCKET).create_signed_url(path, expires_in)
    return result["signedURL"]


def delete_resume(client: Client, path: str) -> None:
    client.storage.from_(RESUME_BUCKET).remove([path])
    logger.info("Deleted resume %s", path)


def upload_tailored_resume(client: Client, user_id: str, draft_id: str, content: bytes) -> str:
    path = f"{user_id}/{draft_id}/tailored_resume.pdf"
    client.storage.from_(DRAFTS_BUCKET).upload(
        path,
        content,
        file_options={"content-type": "application/pdf", "upsert": "true"},
    )
    return path
