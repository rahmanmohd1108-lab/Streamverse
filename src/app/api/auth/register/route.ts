import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  withErrorHandler,
  apiSuccess,
  apiError,
} from "@/lib/errors";
import { registerSchema } from "@/lib/validations";
import {
  hashPassword,
  createSession,
  setSessionCookie,
  setProfileCookie,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = registerSchema.parse(body);

  // Check for existing email
  const existing = await db.user.findUnique({
    where: { email: parsed.email.toLowerCase() },
    select: { id: true },
  });
  if (existing) {
    return apiError("CONFLICT", "An account with this email already exists");
  }

  const passwordHash = await hashPassword(parsed.password);

  const user = await db.user.create({
    data: {
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      passwordHash,
      role: "USER",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  // Create default "Main" profile
  const profile = await db.profile.create({
    data: {
      userId: user.id,
      name: "Main",
      language: "en",
      maturityLevel: "ALL",
      isKids: false,
    },
  });

  // Create default notification preferences
  await db.notificationPreference.create({
    data: { userId: user.id },
  });

  // Welcome notification
  await db.notification.create({
    data: {
      userId: user.id,
      profileId: profile.id,
      title: "Welcome to StreamVerse",
      message: `Hi ${user.name}, welcome aboard! Start exploring thousands of titles.`,
      type: "account",
      actionUrl: "/browse",
    },
  });

  // Mint session
  const token = await createSession(user.id);
  await setSessionCookie(token, false);
  await setProfileCookie(profile.id);

  return apiSuccess({ user }, 201);
});
