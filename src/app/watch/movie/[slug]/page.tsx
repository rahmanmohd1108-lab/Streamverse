import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Info } from "lucide-react";
import {
  getMovieBySlug,
  getAverageRating,
} from "@/lib/api/server";
import { db } from "@/lib/db";
import { getCurrentUserProfile } from "@/lib/auth";
import { VideoPlayer } from "@/components/streamverse/video-player";
import { APP_URL, APP_NAME } from "@/lib/constants";

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
  return {
    title: `Watch ${movie.title}`,
    description: `Watch ${movie.title} on ${APP_NAME}.`,
    robots: { index: false, follow: true },
    alternates: { canonical: `${APP_URL}/movie/${movie.slug}` },
    openGraph: {
      type: "video.movie",
      title: `Watch ${movie.title}`,
      description: `Watch ${movie.title} on ${APP_NAME}.`,
      url: `${APP_URL}/movie/${movie.slug}`,
      images: movie.backdropUrl ? [{ url: movie.backdropUrl }] : [],
    },
  };
}

export default async function WatchMoviePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const movie = await getMovieBySlug(slug);
  if (!movie || movie.status !== "PUBLISHED") notFound();

  // Require auth
  const profile = await getCurrentUserProfile();
  if (!profile?.user) {
    redirect(`/login?redirect=${encodeURIComponent(`/watch/movie/${slug}`)}`);
  }

  // Fetch watch history to resume from
  const history = await db.watchHistory.findFirst({
    where: {
      profileId: profile.profile?.id ?? "",
      contentId: movie.id,
      contentType: "movie",
    },
    orderBy: { lastWatchedAt: "desc" },
  });
  const startSeconds = history?.progressSeconds ?? 0;

  // "Next up" — 6 movies with overlapping genres
  const genreIds = movie.genres.map((g) => g.id);
  const nextUpRaw =
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
  const nextUp = nextUpRaw.map((m) => ({
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

  const subtitleTracks = movie.subtitles?.map((s) => ({
    label: s.language,
    srclang: s.language.slice(0, 2),
    src: s.url,
    kind: s.kind,
  })) ?? [];

  return (
    <div className="min-h-screen bg-black">
      <div className="relative">
        <div className="absolute top-4 left-4 z-20">
          <Link
            href={`/movie/${movie.slug}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-black/60 backdrop-blur text-white text-sm hover:bg-black/80"
          >
            <ChevronLeft className="h-4 w-4" /> Back to detail
          </Link>
        </div>

        <VideoPlayer
          src={movie.videoUrl ?? ""}
          hlsUrl={movie.hlsUrl}
          poster={movie.backdropUrl}
          title={movie.title}
          contentId={movie.id}
          contentType="movie"
          startSeconds={startSeconds}
          duration={movie.duration}
          subtitleTracks={subtitleTracks}
        />
      </div>

      {/* Below the fold: info + next up */}
      <div className="container mx-auto px-4 lg:px-8 py-6 space-y-6">
        <section>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold">{movie.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {movie.releaseYear}
                {movie.duration ? ` · ${Math.floor(movie.duration / 60)}m` : ""}
                {movie.language ? ` · ${movie.language.name}` : ""}
                {movie.ageRating ? ` · ${movie.ageRating}` : ""}
              </p>
            </div>
            <Link
              href={`/movie/${movie.slug}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-sm hover:bg-accent"
            >
              <Info className="h-4 w-4" /> View details
            </Link>
          </div>
          {movie.description && (
            <p className="text-sm text-muted-foreground mt-3 max-w-3xl">
              {movie.description}
            </p>
          )}
        </section>

        {nextUp.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-3">Next up</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {nextUp.map((m) => (
                <Link
                  key={m.id}
                  href={`/watch/movie/${m.slug}`}
                  className="group rounded-md overflow-hidden border border-border/40 bg-card hover:bg-accent/40 transition-colors"
                >
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    {m.backdropUrl && (
                       
                      <img
                        src={m.backdropUrl}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="font-semibold text-sm truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{m.releaseYear}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
