import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError, slugify } from "@/lib/errors";
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
    const existing = await db.genre.findUnique({ where: { id } });
    if (!existing) return apiError("NOT_FOUND", "Genre not found");

    const body = await req.json();
    const data: { name?: string; slug?: string } = {};
    if (typeof body?.name === "string" && body.name.trim()) {
      const name = body.name.trim();
      data.name = name;
      data.slug = body.slug?.trim() || slugify(name);
    } else if (typeof body?.slug === "string" && body.slug.trim()) {
      data.slug = body.slug.trim();
    }

    const genre = await db.genre.update({ where: { id }, data });
    await writeAudit(req, admin, "update", "genre", genre.id, {
      name: genre.name,
      slug: genre.slug,
    });
    return apiSuccess({ genre });
  },
);

export const DELETE = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const existing = await db.genre.findUnique({
      where: { id },
      include: { _count: { select: { movies: true, series: true } } },
    });
    if (!existing) return apiError("NOT_FOUND", "Genre not found");

    if (existing._count.movies > 0 || existing._count.series > 0) {
      return apiError(
        "CONFLICT",
        `Genre is still referenced by ${existing._count.movies} movie(s) and ${existing._count.series} series. Remove those references first.`,
      );
    }

    await db.genre.delete({ where: { id } });
    await writeAudit(req, admin, "delete", "genre", id, {
      name: existing.name,
    });
    return apiSuccess({ ok: true });
  },
);
