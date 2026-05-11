SCORE_RUBRIC = """
You are a job-resume matching expert. Score the candidate's fit for this job.

## Resume:
{resume_text}

## Job Description:
{job_description}

## Scoring rubric (total 100 points):
1. Required skills coverage (0-40):
   - Award points for each required skill the candidate demonstrably has
   - Partial credit for related/transferable skills
2. Experience seniority match (0-25):
   - Does years of experience align with the role's level?
   - Does the complexity of past work match expectations?
3. Domain/industry overlap (0-15):
   - Has the candidate worked in the same or adjacent industry?
4. Nice-to-have skills (0-10):
   - Bonus for preferred qualifications the candidate has
5. Location & compensation alignment (0-10):
   - Location match and salary range alignment (if available)

## CRITICAL RULES:
- NEVER fabricate skills or experience the candidate doesn't have.
- If the resume doesn't mention a skill, score it as missing.
- Be honest about gaps.

## Response format (JSON only):
{{
  "overall_score": <int 0-100>,
  "skills_score": <int 0-40>,
  "experience_score": <int 0-25>,
  "domain_score": <int 0-15>,
  "bonus_score": <int 0-10>,
  "alignment_score": <int 0-10>,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3", "skill4"],
  "matched_experience": ["Bullet from resume that matches requirement X"],
  "rationale": "2-3 sentence explanation of the score"
}}
"""
