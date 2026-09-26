import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess } from "@/lib/errors";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const user = await requireUser();
  let preferences = await db.notificationPreference.findUnique({
    where: { userId: user.id },
  });
  if (!preferences) {
    preferences = await db.notificationPreference.create({
      data: { userId: user.id },
    });
  }
  return apiSuccess({ preferences });
});

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json();

  const data: {
    email?: boolean;
    push?: boolean;
    newContent?: boolean;
    subscription?: boolean;
    account?: boolean;
  } = {};
  for (const key of ["email", "push", "newContent", "subscription", "account"] as const) {
    if (typeof body?.[key] === "boolean") {
      data[key] = body[key];
    }
  }

  // Upsert because NotificationPreference is unique on userId
  const preferences = await db.notificationPreference.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  return apiSuccess({ preferences });
});
