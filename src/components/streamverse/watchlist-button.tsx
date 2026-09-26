"use client";

import { useState } from "react";
import { Plus, Check, Loader2, Bookmark } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiDelete } from "@/lib/api/client";

interface WatchlistButtonProps {
  contentId: string;
  contentType: "movie" | "series";
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  label?: { add: string; in: string };
}

/**
 * Add / remove a title from the active profile's watchlist.
 *
 * - Calls /api/watchlist/check to determine initial state.
 * - POST or DELETE /api/watchlist to toggle.
 * - Invalidates the "watchlist" query key so My List pages refresh.
 */
export function WatchlistButton({
  contentId,
  contentType,
  variant = "secondary",
  size = "lg",
  className,
  label = { add: "Add to My List", in: "In My List" },
}: WatchlistButtonProps) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const { data: inWatchlist, isLoading } = useQuery<boolean>({
    queryKey: ["watchlist-status", contentType, contentId],
    queryFn: async () => {
      try {
        const res = await fetch(
          `/api/watchlist/check?contentId=${contentId}&contentType=${contentType}`,
        );
        if (!res.ok) return false;
        const data = await res.json();
        return data?.inWatchlist === true;
      } catch {
        return false;
      }
    },
    staleTime: 30_000,
  });

  const toggle = async () => {
    setBusy(true);
    try {
      if (inWatchlist) {
        await apiDelete(
          `/api/watchlist?contentId=${contentId}&contentType=${contentType}`,
        );
        toast({ title: "Removed from My List" });
      } else {
        await apiPost("/api/watchlist", { contentId, contentType });
        toast({ title: "Added to My List" });
      }
      qc.invalidateQueries({ queryKey: ["watchlist-status", contentType, contentId] });
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Please sign in",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={toggle}
      disabled={isLoading || busy}
      aria-pressed={inWatchlist}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : inWatchlist ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Plus className="h-4 w-4 mr-2" />
      )}
      {inWatchlist ? label.in : label.add}
    </Button>
  );
}

// Convenience icon-only variant for compact toolbars
export function WatchlistIconButton({
  contentId,
  contentType,
  className,
}: {
  contentId: string;
  contentType: "movie" | "series";
  className?: string;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const { data: inWatchlist } = useQuery<boolean>({
    queryKey: ["watchlist-status", contentType, contentId],
    queryFn: async () => {
      try {
        const res = await fetch(
          `/api/watchlist/check?contentId=${contentId}&contentType=${contentType}`,
        );
        if (!res.ok) return false;
        const data = await res.json();
        return data?.inWatchlist === true;
      } catch {
        return false;
      }
    },
    staleTime: 30_000,
  });

  const toggle = async () => {
    setBusy(true);
    try {
      if (inWatchlist) {
        await apiDelete(
          `/api/watchlist?contentId=${contentId}&contentType=${contentType}`,
        );
        toast({ title: "Removed from My List" });
      } else {
        await apiPost("/api/watchlist", { contentId, contentType });
        toast({ title: "Added to My List" });
      }
      qc.invalidateQueries({ queryKey: ["watchlist-status", contentType, contentId] });
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Please sign in",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn("bg-white/10 backdrop-blur", className)}
      onClick={toggle}
      disabled={busy}
      aria-label={inWatchlist ? "Remove from My List" : "Add to My List"}
      title={inWatchlist ? "Remove from My List" : "Add to My List"}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : inWatchlist ? (
        <Check className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </Button>
  );
}
