# JobHawk — AI Job Application Agent

A semi-autonomous AI agent that discovers jobs, scores them against your resume, drafts tailored cover letters, and lets you review + approve before applying.

## Setup (Phase 1)

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
3. Enable pgvector: already handled in the migration
4. Enable magic link auth: **Authentication → Providers → Email**
5. Create two Storage buckets: `resumes` (public: no) and `drafts` (public: no)

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in your keys
pip install -e .
# Seed companies
python scripts/seed_companies.py
# Start server
uvicorn main:app --reload
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

### 4. GitHub Actions (cron jobs)

Add these secrets to your GitHub repo (**Settings → Secrets → Actions**):

| Secret | Source |
|--------|--------|
| `SUPABASE_URL` | Supabase project settings |
| `SUPABASE_ANON_KEY` | Supabase project settings |
| `SUPABASE_SERVICE_KEY` | Supabase project settings |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) |
| `GOOGLE_API_KEY` | [aistudio.google.com](https://aistudio.google.com) |
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) |
| `RAPIDAPI_KEY` | [rapidapi.com](https://rapidapi.com) — JSearch |
| `ADZUNA_APP_ID` | [developer.adzuna.com](https://developer.adzuna.com) |
| `ADZUNA_APP_KEY` | [developer.adzuna.com](https://developer.adzuna.com) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) |
| `NOTIFICATION_EMAIL` | Your email address |

The cron jobs run automatically:
- **Every 6 hours**: Job discovery
- **8am ET daily**: Digest email
- **9am ET daily**: Follow-up reminders

You can also trigger them manually from the **Actions** tab.

## Architecture

```
User uploads resume → Agent discovers jobs (cron) → Agent scores fit →
Agent drafts cover letter + tailored resume → User reviews/approves →
User manually submits → Agent tracks status + schedules follow-ups
```

### Tech stack

| Layer | Service |
|-------|---------|
| Frontend | Next.js 15 + Tailwind + shadcn/ui (Vercel) |
| Backend | FastAPI + uvicorn (Render.com) |
| Database | Supabase (Postgres + pgvector + Auth + Storage) |
| LLM scoring | Groq (Llama 3.3 70B) |
| LLM drafting | Google AI Studio (Gemini 2.0 Flash) |
| LLM fallback | OpenRouter (free models) |
| Cron | GitHub Actions |
| Email | Resend |

## Phase roadmap

- [x] **Phase 1**: Foundation — resume upload, settings, backend skeleton, frontend shell
- [ ] **Phase 2**: Job discovery + scoring — all sources, dedup, scoring pipeline, jobs UI
- [ ] **Phase 3**: Drafting + review — cover letter, resume diff, approval flow
- [ ] **Phase 4**: Application tracking — Kanban board, follow-ups, email reminders
- [ ] **Phase 5**: Analytics + polish — funnel charts, answer bank, mobile
