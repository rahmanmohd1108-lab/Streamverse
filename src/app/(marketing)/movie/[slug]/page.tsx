import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Info, Clock, Calendar, Globe, Star, Film } from "lucide-react";
import {
  getMovieBySlug,
  getPublishedMovies,
  getAverageRating,
} from "@/lib/api/server";
import { db } from "@/lib/db";
import { APP_URL, APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/streamverse/rating-stars";
import { WatchlistButton } from "@/components/streamverse/watchlist-button";
import { ShareButton } from "@/components/streamverse/share-button";
import { MovieCard } from "@/components/streamverse/movie-card";
import { ContentRow } from "@/components/streamverse/content-row";
import { EmptyState } from "@/components/streamverse/empty-states";

export const dynamic = "force-dynamic";

interface Params {
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie || movie.status !== "PUBLISHED") {
    return { title: "Not Found" };
  }
  const desc =
    movie.description?.slice(0, 160) ?? `Watch ${movie.title} on ${APP_NAME}.`;
  return {
    title: movie.title,
    description: desc,
    alternates: { canonical: `${APP_URL}/movie/${movie.slug}` },
    openGraph: {
      type: "video.movie",
      title: movie.title,
      description: desc,
      url: `${APP_URL}/movie/${movie.slug}`,
      siteName: APP_NAME,
      images: movie.backdropUrl ? [{ url: movie.backdropUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: movie.title,
      description: desc,
      images: movie.backdropUrl ? [movie.backdropUrl] : [],
    },
  };
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie || movie.status !== "PUBLISHED") notFound();

  const avgRating = await getAverageRating(movie.id);

  // "More Like This" — 6 movies sharing any genre
  const genreIds = movie.genres.map((g) => g.id);
  const moreLikeThisRaw =
    genreIds.length > 0
      ? await db.movie.findMany({
          where: {
            status: "PUBLISHED",
            id: { not: movie.id },
            genres: { some: { id: { in: genreIds } } },
          },
          include: { language: true },
          take: 6,
          orderBy: { publishedAt: "desc" },
        })
      : [];

  const moreLikeThis = moreLikeThisRaw.map((m) => ({
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

  const castList = movie.cast
    ? movie.cast
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const directors = movie.director
    ? movie.director
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="pb-12 -mt-16">
      {/* Hero / backdrop */}
      <section className="relative w-full h-[70vh] md:h-[85vh] min-h-[420px] overflow-hidden">
        <div className="absolute inset-0">
          {movie.backdropUrl && (
             
            <img
              src={movie.backdropUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 sv-hero-gradient" />
          <div className="absolute inset-0 sv-hero-bottom" />
        </div>

        <div className="relative container mx-auto px-4 lg:px-8 pt-16 h-full flex flex-col justify-end pb-10 md:pb-16">
          <div className="max-w-3xl sv-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-primary/90 text-primary-foreground">
                <Film className="h-3 w-3 mr-1" /> Movie
              </Badge>
              {movie.ageRating && (
                <Badge variant="secondary" className="bg-black/40">
                  {movie.ageRating}
                </Badge>
              )}
              {movie.isTrending && (
                <Badge variant="secondary" className="bg-black/40">
                  Trending
                </Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-3">
              {movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
              {avgRating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {avgRating.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {movie.releaseYear}
              </span>
              {movie.duration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.floor(movie.duration / 60)}m
                </span>
              )}
              {movie.language && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" /> {movie.language.name}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                <Link href={`/watch/movie/${movie.slug}`}>
                  <Play className="h-5 w-5 mr-2" /> Play
                </Link>
              </Button>
              <WatchlistButton
                contentId={movie.id}
                contentType="movie"
                variant="secondary"
                size="lg"
                className="bg-white/10 backdrop-blur"
              />
              <ShareButton path={`/movie/${movie.slug}`} title={movie.title} />
            </div>

            <RatingStars
              contentId={movie.id}
              contentType="movie"
              initialRating={avgRating}
              size={28}
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-lg font-bold mb-2">Overview</h2>
            <p className="text-sm md:text-base text-muted-foreground whitespace-pre-line leading-relaxed">
              {movie.description}
            </p>
          </section>

          {(castList.length > 0 || directors.length > 0) && (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {castList.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">
                    Cast
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {castList.slice(0, 8).map((c, i) => (
                      <li key={i} className="text-foreground/90">{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {directors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">
                    Director{directors.length > 1 ? "s" : ""}
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {directors.map((d, i) => (
                      <li key={i} className="text-foreground/90">{d}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">
              Details
            </h3>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Genre</dt>
              <dd className="text-right">
                {movie.genres.map((g) => (
                  <Badge key={g.id} variant="outline" className="mr-1 mb-1">
                    {g.name}
                  </Badge>
                ))}
              </dd>
              <dt className="text-muted-foreground">Language</dt>
              <dd className="text-right">{movie.language?.name ?? "—"}</dd>
              <dt className="text-muted-foreground">Released</dt>
              <dd className="text-right">{movie.releaseYear}</dd>
              <dt className="text-muted-foreground">Runtime</dt>
              <dd className="text-right">
                {movie.duration > 0
                  ? `${Math.floor(movie.duration / 60)}m`
                  : "—"}
              </dd>
              {movie.country && (
                <>
                  <dt className="text-muted-foreground">Country</dt>
                  <dd className="text-right">{movie.country}</dd>
                </>
              )}
            </dl>
          </section>
        </div>

        {/* Side column */}
        <aside className="space-y-6">
          {movie.posterUrl && (
            <div className="rounded-md overflow-hidden border border-border/40 max-w-xs mx-auto">
              { }
              <img
                src={movie.posterUrl}
                alt={`${movie.title} poster`}
                className="w-full h-auto"
              />
            </div>
          )}
        </aside>
      </div>

      {moreLikeThis.length > 0 && (
        <div className="mt-8">
          <ContentRow
            title="More Like This"
            items={moreLikeThis}
            viewAllHref={`/movies?genre=${movie.genres[0]?.slug ?? ""}`}
          />
        </div>
      )}
    </div>
  );
}
