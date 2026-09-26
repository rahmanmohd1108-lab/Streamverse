import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { requireUser, setProfileCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireUser();
  const body = await req.json();
  const profileId = String(body?.profileId ?? "").trim();
  if (!profileId) {
    return apiError("BAD_REQUEST", "profileId is required");
  }

  const profile = await db.profile.findFirst({
    where: { id: profileId, userId: user.id },
    select: { id: true },
  });
  if (!profile) {
    return apiError("NOT_FOUND", "Profile not found");
  }

  await setProfileCookie(profile.id);
  return apiSuccess({ ok: true, activeProfileId: profile.id });
});
