import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getPublishedMovies,
  getGenres,
  getLanguages,
} from "@/lib/api/server";
import { MovieCard } from "@/components/streamverse/movie-card";
import { FilterPanel, type FilterState } from "@/components/streamverse/filter-panel";
import { Pagination } from "@/components/streamverse/pagination";
import { EmptyState } from "@/components/streamverse/empty-states";
import { CardGridSkeleton } from "@/components/streamverse/loading-states";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Movies — Browse",
  description: `Browse the full ${APP_NAME} movie catalog by genre, language, year, and popularity.`,
  openGraph: {
    title: `Movies · ${APP_NAME}`,
    description: "Browse movies across genres and languages.",
  },
};

const PAGE_SIZE = 24;

function asString(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(asString(sp.page ?? "1") ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const filters: FilterState = {
    genre: asString(sp.genre),
    language: asString(sp.language),
    year: asString(sp.year),
    sort: asString(sp.sort),
    filter: asString(sp.filter),
  };

  // Build Prisma where
  const where: any = {};
  if (filters.genre) where.genres = { some: { slug: filters.genre } };
  if (filters.language) where.language = { slug: filters.language };
  if (filters.year) where.releaseYear = parseInt(filters.year, 10);
  if (filters.filter === "trending") where.isTrending = true;
  if (filters.filter === "popular") where.isPopular = true;
  if (filters.filter === "new") where.isNewRelease = true;
  if (filters.filter === "featured") where.isFeatured = true;

  const orderByMap: Record<string, any> = {
    newest: { publishedAt: "desc" },
    oldest: { releaseYear: "asc" },
    popular: { isPopular: "desc" },
    rating: { releaseYear: "desc" },
    title: { title: "asc" },
  };
  const orderBy = orderByMap[filters.sort ?? "newest"] ?? { publishedAt: "desc" };

  const [movies, genres, languages] = await Promise.all([
    getPublishedMovies({ where, orderBy, limit: PAGE_SIZE, offset }),
    getGenres(),
    getLanguages(),
  ]);

  // True count for pagination
  const { db } = await import("@/lib/db");
  const totalMovies = await db.movie.count({ where: { status: "PUBLISHED", ...where } });

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 pb-20 md:pb-12">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Movies</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalMovies.toLocaleString()} title{totalMovies === 1 ? "" : "s"} available
        </p>
      </header>

      <Suspense fallback={<div className="py-8"><CardGridSkeleton count={6} /></div>}>
        <FilterPanel
          genres={genres}
          languages={languages}
          current={filters}
          basePath="/movies"
          className="mb-6"
        />
      </Suspense>

      {movies.length === 0 ? (
        <EmptyState
          icon="search"
          title="No movies match your filters"
          description="Try removing a filter or browse all movies."
          actionHref="/movies"
          actionLabel="Reset filters"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {movies.map((m) => (
              <MovieCard
                key={m.id}
                item={{
                  id: m.id,
                  title: m.title,
                  slug: m.slug,
                  posterUrl: m.posterUrl,
                  backdropUrl: m.backdropUrl,
                  releaseYear: m.releaseYear,
                  duration: m.duration,
                  description: m.description,
                  contentType: "movie",
                  ageRating: m.ageRating,
                  language: m.language
                    ? { name: m.language.name }
                    : undefined,
                }}
              />
            ))}
          </div>

          <Pagination
            page={page}
            total={totalMovies}
            pageSize={PAGE_SIZE}
            basePath="/movies"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
