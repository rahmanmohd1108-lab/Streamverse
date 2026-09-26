import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const PUT = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const user = await requireUser();
    const { id } = await params;

    const profile = await db.profile.findUnique({ where: { id } });
    if (!profile || profile.userId !== user.id) {
      return apiError("NOT_FOUND", "Profile not found");
    }

    const body = await req.json();
    const data: {
      name?: string;
      avatar?: string | null;
      language?: string;
      maturityLevel?: string;
      isKids?: boolean;
    } = {};

    if (typeof body?.name === "string" && body.name.trim()) {
      data.name = body.name.trim().slice(0, 60);
    }
    if (body?.avatar !== undefined) {
      data.avatar = body.avatar ? String(body.avatar) : null;
    }
    if (typeof body?.language === "string") {
      data.language = body.language.slice(0, 8);
    }
    if (
      body?.maturityLevel &&
      ["ALL", "7+", "13+", "16+", "18+"].includes(body.maturityLevel)
    ) {
      data.maturityLevel = body.maturityLevel;
    }
    if (typeof body?.isKids === "boolean") {
      data.isKids = body.isKids;
    }

    const updated = await db.profile.update({ where: { id }, data });
    return apiSuccess({ profile: updated });
  },
);

export const DELETE = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const user = await requireUser();
    const { id } = await params;

    const profile = await db.profile.findUnique({ where: { id } });
    if (!profile || profile.userId !== user.id) {
      return apiError("NOT_FOUND", "Profile not found");
    }

    const count = await db.profile.count({ where: { userId: user.id } });
    if (count <= 1) {
      return apiError(
        "CONFLICT",
        "Cannot delete the only remaining profile",
      );
    }

    await db.profile.delete({ where: { id } });
    return apiSuccess({ ok: true });
  },
);
