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

    const movie = await db.movie.findUnique({
      where: { slug },
      include: {
        genres: true,
        categories: true,
        language: true,
        subtitles: true,
      },
    });

    if (!movie || movie.status !== "PUBLISHED") {
      return apiError("NOT_FOUND", "Movie not found");
    }

    return apiSuccess({ movie });
  },
);
