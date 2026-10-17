-- migrate:up

-- ---------------------------------------------------------------------------
-- Career tools
--
-- Anything that feeds the Career Readiness score — interview scores,
-- fellowship applications, evaluations — is written by the server, because
-- colleges, partners and the fellowship rely on that score.
-- ---------------------------------------------------------------------------

-- Interview sessions are scored on the server (/api/interviews).
drop policy "interview_sessions: own" on public.interview_sessions;

-- Fellowship applications are created on the server (/api/fellowship/apply),
-- which checks eligibility and freezes the readiness score at that moment.
drop policy "fellowship_applications: own" on public.fellowship_applications;

create policy "fellowship_applications: read"
on public.fellowship_applications for select to authenticated
using (public.can_see_student(student_id));

-- Reviewers (trainers for the domain, the student's college) can read
-- challenge entries as they can every other learning record.
create policy "challenge_entries: read"
on public.challenge_entries for select to authenticated
using (public.can_see_student(student_id));


-- Passport slugs: lowercase, unique, and only the owner may change theirs.
alter table public.career_passports
  add constraint career_passports_slug_lowercase check (slug = lower(slug));

-- migrate:down
-- Forward-only: restore from a backup instead of rolling back.
