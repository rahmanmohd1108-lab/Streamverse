import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  getSeriesBySlug,
  getEpisodeById,
} from "@/lib/api/server";
import { db } from "@/lib/db";
import { getCurrentUserProfile } from "@/lib/auth";
import { VideoPlayer } from "@/components/streamverse/video-player";
import {
  SeriesWatchClient,
  SeriesEpisodeSidebar,
} from "@/components/streamverse/series-watch-client";
import { APP_URL, APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface Params {
  slug: string;
}

interface PageProps {
  params: Promise<Params>;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const episodeId = (Array.isArray(sp.e) ? sp.e[0] : sp.e) ?? undefined;
  const series = await getSeriesBySlug(slug);
  if (!series || series.status !== "PUBLISHED") {
    return { title: "Not Found" };
  }
  const ep = episodeId
    ? await getEpisodeById(episodeId)
    : series.seasons[0]?.episodes[0]
      ? await getEpisodeById(series.seasons[0].episodes[0].id)
      : null;
  const title = ep ? `${ep.title} — ${series.title}` : series.title;
  return {
    title: `Watch ${title}`,
    description: `Watch ${title} on ${APP_NAME}.`,
    robots: { index: false, follow: true },
    alternates: { canonical: `${APP_URL}/series/${series.slug}` },
    openGraph: {
      type: "video.other",
      title: `Watch ${title}`,
      description: `Watch ${title} on ${APP_NAME}.`,
      url: `${APP_URL}/series/${series.slug}`,
      images: series.backdropUrl ? [{ url: series.backdropUrl }] : [],
    },
  };
}

export default async function WatchSeriesPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const reqEpisodeId = (Array.isArray(sp.e) ? sp.e[0] : sp.e) ?? undefined;

  const series = await getSeriesBySlug(slug);
  if (!series || series.status !== "PUBLISHED") notFound();

  // Require auth
  const profile = await getCurrentUserProfile();
  if (!profile?.user) {
    redirect(
      `/login?redirect=${encodeURIComponent(
        `/watch/series/${slug}${reqEpisodeId ? `?e=${reqEpisodeId}` : ""}`,
      )}`,
    );
  }

  // Resolve episode: explicit id OR first episode of first season
  let episode = reqEpisodeId ? await getEpisodeById(reqEpisodeId) : null;
  if (!episode) {
    const firstEp = series.seasons[0]?.episodes[0];
    if (firstEp) {
      episode = await getEpisodeById(firstEp.id);
    }
  }
  if (!episode) notFound();

  // Validate episode belongs to this series
  const episodeSeason = series.seasons.find(
    (s) => s.id === episode?.seasonId,
  );
  if (!episodeSeason) notFound();

  // Watch history for resume
  const history = await db.watchHistory.findFirst({
    where: {
      profileId: profile.profile?.id ?? "",
      contentId: series.id,
      contentType: "episode",
      episodeId: episode.id,
    },
    orderBy: { lastWatchedAt: "desc" },
  });
  const startSeconds = history?.progressSeconds ?? 0;

  // Prev/next callbacks for the player
  const siblingEpisodes = episodeSeason.episodes ?? [];
  const idx = siblingEpisodes.findIndex((e) => e.id === episode!.id);
  const prevEpId = idx > 0 ? siblingEpisodes[idx - 1].id : null;
  const nextEpId =
    idx >= 0 && idx < siblingEpisodes.length - 1
      ? siblingEpisodes[idx + 1].id
      : null;
  const goTo = (id: string | null) => {
    if (!id) return undefined;
    return () => {
      if (typeof window !== "undefined") {
        window.location.assign(`/watch/series/${slug}?e=${id}`);
      }
    };
  };

  const subtitleTracks =
    episode.subtitles?.map((s) => ({
      label: s.language,
      srclang: s.language.slice(0, 2),
      src: s.url,
      kind: s.kind,
    })) ?? [];

  const seasonsForClient = series.seasons.map((s) => ({
    id: s.id,
    seasonNumber: s.seasonNumber,
    title: s.title,
    episodes: (s.episodes ?? []).map((e) => ({
      id: e.id,
      episodeNumber: e.episodeNumber,
      title: e.title,
      description: e.description,
      duration: e.duration,
      thumbnailUrl: e.thumbnailUrl,
      isPreview: e.isPreview,
    })),
  }));

  return (
    <div className="min-h-screen bg-black">
      <div className="relative">
        <div className="absolute top-4 left-4 z-20">
          <Link
            href={`/series/${slug}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-black/60 backdrop-blur text-white text-sm hover:bg-black/80"
          >
            <ChevronLeft className="h-4 w-4" /> Back to series
          </Link>
        </div>

        <VideoPlayer
          src={episode.videoUrl ?? ""}
          hlsUrl={episode.hlsUrl}
          poster={episode.thumbnailUrl ?? series.backdropUrl}
          title={`${series.title} — S${episodeSeason.seasonNumber}E${episode.episodeNumber}: ${episode.title}`}
          contentId={series.id}
          contentType="series"
          episodeId={episode.id}
          startSeconds={startSeconds}
          duration={episode.duration}
          subtitleTracks={subtitleTracks}
          skipIntroStart={episode.skipIntroStart ?? undefined}
          skipIntroEnd={episode.skipIntroEnd ?? undefined}
          onPrev={prevEpId ? goTo(prevEpId) : undefined}
          onNext={nextEpId ? goTo(nextEpId) : undefined}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — title + description + controls */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {series.title} · Season {episodeSeason.seasonNumber} · Episode {episode.episodeNumber}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold mt-1">{episode.title}</h1>
            </div>

            {episode.description && (
              <p className="text-sm text-muted-foreground max-w-3xl">
                {episode.description}
              </p>
            )}

            <SeriesWatchClient
              seasons={seasonsForClient}
              seriesSlug={slug}
              activeEpisodeId={episode.id}
            />
          </div>

          {/* Right column — episode sidebar (desktop only) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-4">
              <SeriesEpisodeSidebar
                seasons={seasonsForClient}
                activeEpisodeId={episode.id}
                seriesSlug={slug}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
