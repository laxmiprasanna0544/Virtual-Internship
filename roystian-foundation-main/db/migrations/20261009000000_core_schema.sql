-- migrate:up

-- ---------------------------------------------------------------------------
-- Roystian Foundation — core schema
--
-- Static catalogue content (domains, modules, assessments, programmes, badges,
-- challenges) stays in the codebase under data/. Only records that people
-- create or that must be trusted (identity, payments, progress, certificates)
-- live here.
--
-- Trust model:
--   * Every table has RLS enabled.
--   * Students read and write only their own learning records.
--   * Anything that decides money or credentials (registrations, payments,
--     assessment scores, certificates) is written only by the server with the
--     service-role key, which bypasses RLS. There are no client write policies
--     on those tables.
--   * A user's role can never be changed by that user.
-- ---------------------------------------------------------------------------

-- Enums --------------------------------------------------------------------

create type public.app_role as enum ('student', 'admin', 'trainer', 'college', 'partner');
create type public.experience_level as enum ('beginner', 'intermediate', 'advanced');
create type public.education_level as enum (
  'intermediate', 'diploma', 'undergraduate', 'postgraduate', 'working-professional'
);
create type public.program_id as enum ('self-paced', 'industry-led');
create type public.student_status as enum ('active', 'suspended', 'completed');
create type public.payment_method as enum ('upi', 'card', 'netbanking');
create type public.payment_status as enum ('successful', 'pending', 'failed', 'refunded');
create type public.internship_status as enum ('not-started', 'in-progress', 'completed', 'certified');
create type public.submission_status as enum ('pending', 'submitted', 'reviewed', 'approved', 'needs-revision');
create type public.certificate_status as enum ('valid', 'revoked');
create type public.institution_type as enum ('engineering', 'degree', 'university', 'training');

-- Shared helpers -------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Colleges -----------------------------------------------------------------

create table public.colleges (
  id text primary key,
  name text not null,
  city text not null default '',
  state text not null default '',
  type public.institution_type not null,
  departments text[] not null default '{}',
  contact_email text not null default '',
  contact_person text not null default '',
  designation text not null default '',
  phone text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Profiles (one per Cognito user) -----------------------------------------------

create table public.profiles (
  -- The Cognito user's sub.
  id uuid primary key,
  role public.app_role not null default 'student',
  full_name text not null default '',
  email text not null,
  avatar_color text not null default 'indigo',
  -- Set for college placement-cell accounts only.
  college_id text references public.colleges (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_key on public.profiles (lower(email));

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Student details --------------------------------------------------------------

create table public.students (
  id uuid primary key references public.profiles (id) on delete cascade,
  mobile text not null default '',
  education_level public.education_level not null default 'undergraduate',
  college text not null default '',
  course text not null default '',
  city text not null default '',
  domain_id text,
  experience public.experience_level,
  program_id public.program_id,
  active_registration_id text,
  status public.student_status not null default 'active',
  enrolled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index students_college_idx on public.students (lower(college));

create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

-- Role helpers (security definer so policies can read profiles without
-- recursing through profiles' own RLS) ------------------------------------------

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.current_college_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select college_id from public.profiles where id = (select auth.uid());
$$;

-- Trainers ---------------------------------------------------------------------

create table public.trainers (
  id text primary key,
  -- Linked when the trainer has a login.
  profile_id uuid unique references public.profiles (id) on delete set null,
  name text not null,
  title text not null default '',
  industry text not null default '',
  experience text not null default '',
  specialization text not null default '',
  linkedin text not null default '',
  bio text not null default '',
  domains text[] not null default '{}',
  initials text not null default '',
  accent text not null default 'indigo',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trainers_set_updated_at
before update on public.trainers
for each row execute function public.set_updated_at();

create or replace function public.current_trainer_domains()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select domains from public.trainers where profile_id = (select auth.uid())),
    '{}'::text[]
  );
$$;

-- Registrations and payments -----------------------------------------------------

create table public.registrations (
  -- Human-readable, e.g. RF-AIML-2026-000184.
  id text primary key,
  student_id uuid not null references public.students (id) on delete restrict,
  domain_id text not null,
  program_id public.program_id not null,
  experience public.experience_level not null,
  -- Amounts are stored in paise to avoid floating point money.
  amount_paise integer not null check (amount_paise >= 0),
  payment_status public.payment_status not null default 'pending',
  internship_status public.internship_status not null default 'not-started',
  start_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index registrations_student_idx on public.registrations (student_id);

create trigger registrations_set_updated_at
before update on public.registrations
for each row execute function public.set_updated_at();

alter table public.students
  add constraint students_active_registration_fkey
  foreign key (active_registration_id) references public.registrations (id)
  on delete set null;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  registration_id text references public.registrations (id) on delete restrict,
  student_id uuid not null references public.students (id) on delete restrict,
  amount_paise integer not null check (amount_paise >= 0),
  currency text not null default 'INR',
  method public.payment_method,
  status public.payment_status not null default 'pending',
  provider text not null default 'cashfree',
  -- Our order id sent to the gateway; unique so webhooks are idempotent.
  provider_order_id text not null unique,
  provider_payment_id text,
  -- Raw gateway payload for reconciliation.
  provider_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_student_idx on public.payments (student_id);

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

-- Learning progress ------------------------------------------------------------

create table public.module_progress (
  student_id uuid not null references public.students (id) on delete cascade,
  domain_id text not null,
  completed_modules text[] not null default '{}',
  notes jsonb not null default '{}'::jsonb,
  last_module_id text,
  updated_at timestamptz not null default now(),
  primary key (student_id, domain_id)
);

create trigger module_progress_set_updated_at
before update on public.module_progress
for each row execute function public.set_updated_at();

-- Every attempt is kept; the app takes the best score. Written only by the
-- server, which scores the answers against the curriculum.
create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  domain_id text not null,
  assessment_id text not null,
  kind text not null check (kind in ('module', 'final')),
  score integer not null,
  total integer not null,
  percentage numeric(5, 2) not null,
  passed boolean not null,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index assessment_attempts_student_idx
  on public.assessment_attempts (student_id, domain_id, assessment_id);

-- Practical task submissions -----------------------------------------------------

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  domain_id text not null,
  task_title text not null,
  response_text text not null default '',
  -- S3 object key in the uploads bucket.
  file_path text,
  file_name text,
  status public.submission_status not null default 'pending',
  feedback text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, domain_id)
);

create trigger submissions_set_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

create table public.project_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  project_id text not null,
  domain_id text not null,
  status text not null default 'not-started'
    check (status in ('not-started', 'in-progress', 'submitted', 'evaluated')),
  analysis text not null default '',
  recommendations text not null default '',
  report_file_path text,
  report_file_name text,
  repo_url text,
  criterion_scores jsonb not null default '{}'::jsonb,
  overall_score integer,
  feedback text,
  started_at timestamptz,
  submitted_at timestamptz,
  evaluated_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, project_id)
);

create trigger project_submissions_set_updated_at
before update on public.project_submissions
for each row execute function public.set_updated_at();

-- Students may edit their own work, but never the reviewer's fields. Admins,
-- trainers for that domain and the service role are unrestricted.
create or replace function public.guard_review_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.role()) = 'service_role'
     or public.is_admin()
     or new.domain_id = any (public.current_trainer_domains()) then
    return new;
  end if;

  if tg_table_name = 'submissions' then
    if new.status not in ('pending', 'submitted') then
      raise exception 'Students cannot set submission status to %', new.status;
    end if;
    if tg_op = 'UPDATE' and old.status in ('approved', 'reviewed') then
      raise exception 'A reviewed submission cannot be changed';
    end if;
    new.feedback := case when tg_op = 'UPDATE' then old.feedback else null end;
    new.reviewed_by := case when tg_op = 'UPDATE' then old.reviewed_by else null end;
    new.reviewed_at := case when tg_op = 'UPDATE' then old.reviewed_at else null end;
  elsif tg_table_name = 'project_submissions' then
    if new.status = 'evaluated' then
      raise exception 'Students cannot evaluate their own project';
    end if;
    if tg_op = 'UPDATE' then
      new.criterion_scores := old.criterion_scores;
      new.overall_score := old.overall_score;
      new.feedback := old.feedback;
      new.evaluated_at := old.evaluated_at;
    else
      new.criterion_scores := '{}'::jsonb;
      new.overall_score := null;
      new.feedback := null;
      new.evaluated_at := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger submissions_guard_review
before insert or update on public.submissions
for each row execute function public.guard_review_fields();

create trigger project_submissions_guard_review
before insert or update on public.project_submissions
for each row execute function public.guard_review_fields();

-- Certificates -------------------------------------------------------------------

create table public.certificates (
  -- Human-readable public id printed on the certificate and in the QR code.
  id text primary key,
  student_id uuid not null references public.students (id) on delete restrict,
  registration_id text not null references public.registrations (id) on delete restrict,
  domain_id text not null,
  program_id public.program_id not null,
  -- Snapshots, so a later name or catalogue change never alters an issued certificate.
  student_name text not null,
  domain_name text not null,
  program_name text not null,
  duration text not null,
  final_score numeric(5, 2) not null,
  issue_date date not null default current_date,
  status public.certificate_status not null default 'valid',
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz not null default now(),
  unique (registration_id)
);

create index certificates_student_idx on public.certificates (student_id);

-- Public verification: exposes only what a verifier needs, to anyone.
create or replace function public.verify_certificate(certificate_id text)
returns table (
  id text,
  student_name text,
  domain_id text,
  domain_name text,
  program_id public.program_id,
  program_name text,
  duration text,
  issue_date date,
  status public.certificate_status
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.student_name, c.domain_id, c.domain_name, c.program_id, c.program_name,
         c.duration, c.issue_date, c.status
  from public.certificates c
  where c.id = upper(trim(certificate_id));
$$;

-- Notifications and communications ---------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null
    check (type in ('success', 'reminder', 'assessment', 'assignment', 'certificate', 'system')),
  title text not null,
  body text not null default '',
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.communication_logs (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  channel text not null check (channel in ('email', 'whatsapp', 'dashboard', 'internal')),
  recipient text not null,
  subject text not null default '',
  body text not null default '',
  status text not null default 'queued' check (status in ('sent', 'queued', 'failed')),
  provider_message_id text,
  created_at timestamptz not null default now()
);

-- College leads (public enquiry form) --------------------------------------------------

create table public.college_leads (
  id uuid primary key default gen_random_uuid(),
  college_name text not null check (char_length(college_name) between 2 and 200),
  city text not null default '',
  state text not null default '',
  institution_type public.institution_type,
  departments text not null default '',
  year_batch text not null default '',
  contact_person text not null check (char_length(contact_person) between 2 and 120),
  designation text not null default '',
  email text not null check (char_length(email) <= 254),
  phone text not null default '',
  student_count text not null default '',
  interest text not null default '',
  message text not null default '' check (char_length(message) <= 4000),
  status text not null default 'new' check (status in ('new', 'contacted', 'scheduled', 'closed')),
  created_at timestamptz not null default now()
);

-- Career tooling ---------------------------------------------------------------------

create table public.resume_drafts (
  student_id uuid primary key references public.students (id) on delete cascade,
  headline text not null default '',
  summary text not null default '',
  skills text[] not null default '{}',
  include_projects boolean not null default true,
  include_assessments boolean not null default true,
  include_certificate boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.linkedin_drafts (
  student_id uuid primary key references public.students (id) on delete cascade,
  sections jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  kind text not null check (kind in ('technical', 'hr', 'project')),
  domain_id text not null,
  answers jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  overall_score integer not null default 0,
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  completed_at timestamptz not null default now()
);

create table public.career_passports (
  student_id uuid primary key references public.students (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,64}$'),
  published boolean not null default false,
  headline text not null default '',
  about text not null default '',
  visibility jsonb not null default
    '{"readiness":true,"projects":true,"assessments":true,"badges":true,"certificate":true,"contact":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger career_passports_set_updated_at
before update on public.career_passports
for each row execute function public.set_updated_at();

create table public.earned_badges (
  student_id uuid not null references public.students (id) on delete cascade,
  badge_id text not null,
  evidence text not null default '',
  earned_at timestamptz not null default now(),
  primary key (student_id, badge_id)
);

create table public.challenge_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  challenge_id text not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'evaluated')),
  approach text not null default '',
  solution text not null default '',
  repo_url text,
  score integer,
  feedback text,
  submitted_at timestamptz,
  evaluated_at timestamptz,
  unique (student_id, challenge_id)
);

create table public.fellowship_applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students (id) on delete cascade,
  stage text not null default 'eligible'
    check (stage in ('not-eligible', 'eligible', 'applied', 'shortlisted', 'interview', 'selected', 'not-selected')),
  readiness_at_apply integer not null default 0,
  motivation text not null default '',
  available_from date,
  can_relocate boolean not null default false,
  preferred_area text not null default '',
  applied_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  requested_tier integer not null check (requested_tier in (50, 75, 100)),
  awarded_tier integer check (awarded_tier in (50, 75, 100)),
  household_income_band text not null default '',
  category text not null default '',
  statement text not null default '',
  status text not null default 'submitted'
    check (status in ('submitted', 'under-review', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

-- migrate:down
-- Forward-only: restore from a backup instead of rolling back.
