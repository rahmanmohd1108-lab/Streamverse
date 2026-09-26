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
    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) return apiError("NOT_FOUND", "Banner not found");

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (typeof body?.title === "string" && body.title.trim())
      data.title = body.title;
    if (typeof body?.imageUrl === "string")
      data.imageUrl = body.imageUrl || null;
    if (typeof body?.videoUrl === "string")
      data.videoUrl = body.videoUrl || null;
    if (typeof body?.contentId === "string")
      data.contentId = body.contentId || null;
    if (typeof body?.contentType === "string")
      data.contentType = body.contentType || null;
    if (typeof body?.active === "boolean") data.active = body.active;
    if (typeof body?.displayOrder === "number")
      data.displayOrder = body.displayOrder;
    if (typeof body?.startDate === "string")
      data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (typeof body?.endDate === "string")
      data.endDate = body.endDate ? new Date(body.endDate) : null;

    const banner = await db.banner.update({ where: { id }, data });
    await writeAudit(req, admin, "update", "banner", banner.id, {
      title: banner.title,
    });
    return apiSuccess({ banner });
  },
);

export const DELETE = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) return apiError("NOT_FOUND", "Banner not found");

    await db.banner.delete({ where: { id } });
    await writeAudit(req, admin, "delete", "banner", id, {
      title: existing.title,
    });
    return apiSuccess({ ok: true });
  },
);
