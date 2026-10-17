-- migrate:up

-- ---------------------------------------------------------------------------
-- Row level security
--
-- Visibility of a student's records is decided in one place,
-- can_see_student(), so every table applies the same rule:
--   * the student themself
--   * admins
--   * trainers who teach the student's active domain
--   * the placement cell of the student's college
-- ---------------------------------------------------------------------------

create or replace function public.can_see_student(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1
      from public.students s
      where s.id = target
        and (
          s.domain_id = any (public.current_trainer_domains())
          or exists (
            select 1
            from public.colleges c
            where c.id = public.current_college_id()
              and lower(trim(c.name)) = lower(trim(s.college))
          )
        )
    );
$$;

-- Enable RLS everywhere ------------------------------------------------------

alter table public.colleges enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.trainers enable row level security;
alter table public.registrations enable row level security;
alter table public.payments enable row level security;
alter table public.module_progress enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.submissions enable row level security;
alter table public.project_submissions enable row level security;
alter table public.certificates enable row level security;
alter table public.notifications enable row level security;
alter table public.communication_logs enable row level security;
alter table public.college_leads enable row level security;
alter table public.resume_drafts enable row level security;
alter table public.linkedin_drafts enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.career_passports enable row level security;
alter table public.earned_badges enable row level security;
alter table public.challenge_entries enable row level security;
alter table public.fellowship_applications enable row level security;
alter table public.scholarship_applications enable row level security;

-- Column-level write limits ----------------------------------------------------
--
-- Policies decide which rows; these grants decide which columns. A user can
-- edit their own name and contact details, never their role, college link,
-- enrolment or status.

revoke update on public.profiles from anon, authenticated;
grant update (full_name, avatar_color) on public.profiles to authenticated;

revoke update on public.students from anon, authenticated;
grant update (mobile, education_level, college, course, city) on public.students to authenticated;

revoke update on public.notifications from anon, authenticated;
grant update (read) on public.notifications to authenticated;

-- Colleges -----------------------------------------------------------------------

create policy "colleges: admin or own placement cell can read"
on public.colleges for select to authenticated
using (public.is_admin() or id = public.current_college_id());

create policy "colleges: admin manages"
on public.colleges for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Profiles -----------------------------------------------------------------------

create policy "profiles: visible to self and to people who can see the student"
on public.profiles for select to authenticated
using (public.can_see_student(id));

create policy "profiles: update own"
on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "profiles: admin manages"
on public.profiles for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Students -----------------------------------------------------------------------

create policy "students: read"
on public.students for select to authenticated
using (public.can_see_student(id));

create policy "students: update own details"
on public.students for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "students: admin manages"
on public.students for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Trainers (public directory) ---------------------------------------------------------

create policy "trainers: active trainers are public"
on public.trainers for select to anon, authenticated
using (active or public.is_admin());

create policy "trainers: admin manages"
on public.trainers for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Registrations, payments, certificates, attempts: read-only for clients ------------
-- Writes happen on the server with the service-role key.

create policy "registrations: read"
on public.registrations for select to authenticated
using (public.can_see_student(student_id));

create policy "registrations: admin updates"
on public.registrations for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "payments: own or admin"
on public.payments for select to authenticated
using (student_id = (select auth.uid()) or public.is_admin());

create policy "assessment_attempts: read"
on public.assessment_attempts for select to authenticated
using (public.can_see_student(student_id));

create policy "certificates: read"
on public.certificates for select to authenticated
using (public.can_see_student(student_id));

-- Learning progress ---------------------------------------------------------------

create policy "module_progress: read"
on public.module_progress for select to authenticated
using (public.can_see_student(student_id));

create policy "module_progress: student writes own"
on public.module_progress for insert to authenticated
with check (student_id = (select auth.uid()));

create policy "module_progress: student updates own"
on public.module_progress for update to authenticated
using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));

create policy "module_progress: admin manages"
on public.module_progress for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Submissions (review fields are protected by guard_review_fields) ------------------

create policy "submissions: read"
on public.submissions for select to authenticated
using (public.can_see_student(student_id));

create policy "submissions: student inserts own"
on public.submissions for insert to authenticated
with check (student_id = (select auth.uid()));

create policy "submissions: student or reviewer updates"
on public.submissions for update to authenticated
using (
  student_id = (select auth.uid())
  or public.is_admin()
  or domain_id = any (public.current_trainer_domains())
)
with check (
  student_id = (select auth.uid())
  or public.is_admin()
  or domain_id = any (public.current_trainer_domains())
);

create policy "project_submissions: read"
on public.project_submissions for select to authenticated
using (public.can_see_student(student_id));

create policy "project_submissions: student inserts own"
on public.project_submissions for insert to authenticated
with check (student_id = (select auth.uid()));

create policy "project_submissions: student or reviewer updates"
on public.project_submissions for update to authenticated
using (
  student_id = (select auth.uid())
  or public.is_admin()
  or domain_id = any (public.current_trainer_domains())
)
with check (
  student_id = (select auth.uid())
  or public.is_admin()
  or domain_id = any (public.current_trainer_domains())
);

-- Notifications ---------------------------------------------------------------------

create policy "notifications: own"
on public.notifications for select to authenticated
using (user_id = (select auth.uid()));

create policy "notifications: mark own read"
on public.notifications for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "notifications: admin manages"
on public.notifications for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Communication log: admin only ---------------------------------------------------------

create policy "communication_logs: admin reads"
on public.communication_logs for select to authenticated
using (public.is_admin());

-- College leads: anyone can submit, only admins can read ---------------------------------

create policy "college_leads: public can submit"
on public.college_leads for insert to anon, authenticated
with check (status = 'new');

create policy "college_leads: admin manages"
on public.college_leads for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Career tooling: the student owns these outright ------------------------------------------

create policy "resume_drafts: own"
on public.resume_drafts for all to authenticated
using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));

create policy "linkedin_drafts: own"
on public.linkedin_drafts for all to authenticated
using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));

create policy "interview_sessions: own"
on public.interview_sessions for all to authenticated
using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));

create policy "interview_sessions: read"
on public.interview_sessions for select to authenticated
using (public.can_see_student(student_id));

create policy "career_passports: own"
on public.career_passports for all to authenticated
using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));

create policy "career_passports: published are public"
on public.career_passports for select to anon, authenticated
using (published);

create policy "earned_badges: read"
on public.earned_badges for select to authenticated
using (public.can_see_student(student_id));

-- Applications and challenge entries: students submit, admins decide -----------------------

create or replace function public.guard_decision_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.role()) = 'service_role' or public.is_admin() then
    return new;
  end if;

  if tg_table_name = 'challenge_entries' then
    if new.status = 'evaluated' then
      raise exception 'Students cannot evaluate their own entry';
    end if;
    new.score := case when tg_op = 'UPDATE' then old.score else null end;
    new.feedback := case when tg_op = 'UPDATE' then old.feedback else null end;
    new.evaluated_at := case when tg_op = 'UPDATE' then old.evaluated_at else null end;
  elsif tg_table_name = 'fellowship_applications' then
    if new.stage not in ('eligible', 'applied')
       or (tg_op = 'UPDATE' and old.stage not in ('eligible', 'applied')) then
      raise exception 'Fellowship stage is set by the programme team';
    end if;
  elsif tg_table_name = 'scholarship_applications' then
    if tg_op = 'UPDATE' then
      raise exception 'A submitted scholarship application cannot be edited';
    end if;
    new.status := 'submitted';
    new.awarded_tier := null;
    new.decided_at := null;
  end if;

  return new;
end;
$$;

create trigger challenge_entries_guard
before insert or update on public.challenge_entries
for each row execute function public.guard_decision_fields();

create trigger fellowship_applications_guard
before insert or update on public.fellowship_applications
for each row execute function public.guard_decision_fields();

create trigger scholarship_applications_guard
before insert or update on public.scholarship_applications
for each row execute function public.guard_decision_fields();

create policy "challenge_entries: own"
on public.challenge_entries for all to authenticated
using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));

create policy "challenge_entries: admin manages"
on public.challenge_entries for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "fellowship_applications: own"
on public.fellowship_applications for all to authenticated
using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));

create policy "fellowship_applications: admin manages"
on public.fellowship_applications for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "scholarship_applications: own read"
on public.scholarship_applications for select to authenticated
using (student_id = (select auth.uid()));

create policy "scholarship_applications: own submit"
on public.scholarship_applications for insert to authenticated
with check (student_id = (select auth.uid()));

create policy "scholarship_applications: admin manages"
on public.scholarship_applications for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Function access --------------------------------------------------------------------------

grant execute on function public.verify_certificate(text) to anon, authenticated;

-- migrate:down
-- Forward-only: restore from a backup instead of rolling back.
