from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.deps import CurrentUser
from db.client import get_supabase_admin as get_supabase
from db import queries

router = APIRouter()


class UserSettingsUpdate(BaseModel):
    full_name: str | None = None
    target_roles: list[str] | None = None
    target_locations: list[str] | None = None
    min_salary: int | None = None
    max_salary: int | None = None
    experience_years: int | None = None
    preferred_company_sizes: list[str] | None = None
    excluded_companies: list[str] | None = None
    work_authorization: str | None = None
    willing_to_relocate: bool | None = None
    daily_apply_cap: int | None = None
    min_score_threshold: int | None = None


@router.get("")
async def get_settings(user: CurrentUser = None):
    client = get_supabase()
    profile = await queries.get_user_profile(client, user["id"])
    if not profile:
        # Auto-create on first access
        profile = await queries.upsert_user_profile(client, user["id"], {"email": user.get("email")})
    return profile


@router.put("")
async def update_settings(body: UserSettingsUpdate, user: CurrentUser = None):
    client = get_supabase()
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    profile = await queries.upsert_user_profile(client, user["id"], updates)
    return profile
