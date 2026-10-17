import "server-only";

import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Uploads to a private S3 bucket.
 *
 *   1. The server checks the request and returns a presigned POST limited to
 *      one key under the student's own prefix, a size range and the content
 *      type (S3 enforces these at upload time).
 *   2. The browser uploads straight to S3.
 *   3. The server re-checks the stored object (owner prefix, size, type)
 *      before recording it, and deletes it if anything is wrong.
 *
 * Downloads are short-lived presigned GET URLs issued to reviewers.
 */

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** File uploads need an S3-compatible bucket; without one they are switched off. */
export function uploadsEnabled(): boolean {
  return Boolean(process.env.S3_UPLOADS_BUCKET);
}

/** Content types a browser may report for allowed files. Never HTML or SVG. */
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/json",
  "application/x-ipynb+json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/octet-stream",
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/x-python",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function isAllowedContentType(type: string): boolean {
  return ALLOWED_TYPES.has(type.toLowerCase().split(";")[0].trim());
}

declare global {
  var __roystianS3: S3Client | undefined;
}

function bucket(): string {
  const name = process.env.S3_UPLOADS_BUCKET;
  if (!name) throw new Error("S3_UPLOADS_BUCKET is not set");
  return name;
}

/**
 * Any S3-compatible store:
 *   DigitalOcean Spaces  S3_ENDPOINT=https://blr1.digitaloceanspaces.com, S3_REGION=blr1
 *   Amazon S3            leave S3_ENDPOINT unset, S3_REGION=<region>
 *   local emulator       S3_ENDPOINT=http://localhost:5055, S3_FORCE_PATH_STYLE=true
 * Credentials: S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY, or the default AWS chain.
 */
function client(): S3Client {
  if (!globalThis.__roystianS3) {
    const keyId = process.env.S3_ACCESS_KEY_ID;
    const secret = process.env.S3_SECRET_ACCESS_KEY;
    globalThis.__roystianS3 = new S3Client({
      region: process.env.S3_REGION ?? process.env.AWS_REGION ?? "us-east-1",
      ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      ...(keyId && secret ? { credentials: { accessKeyId: keyId, secretAccessKey: secret } } : {}),
    });
  }
  return globalThis.__roystianS3;
}

/** The URL the browser should use (the emulator is reached differently from inside Docker). */
function publicUrl(url: string): string {
  const internal = process.env.S3_ENDPOINT;
  const external = process.env.S3_PUBLIC_ENDPOINT;
  return internal && external && url.startsWith(internal) ? external + url.slice(internal.length) : url;
}

export function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "file";
}

/** `<kind>/<student id>/<scope>/<uuid>-<file name>` — the owner is the second segment. */
export function uploadKey(kind: "submissions" | "projects", studentId: string, scope: string, fileName: string) {
  return `${kind}/${studentId}/${scope.replace(/[^a-z0-9-]/gi, "")}/${randomUUID()}-${safeFileName(fileName)}`;
}

export function keyBelongsTo(key: string, studentId: string): boolean {
  const parts = key.split("/");
  return parts.length >= 4 && (parts[0] === "submissions" || parts[0] === "projects") && parts[1] === studentId;
}

export async function presignUpload(key: string, contentType: string) {
  const { url, fields } = await createPresignedPost(client(), {
    Bucket: bucket(),
    Key: key,
    Conditions: [
      ["content-length-range", 1, MAX_UPLOAD_BYTES],
      ["eq", "$Content-Type", contentType],
    ],
    Fields: { "Content-Type": contentType },
    Expires: 300,
  });
  return { url: publicUrl(url), fields };
}

export type StoredCheck = { ok: true; size: number } | { ok: false; reason: string };

/**
 * Confirms an uploaded object exists and is within limits. Anything outside
 * them is deleted, so a bypassed browser check never leaves a bad file behind.
 */
export async function verifyUpload(key: string): Promise<StoredCheck> {
  let head;
  try {
    head = await client().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
  } catch {
    return { ok: false, reason: "The uploaded file could not be found. Upload it again." };
  }
  const size = head.ContentLength ?? 0;
  const type = head.ContentType ?? "";
  if (size < 1 || size > MAX_UPLOAD_BYTES || !isAllowedContentType(type)) {
    await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key })).catch(() => undefined);
    return {
      ok: false,
      reason: size > MAX_UPLOAD_BYTES ? "That file is larger than the 20MB limit." : "That file type is not allowed.",
    };
  }
  return { ok: true, size };
}

/** A five-minute download link for a reviewer. */
export async function presignDownload(key: string, fileName?: string | null): Promise<string> {
  const url = await getSignedUrl(
    client(),
    new GetObjectCommand({
      Bucket: bucket(),
      Key: key,
      ResponseContentDisposition: `attachment; filename="${safeFileName(fileName ?? key.split("/").pop() ?? "file")}"`,
    }),
    { expiresIn: 300 },
  );
  return publicUrl(url);
}
