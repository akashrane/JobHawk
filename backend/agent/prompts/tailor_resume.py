TAILOR_RESUME_PROMPT = """
You are a resume optimization expert. Suggest specific changes to tailor this resume for the target job.

## Current resume (structured):
{parsed_resume_json}

## Target job description:
{job_description}

## Instructions:
- Reorder experience bullets to put the most relevant ones first
- Adjust terminology to match the JD's language (e.g., if JD says "CI/CD pipelines" and resume says "automated deployment", suggest "CI/CD pipelines")
- NEVER invent new experience, skills, or metrics
- NEVER remove truthful information
- Only suggest changes where the candidate genuinely has the relevant experience

## Response format (JSON):
{{
  "changes": [
    {{
      "section": "experience",
      "company": "Acme Corp",
      "field": "bullets[2]",
      "original": "Built automated deployment scripts",
      "modified": "Built CI/CD pipelines using GitHub Actions for automated deployment",
      "reason": "JD specifically mentions CI/CD — candidate has this experience, just used different terminology"
    }}
  ],
  "summary_of_changes": "Made N changes: ..."
}}
"""
