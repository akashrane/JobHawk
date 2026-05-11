import hashlib

from supabase import Client


def make_description_hash(company: str, title: str, description: str) -> str:
    normalized = f"{company.lower().strip()}|{title.lower().strip()}|{description[:200].lower().strip()}"
    return hashlib.sha256(normalized.encode()).hexdigest()


def is_duplicate(client: Client, source: str, source_id: str | None, description_hash: str) -> bool:
    """Return True if this job already exists in the database."""
    if source_id:
        result = (
            client.table("jobs")
            .select("id")
            .eq("source", source)
            .eq("source_id", source_id)
            .limit(1)
            .execute()
        )
        if result.data:
            return True

    result = (
        client.table("jobs")
        .select("id")
        .eq("description_hash", description_hash)
        .limit(1)
        .execute()
    )
    return bool(result.data)
