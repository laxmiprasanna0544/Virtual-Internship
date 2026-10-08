"use client";

/**
 * Mock API layer.
 *
 * Every screen talks to this module rather than to localStorage directly, so
 * swapping the demo persistence for a real backend is a single-file change:
 * each function below would become a `fetch` call with the same signature.
 */

import {
  getCurrentStudent,
  getCurrentUser,
  login,
  logout,
  registerStudent,
} from "@/lib/auth";
import {
  generateCertificate,
  getCertificateForStudent,
  listCertificates,
  setCertificateStatus,
  verifyCertificate,
} from "@/lib/certificates";
import { createLead, listLeads, setLeadStatus } from "@/lib/leads";
import { listCommunications, logCommunication } from "@/lib/communications";
import {
  listNotifications,
  markAllRead,
  markRead,
  pushNotification,
} from "@/lib/notifications";
import { createRegistration, setPaymentStatus } from "@/lib/payments";
import {
  completionRequirements,
  getProgress,
  getSubmission,
  isCertificateUnlocked,
  markModuleComplete,
  markModuleIncomplete,
  saveModuleNote,
  submitAssessment,
  summariseProgress,
  updateProgress,
} from "@/lib/progress";
import { listSubmissions, reviewSubmission, submitAssignment } from "@/lib/submissions";

/** Simulated network latency for demo loading states. */
export function delay(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const api = {
  // auth
  getCurrentUser,
  getCurrentStudent,
  login,
  logout,
  registerStudent,
  // registration + payment
  createRegistration,
  setPaymentStatus,
  // progress
  getProgress,
  updateProgress,
  markModuleComplete,
  markModuleIncomplete,
  saveModuleNote,
  submitAssessment,
  summariseProgress,
  completionRequirements,
  isCertificateUnlocked,
  // assignments
  getSubmission,
  listSubmissions,
  submitAssignment,
  reviewSubmission,
  // certificates
  generateCertificate,
  getCertificateForStudent,
  listCertificates,
  setCertificateStatus,
  verifyCertificate,
  // notifications + communications
  listNotifications,
  markRead,
  markAllRead,
  pushNotification,
  listCommunications,
  logCommunication,
  // college leads
  createLead,
  listLeads,
  setLeadStatus,
};

export type Api = typeof api;
