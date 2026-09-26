import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const listSchema = z.object({
  adminId: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const params = listSchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );

  const where: Prisma.AdminAuditLogWhereInput = {};
  if (params.adminId) where.adminId = params.adminId;
  if (params.resource) where.resource = params.resource;
  if (params.action) where.action = params.action;

  const [items, total] = await Promise.all([
    db.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    db.adminAuditLog.count({ where }),
  ]);

  return apiSuccess({ items, total, page: params.page, limit: params.limit });
});
