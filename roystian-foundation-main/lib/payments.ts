"use client";

import { getDomain } from "@/data/domains";
import { getProgram } from "@/data/programs";
import { getDB, updateDB } from "@/lib/db";
import {
  buildPaymentId,
  buildPaymentReference,
  buildRegistrationId,
} from "@/lib/ids";
import { runPaymentSuccessFlow } from "@/lib/communications";
import { pushNotification } from "@/lib/notifications";
import { ensureProgress } from "@/lib/progress";
import { uid } from "@/lib/ids";
import type {
  ExperienceLevel,
  Payment,
  PaymentMethod,
  PaymentStatus,
  ProgramId,
  Registration,
  Student,
  Submission,
} from "@/types";

export interface CheckoutInput {
  name: string;
  email: string;
  mobile: string;
  college: string;
  course: string;
  city?: string;
  educationLevel?: Student["educationLevel"];
  domainId: string;
  experience: ExperienceLevel;
  programId: ProgramId;
  method: PaymentMethod;
  existingStudentId?: string | null;
}

export interface CheckoutResult {
  student: Student;
  registration: Registration;
  payment: Payment;
}

/** Simulated gateway latency so the demo payment feels real. */
export const PAYMENT_SIMULATION_MS = 2400;

export function createRegistration(input: CheckoutInput): CheckoutResult {
  const db = getDB();
  const domain = getDomain(input.domainId);
  const program = getProgram(input.programId);
  if (!domain || !program) {
    throw new Error("Unknown domain or program");
  }

  const sequence = db.counters.registration + 1;
  const registrationId = buildRegistrationId(domain.id, sequence);
  const now = new Date().toISOString();

  const existing =
    db.students.find((s) => s.id === input.existingStudentId) ??
    db.students.find(
      (s) => s.email.toLowerCase() === input.email.trim().toLowerCase(),
    );

  const student: Student = existing
    ? {
        ...existing,
        name: input.name,
        mobile: input.mobile,
        college: input.college,
        course: input.course,
        city: input.city ?? existing.city,
        educationLevel: input.educationLevel ?? existing.educationLevel,
        domainId: domain.id,
        experience: input.experience,
        programId: program.id,
        registrationId,
        status: "active",
        enrolledAt: now,
      }
    : {
        id: uid("stu"),
        role: "student",
        name: input.name,
        email: input.email.trim().toLowerCase(),
        password: "student123",
        avatarColor: "indigo",
        createdAt: now,
        mobile: input.mobile,
        educationLevel: input.educationLevel ?? "undergraduate",
        college: input.college,
        course: input.course,
        city: input.city ?? "",
        domainId: domain.id,
        experience: input.experience,
        programId: program.id,
        registrationId,
        status: "active",
        enrolledAt: now,
      };

  const registration: Registration = {
    id: registrationId,
    studentId: student.id,
    studentName: student.name,
    email: student.email,
    college: student.college,
    course: student.course,
    domainId: domain.id,
    programId: program.id,
    experience: input.experience,
    amount: program.price,
    paymentStatus: "successful",
    internshipStatus: "not-started",
    createdAt: now,
    startDate: now,
  };

  const payment: Payment = {
    id: buildPaymentId(db.counters.payment + 1),
    registrationId,
    studentId: student.id,
    studentName: student.name,
    amount: program.price,
    method: input.method,
    status: "successful",
    createdAt: now,
    reference: buildPaymentReference(input.method),
  };

  const submission: Submission = {
    id: `sub_${student.id}_${domain.id}`,
    studentId: student.id,
    studentName: student.name,
    domainId: domain.id,
    taskTitle: domain.practicalTask.title,
    responseText: "",
    fileName: null,
    status: "pending",
    feedback: null,
    submittedAt: null,
    reviewedAt: null,
  };

  updateDB((next) => {
    next.students = existing
      ? next.students.map((s) => (s.id === student.id ? student : s))
      : [student, ...next.students];
    next.registrations = [registration, ...next.registrations];
    next.payments = [payment, ...next.payments];
    next.submissions = [
      submission,
      ...next.submissions.filter(
        (s) => !(s.studentId === student.id && s.domainId === domain.id),
      ),
    ];
    next.counters = {
      registration: sequence,
      certificate: next.counters.certificate,
      payment: next.counters.payment + 1,
    };
  });

  ensureProgress(student.id, domain.id);

  runPaymentSuccessFlow({
    name: student.name,
    email: student.email,
    mobile: student.mobile,
    registrationId,
    domainName: domain.name,
    programName: program.name,
  });

  pushNotification(
    student.id,
    "success",
    "Registration confirmed",
    `Your ${domain.name} virtual internship is active. Registration ID ${registrationId}.`,
    "/dashboard",
  );

  return { student, registration, payment };
}

export function setPaymentStatus(paymentId: string, status: PaymentStatus): void {
  updateDB((db) => {
    db.payments = db.payments.map((p) =>
      p.id === paymentId ? { ...p, status } : p,
    );
    const payment = db.payments.find((p) => p.id === paymentId);
    if (payment) {
      db.registrations = db.registrations.map((r) =>
        r.id === payment.registrationId ? { ...r, paymentStatus: status } : r,
      );
    }
  });
}

export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  hint: string;
}[] = [
  { value: "upi", label: "UPI", hint: "Pay using any UPI app" },
  { value: "card", label: "Debit / Credit Card", hint: "Visa, Mastercard, RuPay" },
  { value: "netbanking", label: "Net Banking", hint: "All major Indian banks" },
];

/**
 * Switches a student's active domain to an already-enrolled domain.
 */
export function switchActiveDomain(studentId: string, domainId: string): boolean {
  const db = getDB();
  const student = db.students.find((s) => s.id === studentId);
  if (!student) return false;

  const registration = db.registrations.find(
    (r) => r.studentId === studentId && r.domainId === domainId,
  );
  if (!registration) return false;

  updateDB((next) => {
    next.students = next.students.map((s) => {
      if (s.id !== studentId) return s;
      return {
        ...s,
        domainId: registration.domainId,
        programId: registration.programId,
        registrationId: registration.id,
        experience: registration.experience,
      };
    });
  });

  return true;
}

