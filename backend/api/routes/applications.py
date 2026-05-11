from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from api.deps import CurrentUser
from db.client import get_supabase_admin as get_supabase
from db import queries

router = APIRouter()

VALID_STAGES = {
    "saved", "applied", "screening", "phone_screen",
    "technical", "onsite", "offer", "accepted",
    "rejected", "withdrawn", "archived",
}


class StageUpdate(BaseModel):
    stage: str


class NoteRequest(BaseModel):
    note: str


class FollowUpRequest(BaseModel):
    follow_up_at: datetime


@router.get("")
async def list_applications(
    user: CurrentUser = None,
    stage: str | None = Query(None),
):
    client = get_supabase()
    apps = await queries.get_applications(client, user["id"], stage=stage)
    return {"applications": apps}


@router.get("/{app_id}")
async def get_application(app_id: str, user: CurrentUser = None):
    client = get_supabase()
    app = await queries.get_application_by_id(client, app_id, user["id"])
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.put("/{app_id}/stage")
async def update_stage(app_id: str, body: StageUpdate, user: CurrentUser = None):
    if body.stage not in VALID_STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid stage '{body.stage}'")
    client = get_supabase()
    app = await queries.get_application_by_id(client, app_id, user["id"])
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    prev_stage = app["stage"]
    updates: dict = {
        "stage": body.stage,
        "last_activity_at": datetime.now(timezone.utc).isoformat(),
    }
    if body.stage == "applied" and not app.get("applied_at"):
        updates["applied_at"] = datetime.now(timezone.utc).isoformat()

    updated = await queries.update_application(client, app_id, user["id"], updates)
    await queries.insert_application_event(client, {
        "application_id": app_id,
        "event": "stage_changed",
        "details": {"from_stage": prev_stage, "to_stage": body.stage},
    })
    return updated


@router.post("/{app_id}/note")
async def add_note(app_id: str, body: NoteRequest, user: CurrentUser = None):
    client = get_supabase()
    app = await queries.get_application_by_id(client, app_id, user["id"])
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    await queries.insert_application_event(client, {
        "application_id": app_id,
        "event": "note_added",
        "details": {"note": body.note},
    })
    await queries.update_application(client, app_id, user["id"], {
        "notes": body.note,
        "last_activity_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"message": "Note added"}


@router.post("/{app_id}/followup")
async def schedule_followup(app_id: str, body: FollowUpRequest, user: CurrentUser = None):
    client = get_supabase()
    app = await queries.get_application_by_id(client, app_id, user["id"])
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    updated = await queries.update_application(client, app_id, user["id"], {
        "next_follow_up_at": body.follow_up_at.isoformat(),
        "last_activity_at": datetime.now(timezone.utc).isoformat(),
    })
    await queries.insert_application_event(client, {
        "application_id": app_id,
        "event": "follow_up_scheduled",
        "details": {"scheduled_at": body.follow_up_at.isoformat()},
    })
    return updated
