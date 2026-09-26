import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess } from "@/lib/errors";
import { forgotPasswordSchema } from "@/lib/validations";
import { generateToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = forgotPasswordSchema.parse(body);

  const email = parsed.email.toLowerCase();

  // Always return ok to prevent email enumeration, but only write a token
  // if the user actually exists.
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });

  let devToken: string | undefined;

  if (user) {
    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await db.passwordResetToken.create({
      data: { email, token, expires },
    });

    if (process.env.NODE_ENV === "development") {
      devToken = token;
    }
    // In production with EMAIL_PROVIDER=none we silently swallow — but the
    // caller still sees { ok: true }.
  }

  if (process.env.NODE_ENV === "development") {
    return apiSuccess({ ok: true, devToken });
  }
  return apiSuccess({ ok: true });
});
