-- migrate:up

-- Dates are Indian calendar dates ------------------------------------------------
-- The database runs in UTC, so current_date gave yesterday's date to anything
-- issued between midnight and 05:30 IST.

alter table public.certificates
  alter column issue_date set default (now() at time zone 'Asia/Kolkata')::date;

-- Certificates print the internship period, so they keep its start date.
alter table public.certificates add column start_date date;

update public.certificates c
set start_date = coalesce(r.start_date, (r.created_at at time zone 'Asia/Kolkata')::date)
from public.registrations r
where r.id = c.registration_id;

create or replace function public.issue_certificate(
  p_student_id uuid,
  p_registration_id text,
  p_domain_code text,
  p_student_name text,
  p_domain_name text,
  p_program_name text,
  p_duration text,
  p_final_score numeric
)
returns public.certificates
language plpgsql
security definer
set search_path = ''
as $$
declare
  reg public.registrations;
  cert public.certificates;
begin
  select * into reg from public.registrations
  where id = p_registration_id and student_id = p_student_id
  for update;
  if not found or reg.payment_status <> 'successful' then
    raise exception 'No paid registration %', p_registration_id;
  end if;

  -- One certificate per registration; a repeat request returns it.
  select * into cert from public.certificates where registration_id = p_registration_id;
  if found then
    return cert;
  end if;

  insert into public.certificates (
    id, student_id, registration_id, domain_id, program_id,
    student_name, domain_name, program_name, duration, final_score, start_date
  ) values (
    format(
      'RF-%s-%s-%s',
      p_domain_code,
      extract(year from now())::int,
      lpad(nextval('public.certificate_number_seq')::text, 6, '0')
    ),
    p_student_id, p_registration_id, reg.domain_id, reg.program_id,
    p_student_name, p_domain_name, p_program_name, p_duration, p_final_score,
    coalesce(reg.start_date, (reg.created_at at time zone 'Asia/Kolkata')::date)
  )
  returning * into cert;

  update public.registrations set internship_status = 'certified' where id = p_registration_id;

  return cert;
end;
$$;

-- A fresh guided enrolment in a domain already taken self-paced -------------------
-- One paid registration per student per domain PER PROGRAMME, so a student who
-- did the self-paced internship can enrol again on the Industry-Led one.

drop index public.registrations_one_paid_per_domain;

create unique index registrations_one_paid_per_domain_program
on public.registrations (student_id, domain_id, program_id)
where payment_status = 'successful';

-- The new enrolment starts from scratch. The earlier enrolment's work in that
-- domain is moved here, row for row, so nothing is lost and the live tables
-- keep holding only the current enrolment's work.
create table public.enrolment_archive (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  domain_id text not null,
  -- The enrolment the work belonged to.
  registration_id text references public.registrations (id) on delete set null,
  source_table text not null check (
    source_table in ('module_progress', 'assessment_attempts', 'submissions', 'project_submissions')
  ),
  row_data jsonb not null,
  archived_at timestamptz not null default now()
);

create index enrolment_archive_student_idx on public.enrolment_archive (student_id, domain_id);
create index enrolment_archive_registration_idx on public.enrolment_archive (registration_id);

alter table public.enrolment_archive enable row level security;

create policy "enrolment_archive: admins read"
on public.enrolment_archive for select to authenticated
using (public.is_admin());

create or replace function public.archive_domain_work(
  p_student_id uuid,
  p_domain_id text,
  p_registration_id text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.enrolment_archive (student_id, domain_id, registration_id, source_table, row_data)
  select p_student_id, p_domain_id, p_registration_id, 'module_progress', to_jsonb(t)
  from public.module_progress t where t.student_id = p_student_id and t.domain_id = p_domain_id
  union all
  select p_student_id, p_domain_id, p_registration_id, 'assessment_attempts', to_jsonb(t)
  from public.assessment_attempts t where t.student_id = p_student_id and t.domain_id = p_domain_id
  union all
  select p_student_id, p_domain_id, p_registration_id, 'submissions', to_jsonb(t)
  from public.submissions t where t.student_id = p_student_id and t.domain_id = p_domain_id
  union all
  select p_student_id, p_domain_id, p_registration_id, 'project_submissions', to_jsonb(t)
  from public.project_submissions t where t.student_id = p_student_id and t.domain_id = p_domain_id;

  delete from public.module_progress where student_id = p_student_id and domain_id = p_domain_id;
  delete from public.assessment_attempts where student_id = p_student_id and domain_id = p_domain_id;
  delete from public.submissions where student_id = p_student_id and domain_id = p_domain_id;
  delete from public.project_submissions where student_id = p_student_id and domain_id = p_domain_id;
end;
$$;

revoke execute on function public.archive_domain_work(uuid, text, text) from public, anon, authenticated;

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
  previous public.registrations;
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

  -- Paid twice for the same domain and programme (two checkouts open at
  -- once): keep the money on record for a refund and return the existing
  -- enrolment.
  select * into reg from public.registrations
  where student_id = pay.student_id and domain_id = pay.domain_id and program_id = pay.program_id
    and payment_status = 'successful';
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

  -- A fresh enrolment on another programme in the same domain starts from
  -- scratch: the earlier enrolment's work is archived first.
  select * into previous from public.registrations
  where student_id = pay.student_id and domain_id = pay.domain_id and payment_status = 'successful'
  order by created_at desc
  limit 1;
  if found then
    perform public.archive_domain_work(pay.student_id, pay.domain_id, previous.id);
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
    'successful', 'in-progress', (now() at time zone 'Asia/Kolkata')::date
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

-- migrate:down
-- Forward-only: restore from a backup instead of rolling back.
