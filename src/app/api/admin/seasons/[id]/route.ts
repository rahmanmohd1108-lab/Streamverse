import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const PUT = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const admin = await requireAdmin();
    const { id } = await params;

    const existing = await db.season.findUnique({ where: { id } });
    if (!existing) return apiError("NOT_FOUND", "Season not found");

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body?.seasonNumber === "number")
      data.seasonNumber = body.seasonNumber;
    if (typeof body?.title === "string") data.title = body.title || null;
    if (typeof body?.description === "string")
      data.description = body.description || null;
    if (typeof body?.posterUrl === "string")
      data.posterUrl = body.posterUrl || null;
    if (typeof body?.releaseDate === "string")
      data.releaseDate = body.releaseDate ? new Date(body.releaseDate) : null;

    const season = await db.season.update({ where: { id }, data });

    await writeAudit(req, admin, "update", "series", season.id, {
      seasonId: season.id,
      seasonNumber: season.seasonNumber,
    });

    return apiSuccess({ season });
  },
);

export const DELETE = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const admin = await requireAdmin();
    const { id } = await params;

    const season = await db.season.findUnique({
      where: { id },
      select: { id: true, seasonNumber: true, seriesId: true },
    });
    if (!season) return apiError("NOT_FOUND", "Season not found");

    await db.season.delete({ where: { id } });

    await writeAudit(req, admin, "delete", "series", id, {
      seasonId: season.id,
      seriesId: season.seriesId,
      seasonNumber: season.seasonNumber,
    });

    return apiSuccess({ ok: true });
  },
);
