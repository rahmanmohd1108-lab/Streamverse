import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { episodeSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const body = await req.json();
  const parsed = episodeSchema.parse(body);

  const season = await db.season.findUnique({
    where: { id: parsed.seasonId },
    select: { id: true, seriesId: true },
  });
  if (!season) return apiError("NOT_FOUND", "Season not found");

  const dup = await db.episode.findUnique({
    where: {
      seasonId_episodeNumber: {
        seasonId: parsed.seasonId,
        episodeNumber: parsed.episodeNumber,
      },
    },
    select: { id: true },
  });
  if (dup)
    return apiError("CONFLICT", "Episode number already exists in this season");

  const episode = await db.episode.create({
    data: {
      seasonId: parsed.seasonId,
      episodeNumber: parsed.episodeNumber,
      title: parsed.title,
      description: parsed.description,
      duration: parsed.duration,
      thumbnailUrl: parsed.thumbnailUrl,
      videoUrl: parsed.videoUrl,
      hlsUrl: parsed.hlsUrl,
      videoProvider: parsed.videoProvider,
      releaseDate: parsed.releaseDate ? new Date(parsed.releaseDate) : null,
      isPreview: parsed.isPreview,
      skipIntroStart: parsed.skipIntroStart,
      skipIntroEnd: parsed.skipIntroEnd,
    },
  });

  await writeAudit(req, admin, "create", "series", episode.id, {
    episodeId: episode.id,
    seasonId: season.id,
    seriesId: season.seriesId,
    episodeNumber: episode.episodeNumber,
    title: episode.title,
  });

  return apiSuccess({ episode }, 201);
});
