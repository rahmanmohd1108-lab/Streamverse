"use client";

import { useState } from "react";
import { SeasonTabs } from "@/components/streamverse/season-tabs";
import { EpisodeList } from "@/components/streamverse/episode-list";
import { formatDuration } from "@/lib/utils";

export interface EpisodeItem {
  id: string;
  episodeNumber: number;
  title: string;
  description?: string | null;
  duration: number;
  thumbnailUrl?: string | null;
  isPreview?: boolean;
  videoUrl?: string | null;
  hlsUrl?: string | null;
}

export interface SeasonItem {
  id: string;
  seasonNumber: number;
  title?: string | null;
  description?: string | null;
  episodes: EpisodeItem[];
}

interface SeriesEpisodesBlockProps {
  seasons: SeasonItem[];
  seriesSlug: string;
  /** initial active season id (defaults to first) */
  initialSeasonId?: string;
  /** episode the user is currently watching (highlight + scrollIntoView) */
  activeEpisodeId?: string;
}

/**
 * Client-side interactive block on the series detail page:
 * - Tabs to switch between seasons
 * - Vertical list of episodes for the active season
 * - Season meta (episode count, total runtime)
 */
export function SeriesEpisodesBlock({
  seasons,
  seriesSlug,
  initialSeasonId,
  activeEpisodeId,
}: SeriesEpisodesBlockProps) {
  const first = seasons[0];
  const [activeSeasonId, setActiveSeasonId] = useState(
    initialSeasonId ?? first?.id ?? "",
  );
  const season = seasons.find((s) => s.id === activeSeasonId) ?? first;
  if (!season) return null;

  const episodes = season.episodes ?? [];
  const totalRuntime = episodes.reduce((n, e) => n + (e.duration || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {season.title || `Season ${season.seasonNumber}`}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {episodes.length} episode{episodes.length === 1 ? "" : "s"}
            {totalRuntime > 0 && (
              <> · {formatDuration(totalRuntime)}</>
            )}
          </p>
        </div>
        <SeasonTabs
          seasons={seasons.map((s) => ({
            id: s.id,
            seasonNumber: s.seasonNumber,
            title: s.title,
          }))}
          activeSeasonId={season.id}
          onChange={setActiveSeasonId}
        />
      </div>

      {season.description && (
        <p className="text-sm text-muted-foreground max-w-2xl">
          {season.description}
        </p>
      )}

      <EpisodeList
        episodes={episodes}
        seriesSlug={seriesSlug}
        activeEpisodeId={activeEpisodeId}
      />
    </div>
  );
}
