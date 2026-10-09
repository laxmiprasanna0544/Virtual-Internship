"use client";

import { useCallback, useEffect, useState } from "react";
import { buildSeedDatabase, DB_VERSION, type Database } from "@/data/seed";
import {
  isBrowser,
  notifyChange,
  readStorage,
  removeStorage,
  STORAGE_KEYS,
  subscribeToChanges,
  writeStorage,
} from "@/lib/storage";

let cache: Database | null = null;

function hydrate(): Database {
  const stored = readStorage<Database | null>(STORAGE_KEYS.db, null);
  if (stored && stored.version === DB_VERSION) {
    return stored;
  }
  const seeded = buildSeedDatabase();
  writeStorage(STORAGE_KEYS.db, seeded);
  return seeded;
}

/** Reads the demo database, seeding it on first use. Browser only. */
export function getDB(): Database {
  if (!isBrowser()) {
    // Server renders never read persisted demo state.
    return buildSeedDatabase();
  }
  if (!cache) cache = hydrate();
  return cache;
}

export function setDB(next: Database): void {
  cache = next;
  writeStorage(STORAGE_KEYS.db, next);
  notifyChange();
}

/**
 * Applies a mutation to the demo database. The mutator receives a shallow
 * clone; returning a value replaces the database, otherwise the clone is saved.
 */
export function updateDB(
  mutator: (draft: Database) => Database | void,
): Database {
  const draft: Database = { ...getDB() };
  const result = mutator(draft);
  const next = result ?? draft;
  setDB({ ...next });
  return next;
}

/**
 * Restores the seeded browser data that not-yet-migrated screens read. The
 * signed-in user's mirrored record (see lib/auth.ts) is kept so the session
 * survives; their real records live in Supabase and are untouched.
 */
export function resetDB(): Database {
  const seeded = buildSeedDatabase();
  const session = readStorage<{ userId: string } | null>(STORAGE_KEYS.session, null);
  if (session && cache) {
    const student = cache.students.find((s) => s.id === session.userId);
    const staff = cache.staff.find((u) => u.id === session.userId);
    if (student && !seeded.students.some((s) => s.id === student.id)) {
      seeded.students = [student, ...seeded.students];
    }
    if (staff && !seeded.staff.some((u) => u.id === staff.id)) {
      seeded.staff = [staff, ...seeded.staff];
    }
  }
  cache = seeded;
  writeStorage(STORAGE_KEYS.db, seeded);
  removeStorage(STORAGE_KEYS.onboarding);
  notifyChange();
  return seeded;
}

/** Reactive access to the demo database. Returns null until mounted. */
export function useDatabase(): Database | null {
  const [db, setDb] = useState<Database | null>(null);

  useEffect(() => {
    const sync = () => {
      cache = null;
      setDb(getDB());
    };
    setDb(getDB());
    return subscribeToChanges(sync);
  }, []);

  return db;
}

/** Convenience wrapper that re-renders callers after a mutation. */
export function useMutate() {
  return useCallback(
    (mutator: (draft: Database) => Database | void) => updateDB(mutator),
    [],
  );
}

export type { Database };
