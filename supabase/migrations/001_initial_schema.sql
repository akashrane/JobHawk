-- Enable required extensions
-- NOTE: pgvector removed — will be added in Phase 2 when upgrading Postgres version
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- USERS & SETTINGS
-- ============================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    target_roles TEXT[] DEFAULT '{}',
    target_locations TEXT[] DEFAULT '{}',
    min_salary INTEGER,
    max_salary INTEGER,
    experience_years INTEGER,
    preferred_company_sizes TEXT[] DEFAULT '{}',
    excluded_companies TEXT[] DEFAULT '{}',
    work_authorization TEXT,
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    daily_apply_cap INTEGER DEFAULT 10,
    min_score_threshold INTEGER DEFAULT 75,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESUMES
-- ============================================
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    parsed_content JSONB,
    raw_text TEXT,
    -- embedding column omitted (pgvector not available) — added in Phase 2
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resumes_user ON resumes(user_id);

-- ============================================
-- COMPANIES
-- ============================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    website TEXT,
    ats_platform TEXT,
    ats_board_url TEXT,
    industry TEXT,
    size_category TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_ats ON companies(ats_platform);

-- ============================================
-- JOBS
-- ============================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    source TEXT NOT NULL,
    source_id TEXT,
    source_url TEXT,
    apply_url TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    description_hash TEXT,
    location TEXT,
    location_type TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency TEXT DEFAULT 'USD',
    employment_type TEXT,
    seniority_level TEXT,
    department TEXT,
    required_skills TEXT[] DEFAULT '{}',
    nice_to_have_skills TEXT[] DEFAULT '{}',
    requirements_summary TEXT,
    -- embedding column omitted (pgvector not available) — added in Phase 2
    is_active BOOLEAN DEFAULT TRUE,
    posted_at TIMESTAMPTZ,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_source ON jobs(source, source_id);
CREATE INDEX idx_jobs_hash ON jobs(description_hash);
CREATE INDEX idx_jobs_active ON jobs(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_jobs_title_trgm ON jobs USING gin (title gin_trgm_ops);
CREATE UNIQUE INDEX idx_jobs_dedup ON jobs(source, source_id) WHERE source_id IS NOT NULL;

-- ============================================
-- SCORES
-- ============================================
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL,
    skills_score INTEGER,
    experience_score INTEGER,
    domain_score INTEGER,
    bonus_score INTEGER,
    alignment_score INTEGER,
    matched_skills TEXT[] DEFAULT '{}',
    missing_skills TEXT[] DEFAULT '{}',
    matched_experience TEXT[] DEFAULT '{}',
    scoring_rationale TEXT,
    cosine_similarity FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id, resume_id)
);

CREATE INDEX idx_scores_user_score ON scores(user_id, overall_score DESC);

-- ============================================
-- DRAFTS
-- ============================================
CREATE TYPE draft_status AS ENUM ('pending', 'approved', 'rejected', 'edited');

CREATE TABLE drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    score_id UUID REFERENCES scores(id) ON DELETE SET NULL,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    status draft_status DEFAULT 'pending',
    cover_letter TEXT,
    cover_letter_edited TEXT,
    resume_diff JSONB,
    tailored_resume_path TEXT,
    screening_answers JSONB,
    generation_metadata JSONB,
    reviewed_at TIMESTAMPTZ,
    user_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drafts_user_status ON drafts(user_id, status);
CREATE INDEX idx_drafts_pending ON drafts(status) WHERE status = 'pending';

-- ============================================
-- APPLICATIONS
-- ============================================
CREATE TYPE application_stage AS ENUM (
    'saved', 'applied', 'screening', 'phone_screen',
    'technical', 'onsite', 'offer', 'accepted',
    'rejected', 'withdrawn', 'archived'
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    draft_id UUID REFERENCES drafts(id) ON DELETE SET NULL,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    stage application_stage DEFAULT 'saved',
    applied_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    cover_letter_used TEXT,
    resume_version_used TEXT,
    notes TEXT,
    salary_offered INTEGER,
    rejection_reason TEXT,
    next_follow_up_at TIMESTAMPTZ,
    follow_up_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_applications_user_stage ON applications(user_id, stage);
CREATE INDEX idx_applications_follow_up ON applications(next_follow_up_at)
    WHERE next_follow_up_at IS NOT NULL AND stage NOT IN ('rejected', 'withdrawn', 'archived', 'accepted');

-- ============================================
-- APPLICATION EVENTS
-- ============================================
CREATE TYPE event_type AS ENUM (
    'created', 'stage_changed', 'note_added', 'follow_up_sent',
    'follow_up_scheduled', 'interview_scheduled', 'offer_received',
    'rejected', 'withdrawn', 'document_attached'
);

CREATE TABLE application_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    event event_type NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_application ON application_events(application_id, created_at DESC);

-- ============================================
-- CONTACTS
-- ============================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    linkedin_url TEXT,
    title TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    relationship TEXT,
    notes TEXT,
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_user ON contacts(user_id);

-- ============================================
-- ANSWER BANK
-- ============================================
CREATE TABLE answer_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    question_pattern TEXT NOT NULL,
    answer TEXT NOT NULL,
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_answer_bank_user ON answer_bank(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own data" ON user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users see own resumes" ON resumes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own scores" ON scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own drafts" ON drafts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own applications" ON applications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own events" ON application_events FOR ALL
    USING (application_id IN (SELECT id FROM applications WHERE user_id = auth.uid()));
CREATE POLICY "Users see own contacts" ON contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own answers" ON answer_bank FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Jobs are public" ON jobs FOR SELECT USING (TRUE);
CREATE POLICY "Companies are public" ON companies FOR SELECT USING (TRUE);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_user_profiles_updated BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_resumes_updated BEFORE UPDATE ON resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_applications_updated BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FOLLOW-UP COUNT HELPER
-- ============================================
CREATE OR REPLACE FUNCTION follow_up_count_increment(row_id UUID)
RETURNS INTEGER AS $$
  UPDATE applications SET follow_up_count = follow_up_count + 1
  WHERE id = row_id
  RETURNING follow_up_count;
$$ LANGUAGE SQL SECURITY DEFINER;
