import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Info, Clock, Calendar, Globe, Star, Tv } from "lucide-react";
import {
  getSeriesBySlug,
  getPublishedSeries,
  getAverageRating,
} from "@/lib/api/server";
import { db } from "@/lib/db";
import { APP_URL, APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/streamverse/rating-stars";
import { WatchlistButton } from "@/components/streamverse/watchlist-button";
import { ShareButton } from "@/components/streamverse/share-button";
import { SeriesEpisodesBlock } from "@/components/streamverse/series-episodes-block";
import { ContentRow } from "@/components/streamverse/content-row";

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
  const series = await getSeriesBySlug(slug);
  if (!series || series.status !== "PUBLISHED") {
    return { title: "Not Found" };
  }
  const desc =
    series.description?.slice(0, 160) ?? `Watch ${series.title} on ${APP_NAME}.`;
  return {
    title: series.title,
    description: desc,
    alternates: { canonical: `${APP_URL}/series/${series.slug}` },
    openGraph: {
      type: "video.other",
      title: series.title,
      description: desc,
      url: `${APP_URL}/series/${series.slug}`,
      siteName: APP_NAME,
      images: series.backdropUrl ? [{ url: series.backdropUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: series.title,
      description: desc,
      images: series.backdropUrl ? [series.backdropUrl] : [],
    },
  };
}

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series || series.status !== "PUBLISHED") notFound();

  const avgRating = await getAverageRating(series.id);

  const firstSeason = series.seasons[0];
  const firstEpisode = firstSeason?.episodes[0];

  // More like this — 6 series sharing any genre
  const genreIds = series.genres.map((g) => g.id);
  const moreLikeThisRaw =
    genreIds.length > 0
      ? await db.series.findMany({
          where: {
            status: "PUBLISHED",
            id: { not: series.id },
            genres: { some: { id: { in: genreIds } } },
          },
          include: { language: true },
          take: 6,
          orderBy: { publishedAt: "desc" },
        })
      : [];

  const moreLikeThis = moreLikeThisRaw.map((s) => ({
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

  const totalEpisodes = series.seasons.reduce(
    (n, season) => n + (season.episodes?.length || 0),
    0,
  );

  const castList = series.cast
    ? series.cast
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const creators = series.director
    ? series.director
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="pb-12 -mt-16">
      {/* Hero */}
      <section className="relative w-full h-[70vh] md:h-[85vh] min-h-[420px] overflow-hidden">
        <div className="absolute inset-0">
          {series.backdropUrl && (
             
            <img
              src={series.backdropUrl}
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
                <Tv className="h-3 w-3 mr-1" /> Series
              </Badge>
              {series.ageRating && (
                <Badge variant="secondary" className="bg-black/40">
                  {series.ageRating}
                </Badge>
              )}
              {series.isTrending && (
                <Badge variant="secondary" className="bg-black/40">
                  Trending
                </Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-3">
              {series.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
              {avgRating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {avgRating.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {series.releaseYear}
              </span>
              <span>
                {series.seasons.length} season{series.seasons.length === 1 ? "" : "s"} ·{" "}
                {totalEpisodes} episode{totalEpisodes === 1 ? "" : "s"}
              </span>
              {series.language && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" /> {series.language.name}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              {firstEpisode && (
                <Button asChild size="lg" className="bg-white text-black hover:bg-white/90">
                  <Link href={`/watch/series/${series.slug}?e=${firstEpisode.id}`}>
                    <Play className="h-5 w-5 mr-2" /> Play First Episode
                  </Link>
                </Button>
              )}
              <WatchlistButton
                contentId={series.id}
                contentType="series"
                variant="secondary"
                size="lg"
                className="bg-white/10 backdrop-blur"
              />
              <ShareButton path={`/series/${series.slug}`} title={series.title} />
            </div>

            <RatingStars
              contentId={series.id}
              contentType="series"
              initialRating={avgRating}
              size={28}
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-lg font-bold mb-2">Overview</h2>
            <p className="text-sm md:text-base text-muted-foreground whitespace-pre-line leading-relaxed">
              {series.description}
            </p>
          </section>

          {(castList.length > 0 || creators.length > 0) && (
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
              {creators.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">
                    Creator{creators.length > 1 ? "s" : ""}
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {creators.map((d, i) => (
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
                {series.genres.map((g) => (
                  <Badge key={g.id} variant="outline" className="mr-1 mb-1">
                    {g.name}
                  </Badge>
                ))}
              </dd>
              <dt className="text-muted-foreground">Language</dt>
              <dd className="text-right">{series.language?.name ?? "—"}</dd>
              <dt className="text-muted-foreground">Released</dt>
              <dd className="text-right">{series.releaseYear}</dd>
              <dt className="text-muted-foreground">Seasons</dt>
              <dd className="text-right">{series.seasons.length}</dd>
              {series.country && (
                <>
                  <dt className="text-muted-foreground">Country</dt>
                  <dd className="text-right">{series.country}</dd>
                </>
              )}
            </dl>
          </section>
        </div>

        <aside className="space-y-6">
          {series.posterUrl && (
            <div className="rounded-md overflow-hidden border border-border/40 max-w-xs mx-auto">
              { }
              <img
                src={series.posterUrl}
                alt={`${series.title} poster`}
                className="w-full h-auto"
              />
            </div>
          )}
        </aside>
      </div>

      <section className="container mx-auto px-4 lg:px-8 mt-12">
        <SeriesEpisodesBlock
          seasons={series.seasons.map((s) => ({
            id: s.id,
            seasonNumber: s.seasonNumber,
            title: s.title,
            description: s.description,
            episodes: (s.episodes ?? []).map((e) => ({
              id: e.id,
              episodeNumber: e.episodeNumber,
              title: e.title,
              description: e.description,
              duration: e.duration,
              thumbnailUrl: e.thumbnailUrl,
              isPreview: e.isPreview,
              videoUrl: e.videoUrl,
              hlsUrl: e.hlsUrl,
            })),
          }))}
          seriesSlug={series.slug}
        />
      </section>

      {moreLikeThis.length > 0 && (
        <div className="mt-8">
          <ContentRow
            title="More Like This"
            items={moreLikeThis}
            viewAllHref={`/series?genre=${series.genres[0]?.slug ?? ""}`}
          />
        </div>
      )}
    </div>
  );
}
