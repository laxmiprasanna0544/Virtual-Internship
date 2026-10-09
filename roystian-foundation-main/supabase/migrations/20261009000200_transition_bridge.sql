-- ---------------------------------------------------------------------------
-- TEMPORARY — transition bridge
--
-- Authentication now runs on Supabase, but most screens still read the
-- browser-side demo database (lib/db.ts) keyed by the old string ids
-- (stu_001, adm_001, college_vjit …). While those screens are migrated, a
-- profile may point at its legacy record so seeded local data keeps working.
--
-- Production accounts leave this null. Drop the column once no screen reads
-- lib/db.ts any more.
-- ---------------------------------------------------------------------------

alter table public.profiles add column legacy_demo_id text unique;

comment on column public.profiles.legacy_demo_id is
  'TEMPORARY: id of the matching record in the browser demo database. Drop after the data-layer migration.';
