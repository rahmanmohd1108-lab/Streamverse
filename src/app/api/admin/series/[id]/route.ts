import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    await requireAdmin();
    const { id } = await params;

    const series = await db.series.findUnique({
      where: { id },
      include: {
        genres: true,
        categories: true,
        language: true,
        subtitles: true,
        seasons: {
          orderBy: { seasonNumber: "asc" },
          include: {
            episodes: { orderBy: { episodeNumber: "asc" } },
          },
        },
      },
    });
    if (!series) return apiError("NOT_FOUND", "Series not found");
    return apiSuccess({ series });
  },
);

export const PUT = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const admin = await requireAdmin();
    const { id } = await params;

    const existing = await db.series.findUnique({
      where: { id },
      select: { id: true, slug: true, title: true },
    });
    if (!existing) return apiError("NOT_FOUND", "Series not found");

    const body = await req.json();
    const { genreIds, categoryIds, publishedAt, slug, ...rest } = body ?? {};

    const data: Record<string, unknown> = { ...rest };
    if (typeof slug === "string" && slug.trim() && slug !== existing.slug) {
      data.slug = slug.trim();
    }
    if (publishedAt !== undefined) {
      data.publishedAt = publishedAt ? new Date(publishedAt) : null;
    }
    if (Array.isArray(genreIds)) {
      data.genres = { set: genreIds.map((gid: string) => ({ id: gid })) };
    }
    if (Array.isArray(categoryIds)) {
      data.categories = { set: categoryIds.map((cid: string) => ({ id: cid })) };
    }

    const series = await db.series.update({
      where: { id },
      data,
      include: { genres: true, categories: true, language: true },
    });

    await writeAudit(req, admin, "update", "series", series.id, {
      title: series.title,
      slug: series.slug,
    });

    return apiSuccess({ series });
  },
);

export const DELETE = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const admin = await requireAdmin();
    const { id } = await params;

    const series = await db.series.findUnique({
      where: { id },
      select: { id: true, status: true, title: true, slug: true },
    });
    if (!series) return apiError("NOT_FOUND", "Series not found");

    let action: "delete" | "archive" = "archive";
    if (series.status === "DRAFT") {
      await db.series.delete({ where: { id } });
      action = "delete";
    } else {
      await db.series.update({ where: { id }, data: { status: "ARCHIVED" } });
    }

    await writeAudit(req, admin, action, "series", id, {
      title: series.title,
      slug: series.slug,
      previousStatus: series.status,
    });

    return apiSuccess({ ok: true, action });
  },
);
