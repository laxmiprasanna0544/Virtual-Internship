-- ---------------------------------------------------------------------------
-- Student journey: id sequences, active-domain switching, submission uploads
-- ---------------------------------------------------------------------------

-- Human-readable ids (RF-AIML-2026-001000) are built from these sequences on
-- the server. Gaps are fine; duplicates are not.
create sequence public.registration_number_seq start 1000;
create sequence public.certificate_number_seq start 1000;

-- A student may move between domains they have already paid for, and only
-- those. Enrolment columns are otherwise read-only to the client.
create or replace function public.switch_active_domain(target_domain text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  reg public.registrations%rowtype;
begin
  select * into reg
  from public.registrations
  where student_id = (select auth.uid())
    and domain_id = target_domain
    and payment_status = 'successful'
  order by created_at desc
  limit 1;

  if not found then
    return false;
  end if;

  update public.students
  set domain_id = reg.domain_id,
      program_id = reg.program_id,
      experience = reg.experience,
      active_registration_id = reg.id
  where id = (select auth.uid());

  return true;
end;
$$;

revoke execute on function public.switch_active_domain(text) from public, anon;
grant execute on function public.switch_active_domain(text) to authenticated;

-- Practical task uploads ---------------------------------------------------------
-- Private bucket. Objects live under "<user id>/…", so a student can only
-- touch their own folder; reviewers read through signed URLs.

-- No MIME allow-list: browsers report notebooks, code and markdown
-- inconsistently. File extensions are validated in the app; the bucket is
-- private and capped at the same 20 MB the app enforces.
insert into storage.buckets (id, name, public, file_size_limit)
values ('submissions', 'submissions', false, 20971520)
on conflict (id) do nothing;

create policy "submissions bucket: student uploads to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "submissions bucket: student replaces own files"
on storage.objects for update to authenticated
using (
  bucket_id = 'submissions'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "submissions bucket: owner and reviewers read"
on storage.objects for select to authenticated
using (
  bucket_id = 'submissions'
  and public.can_see_student(((storage.foldername(name))[1])::uuid)
);

-- Module progress -------------------------------------------------------------------
-- Writes go through these functions rather than direct table access, so they
-- are atomic (no lost updates between tabs) and limited to domains the
-- student has actually paid for.

drop policy "module_progress: student writes own" on public.module_progress;
drop policy "module_progress: student updates own" on public.module_progress;

create or replace function public.has_paid_for_domain(target_domain text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.registrations
    where student_id = (select auth.uid())
      and domain_id = target_domain
      and payment_status = 'successful'
  );
$$;

create or replace function public.set_module_complete(
  target_domain text,
  target_module text,
  complete boolean
)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  result text[];
begin
  if not public.has_paid_for_domain(target_domain) then
    raise exception 'Not enrolled in domain %', target_domain using errcode = '42501';
  end if;

  insert into public.module_progress (student_id, domain_id, completed_modules, last_module_id)
  values (
    (select auth.uid()),
    target_domain,
    case when complete then array[target_module] else '{}'::text[] end,
    target_module
  )
  on conflict (student_id, domain_id) do update
  set completed_modules = case
        when complete then
          case when target_module = any (module_progress.completed_modules)
            then module_progress.completed_modules
            else array_append(module_progress.completed_modules, target_module)
          end
        else array_remove(module_progress.completed_modules, target_module)
      end,
      last_module_id = case when complete then target_module else module_progress.last_module_id end
  returning completed_modules into result;

  return result;
end;
$$;

create or replace function public.save_module_note(
  target_domain text,
  target_module text,
  note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_paid_for_domain(target_domain) then
    raise exception 'Not enrolled in domain %', target_domain using errcode = '42501';
  end if;
  if char_length(note) > 20000 then
    raise exception 'Note is too long';
  end if;

  insert into public.module_progress (student_id, domain_id, notes)
  values ((select auth.uid()), target_domain, jsonb_build_object(target_module, note))
  on conflict (student_id, domain_id) do update
  set notes = module_progress.notes || jsonb_build_object(target_module, note);
end;
$$;

revoke execute on function public.has_paid_for_domain(text) from public, anon;
revoke execute on function public.set_module_complete(text, text, boolean) from public, anon;
revoke execute on function public.save_module_note(text, text, text) from public, anon;
grant execute on function public.set_module_complete(text, text, boolean) to authenticated;
grant execute on function public.save_module_note(text, text, text) to authenticated;

-- Server-side transactions ---------------------------------------------------------
-- Called only with the service-role key from trusted server code (API routes,
-- and later the payment webhook). Each runs as one transaction, so a
-- registration never exists without its payment, and vice versa.

create or replace function public.create_paid_registration(
  p_student_id uuid,
  p_domain_id text,
  p_domain_code text,
  p_program_id public.program_id,
  p_experience public.experience_level,
  p_amount_paise integer,
  p_method public.payment_method,
  p_provider text,
  p_provider_order_id text,
  p_provider_payment_id text default null,
  p_provider_payload jsonb default null
)
returns public.registrations
language plpgsql
security definer
set search_path = ''
as $$
declare
  reg public.registrations;
  reg_id text;
begin
  -- Idempotent on the gateway order id: a repeated webhook returns the
  -- registration created the first time.
  select r.* into reg
  from public.payments p
  join public.registrations r on r.id = p.registration_id
  where p.provider_order_id = p_provider_order_id;
  if found then
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
    reg_id, p_student_id, p_domain_id, p_program_id, p_experience, p_amount_paise,
    'successful', 'in-progress', current_date
  )
  returning * into reg;

  insert into public.payments (
    registration_id, student_id, amount_paise, method, status,
    provider, provider_order_id, provider_payment_id, provider_payload
  ) values (
    reg_id, p_student_id, p_amount_paise, p_method, 'successful',
    p_provider, p_provider_order_id, p_provider_payment_id, p_provider_payload
  );

  update public.students
  set domain_id = p_domain_id,
      program_id = p_program_id,
      experience = p_experience,
      active_registration_id = reg_id,
      enrolled_at = now(),
      status = 'active'
  where id = p_student_id;

  insert into public.module_progress (student_id, domain_id)
  values (p_student_id, p_domain_id)
  on conflict (student_id, domain_id) do nothing;

  return reg;
end;
$$;

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
    student_name, domain_name, program_name, duration, final_score
  ) values (
    format(
      'RF-%s-%s-%s',
      p_domain_code,
      extract(year from now())::int,
      lpad(nextval('public.certificate_number_seq')::text, 6, '0')
    ),
    p_student_id, p_registration_id, reg.domain_id, reg.program_id,
    p_student_name, p_domain_name, p_program_name, p_duration, p_final_score
  )
  returning * into cert;

  update public.registrations set internship_status = 'certified' where id = p_registration_id;

  return cert;
end;
$$;

revoke execute on function public.create_paid_registration(uuid, text, text, public.program_id, public.experience_level, integer, public.payment_method, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.issue_certificate(uuid, text, text, text, text, text, text, numeric) from public, anon, authenticated;
grant execute on function public.create_paid_registration(uuid, text, text, public.program_id, public.experience_level, integer, public.payment_method, text, text, text, jsonb) to service_role;
grant execute on function public.issue_certificate(uuid, text, text, text, text, text, text, numeric) to service_role;

-- One paid registration per student per domain, even under concurrent requests.
create unique index registrations_one_paid_per_domain
on public.registrations (student_id, domain_id)
where payment_status = 'successful';
