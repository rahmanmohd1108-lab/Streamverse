import type { Metadata } from "next";
import { Suspense } from "react";
import { searchContent } from "@/lib/api/server";
import { MovieCard } from "@/components/streamverse/movie-card";
import { SearchBar } from "@/components/streamverse/search-bar";
import { EmptyState } from "@/components/streamverse/empty-states";
import { CardGridSkeleton } from "@/components/streamverse/loading-states";
import { Pagination } from "@/components/streamverse/pagination";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PAGE_SIZE = 24;

function asString(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (Array.isArray(v)) return v[0];
  return v;
}

interface SearchPageProps {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = asString(sp.q) ?? "";
  return {
    title: q ? `Search: ${q}` : "Search",
    description: q
      ? `Search results for “${q}” on ${APP_NAME}.`
      : `Search the ${APP_NAME} catalog for movies and series.`,
    robots: q ? { index: false, follow: true } : { index: true, follow: true },
  };
}

const TYPE_TABS = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "series", label: "Series" },
];

function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const q = (asString(sp.q) ?? "").trim();
  const type = (asString(sp.type) ?? "all") as "all" | "movie" | "series";
  const genre = asString(sp.genre);
  const language = asString(sp.language);
  const year = asString(sp.year);
  const sort = (asString(sp.sort) ?? "newest") as
    | "newest"
    | "oldest"
    | "rating"
    | "popular"
    | "title";
  const page = Math.max(1, parseInt(asString(sp.page ?? "1") ?? "1", 10) || 1);

  const results = q
    ? await searchContent({
        q,
        type,
        genre,
        language,
        year,
        sort,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })
    : { movies: [], series: [], total: 0 };

  const total = results.total;
  const movieCards = results.movies.map((m) => ({
    id: m.id,
    title: m.title,
    slug: m.slug,
    posterUrl: m.posterUrl,
    backdropUrl: m.backdropUrl,
    releaseYear: m.releaseYear,
    duration: m.duration,
    description: m.description,
    contentType: "movie" as const,
    ageRating: m.ageRating,
    language: m.language ? { name: m.language.name } : undefined,
  }));
  const seriesCards = results.series.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    posterUrl: s.posterUrl,
    backdropUrl: s.backdropUrl,
    releaseYear: s.releaseYear,
    duration: null,
    description: s.description,
    contentType: "series" as const,
    ageRating: s.ageRating,
    language: s.language ? { name: s.language.name } : undefined,
  }));
  // Interleave so the page feels mixed when type=all
  const cards =
    type === "movie"
      ? movieCards
      : type === "series"
        ? seriesCards
        : interleave(movieCards, seriesCards);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-6 pb-20 md:pb-12">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
          {q ? `Results for “${q}”` : "Search"}
        </h1>
        <Suspense fallback={<div className="h-12 sv-shimmer rounded-md" />}>
          <SearchBar autoFocus liveUpdate basePath="/search" />
        </Suspense>
      </header>

      {/* Type tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {TYPE_TABS.map((t) => {
          const active = type === t.value;
          const search = new URLSearchParams();
          if (q) search.set("q", q);
          if (t.value !== "all") search.set("type", t.value);
          if (genre) search.set("genre", genre);
          if (language) search.set("language", language);
          if (year) search.set("year", year);
          if (sort && sort !== "newest") search.set("sort", sort);
          const qsStr = search.toString();
          return (
            <Link
              key={t.value}
              href={qsStr ? `/search?${qsStr}` : "/search"}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {!q ? (
        <EmptyState
          icon="search"
          title="Search the catalog"
          description="Start typing above to find movies and series by title, cast, director, or keyword."
        />
      ) : total === 0 ? (
        <EmptyState
          icon="search"
          title={`No results for “${q}”`}
          description="Try a different search term, or remove some filters."
          actionHref="/movies"
          actionLabel="Browse all movies"
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {total} result{total === 1 ? "" : "s"}
          </p>
          <Suspense fallback={<CardGridSkeleton count={8} />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {cards.map((item) => (
                <MovieCard key={`${item.contentType}-${item.id}`} item={item} />
              ))}
            </div>
          </Suspense>

          <Pagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            basePath="/search"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
