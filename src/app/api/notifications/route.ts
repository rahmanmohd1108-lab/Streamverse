import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess } from "@/lib/errors";
import { getCurrentUser, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const onlyUnread = url.searchParams.get("unread") === "true";

  const items = await db.notification.findMany({
    where: {
      userId: user.id,
      ...(onlyUnread ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  void getCurrentUser;
  return apiSuccess({ items });
});
