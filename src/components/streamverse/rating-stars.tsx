"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiDelete } from "@/lib/api/client";

interface RatingStarsProps {
  contentId: string;
  contentType: "movie" | "series";
  /** initial rating (avg rating shown when user has not rated yet) */
  initialRating?: number;
  size?: number;
  className?: string;
  /** show numeric label next to stars */
  showLabel?: boolean;
}

/**
 * Interactive 5-star rating widget.
 *
 * On hover it previews the rating the user is about to give.
 * On click it persists via /api/ratings (POST to set, DELETE to clear).
 * Also reflects the user's existing rating if one exists.
 */
export function RatingStars({
  contentId,
  contentType,
  initialRating = 0,
  size = 24,
  className,
  showLabel = true,
}: RatingStarsProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [hover, setHover] = useState<number | null>(null);

  const { data: existing } = useQuery<{ rating: number } | null>({
    queryKey: ["my-rating", contentType, contentId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/ratings?contentId=${contentId}&contentType=${contentType}`);
        if (!res.ok) return null;
        const j = await res.json();
        return j?.rating ? { rating: j.rating } : null;
      } catch {
        return null;
      }
    },
  });

  const displayRating = hover ?? existing?.rating ?? Math.round(initialRating);

  const submit = async (rating: number) => {
    try {
      await apiPost("/api/ratings", { contentId, contentType, rating });
      qc.invalidateQueries({ queryKey: ["my-rating", contentType, contentId] });
      qc.invalidateQueries({ queryKey: ["avg-rating", contentType, contentId] });
      toast({ title: `Rated ${rating} star${rating > 1 ? "s" : ""}` });
    } catch (e) {
      toast({
        title: "Couldn't save rating",
        description: e instanceof Error ? e.message : "Please sign in to rate",
        variant: "destructive",
      });
    }
  };

  const clear = async () => {
    try {
      await apiDelete(`/api/ratings?contentId=${contentId}&contentType=${contentType}`);
      qc.invalidateQueries({ queryKey: ["my-rating", contentType, contentId] });
      qc.invalidateQueries({ queryKey: ["avg-rating", contentType, contentId] });
      toast({ title: "Rating removed" });
    } catch (e) {
      toast({
        title: "Couldn't remove rating",
        description: e instanceof Error ? e.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="flex items-center"
        role="radiogroup"
        aria-label="Rate this title"
        onMouseLeave={() => setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= displayRating;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={n === displayRating}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="p-0.5 rounded hover:scale-110 transition-transform"
              onMouseEnter={() => setHover(n)}
              onClick={() => {
                if (existing?.rating === n) {
                  clear();
                } else {
                  submit(n);
                }
              }}
            >
              <Star
                style={{ width: size, height: size }}
                className={cn(
                  "transition-colors",
                  filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground fill-transparent",
                )}
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {existing?.rating ? `You rated ${existing.rating}/5` : initialRating ? `${initialRating.toFixed(1)}/5 avg` : "Rate this"}
        </span>
      )}
    </div>
  );
}
