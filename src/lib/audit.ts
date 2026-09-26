/**
 * Shared helper for writing admin audit log entries inside API routes.
 * Keeps the route files small and consistent.
 */
import { NextRequest } from "next/server";
import type { User } from "@prisma/client";
import { db } from "@/lib/db";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "archive";
export type AuditResource =
  | "movie"
  | "series"
  | "season"
  | "episode"
  | "user"
  | "banner"
  | "plan"
  | "genre"
  | "category"
  | "language"
  | "subscription";

export async function writeAudit(
  req: NextRequest,
  admin: User,
  action: AuditAction,
  resource: AuditResource,
  resourceId?: string,
  metadata?: Record<string, unknown>,
) {
  await db.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action,
      resource,
      resourceId: resourceId ?? null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent"),
    },
  });
}
