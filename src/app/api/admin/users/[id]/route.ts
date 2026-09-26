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

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });
    if (!user) return apiError("NOT_FOUND", "User not found");

    const body = await req.json();
    const data: { role?: string; status?: string } = {};
    if (
      body?.role &&
      ["USER", "ADMIN", "CONTENT_MANAGER"].includes(body.role)
    ) {
      data.role = body.role;
    }
    if (
      body?.status &&
      ["ACTIVE", "SUSPENDED", "DELETED"].includes(body.status)
    ) {
      data.status = body.status;
    }

    if (Object.keys(data).length === 0) {
      return apiError("BAD_REQUEST", "No valid fields to update");
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await writeAudit(req, admin, "update", "user", id, {
      email: user.email,
      previousRole: user.role,
      previousStatus: user.status,
      newRole: data.role,
      newStatus: data.status,
    });

    return apiSuccess({ user: updated });
  },
);
