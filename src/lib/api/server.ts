/**
 * StreamVerse server-side data access helpers.
 *
 * Used by Server Components to fetch data with the Prisma client
 * directly — no extra HTTP roundtrip needed.
 */
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const movieInclude = {
  language: true,
  genres: { select: { id: true, name: true, slug: true } },
  categories: { select: { id: true, name: true, slug: true } },
  subtitles: true,
} satisfies Prisma.MovieInclude;

export const seriesInclude = {
  language: true,
  genres: { select: { id: true, name: true, slug: true } },
  categories: { select: { id: true, name: true, slug: true } },
  subtitles: true,
  seasons: {
    orderBy: { seasonNumber: "asc" },
    include: {
      episodes: {
        orderBy: { episodeNumber: "asc" },
      },
    },
  },
} satisfies Prisma.SeriesInclude;

export async function getPublishedMovies(opts: {
  limit?: number;
  offset?: number;
  where?: Prisma.MovieWhereInput;
  orderBy?: Prisma.MovieOrderByWithRelationInput;
} = {}) {
  return db.movie.findMany({
    where: { status: "PUBLISHED", ...opts.where },
    include: movieInclude,
    orderBy: opts.orderBy ?? { publishedAt: "desc" },
    take: opts.limit ?? 20,
    skip: opts.offset ?? 0,
  });
}

export async function getPublishedSeries(opts: {
  limit?: number;
  offset?: number;
  where?: Prisma.SeriesWhereInput;
  orderBy?: Prisma.SeriesOrderByWithRelationInput;
} = {}) {
  return db.series.findMany({
    where: { status: "PUBLISHED", ...opts.where },
    include: seriesInclude,
    orderBy: opts.orderBy ?? { publishedAt: "desc" },
    take: opts.limit ?? 20,
    skip: opts.offset ?? 0,
  });
}

export async function getMovieBySlug(slug: string) {
  return db.movie.findUnique({
    where: { slug },
    include: movieInclude,
  });
}

export async function getSeriesBySlug(slug: string) {
  return db.series.findUnique({
    where: { slug },
    include: seriesInclude,
  });
}

export async function getEpisodeById(id: string) {
  return db.episode.findUnique({
    where: { id },
    include: {
      season: { include: { series: true } },
      subtitles: true,
    },
  });
}

export async function getBanners(activeOnly = true) {
  return db.banner.findMany({
    where: activeOnly ? { active: true } : {},
    orderBy: { displayOrder: "asc" },
  });
}

export async function getGenres() {
  return db.genre.findMany({ orderBy: { name: "asc" } });
}

export async function getLanguages() {
  return db.language.findMany({ orderBy: { name: "asc" } });
}

export async function getCategories() {
  return db.category.findMany({ orderBy: { name: "asc" } });
}

export async function getPlans() {
  return db.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { price: "asc" },
  });
}

export async function searchContent(opts: {
  q?: string;
  type?: "movie" | "series" | "all";
  genre?: string;
  language?: string;
  year?: string;
  minRating?: string;
  sort?: "newest" | "oldest" | "rating" | "popular" | "title";
  limit?: number;
  offset?: number;
}) {
  const {
    q,
    type = "all",
    genre,
    language,
    year,
    sort = "newest",
    limit = 20,
    offset = 0,
  } = opts;
  const where: Prisma.MovieWhereInput = { status: "PUBLISHED" };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { cast: { contains: q } },
      { director: { contains: q } },
    ];
  }
  if (genre) where.genres = { some: { slug: genre } };
  if (language) where.language = { slug: language };
  if (year) where.releaseYear = parseInt(year, 10);

  const orderByMap: Record<string, Prisma.MovieOrderByWithRelationInput> = {
    newest: { publishedAt: "desc" },
    oldest: { releaseYear: "asc" },
    rating: { releaseYear: "desc" },
    popular: { isPopular: "desc" },
    title: { title: "asc" },
  };

  const movies = type === "series" ? [] : await db.movie.findMany({
    where,
    include: movieInclude,
    orderBy: orderByMap[sort],
    take: limit,
    skip: offset,
  });
  const seriesWhere: Prisma.SeriesWhereInput = { status: "PUBLISHED" };
  if (q) {
    seriesWhere.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { cast: { contains: q } },
      { director: { contains: q } },
    ];
  }
  if (genre) seriesWhere.genres = { some: { slug: genre } };
  if (language) seriesWhere.language = { slug: language };
  if (year) seriesWhere.releaseYear = parseInt(year, 10);

  const seriesOrderBy: Record<string, Prisma.SeriesOrderByWithRelationInput> = {
    newest: { publishedAt: "desc" },
    oldest: { releaseYear: "asc" },
    rating: { releaseYear: "desc" },
    popular: { isPopular: "desc" },
    title: { title: "asc" },
  };

  const series = type === "movie" ? [] : await db.series.findMany({
    where: seriesWhere,
    include: seriesInclude,
    orderBy: seriesOrderBy[sort],
    take: limit,
    skip: offset,
  });

  const total = movies.length + series.length;
  return { movies, series, total };
}

/**
 * Lightweight rating aggregation computed in-app (SQLite has limited
 * aggregation primitives in some setups; safer to compute here).
 */
export async function getAverageRating(contentId: string): Promise<number> {
  const rows = await db.rating.findMany({
    where: { contentId },
    select: { rating: true },
  });
  if (rows.length === 0) return 0;
  return rows.reduce((sum, r) => sum + r.rating, 0) / rows.length;
}
