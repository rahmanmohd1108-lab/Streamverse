import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { resetPasswordSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = resetPasswordSchema.parse(body);

  const tokenRow = await db.passwordResetToken.findUnique({
    where: { token: parsed.token },
  });

  if (!tokenRow || tokenRow.used) {
    return apiError("BAD_REQUEST", "Invalid or already-used reset token");
  }
  if (tokenRow.expires.getTime() < Date.now()) {
    return apiError("BAD_REQUEST", "Reset token has expired");
  }

  const user = await db.user.findUnique({
    where: { email: tokenRow.email.toLowerCase() },
    select: { id: true },
  });
  if (!user) {
    return apiError("NOT_FOUND", "No account found for that email");
  }

  const passwordHash = await hashPassword(parsed.password);

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    db.passwordResetToken.update({
      where: { id: tokenRow.id },
      data: { used: true },
    }),
  ]);

  return apiSuccess({ ok: true });
});
