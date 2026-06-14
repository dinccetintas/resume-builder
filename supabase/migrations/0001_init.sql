-- Job-application pipeline schema.
-- Single-user app: the profile is the source of truth; jobs flow through stages
-- discovered -> ranked -> tailored -> applied / needs_manual -> responded.
-- RLS is enabled; access is via the service role (server-side) or the owner.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profile: the "fill once" data the apply worker reuses on every application.
-- Seeded from cv/data.py plus the recurring application fields.
-- ---------------------------------------------------------------------------
create table if not exists profile (
  id                uuid primary key default gen_random_uuid(),
  owner             uuid references auth.users(id) on delete cascade,
  full_name         text not null,
  email             text not null,
  phone             text,
  -- The structured CV (matches cv.CVData.from_dict shape) used as the tailoring base.
  cv_json           jsonb not null,
  -- Work authorization per target country; legally distinct, must be explicit.
  -- e.g. {"US":"Requires sponsorship (H-1B)","UK":"Skilled Worker visa needed",
  --       "NL":"EU citizen - no sponsorship","UAE":"Employer-sponsored","QA":"Resident"}
  work_authorization jsonb not null default '{}'::jsonb,
  salary_expectation text,
  notice_period      text,
  willing_to_relocate boolean default true,
  eeo_defaults       jsonb default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Reusable answers to common screening questions, matched by pattern/keyword.
create table if not exists screening_answers (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid references auth.users(id) on delete cascade,
  -- e.g. 'why_company', 'years_python', 'authorized_to_work_us', 'salary'
  question_key text not null,
  -- keywords used to fuzzy-match an unseen question to this answer
  match_terms  text[] not null default '{}',
  answer       text not null,
  created_at   timestamptz not null default now(),
  unique (owner, question_key)
);

-- ---------------------------------------------------------------------------
-- Jobs discovered from sources, normalized.
-- ---------------------------------------------------------------------------
create type job_source as enum ('adzuna', 'greenhouse', 'lever', 'ashby', 'gulf', 'linkedin', 'manual');

create table if not exists jobs (
  id            uuid primary key default gen_random_uuid(),
  source        job_source not null,
  external_id   text not null,             -- id within the source; dedup key
  title         text not null,
  company       text not null,
  location      text,
  country       text,                      -- normalized: UK / US / AE / QA / NL
  remote        boolean default false,
  jd_text       text,                      -- full job description
  apply_url     text,                      -- where the application is submitted
  ats           text,                      -- detected ATS (greenhouse/lever/ashby/workday/...)
  posted_at     timestamptz,
  -- high-value ranking output (see web/lib/rank.ts)
  score         numeric,
  score_breakdown jsonb,
  discovered_at timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists jobs_score_idx on jobs (score desc nulls last);
create index if not exists jobs_country_idx on jobs (country);

-- ---------------------------------------------------------------------------
-- Applications: one row per job we pursue, tracking the pipeline state.
-- ---------------------------------------------------------------------------
create type application_status as enum (
  'matched',        -- passed the high-value floor, queued for tailoring
  'tailored',       -- tailored CV + cover letter generated
  'applying',       -- computer-use session in progress
  'applied',        -- submitted successfully
  'needs_manual',   -- CAPTCHA / LinkedIn submit / ungrounded question -> human
  'skipped',        -- below the value floor or filtered out
  'responded',      -- employer responded
  'failed'          -- unrecoverable error
);

create table if not exists applications (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null references jobs(id) on delete cascade,
  owner           uuid references auth.users(id) on delete cascade,
  status          application_status not null default 'matched',
  -- Supabase Storage paths for the tailored documents.
  cv_docx_path    text,
  cv_pdf_path     text,
  cover_letter    text,
  tailor_model    text,
  tailor_cost_usd numeric,
  -- why it routed to needs_manual / failed, plus the deep link to finish manually.
  manual_reason   text,
  manual_url      text,
  applied_at      timestamptz,
  updated_at      timestamptz not null default now(),
  unique (job_id)
);

create index if not exists applications_status_idx on applications (status);

-- Audit log of every pipeline run / computer-use session for observability.
create table if not exists run_logs (
  id          uuid primary key default gen_random_uuid(),
  stage       text not null,               -- discover / rank / tailor / apply
  job_id      uuid references jobs(id) on delete set null,
  level       text not null default 'info',
  message     text,
  payload     jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger profile_updated before update on profile
  for each row execute function set_updated_at();
create trigger applications_updated before update on applications
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: owner-scoped; server uses the service role which bypasses RLS.
-- ---------------------------------------------------------------------------
alter table profile enable row level security;
alter table screening_answers enable row level security;
alter table applications enable row level security;

create policy profile_owner on profile
  using (owner = auth.uid()) with check (owner = auth.uid());
create policy screening_owner on screening_answers
  using (owner = auth.uid()) with check (owner = auth.uid());
create policy applications_owner on applications
  using (owner = auth.uid()) with check (owner = auth.uid());

-- jobs and run_logs are app-global (single user); read for authenticated users.
alter table jobs enable row level security;
create policy jobs_read on jobs for select using (auth.role() = 'authenticated');
