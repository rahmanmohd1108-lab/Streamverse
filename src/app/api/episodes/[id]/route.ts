import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const { id } = await params;

    const episode = await db.episode.findUnique({
      where: { id },
      include: {
        subtitles: true,
        season: {
          include: {
            series: true,
          },
        },
      },
    });

    if (!episode) {
      return apiError("NOT_FOUND", "Episode not found");
    }

    // Don't leak unpublished series
    if (
      episode.season?.series &&
      episode.season.series.status !== "PUBLISHED"
    ) {
      return apiError("NOT_FOUND", "Episode not found");
    }

    return apiSuccess({ episode });
  },
);
