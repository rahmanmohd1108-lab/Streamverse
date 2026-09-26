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
    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) return apiError("NOT_FOUND", "Category not found");

    const body = await req.json();
    const data: { name?: string; slug?: string } = {};
    if (typeof body?.name === "string" && body.name.trim()) {
      const name = body.name.trim();
      data.name = name;
      data.slug = body.slug?.trim() || slugify(name);
    } else if (typeof body?.slug === "string" && body.slug.trim()) {
      data.slug = body.slug.trim();
    }

    const category = await db.category.update({ where: { id }, data });
    await writeAudit(req, admin, "update", "category", category.id, {
      name: category.name,
    });
    return apiSuccess({ category });
  },
);

export const DELETE = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const existing = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { movies: true, series: true } } },
    });
    if (!existing) return apiError("NOT_FOUND", "Category not found");

    if (existing._count.movies > 0 || existing._count.series > 0) {
      return apiError(
        "CONFLICT",
        `Category is still referenced by ${existing._count.movies} movie(s) and ${existing._count.series} series.`,
      );
    }

    await db.category.delete({ where: { id } });
    await writeAudit(req, admin, "delete", "category", id, {
      name: existing.name,
    });
    return apiSuccess({ ok: true });
  },
);
