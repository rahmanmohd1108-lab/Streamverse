import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const listSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["USER", "ADMIN", "CONTENT_MANAGER"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin();
  const params = listSchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );

  const where: Prisma.UserWhereInput = {};
  if (params.role) where.role = params.role;
  if (params.status) where.status = params.status;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { email: { contains: params.search } },
    ];
  }

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      // exclude passwordHash — explicitly pick the safe fields
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        authProvider: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { profiles: true, subscriptions: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    db.user.count({ where }),
  ]);

  return apiSuccess({ items, total, page: params.page, limit: params.limit });
});
