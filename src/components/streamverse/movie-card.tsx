"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Plus, Check, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiDelete } from "@/lib/api/client";

export type ContentCardData = {
  id: string;
  title: string;
  slug: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseYear: number;
  duration?: number | null;
  description: string;
  contentType: "movie" | "series";
  ageRating?: string;
  language?: { name: string } | null;
};

interface MovieCardProps {
  item: ContentCardData;
  className?: string;
  showActions?: boolean;
}

export function MovieCard({ item, className, showActions = true }: MovieCardProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: inWatchlist } = useQuery<boolean>({
    queryKey: ["watchlist-status", item.contentType, item.id],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/watchlist/check?contentId=${item.id}&contentType=${item.contentType}`);
        if (!res.ok) return false;
        const data = await res.json();
        return data.inWatchlist === true;
      } catch {
        return false;
      }
    },
    staleTime: 30_000,
  });

  const toggleWatchlist = async () => {
    try {
      if (inWatchlist) {
        await apiDelete(`/api/watchlist?contentId=${item.id}&contentType=${item.contentType}`);
        toast({ title: "Removed from My List" });
      } else {
        await apiPost("/api/watchlist", { contentId: item.id, contentType: item.contentType });
        toast({ title: "Added to My List" });
      }
      qc.invalidateQueries({ queryKey: ["watchlist-status", item.contentType, item.id] });
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Please sign in",
        variant: "destructive",
      });
    }
  };

  const href =
    item.contentType === "movie" ? `/movie/${item.slug}` : `/series/${item.slug}`;

  return (
    <article
      className={cn(
        "group relative sv-card-lift rounded-md overflow-hidden bg-card border border-border/40",
        className,
      )}
    >
      <Link href={href} aria-label={`Open ${item.title}`}>
        <div className="aspect-[2/3] relative overflow-hidden bg-muted">
          {item.posterUrl ? (
             
            <img
              src={item.posterUrl}
              alt={item.title}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              {item.title.slice(0, 24)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-2 right-2">
            {item.ageRating && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-black/60">
                {item.ageRating}
              </Badge>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-7 text-xs px-3">
                <Play className="h-3 w-3 mr-1" /> Play
              </Button>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.releaseYear}
              {item.duration ? ` · ${formatDuration(item.duration)}` : ""}
              {item.language ? ` · ${item.language.name}` : ""}
            </p>
          </div>
          {showActions && (
            <Button
              variant="secondary"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={toggleWatchlist}
              aria-label={inWatchlist ? "Remove from My List" : "Add to My List"}
              title={inWatchlist ? "Remove from My List" : "Add to My List"}
            >
              {inWatchlist ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
