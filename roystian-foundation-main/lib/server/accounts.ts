import "server-only";

import { getSql } from "@/lib/server/db";
import { toStudent, type ProfileRow, type StudentRow } from "@/lib/records/mappers";
import type { Student, User } from "@/types";

export interface Account {
  user: User | Student;
  mfaEnabled: boolean;
}

/** The signed-in account as the client sees it (no secrets, no other users). */
export async function loadAccount(userId: string): Promise<Account | null> {
  const sql = getSql();
  const [profile] = await sql<ProfileRow[]>`select * from public.profiles where id = ${userId}`;
  if (!profile) return null;

  if (profile.role === "student") {
    const [student] = await sql<StudentRow[]>`select * from public.students where id = ${userId}`;
    if (!student) return null;
    return { user: toStudent(profile, student), mfaEnabled: profile.mfa_enabled };
  }

  return {
    user: {
      id: profile.id,
      role: profile.role,
      name: profile.full_name,
      email: profile.email.toLowerCase(),
      password: "",
      avatarColor: profile.avatar_color,
      createdAt: profile.created_at,
      collegeId: profile.college_id,
    },
    mfaEnabled: profile.mfa_enabled,
  };
}
