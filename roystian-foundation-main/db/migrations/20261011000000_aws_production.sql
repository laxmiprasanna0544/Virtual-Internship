-- migrate:up

-- ---------------------------------------------------------------------------
-- AWS production: Cognito accounts, Cashfree payments, and hardening found in
-- the production-readiness audit.
-- ---------------------------------------------------------------------------

-- Accounts ------------------------------------------------------------------
--
-- Profiles are keyed by the Cognito user's sub. The server creates them at
-- sign-up (this replaces the old auth.users trigger). Every self-service
-- account is a student; staff roles are granted in SQL by an administrator.

create or replace function public.provision_student(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_mobile text,
  p_college text,
  p_course text,
  p_city text,
  p_education text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (p_id, 'student', left(coalesce(p_full_name, ''), 120), lower(trim(p_email)))
  on conflict (id) do nothing;

  insert into public.students (id, mobile, college, course, city, education_level)
  values (
    p_id,
    left(coalesce(p_mobile, ''), 20),
    left(coalesce(p_college, ''), 200),
    left(coalesce(p_course, ''), 200),
    left(coalesce(p_city, ''), 100),
    case
      when p_education in ('intermediate', 'diploma', 'undergraduate', 'postgraduate', 'working-professional')
        then p_education::public.education_level
      else 'undergraduate'::public.education_level
    end
  )
  on conflict (id) do nothing;
end;
$$;

revoke execute on function public.provision_student(uuid, text, text, text, text, text, text, text)
  from public, anon, authenticated;

-- Set by the server once the user has enrolled a TOTP authenticator in
-- Cognito. Staff accounts cannot use staff APIs until it is true. Not in the
-- column grants, so users cannot set it themselves.
alter table public.profiles add column mfa_enabled boolean not null default false;

-- Payments (Cashfree) ----------------------------------------------------------
--
-- Checkout creates a pending payment holding what is being bought. Only a
-- verified gateway confirmation (signed webhook, or a server-side order
-- status check) turns it into a registration, through complete_payment().

alter table public.payments
  add column domain_id text,
  add column program_id public.program_id,
  add column experience public.experience_level,
  add column failure_reason text,
  add column refund_id text unique,
  add column refunded_at timestamptz;

create or replace function public.complete_payment(
  p_order_id text,
  p_amount_paise integer,
  p_method public.payment_method,
  p_provider_payment_id text,
  p_payload jsonb,
  p_domain_code text
)
returns public.registrations
language plpgsql
set search_path = ''
as $$
declare
  pay public.payments;
  reg public.registrations;
  reg_id text;
begin
  select * into pay from public.payments where provider_order_id = p_order_id for update;
  if not found then
    raise exception 'Unknown order %', p_order_id using errcode = 'P0002';
  end if;

  -- Idempotent: webhooks are retried, and the status check may race them.
  if pay.registration_id is not null then
    select * into reg from public.registrations where id = pay.registration_id;
    return reg;
  end if;

  if pay.status not in ('pending', 'failed') then
    raise exception 'Order % is %', p_order_id, pay.status using errcode = '22023';
  end if;
  if p_amount_paise <> pay.amount_paise then
    raise exception 'Amount mismatch on order %', p_order_id using errcode = '22023';
  end if;

  -- Paid twice for the same domain (two checkouts open at once): keep the
  -- money on record for a refund and return the existing enrolment.
  select * into reg from public.registrations
  where student_id = pay.student_id and domain_id = pay.domain_id and payment_status = 'successful';
  if found then
    update public.payments
    set status = 'successful',
        method = p_method,
        provider_payment_id = p_provider_payment_id,
        provider_payload = p_payload,
        failure_reason = 'duplicate-enrolment: refund required'
    where id = pay.id;
    return reg;
  end if;

  reg_id := format(
    'RF-%s-%s-%s',
    p_domain_code,
    extract(year from now())::int,
    lpad(nextval('public.registration_number_seq')::text, 6, '0')
  );

  insert into public.registrations (
    id, student_id, domain_id, program_id, experience, amount_paise,
    payment_status, internship_status, start_date
  ) values (
    reg_id, pay.student_id, pay.domain_id, pay.program_id, pay.experience, pay.amount_paise,
    'successful', 'in-progress', current_date
  )
  returning * into reg;

  update public.payments
  set status = 'successful',
      registration_id = reg_id,
      method = p_method,
      provider_payment_id = p_provider_payment_id,
      provider_payload = p_payload,
      failure_reason = null
  where id = pay.id;

  update public.students
  set domain_id = pay.domain_id,
      program_id = pay.program_id,
      experience = pay.experience,
      active_registration_id = reg_id,
      enrolled_at = now(),
      status = 'active'
  where id = pay.student_id;

  insert into public.module_progress (student_id, domain_id)
  values (pay.student_id, pay.domain_id)
  on conflict (student_id, domain_id) do nothing;

  return reg;
end;
$$;

create or replace function public.fail_payment(p_order_id text, p_reason text, p_payload jsonb)
returns void
language sql
set search_path = ''
as $$
  update public.payments
  set status = 'failed', failure_reason = left(p_reason, 500), provider_payload = p_payload
  where provider_order_id = p_order_id and status = 'pending';
$$;

-- Records a refund made through the gateway. One transaction, so the payment
-- and the registration never disagree.
create or replace function public.record_refund(p_payment_id uuid, p_refund_id text, p_payload jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  pay public.payments;
begin
  select * into pay from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'Unknown payment %', p_payment_id using errcode = 'P0002';
  end if;
  if pay.status = 'refunded' then
    return;
  end if;
  if pay.status <> 'successful' then
    raise exception 'Only successful payments can be refunded' using errcode = '22023';
  end if;

  update public.payments
  set status = 'refunded',
      refund_id = p_refund_id,
      refunded_at = now(),
      provider_payload = coalesce(provider_payload, '{}'::jsonb) || jsonb_build_object('refund', p_payload)
  where id = pay.id;

  if pay.registration_id is not null then
    update public.registrations set payment_status = 'refunded' where id = pay.registration_id;
  end if;
end;
$$;

revoke execute on function public.complete_payment(text, integer, public.payment_method, text, jsonb, text)
  from public, anon, authenticated;
revoke execute on function public.fail_payment(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.record_refund(uuid, text, jsonb) from public, anon, authenticated;

-- The simulated checkout is gone; every registration now comes from a
-- verified payment.
drop function public.create_paid_registration(
  uuid, text, text, public.program_id, public.experience_level, integer,
  public.payment_method, text, text, text, jsonb
);

-- Evaluated work is final ----------------------------------------------------------
--
-- Audit finding: a student could move an evaluated project or challenge entry
-- back to "submitted" and replace the work while keeping the score.

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
    if tg_op = 'UPDATE' and old.status = 'evaluated' then
      raise exception 'An evaluated project cannot be changed';
    end if;
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
    if tg_op = 'UPDATE' and old.status = 'evaluated' then
      raise exception 'This entry has already been evaluated';
    end if;
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

-- Students could delete an evaluated entry and start again. Replace the
-- catch-all policy with insert and update only.
drop policy "challenge_entries: own" on public.challenge_entries;

create policy "challenge_entries: student submits own"
on public.challenge_entries for insert to authenticated
with check (student_id = (select auth.uid()));

create policy "challenge_entries: student updates own"
on public.challenge_entries for update to authenticated
using (student_id = (select auth.uid())) with check (student_id = (select auth.uid()));

-- Column grants: which fields a student may change on their own work. The
-- owner, student, project and domain of a record are fixed once created.
revoke update on public.submissions from anon, authenticated;
grant update (task_title, response_text, file_path, file_name, status, submitted_at)
  on public.submissions to authenticated;

revoke update on public.project_submissions from anon, authenticated;
grant update (status, analysis, recommendations, report_file_path, report_file_name, repo_url,
              started_at, submitted_at)
  on public.project_submissions to authenticated;

revoke update on public.challenge_entries from anon, authenticated;
grant update (status, approach, solution, repo_url, submitted_at)
  on public.challenge_entries to authenticated;

revoke delete on all tables in schema public from anon;
revoke insert, update on all tables in schema public from anon;
grant insert on public.college_leads to anon;

-- Indexes on foreign keys and the columns RLS and staff queues filter on -------------

create index payments_registration_idx on public.payments (registration_id);
create index students_domain_idx on public.students (domain_id);
create index students_active_registration_idx on public.students (active_registration_id);
create index profiles_college_idx on public.profiles (college_id);
create index submissions_domain_idx on public.submissions (domain_id);
create index submissions_reviewed_by_idx on public.submissions (reviewed_by);
create index project_submissions_domain_idx on public.project_submissions (domain_id);
create index interview_sessions_student_idx on public.interview_sessions (student_id);
create index scholarship_applications_student_idx on public.scholarship_applications (student_id);
create index assessment_attempts_overridden_by_idx on public.assessment_attempts (overridden_by);
create index assessment_attempts_recent_idx
  on public.assessment_attempts (student_id, assessment_id, submitted_at desc);
create index colleges_name_idx on public.colleges (lower(trim(name)));
create index admin_audit_log_actor_idx on public.admin_audit_log (actor_id);
create index certificates_registration_idx on public.certificates (registration_id);

-- Drop the transition-era delete grant: nothing a request role does needs it.
revoke delete on all tables in schema public from authenticated;

-- migrate:down
-- Forward-only: restore from a backup instead of rolling back.
