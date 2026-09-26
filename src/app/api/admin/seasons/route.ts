import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { seasonSchema } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const body = await req.json();
  const parsed = seasonSchema.parse(body);

  const series = await db.series.findUnique({
    where: { id: parsed.seriesId },
    select: { id: true, title: true },
  });
  if (!series) return apiError("NOT_FOUND", "Series not found");

  const dup = await db.season.findUnique({
    where: { seriesId_seasonNumber: { seriesId: parsed.seriesId, seasonNumber: parsed.seasonNumber } },
    select: { id: true },
  });
  if (dup) return apiError("CONFLICT", "Season number already exists for this series");

  const season = await db.season.create({
    data: {
      seriesId: parsed.seriesId,
      seasonNumber: parsed.seasonNumber,
      title: parsed.title,
      description: parsed.description,
      posterUrl: parsed.posterUrl,
      releaseDate: parsed.releaseDate ? new Date(parsed.releaseDate) : null,
    },
  });

  await writeAudit(req, admin, "create", "series", season.id, {
    seasonId: season.id,
    seriesId: series.id,
    seriesTitle: series.title,
    seasonNumber: season.seasonNumber,
  });

  return apiSuccess({ season }, 201);
});
