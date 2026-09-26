import { withErrorHandler, apiSuccess } from "@/lib/errors";
import { clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async () => {
  await clearSessionCookie();
  return apiSuccess({ ok: true });
});
