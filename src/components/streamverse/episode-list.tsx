"use client";

import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface EpisodeItem {
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

interface EpisodeListProps {
  episodes: EpisodeItem[];
  seriesSlug: string;
  /** currently-watching episode (for highlight) */
  activeEpisodeId?: string;
  className?: string;
}

/**
 * Vertical list of episodes in a season, used on the series
 * detail page. Each item links to the watch page for that episode.
 */
export function EpisodeList({ episodes, seriesSlug, activeEpisodeId, className }: EpisodeListProps) {
  if (!episodes || episodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No episodes available in this season yet.
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {episodes.map((ep) => {
        const href = `/watch/series/${seriesSlug}?e=${ep.id}`;
        const isActive = ep.id === activeEpisodeId;
        return (
          <li key={ep.id}>
            <Link
              href={href}
              className={cn(
                "group flex gap-3 md:gap-4 rounded-md p-2 md:p-3 border transition-colors",
                isActive
                  ? "border-primary/60 bg-primary/10"
                  : "border-border/40 bg-card/60 hover:bg-accent/60 hover:border-border",
              )}
            >
              <div className="relative shrink-0 w-32 md:w-40 aspect-video rounded overflow-hidden bg-muted">
                {ep.thumbnailUrl ? (
                   
                  <img
                    src={ep.thumbnailUrl}
                    alt={ep.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    Ep {ep.episodeNumber}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="rounded-full bg-black/60 p-2">
                    <Play className="h-4 w-4 text-white" fill="currentColor" />
                  </span>
                </div>
                <span className="absolute bottom-1 left-1 text-[10px] font-medium text-white/90 bg-black/60 px-1.5 rounded">
                  E{ep.episodeNumber}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">
                    Episode {ep.episodeNumber}
                  </span>
                  {ep.isPreview && (
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                      Free Preview
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold text-sm md:text-base truncate">{ep.title}</h4>
                {ep.description && (
                  <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                    {ep.description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Clock className="h-3 w-3" />
                  {formatDuration(ep.duration)}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
