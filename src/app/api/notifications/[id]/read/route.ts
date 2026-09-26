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

    const notif = await db.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== user.id) {
      return apiError("NOT_FOUND", "Notification not found");
    }

    const updated = await db.notification.update({
      where: { id },
      data: { read: true },
    });
    return apiSuccess({ ok: true, notification: updated });
  },
);
