import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { getCurrentUserProfile, requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireUser();
  const current = await getCurrentUserProfile();
  if (!current?.profile) {
    return apiError("FORBIDDEN", "No active profile selected");
  }

  const url = new URL(req.url);
  const contentId = url.searchParams.get("contentId");
  const contentType = url.searchParams.get("contentType");

  if (!contentId || !contentType) {
    return apiError(
      "BAD_REQUEST",
      "contentId and contentType query params are required",
    );
  }
  if (contentType !== "movie" && contentType !== "series") {
    return apiError("BAD_REQUEST", "contentType must be movie or series");
  }

  const row = await db.watchlist.findUnique({
    where: {
      profileId_contentId_contentType: {
        profileId: current.profile.id,
        contentId,
        contentType,
      },
    },
    select: { id: true },
  });

  return apiSuccess({ inWatchlist: !!row });
});
