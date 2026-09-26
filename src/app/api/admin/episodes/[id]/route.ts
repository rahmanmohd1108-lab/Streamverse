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

    const existing = await db.episode.findUnique({ where: { id } });
    if (!existing) return apiError("NOT_FOUND", "Episode not found");

    const body = await req.json();
    const data: Record<string, unknown> = {};
    for (const key of [
      "title",
      "description",
      "thumbnailUrl",
      "videoUrl",
      "hlsUrl",
      "videoProvider",
    ] as const) {
      if (body?.[key] !== undefined) {
        data[key] = typeof body[key] === "string" && body[key] === "" ? null : body[key];
      }
    }
    if (typeof body?.episodeNumber === "number") data.episodeNumber = body.episodeNumber;
    if (typeof body?.duration === "number") data.duration = body.duration;
    if (typeof body?.isPreview === "boolean") data.isPreview = body.isPreview;
    if (typeof body?.skipIntroStart === "number")
      data.skipIntroStart = body.skipIntroStart;
    if (typeof body?.skipIntroEnd === "number")
      data.skipIntroEnd = body.skipIntroEnd;
    if (typeof body?.releaseDate === "string")
      data.releaseDate = body.releaseDate ? new Date(body.releaseDate) : null;
    if (typeof body?.seasonId === "string" && body.seasonId)
      data.seasonId = body.seasonId;

    const episode = await db.episode.update({ where: { id }, data });

    await writeAudit(req, admin, "update", "series", episode.id, {
      episodeId: episode.id,
      title: episode.title,
      episodeNumber: episode.episodeNumber,
    });

    return apiSuccess({ episode });
  },
);

export const DELETE = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const admin = await requireAdmin();
    const { id } = await params;

    const episode = await db.episode.findUnique({
      where: { id },
      select: { id: true, title: true, episodeNumber: true, seasonId: true },
    });
    if (!episode) return apiError("NOT_FOUND", "Episode not found");

    await db.episode.delete({ where: { id } });

    await writeAudit(req, admin, "delete", "series", id, {
      episodeId: episode.id,
      seasonId: episode.seasonId,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
    });

    return apiSuccess({ ok: true });
  },
);
