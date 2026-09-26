import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> },
  ) => {
    const { slug } = await params;

    const series = await db.series.findUnique({
      where: { slug },
      include: {
        genres: true,
        categories: true,
        language: true,
        subtitles: true,
        seasons: {
          orderBy: { seasonNumber: "asc" },
          include: {
            episodes: {
              orderBy: { episodeNumber: "asc" },
              include: { subtitles: true },
            },
          },
        },
      },
    });

    if (!series || series.status !== "PUBLISHED") {
      return apiError("NOT_FOUND", "Series not found");
    }

    return apiSuccess({ series });
  },
);
