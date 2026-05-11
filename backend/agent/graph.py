"""
LangGraph agent orchestrator.

Phase 1 exposes trigger_draft_generation() which runs the score→draft pipeline
synchronously (suitable for a single-user hobby app). In Phase 3 this will be
upgraded to a full async LangGraph graph with human-in-the-loop interrupts.
"""
import asyncio
import json
import logging

from supabase import Client

from agent.prompts.cover_letter import COVER_LETTER_PROMPT
from agent.prompts.score_rubric import SCORE_RUBRIC
from agent.prompts.tailor_resume import TAILOR_RESUME_PROMPT
from db import queries
from services.llm import call_drafting_llm, call_scoring_llm, call_tailoring_llm

logger = logging.getLogger(__name__)


async def trigger_draft_generation(user_id: str, job_id: str, client: Client) -> str:
    """
    Score the job against the user's primary resume, generate a cover letter
    and resume diff, and persist a draft record.
    Returns the new draft_id.
    """
    # 1. Load primary resume
    resumes_result = (
        client.table("resumes")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_primary", True)
        .limit(1)
        .execute()
    )
    if not resumes_result.data:
        # Fall back to most recent resume
        resumes_result = (
            client.table("resumes")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
    if not resumes_result.data:
        raise ValueError("No resume found for user. Please upload a resume first.")

    resume = resumes_result.data[0]
    raw_text = resume.get("raw_text", "")
    parsed_content = resume.get("parsed_content", {})

    # 2. Load job
    job = await queries.get_job_by_id(client, job_id)
    if not job:
        raise ValueError(f"Job {job_id} not found")

    company_name = (job.get("companies") or {}).get("name", "the company")
    job_description = job.get("description", "")

    # 3. Score  (run in thread — LLM calls are synchronous/blocking)
    score_messages = [
        {"role": "system", "content": "You are a precise job-resume scoring assistant. Return only JSON."},
        {"role": "user", "content": SCORE_RUBRIC.format(
            resume_text=raw_text[:4000],
            job_description=job_description[:4000],
        )},
    ]
    score_data, score_meta = await asyncio.to_thread(call_scoring_llm, score_messages)

    score_record = await queries.upsert_score(client, {
        "user_id": user_id,
        "job_id": job_id,
        "resume_id": resume["id"],
        "overall_score": score_data.get("overall_score", 0),
        "skills_score": score_data.get("skills_score"),
        "experience_score": score_data.get("experience_score"),
        "domain_score": score_data.get("domain_score"),
        "bonus_score": score_data.get("bonus_score"),
        "alignment_score": score_data.get("alignment_score"),
        "matched_skills": score_data.get("matched_skills", []),
        "missing_skills": score_data.get("missing_skills", []),
        "matched_experience": score_data.get("matched_experience", []),
        "scoring_rationale": score_data.get("rationale"),
    })

    # 4. Cover letter
    cl_messages = [
        {"role": "system", "content": "You are a professional cover letter writer."},
        {"role": "user", "content": COVER_LETTER_PROMPT.format(
            resume_text=raw_text[:3000],
            job_description=job_description[:3000],
            company_name=company_name,
            matched_skills=", ".join(score_data.get("matched_skills", [])),
            matched_experience="\n".join(score_data.get("matched_experience", [])),
        )},
    ]
    cover_letter, cl_meta = await asyncio.to_thread(call_drafting_llm, cl_messages)

    # 5. Resume tailoring diff
    tailor_messages = [
        {"role": "system", "content": "You are a resume optimization expert. Return only JSON."},
        {"role": "user", "content": TAILOR_RESUME_PROMPT.format(
            parsed_resume_json=json.dumps(parsed_content, indent=2)[:3000],
            job_description=job_description[:3000],
        )},
    ]
    diff_data, diff_meta = await asyncio.to_thread(call_tailoring_llm, tailor_messages)

    # 6. Persist draft
    draft = await queries.insert_draft(client, {
        "user_id": user_id,
        "job_id": job_id,
        "score_id": score_record["id"],
        "resume_id": resume["id"],
        "status": "pending",
        "cover_letter": cover_letter,
        "resume_diff": diff_data,
        "generation_metadata": {
            "scoring": score_meta,
            "cover_letter": cl_meta,
            "tailoring": diff_meta,
        },
    })

    logger.info("Draft created draft_id=%s score=%s", draft["id"], score_data.get("overall_score"))
    return draft["id"]
