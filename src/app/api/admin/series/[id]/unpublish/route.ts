import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const admin = await requireAdmin();
    const { id } = await params;

    const series = await db.series.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, status: true },
    });
    if (!series) return apiError("NOT_FOUND", "Series not found");

    const updated = await db.series.update({
      where: { id },
      data: { status: "DRAFT" },
      include: { genres: true, language: true },
    });

    await writeAudit(req, admin, "archive", "series", id, {
      title: series.title,
      slug: series.slug,
      previousStatus: series.status,
    });

    return apiSuccess({ series: updated });
  },
);
