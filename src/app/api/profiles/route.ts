import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import {
  getCurrentUserProfile,
  getActiveProfileId,
  requireUser,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const user = await requireUser();
  const [items, activeProfileId] = await Promise.all([
    db.profile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    getActiveProfileId(),
  ]);

  // If active profile doesn't belong to user, ignore it.
  let active: string | null = activeProfileId;
  if (active && !items.some((p) => p.id === active)) {
    active = null;
  }

  return apiSuccess({ items, activeProfileId: active });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json();

  // Light schema (the imported profileSchema is for both create/update — fine here)
  const name = String(body?.name ?? "").trim();
  if (!name || name.length > 60) {
    return apiError("VALIDATION_ERROR", "name is required (max 60 chars)");
  }
  const isKids = !!body?.isKids;
  const maturityLevel =
    body?.maturityLevel && ["ALL", "7+", "13+", "16+", "18+"].includes(body.maturityLevel)
      ? body.maturityLevel
      : "ALL";
  const language = body?.language ? String(body.language).slice(0, 8) : "en";
  const avatar = body?.avatar ? String(body.avatar) : null;

  const count = await db.profile.count({ where: { userId: user.id } });
  if (count >= 5) {
    return apiError(
      "CONFLICT",
      "Maximum of 5 profiles per account. Remove one to add another.",
    );
  }

  const profile = await db.profile.create({
    data: {
      userId: user.id,
      name,
      isKids,
      maturityLevel,
      language,
      avatar,
    },
  });

  return apiSuccess({ profile }, 201);
});
