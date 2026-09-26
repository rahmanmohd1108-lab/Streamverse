import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { withErrorHandler, apiSuccess } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const moviesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  genre: z.string().optional(),
  language: z.string().optional(),
  year: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}$/.test(v), "Year must be 4 digits"),
  sort: z
    .enum(["newest", "oldest", "rating", "popular", "title"])
    .optional()
    .default("newest"),
});

const MOVIE_INCLUDE = {
  genres: true,
  categories: true,
  language: true,
  subtitles: true,
} satisfies Prisma.MovieInclude;

export const GET = withErrorHandler(async (req: NextRequest) => {
  const params = moviesQuerySchema.parse(
    Object.fromEntries(new URL(req.url).searchParams),
  );

  const where: Prisma.MovieWhereInput = { status: "PUBLISHED" };
  if (params.genre) {
    where.genres = { some: { slug: params.genre } };
  }
  if (params.language) {
    where.language = { slug: params.language };
  }
  if (params.year) {
    where.releaseYear = Number(params.year);
  }

  let orderBy: Prisma.MovieOrderByWithRelationInput;
  switch (params.sort) {
    case "oldest":
      orderBy = { releaseYear: "asc" };
      break;
    case "rating":
      orderBy = { ratings: { _count: "desc" } };
      break;
    case "popular":
      orderBy = { history: { _count: "desc" } };
      break;
    case "title":
      orderBy = { title: "asc" };
      break;
    case "newest":
    default:
      orderBy = { releaseYear: "desc" };
      break;
  }

  const [items, total] = await Promise.all([
    db.movie.findMany({
      where,
      include: MOVIE_INCLUDE,
      orderBy,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    db.movie.count({ where }),
  ]);

  return apiSuccess({
    items,
    total,
    page: params.page,
    limit: params.limit,
  });
});
