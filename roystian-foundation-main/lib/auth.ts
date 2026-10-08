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
import { uid } from "@/lib/ids";
import type { Role, Student, User } from "@/types";

export interface Session {
  userId: string;
  role: Role;
}

export const DEMO_ACCOUNTS: {
  role: Role;
  email: string;
  password: string;
  label: string;
  description: string;
}[] = [
  {
    role: "student",
    email: "student@roystian.demo",
    password: "student123",
    label: "Demo Student",
    description: "Rahul Sharma — AI/ML Industry-Led internship, 40% complete",
  },
  {
    role: "admin",
    email: "admin@roystian.demo",
    password: "admin123",
    label: "Demo Admin",
    description: "Full programme administration and analytics",
  },
  {
    role: "trainer",
    email: "trainer@roystian.demo",
    password: "trainer123",
    label: "Demo Trainer",
    description: "Aarav Mehta — session schedule and assigned students",
  },
  {
    role: "college",
    email: "college@roystian.demo",
    password: "college123",
    label: "Demo College",
    description: "Vignan Institute of Technology — campus dashboard and skill gap report",
  },
];

export function allAccounts(): (User | Student)[] {
  const db = getDB();
  return [...db.staff, ...db.students];
}

export function findUserById(id: string | null | undefined): User | Student | null {
  if (!id) return null;
  return allAccounts().find((u) => u.id === id) ?? null;
}

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

export interface LoginResult {
  ok: boolean;
  error?: string;
  user?: User | Student;
}

export function login(email: string, password: string): LoginResult {
  const normalised = email.trim().toLowerCase();
  const user = allAccounts().find(
    (candidate) => candidate.email.toLowerCase() === normalised,
  );
  if (!user) {
    return { ok: false, error: "No account found with that email address." };
  }
  if (user.password !== password) {
    return { ok: false, error: "Incorrect password. Please try again." };
  }
  if (user.role === "student" && (user as Student).status === "suspended") {
    return {
      ok: false,
      error: "This account is suspended. Contact the programme team.",
    };
  }
  writeStorage(STORAGE_KEYS.session, { userId: user.id, role: user.role });
  notifyChange();
  return { ok: true, user };
}

export function loginAs(userId: string, role: Role): void {
  writeStorage(STORAGE_KEYS.session, { userId, role });
  notifyChange();
}

export function logout(): void {
  removeStorage(STORAGE_KEYS.session);
  notifyChange();
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

export function registerStudent(input: RegisterInput): LoginResult {
  const normalised = input.email.trim().toLowerCase();
  const existing = allAccounts().find(
    (candidate) => candidate.email.toLowerCase() === normalised,
  );
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const student: Student = {
    id: uid("stu"),
    role: "student",
    name: input.name.trim(),
    email: normalised,
    password: input.password,
    avatarColor: "indigo",
    createdAt: new Date().toISOString(),
    mobile: input.mobile ?? "",
    educationLevel: input.educationLevel ?? "undergraduate",
    college: input.college ?? "",
    course: input.course ?? "",
    city: input.city ?? "",
    domainId: null,
    experience: null,
    programId: null,
    registrationId: null,
    status: "active",
    enrolledAt: null,
  };

  updateDB((db) => {
    db.students = [student, ...db.students];
  });

  writeStorage(STORAGE_KEYS.session, { userId: student.id, role: "student" });
  notifyChange();
  return { ok: true, user: student };
}

export interface SessionState {
  ready: boolean;
  user: User | Student | null;
  student: Student | null;
}

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    ready: false,
    user: null,
    student: null,
  });

  useEffect(() => {
    const sync = () => {
      const user = getCurrentUser();
      setState({
        ready: true,
        user,
        student: user && user.role === "student" ? (user as Student) : null,
      });
    };
    sync();
    return subscribeToChanges(sync);
  }, []);

  return state;
}
