from typing import Any, TypedDict


class AgentState(TypedDict, total=False):
    user_id: str
    resume_id: str
    job_id: str
    raw_resume_text: str
    parsed_resume: dict
    job_description: str
    company_name: str
    score: dict
    cover_letter: str
    resume_diff: dict
    draft_id: str
    error: str
    metadata: dict[str, Any]
