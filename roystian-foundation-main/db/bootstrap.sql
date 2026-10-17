-- ---------------------------------------------------------------------------
-- One-time bootstrap for a new environment.
--
-- Run as the RDS master user, connected to the default "postgres" database:
--
--   psql "postgresql://<master>@<host>:5432/postgres?sslmode=require" \
--     -v app_password='<from Secrets Manager>' -f db/bootstrap.sql
--
-- Creates the roles the migrations and row level security rely on, and the
-- application database owned by the application role. The master user is
-- not used by the application afterwards.
-- ---------------------------------------------------------------------------

\set ON_ERROR_STOP on

-- Request roles. Nobody logs in as these; the application switches to them
-- per transaction (see db/migrations/20261008000000_platform.sql).
create role anon nologin;
create role authenticated nologin;

-- The application's login role: owns the schema, runs migrations, and can
-- step down into the request roles.
create role roystian_app login password :'app_password';
grant anon to roystian_app;
grant authenticated to roystian_app;

-- On RDS the master user is not a superuser; it must be a member of the
-- owning role to create a database owned by it.
grant roystian_app to current_user;

create database roystian owner roystian_app;

