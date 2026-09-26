import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { loginSchema } from "@/lib/validations";
import {
  verifyPassword,
  createSession,
  setSessionCookie,
  setProfileCookie,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = loginSchema.parse(body);

  const user = await db.user.findUnique({
    where: { email: parsed.email.toLowerCase() },
    include: { profiles: { orderBy: { createdAt: "asc" }, take: 1 } },
  });

  if (!user || !user.passwordHash) {
    return apiError("UNAUTHORIZED", "Invalid email or password");
  }

  const ok = await verifyPassword(parsed.password, user.passwordHash);
  if (!ok) {
    return apiError("UNAUTHORIZED", "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    return apiError("FORBIDDEN", "Your account has been suspended or deleted");
  }

  const token = await createSession(user.id);
  await setSessionCookie(token, parsed.remember);

  // Set active profile to first profile (if any)
  if (user.profiles[0]) {
    await setProfileCookie(user.profiles[0].id);
  }

  return apiSuccess({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      status: user.status,
    },
  });
});
