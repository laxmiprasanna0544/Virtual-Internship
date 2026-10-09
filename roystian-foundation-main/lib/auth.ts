"use client";

import { useEffect, useState } from "react";
import { getDB, updateDB } from "@/lib/db";
import {
  readStorage,
  removeStorage,
  notifyChange,
  STORAGE_KEYS,
  subscribeToChanges,
  writeStorage,
} from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EducationLevel, Role, Student, User } from "@/types";

/**
 * Authentication runs on Supabase Auth. Supabase is the source of truth for
 * who is signed in and what role they hold; middleware.ts enforces it on the
 * server.
 *
 * TRANSITION: most screens still read the browser demo database (lib/db.ts).
 * After every sign-in this module mirrors the Supabase profile into that
 * database and writes a local session pointing at the mirrored record, so
 * those screens keep working unchanged. Remove the mirror once the screens
 * read from Supabase directly.
 */

export interface Session {
  userId: string;
  role: Role;
}

export function allAccounts(): (User | Student)[] {
  const db = getDB();
  return [...db.staff, ...db.students];
}

export function findUserById(id: string | null | undefined): User | Student | null {
  if (!id) return null;
  return allAccounts().find((u) => u.id === id) ?? null;
}

/** The local mirror session. Only trustworthy while a Supabase session exists. */
export function getSession(): Session | null {
  return readStorage<Session | null>(STORAGE_KEYS.session, null);
}

export function getCurrentUser(): User | Student | null {
  const session = getSession();
  if (!session) return null;
  return findUserById(session.userId);
}

export function getCurrentStudent(): Student | null {
  const user = getCurrentUser();
  if (!user || user.role !== "student") return null;
  return user as Student;
}

/* ------------------------------------------------------------------ */
/*  Supabase → local mirror                                            */
/* ------------------------------------------------------------------ */

let syncing: { userId: string; promise: Promise<User | Student | null> } | null = null;

async function mirrorProfile(userId: string): Promise<User | Student | null> {
  const supabase = getSupabaseBrowserClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, avatar_color, college_id, legacy_demo_id, created_at")
    .eq("id", userId)
    .single();
  if (error || !profile) return null;

  const mirrorId = profile.legacy_demo_id ?? profile.id;

  if (profile.role === "student") {
    const { data: details } = await supabase
      .from("students")
      .select(
        "mobile, education_level, college, course, city, status, domain_id, program_id, experience, active_registration_id, enrolled_at",
      )
      .eq("id", userId)
      .single();

    updateDB((db) => {
      const existing = db.students.find((s) => s.id === mirrorId);
      const fromSupabase = {
        name: profile.full_name,
        email: profile.email.toLowerCase(),
        avatarColor: profile.avatar_color,
        mobile: details?.mobile ?? "",
        educationLevel: (details?.education_level ?? "undergraduate") as EducationLevel,
        college: details?.college ?? "",
        course: details?.course ?? "",
        city: details?.city ?? "",
        status: details?.status ?? "active",
        domainId: details?.domain_id ?? null,
        programId: details?.program_id ?? null,
        experience: details?.experience ?? null,
        registrationId: details?.active_registration_id ?? null,
        enrolledAt: details?.enrolled_at ?? null,
      } satisfies Partial<Student>;

      db.students = existing
        ? db.students.map((s) => (s.id === mirrorId ? { ...s, ...fromSupabase } : s))
        : [
            {
              id: mirrorId,
              role: "student",
              password: "",
              createdAt: profile.created_at,
              ...fromSupabase,
            },
            ...db.students,
          ];
    });
  } else {
    updateDB((db) => {
      const record: User = {
        id: mirrorId,
        role: profile.role,
        name: profile.full_name,
        email: profile.email.toLowerCase(),
        password: "",
        avatarColor: profile.avatar_color,
        createdAt: profile.created_at,
        collegeId: profile.college_id,
      };
      const exists = db.staff.some((u) => u.id === mirrorId);
      db.staff = exists
        ? db.staff.map((u) => (u.id === mirrorId ? { ...u, ...record } : u))
        : [record, ...db.staff];
    });
  }

  writeStorage<Session>(STORAGE_KEYS.session, { userId: mirrorId, role: profile.role });
  notifyChange();
  return findUserById(mirrorId);
}

/** Mirrors a Supabase user once, sharing the request between callers. */
function syncUser(userId: string, force = false): Promise<User | Student | null> {
  if (!force && syncing?.userId === userId) return syncing.promise;
  const promise = mirrorProfile(userId);
  syncing = { userId, promise };
  return promise;
}

function clearLocalSession(): void {
  syncing = null;
  removeStorage(STORAGE_KEYS.session);
  notifyChange();
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

export interface LoginResult {
  ok: boolean;
  error?: string;
  user?: User | Student;
  /** Signup succeeded but the email address must be confirmed first. */
  needsConfirmation?: boolean;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return { ok: false, error: "Confirm your email address before signing in." };
    }
    return { ok: false, error: "Incorrect email or password." };
  }

  const user = await syncUser(data.user.id, true);
  if (!user) {
    await supabase.auth.signOut();
    clearLocalSession();
    return { ok: false, error: "Your account profile could not be loaded. Contact support." };
  }
  if (user.role === "student" && (user as Student).status === "suspended") {
    await supabase.auth.signOut();
    clearLocalSession();
    return { ok: false, error: "This account is suspended. Contact the programme team." };
  }
  return { ok: true, user };
}

/**
 * TRANSITION: re-points the local mirror session after a local-only
 * registration creates or reuses a student record. Has no effect on the
 * Supabase session, which is what the server trusts.
 */
export function loginAs(userId: string, role: Role): void {
  writeStorage<Session>(STORAGE_KEYS.session, { userId, role });
  notifyChange();
}

export async function logout(): Promise<void> {
  await getSupabaseBrowserClient().auth.signOut();
  clearLocalSession();
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  mobile?: string;
  college?: string;
  course?: string;
  city?: string;
  educationLevel?: Student["educationLevel"];
}

export async function registerStudent(input: RegisterInput): Promise<LoginResult> {
  const supabase = getSupabaseBrowserClient();
  // The role is never sent: the database trigger makes every signup a student.
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: {
        full_name: input.name.trim(),
        mobile: input.mobile ?? "",
        college: input.college ?? "",
        course: input.course ?? "",
        city: input.city ?? "",
        education_level: input.educationLevel ?? "undergraduate",
      },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { ok: false, error: "An account with this email already exists." };
    }
    if (error.code === "weak_password") {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Unable to create the account. Please try again." };
  }
  if (!data.session || !data.user) {
    return { ok: true, needsConfirmation: true };
  }

  const user = await syncUser(data.user.id, true);
  return user ? { ok: true, user } : { ok: false, error: "Unable to load your new account." };
}

export interface ProfileUpdate {
  name: string;
  email: string;
  mobile: string;
  college: string;
  course: string;
  city: string;
  educationLevel: EducationLevel;
}

/** Saves the signed-in student's own details to Supabase, then re-mirrors. */
export async function updateOwnProfile(
  values: ProfileUpdate,
): Promise<{ ok: boolean; error?: string; emailChangePending?: boolean }> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Your session has expired. Sign in again." };

  const [profileResult, studentResult] = await Promise.all([
    supabase.from("profiles").update({ full_name: values.name.trim() }).eq("id", user.id),
    supabase
      .from("students")
      .update({
        mobile: values.mobile,
        college: values.college,
        course: values.course,
        city: values.city,
        education_level: values.educationLevel,
      })
      .eq("id", user.id),
  ]);
  if (profileResult.error || studentResult.error) {
    return { ok: false, error: "Unable to save your profile. Please try again." };
  }

  // Email changes go through Supabase's confirmation flow.
  let emailChangePending = false;
  const nextEmail = values.email.trim().toLowerCase();
  if (nextEmail !== user.email?.toLowerCase()) {
    const { error } = await supabase.auth.updateUser({ email: nextEmail });
    if (error) return { ok: false, error: "Profile saved, but the email address could not be changed." };
    emailChangePending = true;
  }

  await syncUser(user.id, true);
  return { ok: true, emailChangePending };
}

/* ------------------------------------------------------------------ */
/*  React                                                              */
/* ------------------------------------------------------------------ */

export interface SessionState {
  ready: boolean;
  user: User | Student | null;
  student: Student | null;
}

function stateFor(user: User | Student | null): SessionState {
  return {
    ready: true,
    user,
    student: user && user.role === "student" ? (user as Student) : null,
  };
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    ready: false,
    user: null,
    student: null,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let authUserId: string | null = null;
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Supabase warns against awaiting its own calls inside this callback.
      setTimeout(async () => {
        if (!active) return;
        if (!session?.user) {
          authUserId = null;
          if (getSession()) clearLocalSession();
          setState(stateFor(null));
          return;
        }
        authUserId = session.user.id;
        const user = await syncUser(session.user.id, event === "USER_UPDATED");
        if (active) setState(stateFor(user));
      }, 0);
    });

    // Local mirror edits (progress, enrolment) re-render subscribers.
    const unsubscribe = subscribeToChanges(() => {
      if (authUserId) setState(stateFor(getCurrentUser()));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      unsubscribe();
    };
  }, []);

  return state;
}
