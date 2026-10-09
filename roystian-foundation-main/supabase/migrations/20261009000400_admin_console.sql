-- ---------------------------------------------------------------------------
-- Admin console
-- ---------------------------------------------------------------------------

-- Admins can record an assessment result on a student's behalf (for example
-- after an offline exam). Such attempts are marked with who entered them, so
-- they are never mistaken for the student's own work.
alter table public.assessment_attempts
  add column overridden_by uuid references public.profiles (id) on delete set null;

comment on column public.assessment_attempts.overridden_by is
  'Set when an admin recorded this result instead of the student taking the assessment.';

-- Every staff action that changes a student's record is logged.
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_target_idx on public.admin_audit_log (target_type, target_id);

alter table public.admin_audit_log enable row level security;

create policy "admin_audit_log: admin reads"
on public.admin_audit_log for select to authenticated
using (public.is_admin());

