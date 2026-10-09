-- ---------------------------------------------------------------------------
-- LOCAL DEVELOPMENT SEED ONLY — never run against production.
--
-- `supabase db reset` runs this after the migrations. It creates one login per
-- role with a known password. The student's journey lives in Supabase; staff
-- accounts are linked to the browser demo database (legacy_demo_id) until the
-- admin, campus and partner screens move over.
--
--   student@roystian.demo   student123
--   admin@roystian.demo     admin123
--   trainer@roystian.demo   trainer123
--   college@roystian.demo   college123
--   partner@roystian.demo   partner123
-- ---------------------------------------------------------------------------

insert into public.colleges (id, name, city, state, type, departments, contact_email, contact_person, designation, phone)
values (
  'college_vjit', 'Vignan Institute of Technology', 'Hyderabad', 'Telangana', 'engineering',
  array['CSE', 'ECE', 'Mechanical', 'IT'], 'college@roystian.demo', 'Dr. A. Sharma',
  'Training & Placement Officer', '+91 90000 00001'
);

do $$
declare
  account record;
begin
  for account in
    select * from (values
      ('00000000-0000-4000-8000-000000000001'::uuid, 'student@roystian.demo', 'student123', 'Rahul Sharma',                     'student'::public.app_role, null::text,     null::text),
      ('00000000-0000-4000-8000-000000000002'::uuid, 'admin@roystian.demo',   'admin123',   'Programme Administrator',          'admin'::public.app_role,   'adm_001',      null::text),
      ('00000000-0000-4000-8000-000000000003'::uuid, 'trainer@roystian.demo', 'trainer123', 'Aarav Mehta',                      'trainer'::public.app_role, 'trn_001',      null::text),
      ('00000000-0000-4000-8000-000000000004'::uuid, 'college@roystian.demo', 'college123', 'Vignan Institute of Technology',   'college'::public.app_role, 'college_vjit', 'college_vjit'),
      ('00000000-0000-4000-8000-000000000005'::uuid, 'partner@roystian.demo', 'partner123', 'Roystian Advanced Technologies',   'partner'::public.app_role, 'ptn_001',      null::text)
    ) as t(id, email, password, full_name, role, legacy_id, college_id)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', account.id, 'authenticated', 'authenticated',
      account.email, extensions.crypt(account.password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', account.full_name),
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), account.id, account.id::text,
      jsonb_build_object('sub', account.id::text, 'email', account.email, 'email_verified', true),
      'email', now(), now(), now()
    );

    -- handle_new_user() created a student profile; promote staff accounts.
    update public.profiles
    set role = account.role,
        college_id = account.college_id,
        legacy_demo_id = account.legacy_id
    where id = account.id;
  end loop;
end;
$$;

-- Demo student: Rahul Sharma, AI/ML Industry-Led, 9 days in, 4 of 10 modules
-- done with their assessments passed, practical task not yet submitted.
update public.students
set mobile = '+91 90000 12345',
    college = 'Vignan Institute of Technology',
    course = 'B.Tech Computer Engineering',
    city = 'Hyderabad'
where id = '00000000-0000-4000-8000-000000000001';

do $$
declare
  rahul constant uuid := '00000000-0000-4000-8000-000000000001';
  reg public.registrations;
  n int;
begin
  reg := public.create_paid_registration(
    rahul, 'ai-ml', 'AIML', 'industry-led', 'beginner', 500000, 'upi',
    'simulated', 'SIM-SEED-RAHUL'
  );

  update public.registrations
  set created_at = now() - interval '9 days', start_date = current_date - 9
  where id = reg.id;
  update public.payments set created_at = now() - interval '9 days' where registration_id = reg.id;
  update public.students set enrolled_at = now() - interval '9 days' where id = rahul;

  update public.module_progress
  set completed_modules = array['ai-ml-m01', 'ai-ml-m02', 'ai-ml-m03', 'ai-ml-m04'],
      last_module_id = 'ai-ml-m04'
  where student_id = rahul and domain_id = 'ai-ml';

  for n in 1..4 loop
    insert into public.assessment_attempts (
      student_id, domain_id, assessment_id, kind, score, total, percentage, passed, submitted_at
    ) values (
      rahul, 'ai-ml', format('ai-ml-m%s-assessment', lpad(n::text, 2, '0')), 'module',
      4, 5, 80, true, now() - make_interval(days => 9 - n * 2)
    );
  end loop;

  insert into public.notifications (user_id, type, title, body, href, created_at) values
    (rahul, 'success', 'Registration confirmed',
     format('Your AI/ML virtual internship is active. Registration ID %s.', reg.id),
     '/dashboard', now() - interval '9 days'),
    (rahul, 'reminder', 'Live session tomorrow',
     'Day 10 — Practical Workshop with Aarav Mehta at 18:00 IST.',
     '/dashboard/schedule', now() - interval '8 hours');
end;
$$;

insert into public.trainers (id, profile_id, name, title, industry, experience, specialization, bio, domains, initials, accent)
values (
  'trainer-aarav-mehta', '00000000-0000-4000-8000-000000000003', 'Aarav Mehta',
  'Senior AI Engineer', 'Technology', '8+ years', 'AI/ML & Data Systems',
  'Demo trainer persona for local development.',
  array['ai-ml', 'data-analytics', 'software-development'], 'AM', 'indigo'
);
