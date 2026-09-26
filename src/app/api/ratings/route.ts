import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { ratingSchema } from "@/lib/validations";
import { getCurrentUserProfile, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireUser();
  const current = await getCurrentUserProfile();
  if (!current?.profile) {
    return apiError("FORBIDDEN", "No active profile selected");
  }

  const body = await req.json();
  const parsed = ratingSchema.parse(body);

  // Validate content exists & published
  const exists =
    parsed.contentType === "movie"
      ? await db.movie.findUnique({
          where: { id: parsed.contentId },
          select: { id: true, status: true },
        })
      : await db.series.findUnique({
          where: { id: parsed.contentId },
          select: { id: true, status: true },
        });
  if (!exists || exists.status !== "PUBLISHED") {
    return apiError("NOT_FOUND", "Content not found");
  }

  // Upsert: lookup by unique key, fall back to create
  const existing = await db.rating.findUnique({
    where: {
      profileId_contentId_contentType: {
        profileId: current.profile.id,
        contentId: parsed.contentId,
        contentType: parsed.contentType,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await db.rating.update({
      where: { id: existing.id },
      data: { rating: parsed.rating },
    });
  } else {
    await db.rating.create({
      data: {
        profileId: current.profile.id,
        contentId: parsed.contentId,
        contentType: parsed.contentType,
        rating: parsed.rating,
      },
    });
  }

  return apiSuccess({ ok: true });
});
