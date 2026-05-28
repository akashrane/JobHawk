import logging
import re
import pandas as pd
from supabase import Client
from jobspy import scrape_jobs

logger = logging.getLogger(__name__)


def clean_str(val) -> str:
    if pd.isna(val) or val is None:
        return ""
    return str(val).strip()


def clean_int(val) -> int | None:
    if pd.isna(val) or val is None:
        return None
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None


def _infer_location_type(location: str) -> str:
    loc = location.lower()
    if "remote" in loc:
        return "remote"
    if "hybrid" in loc:
        return "hybrid"
    return "onsite"


def ensure_company_exists(client: Client, company_name: str) -> str | None:
    if not company_name:
        return None
        
    slug = re.sub(r'[^a-z0-9]+', '-', company_name.lower()).strip('-')
    if not slug:
        return None
        
    try:
        res = client.table("companies").select("id").eq("slug", slug).execute()
        if res.data:
            return res.data[0]["id"]
            
        # Insert new company
        insert_res = client.table("companies").insert({
            "name": company_name,
            "slug": slug,
            "ats_platform": "jobspy_discovered"
        }).execute()
        
        if insert_res.data:
            return insert_res.data[0]["id"]
    except Exception as e:
        logger.error(f"Failed to ensure company {company_name}: {e}")
        
    return None


def fetch_jobspy_jobs(client: Client, roles: list[str], locations: list[str]) -> list[dict]:
    all_new_jobs = []
    
    # Fallbacks if user hasn't configured targets yet
    if not roles:
        roles = ["Software Engineer"]
    if not locations:
        locations = ["Remote"]

    for role in roles:
        for location in locations:
            logger.info("JobSpy: searching for '%s' in '%s'", role, location)
            try:
                jobs_df = scrape_jobs(
                    site_name=["linkedin", "indeed"],
                    search_term=role,
                    location=location,
                    results_wanted=20, # Keep per-query count low to reduce rate limiting
                    hours_old=72,      # Last 3 days
                    country_indeed='USA'
                )
                
                if jobs_df is None or jobs_df.empty:
                    continue
                    
                jobs_list = jobs_df.to_dict(orient="records")
                
                for job in jobs_list:
                    company_name = clean_str(job.get("company"))
                    title = clean_str(job.get("title"))
                    description = clean_str(job.get("description"))
                    job_url = clean_str(job.get("job_url"))
                    site = clean_str(job.get("site")) or "jobspy"
                    source_id = clean_str(job.get("id"))
                    loc = clean_str(job.get("location"))
                    
                    if not description or not title or not source_id:
                        continue
                        
                    salary_min = clean_int(job.get("min_amount"))
                    salary_max = clean_int(job.get("max_amount"))
                    
                    company_id = ensure_company_exists(client, company_name)
                    
                    all_new_jobs.append({
                        "company_id": company_id,
                        "source": site,
                        "source_id": source_id,
                        "source_url": job_url,
                        "apply_url": job_url,
                        "title": title,
                        "description": description,
                        "location": loc,
                        "location_type": _infer_location_type(loc),
                        "salary_min": salary_min,
                        "salary_max": salary_max,
                        "company_name": company_name # for hash deduplication
                    })
            except Exception as e:
                logger.error("JobSpy error for %s in %s: %s", role, location, e)

    return all_new_jobs
