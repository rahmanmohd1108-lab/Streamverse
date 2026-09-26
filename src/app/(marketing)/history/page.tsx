"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { History as HistoryIcon, Play, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/streamverse/empty-states";
import { LoadingSkeleton } from "@/components/streamverse/loading-states";
import { ProgressBar } from "@/components/streamverse/progress-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiDelete, apiFetch } from "@/lib/api/client";
import { formatDuration, formatRelativeTime } from "@/lib/constants";

interface HistoryEntry {
  id: string;
  contentId: string;
  contentType: "movie" | "series" | "episode";
  episodeId?: string | null;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  lastWatchedAt: string;
  content?: {
    title: string;
    slug: string;
    posterUrl: string | null;
    backdropUrl: string | null;
    releaseYear: number;
    duration?: number | null;
    ageRating?: string;
    language?: { name: string } | null;
  } | null;
  episode?: {
    id: string;
    title: string;
    episodeNumber: number;
    season: { id: string; seasonNumber: number; series: { id: string; slug: string; title: string } } | null;
  } | null;
}

interface HistoryResponse {
  items: HistoryEntry[];
}

export default function HistoryPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading } = useQuery<{ user: { id: string } } | null>({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const r = await fetch("/api/auth/me");
        if (!r.ok) return null;
        return r.json();
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.replace("/login?redirect=/history");
    }
  }, [sessionLoading, session, router]);

  const { data, isLoading, isError } = useQuery<HistoryResponse>({
    queryKey: ["history"],
    queryFn: async () => apiFetch<HistoryResponse>("/api/history"),
    enabled: !!session,
  });

  const items = data?.items ?? [];

  const remove = async (entry: HistoryEntry) => {
    const qs = `?contentId=${entry.contentId}&contentType=${entry.contentType}${entry.episodeId ? `&episodeId=${entry.episodeId}` : ""}`;
    try {
      await apiDelete(`/api/history${qs}`);
      qc.invalidateQueries({ queryKey: ["history"] });
      toast({ title: "Removed from history" });
    } catch (e) {
      toast({
        title: "Couldn't remove",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  if (sessionLoading || !session) {
    return (
      <div className="container mx-auto px-4 lg:px-8 py-12 pb-20 md:pb-12">
        <LoadingSkeleton className="h-10 w-48 mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 pb-20 md:pb-12">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-2">
          <HistoryIcon className="h-7 w-7 text-primary" />
          Watch History
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {items.length === 0
            ? "You haven't watched anything yet."
            : `${items.length} recently watched item${items.length === 1 ? "" : "s"}`}
        </p>
      </header>

      {isError ? (
        <EmptyState
          title="Couldn't load history"
          description="Please try again in a moment."
          actionHref="/history"
          actionLabel="Reload"
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="film"
          title="No watch history yet"
          description="Movies and series you watch will show up here so you can resume from where you left off."
          actionHref="/movies"
          actionLabel="Browse movies"
        />
      ) : (
        <ul className="space-y-3">
          {items.map((entry) => {
            const pct =
              entry.durationSeconds > 0
                ? (entry.progressSeconds / entry.durationSeconds) * 100
                : 0;
            const watchHref = entry.episode?.season?.series
              ? `/watch/series/${entry.episode.season.series.slug}?e=${entry.episode.id}`
              : entry.contentType === "movie"
                ? `/watch/movie/${entry.content?.slug ?? ""}`
                : "";
            const title = entry.episode
              ? `${entry.episode.season?.series.title ?? "Series"} — S${entry.episode.season?.seasonNumber ?? 1}E${entry.episode.episodeNumber}: ${entry.episode.title}`
              : entry.content?.title ?? "Unknown title";
            return (
              <li
                key={entry.id}
                className="flex gap-4 rounded-md border border-border/40 bg-card/60 p-3 hover:bg-accent/40 transition-colors"
              >
                <div className="relative shrink-0 w-32 md:w-40 aspect-video rounded overflow-hidden bg-muted">
                  {entry.content?.backdropUrl && (
                     
                    <img
                      src={entry.content.backdropUrl}
                      alt={title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {entry.completed && (
                    <span className="absolute top-1 right-1 bg-green-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                      Completed
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center gap-2">
                    {entry.contentType === "movie" && (
                      <Badge variant="secondary" className="text-[10px]">Movie</Badge>
                    )}
                    {entry.contentType === "series" && (
                      <Badge variant="secondary" className="text-[10px]">Series</Badge>
                    )}
                    {entry.contentType === "episode" && (
                      <Badge variant="secondary" className="text-[10px]">Episode</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(entry.lastWatchedAt)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm md:text-base truncate mt-1">
                    {title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.durationSeconds > 0 && (
                      <>
                        Watched {Math.round(pct)}% ·{" "}
                        {formatDuration(entry.progressSeconds)} /{" "}
                        {formatDuration(entry.durationSeconds)}
                      </>
                    )}
                  </p>
                  <div className="mt-2">
                    <ProgressBar value={entry.progressSeconds} max={entry.durationSeconds || 1} />
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                    {watchHref && (
                      <Button asChild size="sm">
                        <Link href={watchHref}>
                          <Play className="h-3.5 w-3.5 mr-1" />
                          {entry.completed ? "Watch again" : "Resume"}
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(entry)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
