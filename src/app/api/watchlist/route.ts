import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { watchlistSchema } from "@/lib/validations";
import { getCurrentUserProfile, requireUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const user = await requireUser();
  const current = await getCurrentUserProfile();
  if (!current?.profile) {
    return apiError("FORBIDDEN", "No active profile selected");
  }

  const rows = await db.watchlist.findMany({
    where: { profileId: current.profile.id },
    orderBy: { createdAt: "desc" },
    include: {
      movie: {
        include: { genres: true, language: true },
      },
      series: {
        include: { genres: true, language: true },
      },
    },
  });

  const items = rows.map((r) => ({
    id: r.id,
    contentId: r.contentId,
    contentType: r.contentType,
    createdAt: r.createdAt,
    content:
      r.contentType === "movie"
        ? r.movie
          ? { kind: "movie" as const, ...r.movie }
          : null
        : r.series
          ? { kind: "series" as const, ...r.series }
          : null,
  }));

  void user;
  return apiSuccess({ items });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireUser();
  const current = await getCurrentUserProfile();
  if (!current?.profile) {
    return apiError("FORBIDDEN", "No active profile selected");
  }

  const body = await req.json();
  const parsed = watchlistSchema.parse(body);

  // Validate that content exists & is PUBLISHED
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

  // Check duplicates explicitly so we can return a friendlier error.
  const existing = await db.watchlist.findUnique({
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
    return apiError("CONFLICT", "Already in watchlist");
  }

  await db.watchlist.create({
    data: {
      profileId: current.profile.id,
      contentId: parsed.contentId,
      contentType: parsed.contentType,
    },
  });

  return apiSuccess({ ok: true });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireUser();
  const current = await getCurrentUserProfile();
  if (!current?.profile) {
    return apiError("FORBIDDEN", "No active profile selected");
  }

  const url = new URL(req.url);
  const contentId = url.searchParams.get("contentId");
  const contentType = url.searchParams.get("contentType");

  if (!contentId || !contentType) {
    return apiError(
      "BAD_REQUEST",
      "contentId and contentType query params are required",
    );
  }
  if (contentType !== "movie" && contentType !== "series") {
    return apiError("BAD_REQUEST", "contentType must be movie or series");
  }

  try {
    await db.watchlist.delete({
      where: {
        profileId_contentId_contentType: {
          profileId: current.profile.id,
          contentId,
          contentType,
        },
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      // already gone — fine
    } else {
      throw err;
    }
  }

  return apiSuccess({ ok: true });
});
