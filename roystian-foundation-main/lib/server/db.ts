import "server-only";

import postgres from "postgres";
import { readFileSync } from "node:fs";

/**
 * PostgreSQL access (any managed Postgres: DigitalOcean, RDS, …).
 *
 * The app connects as the schema owner. Two ways in:
 *
 *   withUser(userId, tx => …)  — runs as the `authenticated` role with
 *                                auth.uid() = userId, so row level security
 *                                applies exactly as it would to that user.
 *   withAnon(tx => …)          — the `anon` role, for public reads.
 *   service(tx => …) / sql     — the owner role, which bypasses RLS. Only for
 *                                trusted server decisions (payments, scoring,
 *                                certificates, staff actions after a role check).
 */

export type Sql = postgres.Sql<Record<string, unknown>>;
export type Tx = postgres.TransactionSql<Record<string, unknown>>;

declare global {
  // Reused across hot reloads in development.
  var __roystianSql: Sql | undefined;
}

/**
 * TLS to the database. DATABASE_SSL (or the URL's sslmode) is one of:
 *   verify-full (default) — encrypt and verify against the provider's CA
 *                           (DATABASE_CA_CERT, or a file at DATABASE_CA_PATH)
 *   require               — encrypt without verifying (avoid)
 *   disable               — local development only
 */
function sslOption(mode: string): postgres.Options<Record<string, never>>["ssl"] {
  if (mode === "disable") return false;
  if (mode === "require") return { rejectUnauthorized: false };
  // The provider's CA: inline (DigitalOcean App Platform binds ${db.CA_CERT}) or a file path.
  const ca = process.env.DATABASE_CA_CERT || (process.env.DATABASE_CA_PATH ? readFileSync(process.env.DATABASE_CA_PATH, "utf8") : undefined);
  return ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true };
}

function createClient(): Sql {
  // APP_DATABASE_URL wins where the platform manages DATABASE_URL itself (e.g. the
  // Vercel–Neon integration injects the owner role); the app connects as its own role.
  const raw = process.env.APP_DATABASE_URL || process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  // The same URL is used by dbmate, which understands libpq's sslmode and
  // sslrootcert; postgres.js would send them to the server, so strip them.
  const url = new URL(raw);
  const urlMode = url.searchParams.get("sslmode");
  url.searchParams.delete("sslmode");
  url.searchParams.delete("sslrootcert");
  url.searchParams.delete("channel_binding");
  const mode = process.env.DATABASE_SSL ?? urlMode ?? "verify-full";
  return postgres(url.toString(), {
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: sslOption(mode),
    // Off behind transaction-mode poolers (e.g. Neon's pooled endpoint on Vercel).
    prepare: process.env.DATABASE_PREPARE !== "false",
    // Same shapes the mappers have always received: numbers for numeric,
    // ISO strings for timestamps, YYYY-MM-DD for dates.
    types: {
      numeric: {
        to: 1700,
        from: [1700],
        serialize: (value: number) => String(value),
        parse: (value: string) => Number(value),
      },
      timestamptz: {
        to: 1184,
        from: [1184, 1114],
        serialize: (value: string | Date) => (value instanceof Date ? value.toISOString() : value),
        parse: toIsoTimestamp,
      },
      date: {
        to: 1082,
        from: [1082],
        serialize: (value: string) => value,
        parse: (value: string) => value,
      },
    },
  }) as unknown as Sql;
}

/**
 * Postgres sends "2026-10-11 09:30:00.123456+00"; JavaScript needs a "T" and
 * a "+00:00" style offset. Timestamps without a zone are treated as UTC.
 */
export function toIsoTimestamp(value: string): string {
  let iso = value.replace(" ", "T");
  if (/[+-]\d\d$/.test(iso)) iso += ":00";
  else if (!/(Z|[+-]\d\d:?\d\d)$/.test(iso)) iso += "Z";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function getSql(): Sql {
  if (!globalThis.__roystianSql) globalThis.__roystianSql = createClient();
  return globalThis.__roystianSql;
}

/** Runs `fn` as the signed-in user, with row level security enforced. */
export async function withUser<T>(userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return getSql().begin(async (tx) => {
    await tx`select set_config('app.user_id', ${userId}, true), set_config('app.role', 'authenticated', true)`;
    await tx`set local role authenticated`;
    return fn(tx);
  }) as Promise<T>;
}

/** Runs `fn` as an anonymous visitor, with row level security enforced. */
export async function withAnon<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return getSql().begin(async (tx) => {
    await tx`select set_config('app.user_id', '', true), set_config('app.role', 'anon', true)`;
    await tx`set local role anon`;
    return fn(tx);
  }) as Promise<T>;
}

/** Runs `fn` in a transaction as the owner. Bypasses RLS: trusted code only. */
export async function service<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return getSql().begin(fn) as Promise<T>;
}

/** Postgres error code, if `error` came from the database. */
export function pgCode(error: unknown): string | undefined {
  return typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : undefined;
}

export const UNIQUE_VIOLATION = "23505";
export const INSUFFICIENT_PRIVILEGE = "42501";
export const RAISE_EXCEPTION = "P0001";
