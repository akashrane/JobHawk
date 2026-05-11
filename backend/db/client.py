from functools import lru_cache

from supabase import Client, create_client

from config import settings


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Anon client — used for user-scoped requests (RLS enforced)."""
    return create_client(settings.supabase_url, settings.supabase_anon_key)


@lru_cache(maxsize=1)
def get_supabase_admin() -> Client:
    """Service-role client — bypasses RLS; only for cron scripts and auth validation."""
    return create_client(settings.supabase_url, settings.supabase_service_key)
