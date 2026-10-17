-- migrate:up

-- ---------------------------------------------------------------------------
-- Platform: request identity for row level security
--
-- The app connects as the schema owner (roystian_app). Work done on behalf of
-- a signed-in user runs inside a transaction that switches to the
-- `authenticated` role and records who the user is:
--
--   set local role authenticated;
--   select set_config('app.user_id', '<cognito sub>', true),
--          set_config('app.role', 'authenticated', true);
--
-- Public reads use the `anon` role the same way. Trusted server code (payment
-- webhook, scoring, certificates) stays on the owner role, which bypasses RLS.
--
-- auth.uid() and auth.role() read those settings, so every policy and
-- security-definer function written against them keeps working.
--
-- The `anon` and `authenticated` roles are cluster-wide and are created once
-- per environment by db/bootstrap.sql.
-- ---------------------------------------------------------------------------

create schema if not exists auth;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

-- 'authenticated' or 'anon' inside a user/public transaction; 'service_role'
-- for trusted server code, which never sets app.role.
create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(nullif(current_setting('app.role', true), ''), 'service_role');
$$;

grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant execute on function auth.role() to anon, authenticated;

-- Table access for the request roles. RLS (enabled on every table) decides
-- which rows; column grants in later migrations narrow updates further.
grant usage on schema public to anon, authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

-- migrate:down
-- Forward-only: restore from a backup instead of rolling back.
