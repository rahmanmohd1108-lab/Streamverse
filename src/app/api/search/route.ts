import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess } from "@/lib/errors";
import { searchQuerySchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const params = searchQuerySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );

  const q = params.q.trim();
  const baseWhere: Prisma.MovieWhereInput & Prisma.SeriesWhereInput = {
    status: "PUBLISHED",
    OR: [
      { title: { contains: q } },
      { description: { contains: q } },
      { cast: { contains: q } },
      { director: { contains: q } },
    ],
  };
  if (params.genre) {
    baseWhere.genres = { some: { slug: params.genre } };
  }
  if (params.language) {
    baseWhere.language = { slug: params.language };
  }
  if (params.year) {
    baseWhere.releaseYear = Number(params.year);
  }

  const movieWhere = baseWhere as Prisma.MovieWhereInput;
  const seriesWhere = baseWhere as Prisma.SeriesWhereInput;

  let movieOrderBy: Prisma.MovieOrderByWithRelationInput = {
    releaseYear: "desc",
  };
  let seriesOrderBy: Prisma.SeriesOrderByWithRelationInput = {
    releaseYear: "desc",
  };

  if (params.sort === "title") {
    movieOrderBy = { title: "asc" };
    seriesOrderBy = { title: "asc" };
  } else if (params.sort === "popular") {
    movieOrderBy = { history: { _count: "desc" } };
    seriesOrderBy = { history: { _count: "desc" } };
  } else if (params.sort === "rating") {
    movieOrderBy = { ratings: { _count: "desc" } };
    seriesOrderBy = { ratings: { _count: "desc" } };
  } else if (params.sort === "oldest") {
    movieOrderBy = { releaseYear: "asc" };
    seriesOrderBy = { releaseYear: "asc" };
  }

  // For search we return first N matches (cap to limit) for each kind.
  const take = params.limit;

  const [movies, series, movieTotal, seriesTotal] = await Promise.all([
    db.movie.findMany({
      where: movieWhere,
      include: { genres: true, language: true },
      orderBy: movieOrderBy,
      take,
    }),
    db.series.findMany({
      where: seriesWhere,
      include: { genres: true, language: true },
      orderBy: seriesOrderBy,
      take,
    }),
    db.movie.count({ where: movieWhere }),
    db.series.count({ where: seriesWhere }),
  ]);

  const total = movieTotal + seriesTotal;

  return apiSuccess({ movies, series, total });
});
