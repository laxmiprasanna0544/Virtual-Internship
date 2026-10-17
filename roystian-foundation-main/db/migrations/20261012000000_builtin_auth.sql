-- migrate:up

-- ---------------------------------------------------------------------------
-- Built-in authentication (replaces Amazon Cognito).
--
-- Credentials, one-time codes and sessions live in their own schema with NO
-- grants to the request roles (anon, authenticated): only trusted server
-- code, running as the owner, can read or write them. Row level security on
-- the application tables is unchanged — auth.uid() is still the user's id.
--
-- Secrets are never stored in a usable form:
--   password_hash   scrypt (see lib/server/passwords.ts)
--   code_hash       HMAC-SHA256 of the 6-digit code, keyed with AUTH_SECRET
--   token_hash      SHA-256 of the 256-bit session token
--   totp_secret     AES-256-GCM encrypted with a key derived from AUTH_SECRET
-- ---------------------------------------------------------------------------

create schema identity;
revoke all on schema identity from public;

create table identity.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  email_verified_at timestamptz,
  -- Set while an email change waits for its code.
  pending_email text,
  disabled_at timestamptz,
  totp_secret text,
  totp_enabled_at timestamptz,
  -- Last accepted 30-second step: a code can't be replayed inside its window.
  totp_last_step bigint,
  failed_logins integer not null default 0,
  locked_until timestamptz,
  password_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index users_email_key on identity.users (lower(email));

create trigger users_set_updated_at
before update on identity.users
for each row execute function public.set_updated_at();

create table identity.codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references identity.users (id) on delete cascade,
  purpose text not null check (purpose in ('verify-email', 'reset-password', 'change-email')),
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Only the newest unconsumed code per purpose is ever accepted.
create index codes_lookup_idx on identity.codes (user_id, purpose, created_at desc);

create table identity.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references identity.users (id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  ip text,
  user_agent text
);

create index sessions_user_idx on identity.sessions (user_id);

-- Second step of sign-in for accounts with an authenticator app.
create table identity.mfa_challenges (
  token_hash text primary key,
  user_id uuid not null references identity.users (id) on delete cascade,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Profiles reference the identity (they used to reference Cognito's sub).
alter table public.profiles
  add constraint profiles_identity_fkey
  foreign key (id) references identity.users (id) on delete cascade
  not valid;

-- migrate:down
-- Forward-only: restore from a backup instead of rolling back.
