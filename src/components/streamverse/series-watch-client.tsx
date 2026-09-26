"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Clock, ChevronLeft, ChevronRight, ListVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SeasonTabs } from "@/components/streamverse/season-tabs";
import { cn, formatDuration } from "@/lib/utils";

export interface EpisodeItem {
  id: string;
  episodeNumber: number;
  title: string;
  description?: string | null;
  duration: number;
  thumbnailUrl?: string | null;
  isPreview?: boolean;
}

export interface SeasonItem {
  id: string;
  seasonNumber: number;
  title?: string | null;
  episodes: EpisodeItem[];
}

interface SeriesWatchClientProps {
  seasons: SeasonItem[];
  seriesSlug: string;
  activeEpisodeId: string;
}

/**
 * Controls rendered below the player:
 *  - prev/next episode buttons (computed from current season)
 *  - mobile "browse episodes" sheet trigger
 *  - back-to-series link
 *
 * The desktop sidebar episode list is rendered separately by
 * <SeriesEpisodeSidebar /> (see exports). Both components share
 * state via the URL (?e=… and ?season=… in future).
 */
export function SeriesWatchClient({
  seasons,
  seriesSlug,
  activeEpisodeId,
}: SeriesWatchClientProps) {
  const router = useRouter();
  const [mobileListOpen, setMobileListOpen] = useState(false);

  const activeSeason = useMemo(
    () =>
      seasons.find((s) => s.episodes.some((e) => e.id === activeEpisodeId)) ??
      seasons[0],
    [seasons, activeEpisodeId],
  );
  const [activeSeasonId, setActiveSeasonId] = useState(activeSeason?.id ?? "");
  const displayedSeason =
    seasons.find((s) => s.id === activeSeasonId) ?? activeSeason ?? seasons[0];

  if (!displayedSeason) return null;

  const episodes = displayedSeason.episodes ?? [];
  const currentIndex = episodes.findIndex((e) => e.id === activeEpisodeId);
  const prevEp = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEp =
    currentIndex >= 0 && currentIndex < episodes.length - 1
      ? episodes[currentIndex + 1]
      : null;

  const switchEpisode = (episodeId: string) => {
    setMobileListOpen(false);
    router.push(`/watch/series/${seriesSlug}?e=${episodeId}`, { scroll: false });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            S{displayedSeason.seasonNumber} · E{episodes[currentIndex]?.episodeNumber ?? 1}
          </span>
          {prevEp && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => switchEpisode(prevEp.id)}
              aria-label="Previous episode"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
          )}
          {nextEp && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => switchEpisode(nextEp.id)}
              aria-label="Next episode"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
        <Link
          href={`/series/${seriesSlug}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-sm hover:bg-accent"
        >
          <ListVideo className="h-4 w-4" /> Back to series
        </Link>
      </div>

      {/* Mobile sheet trigger */}
      <div className="lg:hidden mt-4">
        <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full" size="lg">
              <ListVideo className="h-4 w-4 mr-2" />
              Browse episodes
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] bg-background">
            <SheetTitle className="sr-only">Episodes</SheetTitle>
            <div className="mt-2 overflow-y-auto sv-scroll">
              <EpisodeListView
                seasons={seasons}
                displayedSeasonId={displayedSeason.id}
                activeEpisodeId={activeEpisodeId}
                onSeasonChange={setActiveSeasonId}
                onPick={switchEpisode}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

/**
 * Desktop sidebar — renders nothing on mobile.
 * Place inside a `hidden lg:block` column on the watch page.
 */
export function SeriesEpisodeSidebar({
  seasons,
  activeEpisodeId,
  seriesSlug,
}: {
  seasons: SeasonItem[];
  activeEpisodeId: string;
  seriesSlug: string;
}) {
  const router = useRouter();
  const activeSeason = useMemo(
    () =>
      seasons.find((s) => s.episodes.some((e) => e.id === activeEpisodeId)) ??
      seasons[0],
    [seasons, activeEpisodeId],
  );
  const [activeSeasonId, setActiveSeasonId] = useState(activeSeason?.id ?? "");
  const displayedSeason =
    seasons.find((s) => s.id === activeSeasonId) ?? activeSeason ?? seasons[0];

  if (!displayedSeason) return null;

  return (
    <EpisodeListView
      seasons={seasons}
      displayedSeasonId={displayedSeason.id}
      activeEpisodeId={activeEpisodeId}
      onSeasonChange={setActiveSeasonId}
      onPick={(episodeId) =>
        router.push(`/watch/series/${seriesSlug}?e=${episodeId}`, { scroll: false })
      }
      header={<h2 className="text-lg font-bold">Episodes</h2>}
    />
  );
}

function EpisodeListView({
  seasons,
  displayedSeasonId,
  activeEpisodeId,
  onSeasonChange,
  onPick,
  header,
}: {
  seasons: SeasonItem[];
  displayedSeasonId: string;
  activeEpisodeId: string;
  onSeasonChange: (id: string) => void;
  onPick: (id: string) => void;
  header?: React.ReactNode;
}) {
  const displayedSeason =
    seasons.find((s) => s.id === displayedSeasonId) ?? seasons[0];
  if (!displayedSeason) return null;

  const episodes = displayedSeason.episodes ?? [];

  return (
    <div className="space-y-4">
      {header}
      <SeasonTabs
        seasons={seasons.map((s) => ({
          id: s.id,
          seasonNumber: s.seasonNumber,
          title: s.title,
        }))}
        activeSeasonId={displayedSeason.id}
        onChange={onSeasonChange}
      />
      <ul className="space-y-2 max-h-[70vh] overflow-y-auto sv-scroll pr-1">
        {episodes.map((ep) => {
          const isActive = ep.id === activeEpisodeId;
          return (
            <li key={ep.id}>
              <button
                type="button"
                onClick={() => onPick(ep.id)}
                className={cn(
                  "w-full text-left flex gap-3 rounded-md p-2 border transition-colors",
                  isActive
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/40 bg-card/60 hover:bg-accent/60 hover:border-border",
                )}
              >
                <div className="relative shrink-0 w-28 aspect-video rounded overflow-hidden bg-muted">
                  {ep.thumbnailUrl ? (
                     
                    <img
                      src={ep.thumbnailUrl}
                      alt={ep.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      E{ep.episodeNumber}
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="h-5 w-5 text-white" fill="currentColor" />
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1 text-[10px] font-medium text-white/90 bg-black/60 px-1.5 rounded">
                    E{ep.episodeNumber}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{ep.title}</p>
                  {ep.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {ep.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(ep.duration)}
                    {ep.isPreview && (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5 ml-1 h-4">
                        Free
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
