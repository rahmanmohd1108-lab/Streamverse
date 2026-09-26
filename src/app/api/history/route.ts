import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { watchHistorySchema } from "@/lib/validations";
import { getCurrentUserProfile, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  await requireUser();
  const current = await getCurrentUserProfile();
  if (!current?.profile) {
    return apiError("FORBIDDEN", "No active profile selected");
  }

  const rows = await db.watchHistory.findMany({
    where: { profileId: current.profile.id },
    orderBy: { lastWatchedAt: "desc" },
    take: 50,
    include: {
      movie: { select: { id: true, title: true, slug: true, posterUrl: true, backdropUrl: true, releaseYear: true, duration: true, ageRating: true } },
      series: { select: { id: true, title: true, slug: true, posterUrl: true, backdropUrl: true, releaseYear: true, ageRating: true } },
      episode: {
        select: {
          id: true,
          title: true,
          episodeNumber: true,
          thumbnailUrl: true,
          duration: true,
          season: { select: { id: true, seasonNumber: true, series: { select: { id: true, title: true, slug: true, posterUrl: true } } } },
        },
      },
    },
  });

  const items = rows.map((r) => ({
    id: r.id,
    contentId: r.contentId,
    contentType: r.contentType,
    episodeId: r.episodeId,
    progressSeconds: r.progressSeconds,
    durationSeconds: r.durationSeconds,
    completed: r.completed,
    lastWatchedAt: r.lastWatchedAt,
    content:
      r.contentType === "movie"
        ? r.movie
          ? { kind: "movie" as const, ...r.movie }
          : null
        : r.contentType === "series"
          ? r.series
            ? { kind: "series" as const, ...r.series }
            : null
          : r.episode
            ? { kind: "episode" as const, ...r.episode }
            : null,
  }));

  return apiSuccess({ items });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireUser();
  const current = await getCurrentUserProfile();
  if (!current?.profile) {
    return apiError("FORBIDDEN", "No active profile selected");
  }

  const body = await req.json();
  const parsed = watchHistorySchema.parse(body);

  const completed = parsed.completed ?? false;

  // For unique key on [profileId, contentId, contentType, episodeId]:
  // SQLite treats NULL as distinct, so for movie/series history we set
  // episodeId to undefined (which Prisma doesn't write → stays NULL) but
  // we still need a deterministic lookup. We use findFirst + upsert-by-id.
  const existing = await db.watchHistory.findFirst({
    where: {
      profileId: current.profile.id,
      contentId: parsed.contentId,
      contentType: parsed.contentType,
      ...(parsed.episodeId ? { episodeId: parsed.episodeId } : { episodeId: null }),
    },
    select: { id: true },
  });

  const data = {
    profileId: current.profile.id,
    contentId: parsed.contentId,
    contentType: parsed.contentType,
    episodeId: parsed.episodeId ?? null,
    progressSeconds: parsed.progressSeconds,
    durationSeconds: parsed.durationSeconds,
    completed,
    lastWatchedAt: new Date(),
  };

  if (existing) {
    await db.watchHistory.update({ where: { id: existing.id }, data });
  } else {
    await db.watchHistory.create({ data });
  }

  if (completed) {
    await db.contentView.create({
      data: {
        profileId: current.profile.id,
        contentId: parsed.contentId,
        contentType: parsed.contentType,
        episodeId: parsed.episodeId ?? null,
        startedAt: new Date(Date.now() - parsed.durationSeconds * 1000),
        completedAt: new Date(),
        duration: parsed.durationSeconds,
      },
    });
    await db.analyticsEvent.create({
      data: {
        eventType: "watch_complete",
        userId: current.user.id,
        profileId: current.profile.id,
        contentId: parsed.contentId,
        contentType: parsed.contentType,
        metadata: JSON.stringify({
          episodeId: parsed.episodeId,
          duration: parsed.durationSeconds,
        }),
      },
    });
  } else {
    await db.analyticsEvent.create({
      data: {
        eventType: "watch_start",
        userId: current.user.id,
        profileId: current.profile.id,
        contentId: parsed.contentId,
        contentType: parsed.contentType,
        metadata: JSON.stringify({
          episodeId: parsed.episodeId,
          progress: parsed.progressSeconds,
        }),
      },
    });
  }

  return apiSuccess({ ok: true });
});
